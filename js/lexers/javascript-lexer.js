/**
 * JavaScriptLexer - Analizador Léxico para JavaScript (ECMAScript 2024)
 * Asignatura: Autómatas I
 * 
 * Implementa las reglas léxicas oficiales de JavaScript:
 * - Palabras reservadas estándar y contextuales
 * - Identificadores válidos (incluyendo $ y _) y privados (#campo)
 * - Detección de identificadores inválidos iniciados por dígitos (ej: 123var)
 * - Literales numéricos (enteros, decimales, notación científica, BigInt, hex, bin, oct)
 * - Detección de números mal formados (ej: 3.14.15, 0xZZ, 1e, 0b102)
 * - Cadenas de texto regulares ('...', "...") y literales de plantilla (`...` multilínea)
 * - Detección de cadenas y comentarios multilínea sin cerrar
 * - Comentarios de línea (//) y de bloque (/* ... *\/)
 * - Operadores completos (===, !==, ??=, &&=, ||, ?., =>, etc.)
 * - Detección de operadores mal formados y caracteres ilegales
 */

class JavaScriptLexer extends BaseLexer {
  constructor(source = '') {
    super(source, 'JavaScript');
    this.initKeywords();
  }

  initKeywords() {
    this.keywords = new Set([
      'abstract', 'arguments', 'async', 'await', 'boolean', 'break', 'byte',
      'case', 'catch', 'char', 'class', 'const', 'continue', 'debugger',
      'default', 'delete', 'do', 'double', 'else', 'enum', 'eval',
      'export', 'extends', 'false', 'final', 'finally', 'float', 'for',
      'function', 'goto', 'if', 'implements', 'import', 'in', 'instanceof',
      'int', 'interface', 'let', 'long', 'native', 'new', 'null', 'of',
      'package', 'private', 'protected', 'public', 'return', 'short',
      'static', 'super', 'switch', 'synchronized', 'this', 'throw', 'throws',
      'transient', 'true', 'try', 'typeof', 'undefined', 'var', 'void',
      'volatile', 'while', 'with', 'yield'
    ]);
  }

  // En JS, $ es un carácter válido para identificadores
  isAlpha(c) {
    return (c >= 'a' && c <= 'z') ||
           (c >= 'A' && c <= 'Z') ||
           c === '_' ||
           c === '$';
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

      // 2. Comentarios de línea (//) o bloque (/* */)
      if (c === '/' && this.peek(1) === '/') {
        this.scanSingleLineComment(startLine, startCol);
        continue;
      }

      if (c === '/' && this.peek(1) === '*') {
        this.scanMultiLineComment(startLine, startCol);
        continue;
      }

      // 3. Cadenas de texto regulares (' o ")
      if (c === '"' || c === "'") {
        this.scanString(startLine, startCol);
        continue;
      }

      // 4. Literales de plantilla (template literals con backticks `)
      if (c === '`') {
        this.scanTemplateLiteral(startLine, startCol);
        continue;
      }

      // 5. Literales numéricos (dígito o punto seguido de dígito)
      if (this.isDigit(c) || (c === '.' && this.isDigit(this.peek(1)))) {
        this.scanNumber(startLine, startCol);
        continue;
      }

      // 6. Identificadores de campo privado (#campo)
      if (c === '#' && this.isAlpha(this.peek(1))) {
        this.scanPrivateIdentifier(startLine, startCol);
        continue;
      }

      // 7. Identificadores y palabras reservadas
      if (this.isAlpha(c)) {
        this.scanIdentifierOrKeyword(startLine, startCol);
        continue;
      }

      // 8. Operadores y delimitadores
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
        `Cierre el comentario multilínea agregando '*/'.`
      );
      return;
    }

    this.addToken('Comentario de bloque', 'comment', commentText, startLine, startCol);
  }

  scanString(startLine, startCol) {
    const quoteChar = this.peek();
    let strVal = this.advance();
    let closed = false;

    while (!this.isAtEnd()) {
      const c = this.peek();

      // En JavaScript las cadenas normales no pueden contener saltos de línea sin escapar
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

      if (c === quoteChar) {
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
        `Se esperaba comilla de cierre (${quoteChar}) antes del fin de línea o archivo.`,
        startLine,
        startCol,
        `Agregue la comilla de cierre ${quoteChar} antes del salto de línea.`
      );
      return;
    }

    this.addToken('Cadena de texto', 'literal', strVal, startLine, startCol);
  }

  scanTemplateLiteral(startLine, startCol) {
    let templateVal = this.advance(); // '`'
    let closed = false;

    while (!this.isAtEnd()) {
      const c = this.peek();

      if (c === '\\') {
        templateVal += this.advance();
        if (!this.isAtEnd()) {
          templateVal += this.advance();
        }
        continue;
      }

      if (c === '`') {
        templateVal += this.advance();
        closed = true;
        break;
      }

      templateVal += this.advance();
    }

    if (!closed) {
      this.addError(
        'Plantilla literal (template string) sin cerrar',
        templateVal.length > 30 ? templateVal.slice(0, 27) + '...' : templateVal,
        `Se esperaba el acento grave invertido de cierre (\`) antes del fin de archivo.`,
        startLine,
        startCol,
        `Agregue el símbolo (\`) para cerrar la plantilla literal.`
      );
      return;
    }

    this.addToken('Plantilla literal (Template String)', 'literal', templateVal, startLine, startCol);
  }

  scanNumber(startLine, startCol) {
    let numStr = '';
    const firstChar = this.peek();

    // 0x (hexadecimal)
    if (firstChar === '0' && (this.peek(1) === 'x' || this.peek(1) === 'X')) {
      numStr += this.advance() + this.advance();
      let digits = '';
      while (this.isHexDigit(this.peek()) || this.peek() === '_') {
        digits += this.advance();
      }
      numStr += digits;

      // Soporte BigInt en hex (0xFFn)
      if (this.peek() === 'n') {
        numStr += this.advance();
        this.addToken('Número BigInt hexadecimal', 'literal', numStr, startLine, startCol);
        return;
      }

      if (digits.length === 0 || (this.isAlpha(this.peek()) && !this.isHexDigit(this.peek()))) {
        while (this.isAlphaNumeric(this.peek())) {
          numStr += this.advance();
        }
        this.addError(
          'Literal hexadecimal inválido',
          numStr,
          `El prefijo '0x' debe ir seguido únicamente de dígitos hexadecimales válidos (0-9, a-f, A-F).`,
          startLine,
          startCol,
          `Corrija los dígitos hexadecimales.`
        );
        return;
      }

      this.addToken('Número hexadecimal', 'literal', numStr, startLine, startCol);
      return;
    }

    // 0b (binario)
    if (firstChar === '0' && (this.peek(1) === 'b' || this.peek(1) === 'B')) {
      numStr += this.advance() + this.advance();
      let digits = '';
      while (this.isBinDigit(this.peek()) || this.peek() === '_') {
        digits += this.advance();
      }
      numStr += digits;

      if (this.peek() === 'n') {
        numStr += this.advance();
        this.addToken('Número BigInt binario', 'literal', numStr, startLine, startCol);
        return;
      }

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

    // 0o (octal)
    if (firstChar === '0' && (this.peek(1) === 'o' || this.peek(1) === 'O')) {
      numStr += this.advance() + this.advance();
      let digits = '';
      while (this.isOctDigit(this.peek()) || this.peek() === '_') {
        digits += this.advance();
      }
      numStr += digits;

      if (this.peek() === 'n') {
        numStr += this.advance();
        this.addToken('Número BigInt octal', 'literal', numStr, startLine, startCol);
        return;
      }

      if (digits.length === 0 || this.isAlphaNumeric(this.peek())) {
        while (this.isAlphaNumeric(this.peek())) {
          numStr += this.advance();
        }
        this.addError(
          'Literal octal inválido',
          numStr,
          `El prefijo '0o' debe ir seguido únicamente de dígitos octales (0-7).`,
          startLine,
          startCol,
          `Use únicamente dígitos del 0 al 7.`
        );
        return;
      }

      this.addToken('Número octal', 'literal', numStr, startLine, startCol);
      return;
    }

    // Entero decimal o decimal flotante
    let hasDot = false;
    let dotCount = 0;

    while (this.isDigit(this.peek()) || this.peek() === '_' || this.peek() === '.') {
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
            `Conserve un solo punto decimal.`
          );
          return;
        }
        hasDot = true;
      }
      numStr += this.advance();
    }

    // Exponente científico (e o E)
    let hasExp = false;
    if (this.peek() === 'e' || this.peek() === 'E') {
      hasExp = true;
      numStr += this.advance();
      if (this.peek() === '+' || this.peek() === '-') {
        numStr += this.advance();
      }
      let expDigits = '';
      while (this.isDigit(this.peek()) || this.peek() === '_') {
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
          `Indique el exponente numérico (ej: 1e3).`
        );
        return;
      }
    }

    // Sufijo BigInt 'n'
    if (this.peek() === 'n' && !hasDot && !hasExp) {
      numStr += this.advance();
      this.addToken('Número BigInt', 'literal', numStr, startLine, startCol);
      return;
    }

    // Letra consecutiva inválida (ej: 123abc, 9variable)
    if (this.isAlpha(this.peek())) {
      while (this.isAlphaNumeric(this.peek())) {
        numStr += this.advance();
      }
      this.addError(
        'Identificador inválido',
        numStr,
        `Un identificador no puede comenzar con un dígito ('${numStr}'). La gramática de JavaScript exige iniciar con letra, '$' o '_'.`,
        startLine,
        startCol,
        `Renombre el identificador para que inicie con letra, '$' o '_'.`
      );
      return;
    }

    if (hasDot || hasExp) {
      this.addToken('Número decimal (flotante)', 'literal', numStr, startLine, startCol);
    } else {
      this.addToken('Número entero', 'literal', numStr, startLine, startCol);
    }
  }

  scanPrivateIdentifier(startLine, startCol) {
    let name = this.advance(); // '#'
    while (this.isAlphaNumeric(this.peek())) {
      name += this.advance();
    }
    this.addToken('Identificador privado', 'identifier', name, startLine, startCol);
  }

  scanIdentifierOrKeyword(startLine, startCol) {
    let name = '';
    while (this.isAlphaNumeric(this.peek())) {
      name += this.advance();
    }

    if (this.keywords.has(name)) {
      this.addToken('Palabra reservada', 'keyword', name, startLine, startCol);
    } else {
      this.addToken('Identificador', 'identifier', name, startLine, startCol);
    }
  }

  scanOperatorsAndPunctuation(startLine, startCol) {
    const c = this.peek();

    // 1. Operadores de cuatro caracteres (ej: >>>=)
    if (c === '>' && this.peek(1) === '>' && this.peek(2) === '>' && this.peek(3) === '=') {
      const op = this.advance() + this.advance() + this.advance() + this.advance();
      this.addToken('Operador de asignación con desplazamiento', 'operator', op, startLine, startCol);
      return;
    }

    // 2. Operadores ilegales comunes (ej: !===, ===>, &&&&, ||||)
    if (c === '!' && this.peek(1) === '=' && this.peek(2) === '=' && this.peek(3) === '=') {
      const bad = this.advance() + this.advance() + this.advance() + this.advance();
      this.addError('Operador no válido', bad, `El operador '${bad}' no existe en JavaScript. La desigualdad estricta es '!=='.`, startLine, startCol, `Use '!=='.`);
      return;
    }
    if (c === '=' && this.peek(1) === '=' && this.peek(2) === '=' && this.peek(3) === '=') {
      const bad = this.advance() + this.advance() + this.advance() + this.advance();
      this.addError('Operador no válido', bad, `Secuencia de signos de igualdad inválida '${bad}'. La igualdad estricta es '==='.`, startLine, startCol, `Use '==='.`);
      return;
    }
    if (c === '&' && this.peek(1) === '&' && this.peek(2) === '&') {
      const bad = this.advance() + this.advance() + this.advance();
      this.addError('Operador no válido', bad, `El operador '${bad}' no es válido. El operador lógico AND es '&&'.`, startLine, startCol, `Use '&&'.`);
      return;
    }
    if (c === '|' && this.peek(1) === '|' && this.peek(2) === '|') {
      const bad = this.advance() + this.advance() + this.advance();
      this.addError('Operador no válido', bad, `El operador '${bad}' no es válido. El operador lógico OR es '||'.`, startLine, startCol, `Use '||'.`);
      return;
    }

    // 3. Operadores de tres caracteres
    // ===, !==, **=, <<=, >>=, >>>, &&=, ||=, ??=, ...
    const threeChars = c + this.peek(1) + this.peek(2);
    if (threeChars === '===' || threeChars === '!==') {
      this.advance(); this.advance(); this.advance();
      this.addToken('Operador de comparación estricta', 'operator', threeChars, startLine, startCol);
      return;
    }
    if (threeChars === '>>>') {
      this.advance(); this.advance(); this.advance();
      this.addToken('Operador de desplazamiento sin signo', 'operator', threeChars, startLine, startCol);
      return;
    }
    if (['**=', '<<=', '>>=', '&&=', '||=', '??='].includes(threeChars)) {
      this.advance(); this.advance(); this.advance();
      this.addToken('Operador de asignación compuesta', 'operator', threeChars, startLine, startCol);
      return;
    }
    if (threeChars === '...') {
      this.advance(); this.advance(); this.advance();
      this.addToken('Operador de propagación / Rest (...)', 'delimiter', threeChars, startLine, startCol);
      return;
    }

    // 4. Operadores de dos caracteres
    const twoChars = c + this.peek(1);
    const comparisonTwo = ['==', '!=', '<=', '>='];
    if (comparisonTwo.includes(twoChars)) {
      this.advance(); this.advance();
      this.addToken('Operador de comparación', 'operator', twoChars, startLine, startCol);
      return;
    }

    const assignmentTwo = ['+=', '-=', '*=', '/=', '%=', '&=', '|=', '^='];
    if (assignmentTwo.includes(twoChars)) {
      this.advance(); this.advance();
      this.addToken('Operador de asignación', 'operator', twoChars, startLine, startCol);
      return;
    }

    const logicalTwo = ['&&', '||', '??'];
    if (logicalTwo.includes(twoChars)) {
      this.advance(); this.advance();
      this.addToken('Operador lógico', 'operator', twoChars, startLine, startCol);
      return;
    }

    const arithmeticTwo = ['++', '--', '**'];
    if (arithmeticTwo.includes(twoChars)) {
      this.advance(); this.advance();
      this.addToken('Operador aritmético', 'operator', twoChars, startLine, startCol);
      return;
    }

    const bitwiseTwo = ['<<', '>>'];
    if (bitwiseTwo.includes(twoChars)) {
      this.advance(); this.advance();
      this.addToken('Operador de bits', 'operator', twoChars, startLine, startCol);
      return;
    }

    if (twoChars === '=>') {
      this.advance(); this.advance();
      this.addToken('Flecha de función flecha (=>)', 'operator', twoChars, startLine, startCol);
      return;
    }

    if (twoChars === '?.') {
      this.advance(); this.advance();
      this.addToken('Encadenamiento opcional (?.)', 'operator', twoChars, startLine, startCol);
      return;
    }

    // 5. Operadores de un carácter
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
      this.addToken('Operador de bits', 'operator', c, startLine, startCol);
      return;
    }

    if (c === '?') {
      this.advance();
      this.addToken('Operador condicional ternario (?)', 'operator', c, startLine, startCol);
      return;
    }

    // 6. Delimitadores y signos de puntuación
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
      '.': 'Punto'
    };
    if (punctuation[c]) {
      this.advance();
      this.addToken('Signo de puntuación (' + punctuation[c] + ')', 'delimiter', c, startLine, startCol);
      return;
    }

    // 7. Símbolo # solitario (no seguido de letra para identificador privado)
    if (c === '#') {
      const bad = this.advance();
      this.addError(
        'Identificador privado mal formado',
        bad,
        `El símbolo '#' en JavaScript solo es válido al inicio de nombres de miembros privados dentro de clases (ej: #miCampo).`,
        startLine,
        startCol,
        `Agregue un nombre válido después de '#' o elimine el símbolo.`
      );
      return;
    }

    // 8. Caracteres ilegales en el alfabeto de JavaScript
    const illegalChar = this.advance();
    this.addError(
      'Carácter ilegal',
      illegalChar,
      `El carácter '${illegalChar}' no pertenece al conjunto léxico válido de JavaScript fuera de cadenas o comentarios.`,
      startLine,
      startCol,
      `Elimine o reemplace el carácter '${illegalChar}'.`
    );
  }
}

if (typeof window !== 'undefined') {
  window.JavaScriptLexer = JavaScriptLexer;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = JavaScriptLexer;
}
