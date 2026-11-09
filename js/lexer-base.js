/**
 * BaseLexer - Clase base para analizadores léxicos
 * Asignatura: Autómatas I
 * 
 * Implementa el motor de escaneo de caracteres, seguimiento de posición
 * (línea y columna), registro de tokens válidos y captura de errores léxicos
 * con soporte para recuperación de errores (panic mode / skip invalid).
 */

class BaseLexer {
  constructor(source = '', languageName = '') {
    this.source = source;
    this.languageName = languageName;
    this.length = source.length;
    this.cursor = 0;
    this.line = 1;
    this.column = 1;
    this.tokens = [];
    this.errors = [];
    this.tokenIdCounter = 1;
    this.errorIdCounter = 1;
  }

  /**
   * Reinicia el estado del analizador
   */
  reset(source = '') {
    this.source = source;
    this.length = source.length;
    this.cursor = 0;
    this.line = 1;
    this.column = 1;
    this.tokens = [];
    this.errors = [];
    this.tokenIdCounter = 1;
    this.errorIdCounter = 1;
  }

  /**
   * Comprueba si se ha alcanzado el final del código fuente
   */
  isAtEnd() {
    return this.cursor >= this.length;
  }

  /**
   * Inspecciona el carácter actual o con un desplazamiento sin consumirlo
   */
  peek(offset = 0) {
    const pos = this.cursor + offset;
    if (pos >= this.length) return '\0';
    return this.source[pos];
  }

  /**
   * Consume y devuelve el carácter actual, actualizando línea y columna
   */
  advance() {
    if (this.isAtEnd()) return '\0';
    const char = this.source[this.cursor];
    this.cursor++;
    if (char === '\n') {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
    return char;
  }

  /**
   * Consume el carácter actual solo si coincide con el esperado
   */
  match(expected) {
    if (this.isAtEnd()) return false;
    if (this.source[this.cursor] !== expected) return false;
    this.advance();
    return true;
  }

  /**
   * Registra un token reconocido
   */
  addToken(type, category, lexeme, startLine, startCol, extra = {}) {
    this.tokens.push({
      id: this.tokenIdCounter++,
      type,
      category, // 'keyword', 'identifier', 'operator', 'literal', 'delimiter', 'comment', 'preprocessor'
      lexeme,
      line: startLine,
      column: startCol,
      length: lexeme.length,
      ...extra
    });
  }

  /**
   * Registra un error léxico detectado
   */
  addError(errorType, lexeme, description, startLine, startCol, suggestion = '') {
    this.errors.push({
      id: this.errorIdCounter++,
      errorType,
      lexeme,
      description,
      line: startLine,
      column: startCol,
      length: (lexeme && lexeme.length > 0) ? lexeme.length : 1,
      suggestion
    });
  }

  /**
   * Helper para verificar si un carácter es dígito decimal
   */
  isDigit(c) {
    return c >= '0' && c <= '9';
  }

  /**
   * Helper para verificar si un carácter es dígito hexadecimal
   */
  isHexDigit(c) {
    return (c >= '0' && c <= '9') ||
           (c >= 'a' && c <= 'f') ||
           (c >= 'A' && c <= 'F');
  }

  /**
   * Helper para verificar si un carácter es dígito binario
   */
  isBinDigit(c) {
    return c === '0' || c === '1';
  }

  /**
   * Helper para verificar si un carácter es dígito octal
   */
  isOctDigit(c) {
    return c >= '0' && c <= '7';
  }

  /**
   * Helper para verificar si un carácter es letra ASCII o guión bajo
   */
  isAlpha(c) {
    return (c >= 'a' && c <= 'z') ||
           (c >= 'A' && c <= 'Z') ||
           c === '_';
  }

  /**
   * Helper para verificar si es alfanumérico ASCII o guión bajo
   */
  isAlphaNumeric(c) {
    return this.isAlpha(c) || this.isDigit(c);
  }

  /**
   * Método principal de análisis que debe sobreescribir cada subclase
   */
  tokenize() {
    throw new Error('tokenize() debe ser implementado por la subclase');
  }
}

// Exportación para entornos ES Modules o asignación al objeto global window
if (typeof window !== 'undefined') {
  window.BaseLexer = BaseLexer;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BaseLexer;
}
