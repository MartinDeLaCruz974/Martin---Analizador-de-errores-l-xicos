/**
 * PythonLexer - Analizador Léxico para Python 3
 * Asignatura: Autómatas I
 * 
 * Implementa las reglas léxicas oficiales de Python:
 * - Palabras reservadas y operadores lógicos integrados (and, or, not)
 * - Identificadores válidos y detección de identificadores inválidos (e.g. 123abc)
 * - Literales numéricos (enteros, flotantes, notación científica, complejos, hex, bin, oct)
 * - Detección de números mal formados (e.g. 3.14.15, 0xZZ, 1e, 0b102)
 * - Cadenas de texto con comillas simples, dobles y triples (multilínea) con prefijos (f, r, b, u)
 * - Cadenas sin cerrar (detección antes de salto de línea o EOF)
 * - Comentarios de una sola línea con #
 * - Operadores aritméticos, relacionales, de asignación, de bits y morsa (:=)
 * - Detección de secuencias ilegales o no soportadas en Python (===, &&, ||, ++, --, $, ?, etc.)
 */

class PythonLexer extends BaseLexer {
  constructor(source = '') {
    super(source, 'Python');
    this.initKeywords();
  }

  initKeywords() {
    this.keywords = new Set([
      'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await',
      'break', 'class', 'continue', 'def', 'del', 'elif', 'else',
      'except', 'finally', 'for', 'from', 'global', 'if', 'import',
      'in', 'is', 'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise',
      'return', 'try', 'while', 'with', 'yield', 'match', 'case'
    ]);

    // Clasificación semántica de palabras clave para el análisis
    this.logicalKeywords = new Set(['and', 'or', 'not']);
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

      // 2. Comentarios (# hasta el fin de línea)
      if (c === '#') {
        this.scanComment(startLine, startCol);
        continue;
      }

      // 3. Prefijos de cadenas (r, f, b, u, rf, fr, etc.) seguidos de comillas
      if (this.isStringPrefix()) {
        this.scanStringWithPrefix(startLine, startCol);
        continue;
      }

      // 4. Cadenas de texto regulares (' o ")
      if (c === '"' || c === "'") {
        this.scanString(startLine, startCol);
        continue;
      }

      // 5. Literales numéricos (dígito o punto seguido de dígito)
      if (this.isDigit(c) || (c === '.' && this.isDigit(this.peek(1)))) {
        this.scanNumber(startLine, startCol);
        continue;
      }

      // 6. Identificadores y palabras reservadas
      if (this.isAlpha(c)) {
        this.scanIdentifierOrKeyword(startLine, startCol);
        continue;
      }

      // 7. Operadores y delimitadores
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

  scanComment(startLine, startCol) {
    let commentText = '';
    while (!this.isAtEnd() && this.peek() !== '\n') {
      commentText += this.advance();
    }
    this.addToken('Comentario', 'comment', commentText, startLine, startCol);
  }

  isStringPrefix() {
    const c1 = this.peek().toLowerCase();
    const c2 = this.peek(1).toLowerCase();
    const c3 = this.peek(2);

    const validChars = new Set(['r', 'u', 'f', 'b']);

    // Prefijo de dos letras (ej: rf, fr, rb, br)
    if (validChars.has(c1) && validChars.has(c2) && (c3 === '"' || c3 === "'")) {
      return 2;
    }

    // Prefijo de una letra (ej: r, f, b, u)
    if (validChars.has(c1) && (c2 === '"' || c2 === "'")) {
      return 1;
    }

    return 0;
  }

  scanStringWithPrefix(startLine, startCol) {
    const prefixLen = this.isStringPrefix();
    let prefix = '';
    for (let i = 0; i < prefixLen; i++) {
      prefix += this.advance();
    }
    this.scanString(startLine, startCol, prefix);
  }

  scanString(startLine, startCol, prefix = '') {
    const quoteChar = this.peek();
    let isTriple = false;

    // Verificar si es comilla triple (''' o """)
    if (this.peek(1) === quoteChar && this.peek(2) === quoteChar) {
      isTriple = true;
    }

    let rawString = prefix;

    if (isTriple) {
      rawString += this.advance(); // 1
      rawString += this.advance(); // 2
      rawString += this.advance(); // 3
      const quoteTriple = quoteChar + quoteChar + quoteChar;

      let closed = false;
      while (!this.isAtEnd()) {
        if (this.peek() === '\\') {
          rawString += this.advance();
          if (!this.isAtEnd()) {
            rawString += this.advance();
          }
          continue;
        }

        if (this.peek() === quoteChar &&
            this.peek(1) === quoteChar &&
            this.peek(2) === quoteChar) {
          rawString += this.advance();
          rawString += this.advance();
          rawString += this.advance();
          closed = true;
          break;
        }

        rawString += this.advance();
      }

      if (!closed) {
        this.addError(
          'Cadena multilínea sin cerrar',
          rawString.length > 30 ? rawString.slice(0, 27) + '...' : rawString,
          `Se esperaba cierre de comillas triples (${quoteTriple}) antes del fin de archivo.`,
          startLine,
          startCol,
          `Cierre la cadena agregando ${quoteTriple} al final.`
        );
        return;
      }

      this.addToken('Cadena de texto (multilínea)', 'literal', rawString, startLine, startCol);
    } else {
      // Comilla simple o doble simple
      rawString += this.advance();
      let closed = false;

      while (!this.isAtEnd()) {
        const c = this.peek();

        // En Python, una cadena estándar de una línea NO puede contener un salto de línea sin escapar
        if (c === '\n') {
          break;
        }

        if (c === '\\') {
          rawString += this.advance();
          if (!this.isAtEnd() && this.peek() !== '\n') {
            rawString += this.advance();
          }
          continue;
        }

        if (c === quoteChar) {
          rawString += this.advance();
          closed = true;
          break;
        }

        rawString += this.advance();
      }

      if (!closed) {
        this.addError(
          'Cadena de texto sin cerrar',
          rawString,
          `Se esperaba comilla de cierre (${quoteChar}) antes del fin de línea o archivo.`,
          startLine,
          startCol,
          `Agregue la comilla de cierre ${quoteChar} antes del salto de línea.`
        );
        return;
      }

      this.addToken('Cadena de texto', 'literal', rawString, startLine, startCol);
    }
  }

  scanNumber(startLine, startCol) {
    let numStr = '';
    const firstChar = this.peek();

    // Comprobar bases numéricas: 0x, 0b, 0o
    if (firstChar === '0' && (this.peek(1) === 'x' || this.peek(1) === 'X')) {
      numStr += this.advance(); // '0'
      numStr += this.advance(); // 'x'
      let digits = '';
      while (this.isHexDigit(this.peek()) || this.peek() === '_') {
        digits += this.advance();
      }
      numStr += digits;

      // Verificar si hubo dígitos y si hay caracteres inválidos pegados
      if (digits.length === 0 || (this.isAlpha(this.peek()) && !this.isHexDigit(this.peek()))) {
        // Error en número hexadecimal
        while (this.isAlphaNumeric(this.peek())) {
          numStr += this.advance();
        }
        this.addError(
          'Literal hexadecimal inválido',
          numStr,
          `El prefijo '0x' debe ir seguido únicamente de dígitos hexadecimales válidos (0-9, a-f, A-F).`,
          startLine,
          startCol,
          `Corrija los caracteres hexadecimales del número.`
        );
        return;
      }

      this.addToken('Número hexadecimal', 'literal', numStr, startLine, startCol);
      return;
    }

    if (firstChar === '0' && (this.peek(1) === 'b' || this.peek(1) === 'B')) {
      numStr += this.advance(); // '0'
      numStr += this.advance(); // 'b'
      let digits = '';
      while (this.isBinDigit(this.peek()) || this.peek() === '_') {
        digits += this.advance();
      }
      numStr += digits;

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
          `Use únicamente los dígitos 0 y 1 en literales binarios.`
        );
        return;
      }

      this.addToken('Número binario', 'literal', numStr, startLine, startCol);
      return;
    }

    if (firstChar === '0' && (this.peek(1) === 'o' || this.peek(1) === 'O')) {
      numStr += this.advance(); // '0'
      numStr += this.advance(); // 'o'
      let digits = '';
      while (this.isOctDigit(this.peek()) || this.peek() === '_') {
        digits += this.advance();
      }
      numStr += digits;

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
          `Use únicamente dígitos del 0 al 7 en literales octales.`
        );
        return;
      }

      this.addToken('Número octal', 'literal', numStr, startLine, startCol);
      return;
    }

    // Entero decimal o Flotante
    let hasDot = false;
    let dotCount = 0;

    while (this.isDigit(this.peek()) || this.peek() === '_' || this.peek() === '.') {
      if (this.peek() === '.') {
        // Si el siguiente carácter es otro punto o ya teníamos punto
        if (hasDot) {
          dotCount++;
          numStr += this.advance();
          // Consumir el resto de caracteres para capturar el error completo
          while (this.isAlphaNumeric(this.peek()) || this.peek() === '.') {
            numStr += this.advance();
          }
          this.addError(
            'Número decimal mal formado',
            numStr,
            `El literal numérico contiene múltiples puntos decimales (${dotCount + 1}). Solo se permite un único punto.`,
            startLine,
            startCol,
            `Elimine los puntos decimales adicionales.`
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
          `La notación científica '${numStr}' requiere dígitos después del símbolo de exponente 'e'.`,
          startLine,
          startCol,
          `Especifique el valor numérico del exponente (ej: 1e5 o 2.5e-3).`
        );
        return;
      }
    }

    // Sufijo de número imaginario en Python: 'j' o 'J'
    if (this.peek() === 'j' || this.peek() === 'J') {
      numStr += this.advance();
      this.addToken('Número imaginario (complejo)', 'literal', numStr, startLine, startCol);
      return;
    }

    // Si después de los dígitos viene una letra no permitida (ej: 123abc, 9variable)
    if (this.isAlpha(this.peek())) {
      while (this.isAlphaNumeric(this.peek())) {
        numStr += this.advance();
      }
      this.addError(
        'Identificador inválido',
        numStr,
        `Un identificador no puede comenzar con un dígito ('${numStr}'). La gramática léxica exige iniciar con letra o guión bajo '_'.`,
        startLine,
        startCol,
        `Renombre el identificador para que inicie con una letra o '_', o separe el número de la variable con un operador o espacio.`
      );
      return;
    }

    // Clasificación del token numérico
    if (hasDot || hasExp) {
      this.addToken('Número decimal (flotante)', 'literal', numStr, startLine, startCol);
    } else {
      this.addToken('Número entero', 'literal', numStr, startLine, startCol);
    }
  }

  scanIdentifierOrKeyword(startLine, startCol) {
    let name = '';
    while (this.isAlphaNumeric(this.peek())) {
      name += this.advance();
    }

    if (this.keywords.has(name)) {
      if (this.logicalKeywords.has(name)) {
        this.addToken('Operador lógico', 'operator', name, startLine, startCol);
      } else {
        this.addToken('Palabra reservada', 'keyword', name, startLine, startCol);
      }
    } else {
      this.addToken('Identificador', 'identifier', name, startLine, startCol);
    }
  }

  scanOperatorsAndPunctuation(startLine, startCol) {
    const c = this.peek();

    // 1. Detectar secuencias erróneas típicas de otros lenguajes no válidas en Python
    // === (Operador triple igual no existe en Python)
    if (c === '=' && this.peek(1) === '=' && this.peek(2) === '=') {
      const badOp = this.advance() + this.advance() + this.advance();
      this.addError(
        'Operador no válido',
        badOp,
        `El operador '${badOp}' no existe en Python. En Python la comparación de igualdad se realiza con '=='.`,
        startLine,
        startCol,
        `Use '==' en lugar de '==='.`
      );
      return;
    }

    // !== (No existe en Python)
    if (c === '!' && this.peek(1) === '=' && this.peek(2) === '=') {
      const badOp = this.advance() + this.advance() + this.advance();
      this.addError(
        'Operador no válido',
        badOp,
        `El operador '${badOp}' no existe en Python. La desigualdad se expresa con '!='.`,
        startLine,
        startCol,
        `Use '!='.`
      );
      return;
    }

    // && (Python utiliza la palabra 'and')
    if (c === '&' && this.peek(1) === '&') {
      const badOp = this.advance() + this.advance();
      this.addError(
        'Operador no válido en Python',
        badOp,
        `El operador '${badOp}' no es parte de la gramática de Python. La conjunción lógica se escribe con la palabra reservada 'and'.`,
        startLine,
        startCol,
        `Reemplace '&&' por 'and'.`
      );
      return;
    }

    // || (Python utiliza la palabra 'or')
    if (c === '|' && this.peek(1) === '|') {
      const badOp = this.advance() + this.advance();
      this.addError(
        'Operador no válido en Python',
        badOp,
        `El operador '${badOp}' no es parte de la gramática de Python. La disyunción lógica se escribe con la palabra reservada 'or'.`,
        startLine,
        startCol,
        `Reemplace '||' por 'or'.`
      );
      return;
    }

    // ++ o -- (Incremento/decremento no existen en Python)
    if ((c === '+' && this.peek(1) === '+') || (c === '-' && this.peek(1) === '-')) {
      const badOp = this.advance() + this.advance();
      this.addError(
        'Operador no válido en Python',
        badOp,
        `Python no soporta operadores de incremento o decremento '${badOp}'. Use '+=' o '-='.`,
        startLine,
        startCol,
        `Reemplace '${badOp}' por '${badOp[0]}= 1'.`
      );
      return;
    }

    // 2. Operadores de tres caracteres
    // **=, //=, <<=, >>=
    if ((c === '*' && this.peek(1) === '*' && this.peek(2) === '=') ||
        (c === '/' && this.peek(1) === '/' && this.peek(2) === '=') ||
        (c === '<' && this.peek(1) === '<' && this.peek(2) === '=') ||
        (c === '>' && this.peek(1) === '>' && this.peek(2) === '=')) {
      const op = this.advance() + this.advance() + this.advance();
      this.addToken('Operador de asignación', 'operator', op, startLine, startCol);
      return;
    }

    // 3. Operadores de dos caracteres
    // **, //, ==, !=, <=, >=, :=, +=, -=, *=, /=, %=, &=, |=, ^=, <<, >>, ->
    const twoChars = c + this.peek(1);
    const assignmentTwo = ['+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', ':='];
    if (assignmentTwo.includes(twoChars)) {
      this.advance();
      this.advance();
      this.addToken('Operador de asignación', 'operator', twoChars, startLine, startCol);
      return;
    }

    const comparisonTwo = ['==', '!=', '<=', '>='];
    if (comparisonTwo.includes(twoChars)) {
      this.advance();
      this.advance();
      this.addToken('Operador de comparación', 'operator', twoChars, startLine, startCol);
      return;
    }

    const arithmeticTwo = ['**', '//'];
    if (arithmeticTwo.includes(twoChars)) {
      this.advance();
      this.advance();
      this.addToken('Operador aritmético', 'operator', twoChars, startLine, startCol);
      return;
    }

    const bitwiseTwo = ['<<', '>>'];
    if (bitwiseTwo.includes(twoChars)) {
      this.advance();
      this.advance();
      this.addToken('Operador de desplazamiento de bits', 'operator', twoChars, startLine, startCol);
      return;
    }

    if (twoChars === '->') {
      this.advance();
      this.advance();
      this.addToken('Indicador de tipo de retorno', 'operator', twoChars, startLine, startCol);
      return;
    }

    // 4. Operadores de un solo carácter
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

    const bitwiseOne = ['&', '|', '^', '~'];
    if (bitwiseOne.includes(c)) {
      this.advance();
      this.addToken('Operador de bits', 'operator', c, startLine, startCol);
      return;
    }

    if (c === '@') {
      this.advance();
      this.addToken('Decorador (@)', 'operator', c, startLine, startCol);
      return;
    }

    // 5. Delimitadores y puntuación
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

    // 6. Signo de exclamación solitario (!)
    if (c === '!') {
      this.advance();
      this.addError(
        'Operador no válido',
        '!',
        `El símbolo '!' no es un operador válido en Python. Para la negación lógica utilice 'not'.`,
        startLine,
        startCol,
        `Reemplace '!' por 'not'.`
      );
      return;
    }

    // 7. Caracteres ilegales no reconocidos en el alfabeto de Python
    const illegalChar = this.advance();
    this.addError(
      'Carácter ilegal',
      illegalChar,
      `El carácter '${illegalChar}' no pertenece al alfabeto de tokens válidos en Python.`,
      startLine,
      startCol,
      `Elimine o reemplace el carácter '${illegalChar}'.`
    );
  }
}

if (typeof window !== 'undefined') {
  window.PythonLexer = PythonLexer;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PythonLexer;
}
