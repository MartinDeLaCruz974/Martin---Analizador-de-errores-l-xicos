/**
 * PythonAnalyzer - Analizador Multonivel para Python 3
 * Asignatura: Autómatas I / Compiladores
 * 
 * Integra los tres niveles fundamentales de análisis:
 * 1. Nivel Léxico: Tokens válidos y detección de caracteres ilegales, números mal formados, cadenas sin cerrar.
 * 2. Nivel Sintáctico: Delimitadores sin cerrar, falta de dos puntos (:), operadores incorrectos, expresiones incompletas.
 * 3. Nivel Semántico: Variables no definidas, funciones no declaradas, aridad de argumentos, incompatibilidad de tipos, etc.
 */

class PythonAnalyzer {
  constructor(sourceCode = '') {
    this.sourceCode = sourceCode;
    this.lexer = new PythonLexer(sourceCode);
    this.lexicalResult = null;
    this.syntacticErrors = [];
    this.semanticErrors = [];
    this.errorIdCounter = 1;

    // Tabla de símbolos y funciones built-in de Python
    this.builtins = new Set([
      'print', 'input', 'len', 'range', 'abs', 'min', 'max', 'sum', 'sorted',
      'reversed', 'enumerate', 'zip', 'map', 'filter', 'any', 'all', 'isinstance',
      'issubclass', 'id', 'repr', 'round', 'pow', 'divmod', 'open', 'type', 'help',
      'dir', 'vars', 'hasattr', 'getattr', 'setattr', 'delattr', 'callable', 'super',
      'int', 'float', 'str', 'bool', 'list', 'dict', 'set', 'tuple', 'bytes', 'complex',
      'object', 'Exception', 'ValueError', 'TypeError', 'KeyError', 'IndexError',
      'FileNotFoundError', 'ZeroDivisionError', 'True', 'False', 'None',
      'math', 'sys', 'os', 'random', 'json', 'time', 'datetime', 're'
    ]);
  }

  analyze() {
    this.errorIdCounter = 1;
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
      language: 'Python',
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
   * REGLAS DEL ANÁLISIS SINTÁCTICO DE PYTHON
   * ========================================================
   */
  analyzeSyntax(tokens) {
    const lines = this.sourceCode.split('\n');

    // A. Verificación de delimitadores balanceados: (), [], {}
    this.checkBalancedDelimiters(tokens);

    // B. Verificación de dos puntos (:) obligatorios en estructuras compuestas
    this.checkColonsInCompoundStatements(tokens, lines);

    // C. Verificación de asignaciones inválidas a literales (5 = x)
    this.checkInvalidAssignments(tokens);

    // D. Verificación de operadores mal colocados o consecutivos (a + * b)
    this.checkOperatorsAndIncompleteExpressions(tokens);

    // E. Verificación de orden de argumentos (posicional tras keyword)
    this.checkArgumentOrder(tokens);

    // F. Verificación de estructuras de control incompletas (if sin condición, etc.)
    this.checkControlStructures(tokens);
  }

  checkBalancedDelimiters(tokens) {
    const stack = [];
    const pairs = {
      ')': '(',
      ']': '[',
      '}': '{'
    };
    const names = {
      '(': 'Paréntesis',
      '[': 'Corchete',
      '{': 'Llave'
    };

    for (const t of tokens) {
      if (t.lexeme === '(' || t.lexeme === '[' || t.lexeme === '{') {
        stack.push(t);
      } else if (t.lexeme === ')' || t.lexeme === ']' || t.lexeme === '}') {
        const expectedOpen = pairs[t.lexeme];
        if (stack.length === 0) {
          this.addSyntacticError(
            'Delimitador de cierre inesperado',
            t.lexeme,
            `Se encontró el delimitador de cierre '${t.lexeme}' sin un delimitador de apertura correspondiente previo.`,
            t.line,
            t.column,
            `Elimine el '${t.lexeme}' sobrante o agregue el delimitador de apertura correspondiente.`
          );
        } else {
          const top = stack.pop();
          if (top.lexeme !== expectedOpen) {
            this.addSyntacticError(
              'Delimitadores incompatibles',
              t.lexeme,
              `Se esperaba cerrar '${top.lexeme}' (${names[top.lexeme]}) abierto en la línea ${top.line}, pero se encontró '${t.lexeme}'.`,
              t.line,
              t.column,
              `Reemplace '${t.lexeme}' por el cierre adecuado para '${top.lexeme}'.`
            );
          }
        }
      }
    }

    // Delimitadores que quedaron sin cerrar al final
    while (stack.length > 0) {
      const unclosed = stack.pop();
      this.addSyntacticError(
        'Delimitador sin cerrar',
        unclosed.lexeme,
        `El delimitador '${unclosed.lexeme}' (${names[unclosed.lexeme]}) abierto en la línea ${unclosed.line}, columna ${unclosed.column} no fue cerrado antes del fin de archivo.`,
        unclosed.line,
        unclosed.column,
        `Agregue el delimitador de cierre correspondiente para '${unclosed.lexeme}'.`
      );
    }
  }

  checkColonsInCompoundStatements(tokens, lines) {
    // Palabras reservadas que exigen dos puntos (:) al final del encabezado
    const compoundKeywords = new Set([
      'def', 'class', 'if', 'elif', 'else', 'for', 'while', 'try', 'except', 'finally', 'with', 'match', 'case'
    ]);

    // Agrupar tokens significativos por línea
    const tokensByLine = new Map();
    for (const t of tokens) {
      if (t.category === 'comment') continue;
      if (!tokensByLine.has(t.line)) {
        tokensByLine.set(t.line, []);
      }
      tokensByLine.get(t.line).push(t);
    }

    tokensByLine.forEach((lineTokens, lineNum) => {
      if (lineTokens.length === 0) return;
      const firstToken = lineTokens[0];

      if (compoundKeywords.has(firstToken.lexeme)) {
        // En Python, el encabezado puede continuar en la siguiente línea si hay paréntesis abiertos,
        // pero el último token del encabezado de la instrucción debe ser ':'
        const lastToken = lineTokens[lineTokens.length - 1];

        // Comprobación de dos puntos al final de la línea o declaración
        if (lastToken.lexeme !== ':') {
          // Si termina con operador o dentro de paréntesis abiertos, podría continuar, de lo contrario es error
          this.addSyntacticError(
            'Falta de dos puntos (:)',
            firstToken.lexeme,
            `La instrucción '${firstToken.lexeme}' requiere el símbolo ':' al final del encabezado de bloque en la línea ${lineNum}.`,
            firstToken.line,
            firstToken.column,
            `Agregue ':' al final de la instrucción ${firstToken.lexeme}.`
          );
        }
      }
    });
  }

  checkInvalidAssignments(tokens) {
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      // Si encontramos operador de asignación '=' (y no '==')
      if (t.lexeme === '=' && t.category === 'operator') {
        const prev = tokens[i - 1];
        if (!prev) continue;

        // No se puede asignar a un literal numérico, literal de cadena o booleano
        if (prev.category === 'literal') {
          this.addSyntacticError(
            'Destino de asignación inválido (L-Value)',
            prev.lexeme,
            `No se puede asignar un valor al literal '${prev.lexeme}'. La parte izquierda de una asignación debe ser una variable o identificador.`,
            prev.line,
            prev.column,
            `Coloque el nombre de una variable a la izquierda del signo '='.`
          );
        } else if (prev.lexeme === ')' || prev.lexeme === ']') {
          // Asignación a llamada de función o expresión aritmética cerrada ej: (a + b) = 10
          let j = i - 2;
          let isExpr = false;
          while (j >= 0 && tokens[j].line === prev.line) {
            if (['+', '-', '*', '/', '%'].includes(tokens[j].lexeme)) {
              isExpr = true;
              break;
            }
            j--;
          }
          if (isExpr) {
            this.addSyntacticError(
              'Asignación a expresión inválida',
              tokens[j].lexeme,
              `No se puede asignar un valor al resultado de una expresión aritmética.`,
              tokens[j].line,
              tokens[j].column,
              `Asigne el resultado a una variable independiente.`
            );
          }
        }
      }
    }
  }

  checkOperatorsAndIncompleteExpressions(tokens) {
    const binaryOperators = new Set(['+', '-', '*', '/', '//', '%', '**', '==', '!=', '<', '>', '<=', '>=']);

    for (let i = 0; i < tokens.length; i++) {
      const curr = tokens[i];
      const next = tokens[i + 1];

      // Dos operadores binarios consecutivos inválidos (ej: a + * b)
      if (binaryOperators.has(curr.lexeme) && next && binaryOperators.has(next.lexeme)) {
        // Excepción: operadores unarios como '+' o '-' tras operador binario (ej: x * -5 es válido)
        if (next.lexeme !== '+' && next.lexeme !== '-') {
          this.addSyntacticError(
            'Operadores consecutivos incorrectos',
            `${curr.lexeme} ${next.lexeme}`,
            `Los operadores binarios '${curr.lexeme}' y '${next.lexeme}' están colocados consecutivamente sin un operando intermedio.`,
            curr.line,
            curr.column,
            `Elimine uno de los operadores o agregue el operando entre ellos.`
          );
        }
      }

      // Operador al final de la línea sin operando a la derecha
      if (binaryOperators.has(curr.lexeme)) {
        if (!next || next.line > curr.line) {
          this.addSyntacticError(
            'Instrucción o expresión incompleta',
            curr.lexeme,
            `El operador binario '${curr.lexeme}' requiere una expresión o valor a su derecha.`,
            curr.line,
            curr.column,
            `Complete la expresión agregando el valor o variable restante.`
          );
        }
      }
    }
  }

  checkArgumentOrder(tokens) {
    // Detectar si en una llamada a función un argumento posicional sigue a un argumento por clave (keyword)
    // ej: funcion(a=1, 2) -> SyntaxError: positional argument follows keyword argument
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].category === 'identifier' && tokens[i + 1] && tokens[i + 1].lexeme === '(') {
        let depth = 1;
        let seenKeyword = false;
        let j = i + 2;

        while (j < tokens.length && depth > 0) {
          const tok = tokens[j];
          if (tok.lexeme === '(') depth++;
          else if (tok.lexeme === ')') depth--;
          else if (depth === 1) {
            // Verificar si es argumento por clave (identificador '=' valor)
            if (tok.category === 'identifier' && tokens[j + 1] && tokens[j + 1].lexeme === '=' && tokens[j + 1].category === 'operator') {
              seenKeyword = true;
            } else if (tok.lexeme === ',' && seenKeyword) {
              const nextArg = tokens[j + 1];
              if (nextArg && nextArg.lexeme !== ')' && nextArg.category !== 'comment') {
                // Si el siguiente no tiene '=' después
                if (!(tokens[j + 2] && tokens[j + 2].lexeme === '=')) {
                  this.addSyntacticError(
                    'Argumento posicional tras argumento por clave',
                    nextArg.lexeme,
                    `En Python, un argumento posicional ('${nextArg.lexeme}') no puede ir después de un argumento por palabra clave (keyword argument).`,
                    nextArg.line,
                    nextArg.column,
                    `Coloque todos los argumentos posicionales antes de los argumentos nombrados con clave.`
                  );
                }
              }
            }
          }
          j++;
        }
      }
    }
  }

  checkControlStructures(tokens) {
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      // if : o while : (sin condición)
      if ((t.lexeme === 'if' || t.lexeme === 'while' || t.lexeme === 'elif') && tokens[i + 1] && tokens[i + 1].lexeme === ':') {
        this.addSyntacticError(
          'Estructura condicional/repetitiva incompleta',
          t.lexeme,
          `La estructura '${t.lexeme}' requiere una condición lógica antes de los dos puntos ':'.`,
          t.line,
          t.column,
          `Especifique la condición a evaluar (ej: if x > 0:).`
        );
      }

      // def sin nombre o parámetros
      if (t.lexeme === 'def') {
        const next = tokens[i + 1];
        if (!next || next.category !== 'identifier') {
          this.addSyntacticError(
            'Error en definición de función',
            t.lexeme,
            `Se esperaba el nombre del identificador de la función después de la palabra reservada 'def'.`,
            t.line,
            t.column,
            `Indique el nombre de la función (ej: def mi_funcion():).`
          );
        } else if (tokens[i + 2] && tokens[i + 2].lexeme !== '(') {
          this.addSyntacticError(
            'Faltan paréntesis en función',
            next.lexeme,
            `La definición de la función '${next.lexeme}' requiere la lista de parámetros entre paréntesis '(...)'.`,
            next.line,
            next.column,
            `Agregue '()' después del nombre de la función.`
          );
        }
      }
    }
  }

  /**
   * ========================================================
   * REGLAS DEL ANÁLISIS SEMÁNTICO DE PYTHON
   * ========================================================
   */
  analyzeSemantics(tokens) {
    // 1. Recolección de símbolos declarados (funciones, clases, variables asignadas)
    const definedSymbols = new Set([...this.builtins]);
    const functionSignatures = new Map(); // nombre -> { paramsCount, paramNames, line }
    const assignedVariablesWithTypes = new Map(); // nombre -> 'int' | 'str' | 'float' | 'list'

    // Primera pasada: registrar funciones y variables definidas
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];

      // Funciones definidas con def
      if (t.lexeme === 'def' && tokens[i + 1] && tokens[i + 1].category === 'identifier') {
        const funcName = tokens[i + 1].lexeme;
        definedSymbols.add(funcName);

        // Recolectar parámetros
        const params = [];
        let j = i + 3; // Tras 'def' 'nombre' '('
        while (j < tokens.length && tokens[j].lexeme !== ')' && tokens[j].lexeme !== ':') {
          if (tokens[j].category === 'identifier') {
            params.push(tokens[j].lexeme);
            definedSymbols.add(tokens[j].lexeme); // Los parámetros existen dentro del ámbito
          }
          j++;
        }
        functionSignatures.set(funcName, {
          paramCount: params.length,
          paramNames: params,
          line: tokens[i + 1].line
        });
      }

      // Clases definidas con class
      if (t.lexeme === 'class' && tokens[i + 1] && tokens[i + 1].category === 'identifier') {
        definedSymbols.add(tokens[i + 1].lexeme);
      }

      // Variables en bucles for (for item in lista:)
      if (t.lexeme === 'for' && tokens[i + 1] && tokens[i + 1].category === 'identifier') {
        definedSymbols.add(tokens[i + 1].lexeme);
      }

      // Variables que reciben asignación (= o +=, -=, etc.)
      if (t.category === 'operator' && ['=', '+=', '-=', '*=', '/=', ':='].includes(t.lexeme)) {
        const prev = tokens[i - 1];
        if (prev && prev.category === 'identifier') {
          definedSymbols.add(prev.lexeme);

          // Inferir tipo básico si el siguiente es un literal
          const next = tokens[i + 1];
          if (next && next.category === 'literal') {
            if (next.type.includes('entero')) assignedVariablesWithTypes.set(prev.lexeme, 'int');
            else if (next.type.includes('decimal')) assignedVariablesWithTypes.set(prev.lexeme, 'float');
            else if (next.type.includes('Cadena')) assignedVariablesWithTypes.set(prev.lexeme, 'str');
            else if (next.lexeme === 'True' || next.lexeme === 'False') assignedVariablesWithTypes.set(prev.lexeme, 'bool');
          }
        }
      }

      // Importaciones (import modulo o from modulo import item)
      if (t.lexeme === 'import' && tokens[i + 1] && tokens[i + 1].category === 'identifier') {
        definedSymbols.add(tokens[i + 1].lexeme);
      }
    }

    // Segunda pasada: verificación de uso de identificadores y aridad
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];

      // Verificación de llamadas a funciones y aridad
      if (t.category === 'identifier' && tokens[i + 1] && tokens[i + 1].lexeme === '(') {
        const funcName = t.lexeme;
        const prev = tokens[i - 1];

        // Ignorar si es llamada a método de un objeto (ej: obj.metodo())
        if (prev && prev.lexeme === '.') {
          continue;
        }

        // Si es una función declarada por el usuario
        if (functionSignatures.has(funcName)) {
          const sig = functionSignatures.get(funcName);
          // Contar argumentos en la llamada
          const argsCount = this.countArgumentsInCall(tokens, i + 1);

          if (argsCount !== sig.paramCount) {
            this.addSemanticError(
              'Aridad de función incorrecta',
              funcName,
              `La función '${funcName}' espera ${sig.paramCount} argumento(s) según su definición en la línea ${sig.line}, pero se proporcionaron ${argsCount}.`,
              t.line,
              t.column,
              `Ajuste la cantidad de argumentos enviados a '${funcName}' para que coincida con ${sig.paramCount}.`
            );
          }
        } else if (!definedSymbols.has(funcName)) {
          // Función no declarada ni estándar
          this.addSemanticError(
            'Función no declarada',
            funcName,
            `Se intenta invocar la función '${funcName}()', pero no ha sido definida ni importada en este módulo.`,
            t.line,
            t.column,
            `Defina la función '${funcName}' con 'def' o impórtela antes de su uso.`
          );
        }
        continue;
      }

      // Verificación de variables no definidas
      if (t.category === 'identifier') {
        const prev = tokens[i - 1];
        const next = tokens[i + 1];

        // Excluir palabras clave, accesos de miembro (obj.prop), nombres en definición (def f, class C)
        if (prev && (prev.lexeme === 'def' || prev.lexeme === 'class' || prev.lexeme === '.' || prev.lexeme === 'import')) {
          continue;
        }
        // Excluir si está en la parte izquierda de una asignación directa (x = 5)
        if (next && next.lexeme === '=' && next.category === 'operator') {
          continue;
        }

        if (!definedSymbols.has(t.lexeme)) {
          this.addSemanticError(
            'Variable no definida',
            t.lexeme,
            `El identificador '${t.lexeme}' se utiliza antes de ser asignado o no ha sido definido en el ámbito actual.`,
            t.line,
            t.column,
            `Asigne un valor previo a '${t.lexeme}' o verifique que esté escrito correctamente.`
          );
          // Para no repetir el mismo error varias veces, agregarlo al conjunto
          definedSymbols.add(t.lexeme);
        }
      }

      // Verificación de operaciones incompatibles entre tipos (ej: int + str en Python)
      if (t.lexeme === '+' && t.category === 'operator') {
        const left = tokens[i - 1];
        const right = tokens[i + 1];

        if (left && right) {
          const isLeftNumber = left.type && (left.type.includes('entero') || left.type.includes('decimal'));
          const isRightString = right.type && right.type.includes('Cadena');
          const isLeftString = left.type && left.type.includes('Cadena');
          const isRightNumber = right.type && (right.type.includes('entero') || right.type.includes('decimal'));

          if ((isLeftNumber && isRightString) || (isLeftString && isRightNumber)) {
            this.addSemanticError(
              'Operación incompatible entre tipos',
              `${left.lexeme} + ${right.lexeme}`,
              `En Python no se puede sumar directamente un tipo numérico con un tipo 'str' (TypeError: unsupported operand type for +).`,
              t.line,
              t.column,
              `Convierta el número a cadena usando 'str(...)' o la cadena a número usando 'int(...)'/'float(...)'.`
            );
          }
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
  window.PythonAnalyzer = PythonAnalyzer;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PythonAnalyzer;
}
