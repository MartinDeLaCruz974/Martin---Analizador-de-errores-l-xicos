/**
 * CppLexer - Analizador Léxico para C++ (C++20/C++23)
 * Asignatura: Autómatas I
 * 
 * Implementa las reglas léxicas oficiales de C++:
 * - Palabras reservadas del estándar C++
 * - Directivas de preprocesador (#include, #define, #ifdef, etc.)
 * - Identificadores válidos y detección de identificadores inválidos iniciados por dígitos
 * - Literales numéricos (enteros con sufijos u, l, ll, flotantes con f, l, notación científica, hex, bin, oct)
 * - Soporte para separador de dígitos comilla simple (1'000'000)
 * - Detección de números mal formados (ej: 3.14.15, 0xZZ, 1e, 0b102)
 * - Literales de caracteres ('a', '\n') con validación de longitud y cierre
 * - Cadenas de texto ("...") y cadenas raw (R"(...)")
 * - Detección de cadenas y comentarios multilínea sin cerrar
 * - Comentarios de línea (//) y bloque (/* ... *\/)
 * - Operadores específicos de C++ (::, ->, ->*, .*, <=>, <<, >>, ++, --, etc.)
 * - Detección de operadores inexistentes (como ===) y caracteres ilegales ($, @, `, etc.)
 */

class CppLexer extends BaseLexer {
  constructor(source = '') {
    super(source, 'C++');
    this.initKeywords();
  }

  initKeywords() {
    this.keywords = new Set([
      'alignas', 'alignof', 'and', 'and_eq', 'asm', 'atomic_cancel', 'atomic_commit',
      'atomic_noexcept', 'auto', 'bitand', 'bitor', 'bool', 'break', 'case', 'catch',
      'char', 'char8_t', 'char16_t', 'char32_t', 'class', 'compl', 'concept', 'const',
      'consteval', 'constexpr', 'constinit', 'const_cast', 'continue', 'co_await',
      'co_return', 'co_yield', 'decltype', 'default', 'delete', 'do', 'double',
      'dynamic_cast', 'else', 'enum', 'explicit', 'export', 'extern', 'false', 'float',
      'for', 'friend', 'goto', 'if', 'inline', 'int', 'long', 'mutable', 'namespace',
      'new', 'noexcept', 'not', 'not_eq', 'nullptr', 'operator', 'or', 'or_eq',
      'private', 'protected', 'public', 'reflexpr', 'register', 'reinterpret_cast',
      'requires', 'return', 'short', 'signed', 'sizeof', 'static', 'static_assert',
      'static_cast', 'struct', 'switch', 'template', 'this', 'thread_local', 'throw',
      'true', 'try', 'typedef', 'typeid', 'typename', 'union', 'unsigned', 'using',
      'virtual', 'void', 'volatile', 'wchar_t', 'while', 'xor', 'xor_eq'
    ]);

    this.logicalKeywords = new Set(['and', 'or', 'not', 'and_eq', 'or_eq', 'not_eq', 'bitand', 'bitor', 'compl', 'xor', 'xor_eq']);
  }

  tokenize() {
    this.reset(this.source);

    while (!this.isAtEnd()) {
      const startLine = this.line;
      const startCol = this.column;
      const c = this.peek();

      // 1. Espacios en blanco y saltos de línea
      if (c === ' ' || c === '\t' || c === '\r') {
        this.advance();
        continue;
      }

      if (c === '\n') {
        this.advance();
        continue;
      }

      // 2. Directivas de preprocesador (#include, #define, etc.)
      if (c === '#') {
        this.scanPreprocessor(startLine, startCol);
        continue;
      }

      // 3. Comentarios de línea (//) o bloque (/* */)
      if (c === '/' && this.peek(1) === '/') {
        this.scanSingleLineComment(startLine, startCol);
        continue;
      }

      if (c === '/' && this.peek(1) === '*') {
        this.scanMultiLineComment(startLine, startCol);
        continue;
      }

      // 4. Literales de cadena raw: R"(...)"
      if (c === 'R' && this.peek(1) === '"') {
        this.scanRawString(startLine, startCol);
        continue;
      }

      // 5. Cadenas de caracteres ("...") y prefijos L", u8", u", U"
      if (c === '"') {
        this.scanString(startLine, startCol);
        continue;
      }

      // 6. Literales de carácter individual ('c')
      if (c === "'") {
        this.scanCharLiteral(startLine, startCol);
        continue;
      }

      // 7. Literales numéricos (dígito o punto seguido de dígito)
      if (this.isDigit(c) || (c === '.' && this.isDigit(this.peek(1)))) {
        this.scanNumber(startLine, startCol);
        continue;
      }

      // 8. Identificadores y palabras reservadas
      if (this.isAlpha(c)) {
        this.scanIdentifierOrKeyword(startLine, startCol);
        continue;
      }

      // 9. Operadores y delimitadores
      this.scanOperatorsAndPunctuation(startLine, startCol);
    }

    return {
      language: this.languageName,
      tokens: this.tokens,
      errors: this.errors,
      totalTokens: this.tokens.length,
      totalErrors: this.errors.length,
      isValid: this.errors.length === 0
    };
  }

  scanPreprocessor(startLine, startCol) {
    let directive = this.advance(); // '#'
    
    // Ignorar espacios opcionales entre '#' y la palabra clave de directiva
    while (this.peek() === ' ' || this.peek() === '\t') {
      directive += this.advance();
    }

    while (this.isAlpha(this.peek())) {
      directive += this.advance();
    }

    this.addToken('Directiva de preprocesador', 'preprocessor', directive, startLine, startCol);

    // Si es #include, puede venir un <header> o "header"
    while (this.peek() === ' ' || this.peek() === '\t') {
      this.advance();
    }

    if (this.peek() === '<') {
      const headerStartLine = this.line;
      const headerStartCol = this.column;
      let header = this.advance(); // '<'
      let closed = false;
      while (!this.isAtEnd() && this.peek() !== '\n') {
        if (this.peek() === '>') {
          header += this.advance();
          closed = true;
          break;
        }
        header += this.advance();
      }

      if (!closed) {
        this.addError(
          'Cabecera de inclusión sin cerrar',
          header,
          `Se esperaba el delimitador '>' para cerrar la cabecera del #include.`,
          headerStartLine,
          headerStartCol,
          `Cierre el nombre del archivo de cabecera con '>'.`
        );
      } else {
        this.addToken('Nombre de cabecera (Header)', 'literal', header, headerStartLine, headerStartCol);
      }
    }
  }

  scanSingleLineComment(startLine, startCol) {
    let commentText = this.advance() + this.advance(); // '//'
    while (!this.isAtEnd() && this.peek() !== '\n') {
      commentText += this.advance();
    }
    this.addToken('Comentario de una línea', 'comment', commentText, startLine, startCol);
  }

  scanMultiLineComment(startLine, startCol) {
    let commentText = this.advance() + this.advance(); // '/*'
    let closed = false;

    while (!this.isAtEnd()) {
      if (this.peek() === '*' && this.peek(1) === '/') {
        commentText += this.advance(); // '*'
        commentText += this.advance(); // '/'
        closed = true;
        break;
      }
      commentText += this.advance();
    }

    if (!closed) {
      this.addError(
        'Comentario multilínea sin cerrar',
        commentText.length > 30 ? commentText.slice(0, 27) + '...' : commentText,
        `Se esperaba el delimitador de cierre '*/' antes del fin de archivo.`,
        startLine,
        startCol,
        `Cierre el comentario con '*/'.`
      );
      return;
    }

    this.addToken('Comentario de bloque', 'comment', commentText, startLine, startCol);
  }

  scanCharLiteral(startLine, startCol) {
    let charVal = this.advance(); // "'"
    let contentChars = 0;
    let closed = false;

    while (!this.isAtEnd()) {
      const c = this.peek();

      if (c === '\n') {
        break;
      }

      if (c === '\\') {
        charVal += this.advance();
        if (!this.isAtEnd() && this.peek() !== '\n') {
          charVal += this.advance();
          contentChars++;
        }
        continue;
      }

      if (c === "'") {
        charVal += this.advance();
        closed = true;
        break;
      }

      charVal += this.advance();
      contentChars++;
    }

    if (!closed) {
      this.addError(
        'Literal de carácter sin cerrar',
        charVal,
        `Se esperaba comilla simple de cierre (') antes del fin de línea.`,
        startLine,
        startCol,
        `Cierre el carácter con una comilla simple (').`
      );
      return;
    }

    if (contentChars === 0) {
      this.addError(
        'Literal de carácter vacío',
        charVal,
        `Un literal de tipo 'char' no puede estar vacío ('' no es válido en C++).`,
        startLine,
        startCol,
        `Especifique al menos un carácter dentro de las comillas simples.`
      );
      return;
    }

    if (contentChars > 1) {
      this.addError(
        'Literal de carácter múltiple inválido',
        charVal,
        `Un literal de carácter 'char' solo puede contener un único carácter. Para secuencias de texto utilice comillas dobles ("...").`,
        startLine,
        startCol,
        `Use comillas dobles ("...") para cadenas de texto.`
      );
      return;
    }

    this.addToken('Literal de carácter (char)', 'literal', charVal, startLine, startCol);
  }

  scanString(startLine, startCol) {
    let strVal = this.advance(); // '"'
    let closed = false;

    while (!this.isAtEnd()) {
      const c = this.peek();

      if (c === '\n') {
        break;
      }

      if (c === '\\') {
        strVal += this.advance();
        if (!this.isAtEnd() && this.peek() !== '\n') {
          strVal += this.advance();
        }
        continue;
      }

      if (c === '"') {
        strVal += this.advance();
        closed = true;
        break;
      }

      strVal += this.advance();
    }

    if (!closed) {
      this.addError(
        'Cadena de texto sin cerrar',
        strVal,
        `Se esperaba comilla doble de cierre (") antes del fin de línea o archivo.`,
        startLine,
        startCol,
        `Agregue la comilla de cierre " antes del salto de línea.`
      );
      return;
    }

    this.addToken('Cadena de texto (string)', 'literal', strVal, startLine, startCol);
  }

  scanRawString(startLine, startCol) {
    let rawVal = this.advance() + this.advance(); // 'R"'
    let closed = false;

    while (!this.isAtEnd()) {
      if (this.peek() === ')' && this.peek(1) === '"') {
        rawVal += this.advance() + this.advance(); // ')"'
        closed = true;
        break;
      }
      rawVal += this.advance();
    }

    if (!closed) {
      this.addError(
        'Cadena raw sin cerrar',
        rawVal.length > 30 ? rawVal.slice(0, 27) + '...' : rawVal,
        `Se esperaba el delimitador de cierre ')"' para la cadena raw en C++.`,
        startLine,
        startCol,
        `Cierre la cadena raw con ')"'.`
      );
      return;
    }

    this.addToken('Cadena raw (R"...")', 'literal', rawVal, startLine, startCol);
  }

  scanNumber(startLine, startCol) {
    let numStr = '';
    const firstChar = this.peek();

    // 0x (Hexadecimal)
    if (firstChar === '0' && (this.peek(1) === 'x' || this.peek(1) === 'X')) {
      numStr += this.advance() + this.advance();
      let digits = '';
      while (this.isHexDigit(this.peek()) || this.peek() === "'") {
        digits += this.advance();
      }
      numStr += digits;

      // Consumir sufijos enteros válidos en C++ (u, l, ll, ull, etc.)
      const suffix = this.scanIntSuffix();
      numStr += suffix;

      if (digits.length === 0 || (this.isAlpha(this.peek()) && !this.isHexDigit(this.peek()))) {
        while (this.isAlphaNumeric(this.peek())) {
          numStr += this.advance();
        }
        this.addError(
          'Literal hexadecimal inválido',
          numStr,
          `El prefijo '0x' debe ir seguido de dígitos hexadecimales válidos (0-9, a-f, A-F).`,
          startLine,
          startCol,
          `Corrija los dígitos hexadecimales.`
        );
        return;
      }

      this.addToken('Número hexadecimal', 'literal', numStr, startLine, startCol);
      return;
    }

    // 0b (Binario C++14)
    if (firstChar === '0' && (this.peek(1) === 'b' || this.peek(1) === 'B')) {
      numStr += this.advance() + this.advance();
      let digits = '';
      while (this.isBinDigit(this.peek()) || this.peek() === "'") {
        digits += this.advance();
      }
      numStr += digits;

      const suffix = this.scanIntSuffix();
      numStr += suffix;

      if (digits.length === 0 || this.isAlphaNumeric(this.peek())) {
        while (this.isAlphaNumeric(this.peek())) {
          numStr += this.advance();
        }
        this.addError(
          'Literal binario inválido',
          numStr,
          `El prefijo '0b' debe ir seguido únicamente de dígitos binarios (0 o 1).`,
          startLine,
          startCol,
          `Use únicamente los dígitos 0 y 1.`
        );
        return;
      }

      this.addToken('Número binario', 'literal', numStr, startLine, startCol);
      return;
    }

    // Entero decimal o Flotante
    let hasDot = false;
    let dotCount = 0;

    while (this.isDigit(this.peek()) || this.peek() === "'" || this.peek() === '.') {
      if (this.peek() === '.') {
        if (hasDot) {
          dotCount++;
          numStr += this.advance();
          while (this.isAlphaNumeric(this.peek()) || this.peek() === '.') {
            numStr += this.advance();
          }
          this.addError(
            'Número decimal mal formado',
            numStr,
            `El literal numérico contiene múltiples puntos decimales (${dotCount + 1}).`,
            startLine,
            startCol,
            `Conserve un único punto decimal.`
          );
          return;
        }
        hasDot = true;
      }
      numStr += this.advance();
    }

    // Exponente científico
    let hasExp = false;
    if (this.peek() === 'e' || this.peek() === 'E') {
      hasExp = true;
      numStr += this.advance();
      if (this.peek() === '+' || this.peek() === '-') {
        numStr += this.advance();
      }
      let expDigits = '';
      while (this.isDigit(this.peek()) || this.peek() === "'") {
        expDigits += this.advance();
      }
      numStr += expDigits;

      if (expDigits.length === 0) {
        while (this.isAlphaNumeric(this.peek()) || this.peek() === '.') {
          numStr += this.advance();
        }
        this.addError(
          'Exponente incompleto en notación científica',
          numStr,
          `La notación científica '${numStr}' requiere dígitos para el exponente tras la 'e'.`,
          startLine,
          startCol,
          `Indique el exponente numérico (ej: 1e6 o 3.5e-2).`
        );
        return;
      }
    }

    // Sufijos numéricos de C++:
    // Flotantes: f, F, l, L
    // Enteros: u, U, l, L, ll, LL, z, Z
    if (hasDot || hasExp) {
      if (['f', 'F', 'l', 'L'].includes(this.peek())) {
        numStr += this.advance();
      }
      // Si aún quedan letras, error
      if (this.isAlpha(this.peek())) {
        while (this.isAlphaNumeric(this.peek())) {
          numStr += this.advance();
        }
        this.addError('Sufijo de flotante inválido', numStr, `El sufijo numérico '${numStr}' no es válido para números de coma flotante en C++.`, startLine, startCol, `Use los sufijos válidos 'f' o 'L'.`);
        return;
      }
      this.addToken('Número decimal (flotante)', 'literal', numStr, startLine, startCol);
      return;
    }

    // Sufijo entero
    const intSuffix = this.scanIntSuffix();
    numStr += intSuffix;

    // Si aún quedan caracteres alfabéticos (ej: 123abc, 9variable)
    if (this.isAlpha(this.peek())) {
      while (this.isAlphaNumeric(this.peek())) {
        numStr += this.advance();
      }
      this.addError(
        'Identificador inválido',
        numStr,
        `Un identificador no puede comenzar con un dígito ('${numStr}'). La gramática de C++ exige iniciar con letra o guión bajo '_'.`,
        startLine,
        startCol,
        `Renombre el identificador para que inicie con una letra o '_'.`
      );
      return;
    }

    this.addToken('Número entero', 'literal', numStr, startLine, startCol);
  }

  scanIntSuffix() {
    let suffix = '';
    const valid = ['u', 'U', 'l', 'L', 'z', 'Z'];
    while (valid.includes(this.peek())) {
      suffix += this.advance();
      if (suffix.length > 3) break;
    }
    return suffix;
  }

  scanIdentifierOrKeyword(startLine, startCol) {
    let name = '';
    while (this.isAlphaNumeric(this.peek())) {
      name += this.advance();
    }

    if (this.keywords.has(name)) {
      if (this.logicalKeywords.has(name)) {
        this.addToken('Operador lógico (palabra clave)', 'operator', name, startLine, startCol);
      } else {
        this.addToken('Palabra reservada', 'keyword', name, startLine, startCol);
      }
    } else {
      this.addToken('Identificador', 'identifier', name, startLine, startCol);
    }
  }

  scanOperatorsAndPunctuation(startLine, startCol) {
    const c = this.peek();

    // 1. Detectar secuencias inválidas típicas (===, !===)
    if (c === '=' && this.peek(1) === '=' && this.peek(2) === '=') {
      const bad = this.advance() + this.advance() + this.advance();
      this.addError(
        'Operador no válido en C++',
        bad,
        `El operador '${bad}' no existe en C++. La igualdad se evalúa únicamente con '=='.`,
        startLine,
        startCol,
        `Reemplace '${bad}' por '=='.`
      );
      return;
    }

    if (c === '!' && this.peek(1) === '=' && this.peek(2) === '=') {
      const bad = this.advance() + this.advance() + this.advance();
      this.addError(
        'Operador no válido en C++',
        bad,
        `El operador '${bad}' no existe en C++. La desigualdad se evalúa con '!='.`,
        startLine,
        startCol,
        `Reemplace '${bad}' por '!='.`
      );
      return;
    }

    // 2. Operadores de tres caracteres: <=>, <<=, >>=, ->*
    const threeChars = c + this.peek(1) + this.peek(2);
    if (threeChars === '<=>') {
      this.advance(); this.advance(); this.advance();
      this.addToken('Operador de comparación trivalente (Spaceship <=>)', 'operator', threeChars, startLine, startCol);
      return;
    }
    if (threeChars === '<<=' || threeChars === '>>=') {
      this.advance(); this.advance(); this.advance();
      this.addToken('Operador de asignación con desplazamiento', 'operator', threeChars, startLine, startCol);
      return;
    }
    if (threeChars === '->*') {
      this.advance(); this.advance(); this.advance();
      this.addToken('Operador de puntero a miembro indirecto (->*)', 'operator', threeChars, startLine, startCol);
      return;
    }

    // 3. Operadores de dos caracteres
    const twoChars = c + this.peek(1);
    
    // Resolución de ámbito ::
    if (twoChars === '::') {
      this.advance(); this.advance();
      this.addToken('Operador de resolución de ámbito (::)', 'operator', twoChars, startLine, startCol);
      return;
    }

    // Acceso a miembro de puntero -> y .*
    if (twoChars === '->') {
      this.advance(); this.advance();
      this.addToken('Operador de acceso a miembro de puntero (->)', 'operator', twoChars, startLine, startCol);
      return;
    }
    if (twoChars === '.*') {
      this.advance(); this.advance();
      this.addToken('Operador de puntero a miembro directo (.*)', 'operator', twoChars, startLine, startCol);
      return;
    }

    // Flujos << y >>
    if (twoChars === '<<') {
      this.advance(); this.advance();
      this.addToken('Operador de inserción de flujo / desplazamiento (<<)', 'operator', twoChars, startLine, startCol);
      return;
    }
    if (twoChars === '>>') {
      this.advance(); this.advance();
      this.addToken('Operador de extracción de flujo / desplazamiento (>>)', 'operator', twoChars, startLine, startCol);
      return;
    }

    const comparisonTwo = ['==', '!=', '<=', '>='];
    if (comparisonTwo.includes(twoChars)) {
      this.advance(); this.advance();
      this.addToken('Operador de comparación', 'operator', twoChars, startLine, startCol);
      return;
    }

    const assignmentTwo = ['+=', '-=', '*=', '/=', '%=', '&=', '|=', '^='];
    if (assignmentTwo.includes(twoChars)) {
      this.advance(); this.advance();
      this.addToken('Operador de asignación compuesta', 'operator', twoChars, startLine, startCol);
      return;
    }

    const logicalTwo = ['&&', '||'];
    if (logicalTwo.includes(twoChars)) {
      this.advance(); this.advance();
      this.addToken('Operador lógico', 'operator', twoChars, startLine, startCol);
      return;
    }

    const arithmeticTwo = ['++', '--'];
    if (arithmeticTwo.includes(twoChars)) {
      this.advance(); this.advance();
      this.addToken('Operador aritmético (incremento/decremento)', 'operator', twoChars, startLine, startCol);
      return;
    }

    // 4. Operadores de un carácter
    const arithmeticOne = ['+', '-', '*', '/', '%'];
    if (arithmeticOne.includes(c)) {
      this.advance();
      this.addToken('Operador aritmético', 'operator', c, startLine, startCol);
      return;
    }

    if (c === '=') {
      this.advance();
      this.addToken('Operador de asignación', 'operator', c, startLine, startCol);
      return;
    }

    const comparisonOne = ['<', '>'];
    if (comparisonOne.includes(c)) {
      this.advance();
      this.addToken('Operador de comparación', 'operator', c, startLine, startCol);
      return;
    }

    const logicalOne = ['!'];
    if (logicalOne.includes(c)) {
      this.advance();
      this.addToken('Operador lógico (NOT)', 'operator', c, startLine, startCol);
      return;
    }

    const bitwiseOne = ['&', '|', '^', '~'];
    if (bitwiseOne.includes(c)) {
      this.advance();
      this.addToken('Operador de bits / dirección', 'operator', c, startLine, startCol);
      return;
    }

    if (c === '?') {
      this.advance();
      this.addToken('Operador condicional (?)', 'operator', c, startLine, startCol);
      return;
    }

    // 5. Delimitadores y signos de puntuación
    const delimiters = {
      '(': 'Paréntesis de apertura',
      ')': 'Paréntesis de cierre',
      '[': 'Corchete de apertura',
      ']': 'Corchete de cierre',
      '{': 'Llave de apertura',
      '}': 'Llave de cierre'
    };
    if (delimiters[c]) {
      this.advance();
      this.addToken('Delimitador (' + delimiters[c] + ')', 'delimiter', c, startLine, startCol);
      return;
    }

    const punctuation = {
      ',': 'Coma',
      ':': 'Dos puntos',
      ';': 'Punto y coma',
      '.': 'Punto de acceso a miembro'
    };
    if (punctuation[c]) {
      this.advance();
      this.addToken('Signo de puntuación (' + punctuation[c] + ')', 'delimiter', c, startLine, startCol);
      return;
    }

    // 6. Caracteres ilegales en C++ fuera de cadenas o comentarios
    const illegalChar = this.advance();
    this.addError(
      'Carácter ilegal',
      illegalChar,
      `El carácter '${illegalChar}' no pertenece al alfabeto léxico válido de C++.`,
      startLine,
      startCol,
      `Elimine o reemplace el carácter '${illegalChar}'.`
    );
  }
}

if (typeof window !== 'undefined') {
  window.CppLexer = CppLexer;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CppLexer;
}
