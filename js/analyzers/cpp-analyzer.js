/**
 * CppAnalyzer - Analizador Multinivel para C++ (C++20/C++23)
 * Asignatura: Autómatas I / Compiladores
 * 
 * Integra los tres niveles de análisis para C++:
 * 1. Nivel Léxico: Tokens, directivas de preprocesador y errores léxicos mediante CppLexer.
 * 2. Nivel Sintáctico: Delimitadores balanceados, punto y coma (;) obligatorios, punto y coma tras class/struct, estructuras condicionales y tipos de retorno faltantes.
 * 3. Nivel Semántico: Variables no declaradas, funciones inexistentes, redefinición en el mismo ámbito, modificación de variables const, aridad de funciones y tipos incompatibles.
 */

class CppAnalyzer {
  constructor(sourceCode = '') {
    this.sourceCode = sourceCode;
    this.lexer = new CppLexer(sourceCode);
    this.lexicalResult = null;
    this.syntacticErrors = [];
    this.semanticErrors = [];

    // Tipos primitivos y biblioteca estándar de C++
    this.cppTypes = new Set([
      'int', 'float', 'double', 'char', 'bool', 'void', 'long', 'short',
      'unsigned', 'signed', 'auto', 'size_t', 'string', 'wstring',
      'int8_t', 'int16_t', 'int32_t', 'int64_t', 'uint8_t', 'uint16_t', 'uint32_t', 'uint64_t'
    ]);

    this.standardSymbols = new Set([
      'std', 'cout', 'cin', 'cerr', 'endl', 'vector', 'string', 'map', 'set',
      'pair', 'tuple', 'unique_ptr', 'shared_ptr', 'make_unique', 'make_shared',
      'printf', 'scanf', 'malloc', 'free', 'nullptr', 'true', 'false', 'main',
      'iostream', 'vector', 'algorithm', 'cmath', 'string'
    ]);
  }

  analyze() {
    this.syntacticErrors = [];
    this.semanticErrors = [];

    // 1. ANÁLISIS LÉXICO
    this.lexicalResult = this.lexer.tokenize();
    const lexicalErrors = this.lexicalResult.errors.map(err => ({
      ...err,
      category: 'lexical',
      level: 'Léxico',
      color: 'red'
    }));

    const tokens = this.lexicalResult.tokens;

    // 2. ANÁLISIS SINTÁCTICO
    this.analyzeSyntax(tokens);

    // 3. ANÁLISIS SEMÁNTICO
    this.analyzeSemantics(tokens);

    const totalErrors = lexicalErrors.length + this.syntacticErrors.length + this.semanticErrors.length;

    return {
      language: 'C++',
      tokens: tokens,
      lexicalErrors: lexicalErrors,
      syntacticErrors: this.syntacticErrors,
      semanticErrors: this.semanticErrors,
      allErrors: [...lexicalErrors, ...this.syntacticErrors, ...this.semanticErrors],
      counts: {
        lexical: lexicalErrors.length,
        syntactic: this.syntacticErrors.length,
        semantic: this.semanticErrors.length,
        total: totalErrors
      },
      isValid: totalErrors === 0
    };
  }

  addSyntacticError(errorType, lexeme, description, line, column, suggestion = '') {
    this.syntacticErrors.push({
      id: `syn-${this.syntacticErrors.length + 1}`,
      category: 'syntactic',
      level: 'Sintáctico',
      errorType,
      lexeme,
      description,
      line,
      column,
      length: (lexeme && lexeme.length > 0) ? lexeme.length : 1,
      suggestion,
      color: 'orange'
    });
  }

  addSemanticError(errorType, lexeme, description, line, column, suggestion = '') {
    this.semanticErrors.push({
      id: `sem-${this.semanticErrors.length + 1}`,
      category: 'semantic',
      level: 'Semántico',
      errorType,
      lexeme,
      description,
      line,
      column,
      length: (lexeme && lexeme.length > 0) ? lexeme.length : 1,
      suggestion,
      color: 'yellow'
    });
  }

  /**
   * ========================================================
   * ANÁLISIS SINTÁCTICO DE C++
   * ========================================================
   */
  analyzeSyntax(tokens) {
    // A. Delimitadores balanceados (), [], {}
    this.checkBalancedDelimiters(tokens);

    // B. Falta de punto y coma (;) tras class o struct (ej: class Foo { };)
    this.checkClassSemicolons(tokens);

    // C. Verificación de punto y coma (;) en sentencias e instrucciones
    this.checkStatementSemicolons(tokens);

    // D. Estructuras condicionales y bucles
    this.checkControlStructures(tokens);

    // E. Declaraciones incompletas (int ;)
    this.checkIncompleteDeclarations(tokens);

    // F. L-Values inválidos en asignación (5 = x;)
    this.checkInvalidAssignments(tokens);

    // G. Operadores consecutivos inválidos
    this.checkOperators(tokens);
  }

  checkBalancedDelimiters(tokens) {
    const stack = [];
    const pairs = { ')': '(', ']': '[', '}': '{' };
    const names = { '(': 'Paréntesis', '[': 'Corchete', '{': 'Llave' };

    for (const t of tokens) {
      if (t.lexeme === '(' || t.lexeme === '[' || t.lexeme === '{') {
        stack.push(t);
      } else if (t.lexeme === ')' || t.lexeme === ']' || t.lexeme === '}') {
        const expectedOpen = pairs[t.lexeme];
        if (stack.length === 0) {
          this.addSyntacticError(
            'Delimitador de cierre inesperado',
            t.lexeme,
            `Se encontró el delimitador de cierre '${t.lexeme}' sin delimitador de apertura previo en C++.`,
            t.line,
            t.column,
            `Elimine el '${t.lexeme}' sobrante o abra el delimitador correspondiente.`
          );
        } else {
          const top = stack.pop();
          if (top.lexeme !== expectedOpen) {
            this.addSyntacticError(
              'Delimitadores incompatibles',
              t.lexeme,
              `Se esperaba cerrar '${top.lexeme}' (${names[top.lexeme]}) de la línea ${top.line}, pero se encontró '${t.lexeme}'.`,
              t.line,
              t.column,
              `Reemplace '${t.lexeme}' por el cierre adecuado para '${top.lexeme}'.`
            );
          }
        }
      }
    }

    while (stack.length > 0) {
      const unclosed = stack.pop();
      this.addSyntacticError(
        'Delimitador sin cerrar',
        unclosed.lexeme,
        `El delimitador '${unclosed.lexeme}' (${names[unclosed.lexeme]}) de la línea ${unclosed.line}, columna ${unclosed.column} no fue cerrado antes del fin de archivo.`,
        unclosed.line,
        unclosed.column,
        `Agregue el delimitador de cierre correspondiente para '${unclosed.lexeme}'.`
      );
    }
  }

  checkClassSemicolons(tokens) {
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].lexeme === 'class' || tokens[i].lexeme === 'struct') {
        // Buscar el bloque de la clase '{ ... }'
        let j = i + 1;
        while (j < tokens.length && tokens[j].lexeme !== '{' && tokens[j].lexeme !== ';') {
          j++;
        }
        if (j < tokens.length && tokens[j].lexeme === '{') {
          let depth = 1;
          let k = j + 1;
          while (k < tokens.length && depth > 0) {
            if (tokens[k].lexeme === '{') depth++;
            else if (tokens[k].lexeme === '}') depth--;
            k++;
          }
          // Tras cerrar '}', en C++ DEBE haber un ';' obligatorio
          const closeBrace = tokens[k - 1];
          const afterBrace = tokens[k];
          if (closeBrace && closeBrace.lexeme === '}' && (!afterBrace || afterBrace.lexeme !== ';')) {
            this.addSyntacticError(
              "Falta de ';' tras definición de clase/estructura",
              tokens[i].lexeme,
              `En C++ la definición de '${tokens[i].lexeme}' requiere obligatoriamente un punto y coma ';' después de la llave de cierre '}' (error: expected ';' after ${tokens[i].lexeme} definition).`,
              closeBrace.line,
              closeBrace.column + 1,
              `Agregue ';' inmediatamente después de la llave de cierre '}'.`
            );
          }
        }
      }
    }
  }

  checkStatementSemicolons(tokens) {
    // Detectar líneas con instrucciones que no terminan en ; o {
    // Agrupar tokens por línea
    const tokensByLine = new Map();
    for (const t of tokens) {
      if (t.category === 'comment' || t.category === 'preprocessor') continue;
      if (!tokensByLine.has(t.line)) tokensByLine.set(t.line, []);
      tokensByLine.get(t.line).push(t);
    }

    tokensByLine.forEach((lineTokens, lineNum) => {
      if (lineTokens.length === 0) return;
      const first = lineTokens[0];
      const last = lineTokens[lineTokens.length - 1];

      // Ignorar cabeceras de control (if, for, while, switch, class, namespace, public, private, protected)
      const ignoreFirst = new Set(['if', 'for', 'while', 'switch', 'class', 'struct', 'namespace', 'public', 'private', 'protected', '#include']);
      if (ignoreFirst.has(first.lexeme)) return;

      // Sentencias normales de asignación o declaración: deben terminar en ';' o '{'
      if (['return', 'int', 'float', 'double', 'char', 'bool', 'auto', 'cout', 'cin', 'string'].includes(first.lexeme) ||
          first.category === 'identifier') {
        if (last.lexeme !== ';' && last.lexeme !== '{' && last.lexeme !== '}' && last.lexeme !== ':') {
          // Si no es continuación de operadores (<<, >>, +)
          if (!['<<', '>>', '+', '-', '*', ',', '(', '{'].includes(last.lexeme)) {
            this.addSyntacticError(
              "Falta de punto y coma (';')",
              last.lexeme,
              `La instrucción en la línea ${lineNum} no termina con el delimitador obligatorio ';' (error: expected ';' at end of statement).`,
              last.line,
              last.column + last.length,
              `Agregue ';' al final de la instrucción.`
            );
          }
        }
      }
    });
  }

  checkControlStructures(tokens) {
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      if (t.lexeme === 'if' || t.lexeme === 'while' || t.lexeme === 'switch') {
        const next = tokens[i + 1];
        if (!next || next.lexeme !== '(') {
          this.addSyntacticError(
            'Faltan paréntesis en estructura de control',
            t.lexeme,
            `En C++ la condición de '${t.lexeme}' debe estar encerrada entre paréntesis '(...)'.`,
            t.line,
            t.column,
            `Encierre la condición entre paréntesis (ej: ${t.lexeme} (condicion)).`
          );
        } else if (tokens[i + 2] && tokens[i + 2].lexeme === ')') {
          this.addSyntacticError(
            'Condición vacía',
            t.lexeme,
            `La condición de '${t.lexeme}' no puede estar vacía.`,
            t.line,
            t.column,
            `Especifique una expresión dentro de los paréntesis.`
          );
        }
      }

      if (t.lexeme === 'else') {
        let hasIf = false;
        let j = i - 1;
        while (j >= 0) {
          if (tokens[j].lexeme === 'if') { hasIf = true; break; }
          j--;
        }
        if (!hasIf) {
          this.addSyntacticError(
            'Cláusula else sin if',
            'else',
            `Se encontró 'else' sin un 'if' previo correspondiente.`,
            t.line,
            t.column,
            `Verifique la estructura de su condicional 'if'.`
          );
        }
      }
    }
  }

  checkIncompleteDeclarations(tokens) {
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      if (this.cppTypes.has(t.lexeme)) {
        const next = tokens[i + 1];
        // int ; o double = 10;
        if (next && next.lexeme === ';') {
          this.addSyntacticError(
            'Declaración incompleta',
            t.lexeme,
            `Se declaró el tipo '${t.lexeme}' pero falta el nombre del identificador de la variable (error: expected unqualified-id).`,
            t.line,
            t.column,
            `Especifique el nombre de la variable (ej: ${t.lexeme} miVariable;).`
          );
        } else if (next && next.lexeme === '=') {
          this.addSyntacticError(
            'Falta nombre de variable en declaración',
            t.lexeme,
            `Falta el nombre de la variable entre el tipo '${t.lexeme}' y el operador '='.`,
            t.line,
            t.column,
            `Indique el nombre de la variable antes de '='.`
          );
        }
      }
    }
  }

  checkInvalidAssignments(tokens) {
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      if (t.lexeme === '=' && t.category === 'operator') {
        const prev = tokens[i - 1];
        if (prev && prev.category === 'literal') {
          this.addSyntacticError(
            'Destino de asignación inválido (L-Value)',
            prev.lexeme,
            `No se puede asignar un valor a un literal ('${prev.lexeme}'). El operando izquierdo debe ser un L-Value modificable (error: lvalue required as left operand of assignment).`,
            prev.line,
            prev.column,
            `Coloque una variable modificable a la izquierda de '='.`
          );
        }
      }
    }
  }

  checkOperators(tokens) {
    const binaryOps = new Set(['+', '-', '*', '/', '%', '==', '!=', '<', '>', '<=', '>=']);
    for (let i = 0; i < tokens.length; i++) {
      const curr = tokens[i];
      const next = tokens[i + 1];

      if (binaryOps.has(curr.lexeme) && next && binaryOps.has(next.lexeme)) {
        if (next.lexeme !== '+' && next.lexeme !== '-') {
          this.addSyntacticError(
            'Operadores consecutivos incorrectos',
            `${curr.lexeme} ${next.lexeme}`,
            `Los operadores binarios '${curr.lexeme}' y '${next.lexeme}' están colocados consecutivamente sin un operando intermedio.`,
            curr.line,
            curr.column,
            `Elimine uno de los operadores.`
          );
        }
      }
    }
  }

  /**
   * ========================================================
   * ANÁLISIS SEMÁNTICO DE C++
   * ========================================================
   */
  analyzeSemantics(tokens) {
    const declaredVariables = new Set([...this.standardSymbols]);
    const constVariables = new Set();
    const declaredFunctions = new Map(); // name -> paramCount
    const variableTypes = new Map(); // name -> type ('int', 'double', 'string', etc.)

    // Primera pasada: registrar tipos y declaraciones
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];

      // Detección de const: const int MAX = 100;
      let isConst = false;
      let typeIndex = i;
      if (t.lexeme === 'const') {
        isConst = true;
        typeIndex = i + 1;
      }

      const typeTok = tokens[typeIndex];
      if (typeTok && (this.cppTypes.has(typeTok.lexeme) || typeTok.lexeme === 'auto')) {
        const idTok = tokens[typeIndex + 1];
        if (idTok && idTok.category === 'identifier') {
          const varName = idTok.lexeme;

          // Si el siguiente es '(' es declaración de función: int suma(int a, int b)
          if (tokens[typeIndex + 2] && tokens[typeIndex + 2].lexeme === '(') {
            declaredVariables.add(varName);

            // Contar parámetros
            const params = [];
            let j = typeIndex + 3;
            while (j < tokens.length && tokens[j].lexeme !== ')') {
              if (tokens[j].category === 'identifier') {
                params.push(tokens[j].lexeme);
                declaredVariables.add(tokens[j].lexeme);
              }
              j++;
            }
            declaredFunctions.set(varName, {
              paramCount: params.length,
              line: idTok.line
            });
          } else {
            // Declaración de variable
            if (declaredVariables.has(varName) && !this.standardSymbols.has(varName)) {
              this.addSemanticError(
                'Redefinición de variable',
                varName,
                `La variable '${varName}' ya fue declarada previamente en este ámbito (error: redefinition of '${varName}').`,
                idTok.line,
                idTok.column,
                `Utilice un nombre de variable diferente o evite duplicar la declaración.`
              );
            }
            declaredVariables.add(varName);
            variableTypes.set(varName, typeTok.lexeme);

            if (isConst) {
              constVariables.add(varName);
            }

            // Comprobación de asignación de tipo incompatible en la declaración
            // ej: int x = "cadena";
            if (tokens[typeIndex + 2] && tokens[typeIndex + 2].lexeme === '=') {
              const valTok = tokens[typeIndex + 3];
              if (valTok && valTok.category === 'literal') {
                if (typeTok.lexeme === 'int' && (valTok.type.includes('Cadena') || valTok.type.includes('string'))) {
                  this.addSemanticError(
                    'Asignación de tipos incompatibles',
                    `${typeTok.lexeme} ${varName} = ${valTok.lexeme}`,
                    `No se puede asignar un literal de cadena ('const char*') a una variable de tipo entero '${typeTok.lexeme}' (error: cannot convert 'const char*' to 'int').`,
                    valTok.line,
                    valTok.column,
                    `Asigne un número entero o cambie el tipo de la variable a 'string'.`
                  );
                }
              }
            }
          }
        }
      }

      // Clases: class MiClase
      if ((t.lexeme === 'class' || t.lexeme === 'struct') && tokens[i + 1] && tokens[i + 1].category === 'identifier') {
        declaredVariables.add(tokens[i + 1].lexeme);
      }
    }

    // Segunda pasada: verificación de uso de identificadores, variables no declaradas y const
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];

      // Verificación de modificación de variable const: const int X = 10; X = 20;
      if (t.category === 'operator' && ['=', '+=', '-=', '*=', '/='].includes(t.lexeme)) {
        const prev = tokens[i - 1];
        if (prev && prev.category === 'identifier') {
          if (constVariables.has(prev.lexeme)) {
            this.addSemanticError(
              'Modificación de variable de solo lectura (const)',
              prev.lexeme,
              `No se puede modificar la variable constante '${prev.lexeme}' (error: assignment of read-only variable '${prev.lexeme}').`,
              prev.line,
              prev.column,
              `Elimine el calificador 'const' de la declaración si su valor debe ser reasignable.`
            );
          }
        }
      }

      // Verificación de llamadas a funciones y aridad
      if (t.category === 'identifier' && tokens[i + 1] && tokens[i + 1].lexeme === '(') {
        const funcName = t.lexeme;
        const prev = tokens[i - 1];

        // Ignorar métodos de objetos (obj.metodo(), ptr->metodo(), std::cout)
        if (prev && (prev.lexeme === '.' || prev.lexeme === '->' || prev.lexeme === '::')) {
          continue;
        }
        // Ignorar si es el nombre en una declaración de tipo (int suma(...))
        if (prev && this.cppTypes.has(prev.lexeme)) {
          continue;
        }

        if (declaredFunctions.has(funcName)) {
          const sig = declaredFunctions.get(funcName);
          const argsCount = this.countArgumentsInCall(tokens, i + 1);

          if (argsCount !== sig.paramCount) {
            this.addSemanticError(
              'Cantidad incorrecta de argumentos en función',
              funcName,
              `La función '${funcName}' espera ${sig.paramCount} argumento(s) según su declaración en la línea ${sig.line}, pero se pasaron ${argsCount}.`,
              t.line,
              t.column,
              `Proporcione exactamente ${sig.paramCount} argumento(s) en la llamada a '${funcName}'.`
            );
          }
        } else if (!declaredVariables.has(funcName)) {
          this.addSemanticError(
            'Función no declarada',
            funcName,
            `Se intenta invocar la función '${funcName}()', pero no ha sido declarada ni prototipada en este archivo (error: '${funcName}' was not declared in this scope).`,
            t.line,
            t.column,
            `Declare el prototipo o la función '${funcName}' antes de invocarla.`
          );
        }
        continue;
      }

      // Verificación de variables no declaradas
      if (t.category === 'identifier') {
        const prev = tokens[i - 1];
        const next = tokens[i + 1];

        // Ignorar si está precedido de un tipo (int x, double y)
        if (prev && (this.cppTypes.has(prev.lexeme) || prev.lexeme === 'auto' || prev.lexeme === 'class' || prev.lexeme === 'struct' || prev.lexeme === 'namespace' || prev.lexeme === '::' || prev.lexeme === '.' || prev.lexeme === '->')) {
          continue;
        }
        // Ignorar si es una etiqueta case o goto
        if (prev && (prev.lexeme === 'goto' || prev.lexeme === 'case')) {
          continue;
        }

        if (!declaredVariables.has(t.lexeme)) {
          this.addSemanticError(
            'Variable no declarada',
            t.lexeme,
            `El identificador '${t.lexeme}' no ha sido declarado con un tipo en este ámbito (error: '${t.lexeme}' was not declared in this scope).`,
            t.line,
            t.column,
            `Declare la variable especificando su tipo (ej: int ${t.lexeme}; o auto ${t.lexeme} = ...).`
          );
          declaredVariables.add(t.lexeme);
        }
      }
    }
  }

  countArgumentsInCall(tokens, openParenIndex) {
    let depth = 1;
    let count = 0;
    let hasTokensInside = false;

    for (let i = openParenIndex + 1; i < tokens.length; i++) {
      const tok = tokens[i];
      if (tok.lexeme === '(' || tok.lexeme === '[' || tok.lexeme === '{') depth++;
      else if (tok.lexeme === ')' || tok.lexeme === ']' || tok.lexeme === '}') {
        depth--;
        if (depth === 0) {
          if (hasTokensInside && count === 0) count = 1;
          break;
        }
      } else if (depth === 1) {
        if (tok.lexeme === ',') {
          count++;
        } else if (tok.category !== 'comment') {
          hasTokensInside = true;
        }
      }
    }
    if (hasTokensInside && count === 0) count = 1;
    else if (count > 0 && hasTokensInside) count++;

    return count;
  }
}

if (typeof window !== 'undefined') {
  window.CppAnalyzer = CppAnalyzer;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CppAnalyzer;
}
