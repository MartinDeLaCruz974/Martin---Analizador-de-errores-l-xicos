/**
 * JavaScriptAnalyzer - Analizador Multinivel para JavaScript (ECMAScript 2024)
 * Asignatura: Autómatas I / Compiladores
 * 
 * Integra los tres niveles de análisis para JavaScript:
 * 1. Nivel Léxico: Tokens y errores léxicos mediante JavaScriptLexer.
 * 2. Nivel Sintáctico: Delimitadores balanceados, declaraciones const sin inicializar, estructuras condicionales/repetitivas, L-values inválidos.
 * 3. Nivel Semántico: Variables no declaradas, reasignación a const, redeclaración en el mismo ámbito, aridad de funciones y llamadas no funciones.
 */

class JavaScriptAnalyzer {
  constructor(sourceCode = '') {
    this.sourceCode = sourceCode;
    this.lexer = new JavaScriptLexer(sourceCode);
    this.lexicalResult = null;
    this.syntacticErrors = [];
    this.semanticErrors = [];

    // Entorno global de built-ins en JavaScript
    this.builtins = new Set([
      'console', 'Math', 'JSON', 'window', 'document', 'globalThis',
      'Array', 'Object', 'String', 'Number', 'Boolean', 'Date', 'RegExp',
      'Map', 'Set', 'WeakMap', 'WeakSet', 'Promise', 'Proxy', 'Reflect',
      'Symbol', 'Error', 'TypeError', 'SyntaxError', 'RangeError',
      'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval',
      'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'encodeURI', 'decodeURI',
      'fetch', 'alert', 'prompt', 'confirm', 'undefined', 'null', 'NaN', 'Infinity',
      'true', 'false', 'this'
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
      language: 'JavaScript',
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
   * ANÁLISIS SINTÁCTICO DE JAVASCRIPT
   * ========================================================
   */
  analyzeSyntax(tokens) {
    // A. Delimitadores balanceados (), [], {}
    this.checkBalancedDelimiters(tokens);

    // B. Declaraciones const sin inicializar (const x;)
    this.checkConstInitialization(tokens);

    // C. Asignaciones a L-Value inválidos (5 = x)
    this.checkInvalidAssignments(tokens);

    // D. Estructuras condicionales y de control (if sin paréntesis, etc.)
    this.checkControlStructures(tokens);

    // E. Operadores mal ubicados y expresiones incompletas
    this.checkOperatorsAndIncompleteExpressions(tokens);

    // F. Definiciones de funciones incompletas
    this.checkFunctionDefinitions(tokens);
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
            `Se encontró el delimitador de cierre '${t.lexeme}' sin su apertura correspondiente.`,
            t.line,
            t.column,
            `Elimine el carácter '${t.lexeme}' o agregue su apertura correspondiente.`
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

    while (stack.length > 0) {
      const unclosed = stack.pop();
      this.addSyntacticError(
        'Delimitador sin cerrar',
        unclosed.lexeme,
        `El delimitador '${unclosed.lexeme}' (${names[unclosed.lexeme]}) de la línea ${unclosed.line}, columna ${unclosed.column} no fue cerrado.`,
        unclosed.line,
        unclosed.column,
        `Agregue el delimitador de cierre correspondiente para '${unclosed.lexeme}'.`
      );
    }
  }

  checkConstInitialization(tokens) {
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].lexeme === 'const') {
        const idToken = tokens[i + 1];
        if (idToken && idToken.category === 'identifier') {
          const next = tokens[i + 2];
          // En JavaScript, const variable DEBE inicializarse obligatoriamente: const x = 10;
          if (!next || next.lexeme !== '=') {
            this.addSyntacticError(
              'Declaración const sin inicializar',
              idToken.lexeme,
              `La declaración constante '${idToken.lexeme}' requiere una inicialización obligatoria con '=' (Missing initializer in const declaration).`,
              idToken.line,
              idToken.column,
              `Asigne un valor inicial a '${idToken.lexeme}' (ej: const ${idToken.lexeme} = valor;).`
            );
          }
        } else {
          this.addSyntacticError(
            'Declaración incompleta',
            'const',
            `Se esperaba un nombre de identificador después de la palabra clave 'const'.`,
            tokens[i].line,
            tokens[i].column,
            `Especifique el nombre de la variable (ej: const nombre = ...).`
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
        if (!prev) continue;

        if (prev.category === 'literal') {
          this.addSyntacticError(
            'Destino de asignación inválido (L-Value)',
            prev.lexeme,
            `No se puede asignar un valor a un literal ('${prev.lexeme}'). El lado izquierdo debe ser una variable o propiedad válida (Invalid left-hand side in assignment).`,
            prev.line,
            prev.column,
            `Coloque un identificador de variable a la izquierda de '='.`
          );
        }
      }
    }
  }

  checkControlStructures(tokens) {
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];

      // if sin paréntesis de condición: ej: if { o if x > 0 {
      if (t.lexeme === 'if' || t.lexeme === 'while' || t.lexeme === 'switch') {
        const next = tokens[i + 1];
        if (!next || next.lexeme !== '(') {
          this.addSyntacticError(
            'Faltan paréntesis en estructura de control',
            t.lexeme,
            `En JavaScript la condición de '${t.lexeme}' debe estar obligatoriamente encerrada entre paréntesis '(...)'.`,
            t.line,
            t.column,
            `Encierre la condición entre paréntesis (ej: ${t.lexeme} (condicion) { ... }).`
          );
        } else if (tokens[i + 2] && tokens[i + 2].lexeme === ')') {
          this.addSyntacticError(
            'Condición vacía en estructura de control',
            t.lexeme,
            `La condición de '${t.lexeme}' no puede estar vacía '()'.`,
            t.line,
            t.column,
            `Especifique una expresión válida dentro de los paréntesis.`
          );
        }
      }

      // else sin if previo
      if (t.lexeme === 'else') {
        let hasIf = false;
        let j = i - 1;
        while (j >= 0) {
          if (tokens[j].lexeme === 'if') {
            hasIf = true;
            break;
          }
          j--;
        }
        if (!hasIf) {
          this.addSyntacticError(
            'Cláusula else sin if',
            'else',
            `Se encontró una cláusula 'else' sin una estructura 'if' previa correspondiente.`,
            t.line,
            t.column,
            `Asegúrese de que el 'else' corresponda a un 'if' anterior.`
          );
        }
      }
    }
  }

  checkOperatorsAndIncompleteExpressions(tokens) {
    const binaryOperators = new Set(['+', '-', '*', '/', '%', '**', '==', '===', '!=', '!==', '<', '>', '<=', '>=']);

    for (let i = 0; i < tokens.length; i++) {
      const curr = tokens[i];
      const next = tokens[i + 1];

      // Dos operadores binarios consecutivos inválidos
      if (binaryOperators.has(curr.lexeme) && next && binaryOperators.has(next.lexeme)) {
        if (next.lexeme !== '+' && next.lexeme !== '-') {
          this.addSyntacticError(
            'Operadores consecutivos incorrectos',
            `${curr.lexeme} ${next.lexeme}`,
            `Los operadores binarios '${curr.lexeme}' y '${next.lexeme}' están colocados consecutivamente sin un operando.`,
            curr.line,
            curr.column,
            `Elimine uno de los operadores o coloque un operando entre ambos.`
          );
        }
      }

      // Operador al final de la línea sin operando
      if (binaryOperators.has(curr.lexeme)) {
        if (!next || next.lexeme === ';' || next.lexeme === '}') {
          this.addSyntacticError(
            'Expresión incompleta',
            curr.lexeme,
            `El operador binario '${curr.lexeme}' requiere un operando a su derecha.`,
            curr.line,
            curr.column,
            `Agregue el valor o variable faltante.`
          );
        }
      }
    }
  }

  checkFunctionDefinitions(tokens) {
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].lexeme === 'function') {
        const next = tokens[i + 1];
        // En declaración estándar de función nombrada
        if (next && next.category === 'identifier') {
          if (tokens[i + 2] && tokens[i + 2].lexeme !== '(') {
            this.addSyntacticError(
              'Faltan paréntesis de parámetros',
              next.lexeme,
              `La función '${next.lexeme}' requiere paréntesis de parámetros '(...)'.`,
              next.line,
              next.column,
              `Agregue '()' después del nombre de la función.`
            );
          }
        }
      }
    }
  }

  /**
   * ========================================================
   * ANÁLISIS SEMÁNTICO DE JAVASCRIPT
   * ========================================================
   */
  analyzeSemantics(tokens) {
    const declaredVariables = new Set([...this.builtins]);
    const constVariables = new Set();
    const declaredFunctions = new Map(); // name -> paramCount
    const variableTypes = new Map(); // name -> 'number' | 'string' | 'boolean'

    // Primera pasada: recolectar declaraciones let, const, var, function
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];

      // Declaraciones let y var
      if (t.lexeme === 'let' || t.lexeme === 'var') {
        const idToken = tokens[i + 1];
        if (idToken && idToken.category === 'identifier') {
          // Si ya estaba declarada con let/const en el mismo ámbito
          if (declaredVariables.has(idToken.lexeme) && !this.builtins.has(idToken.lexeme)) {
            this.addSemanticError(
              'Redeclaración de identificador',
              idToken.lexeme,
              `El identificador '${idToken.lexeme}' ya ha sido declarado previamente en este ámbito (Identifier '${idToken.lexeme}' has already been declared).`,
              idToken.line,
              idToken.column,
              `Utilice un nombre de variable diferente o evite duplicar la declaración.`
            );
          }
          declaredVariables.add(idToken.lexeme);

          // Inferir tipo si hay asignación inmediata
          if (tokens[i + 2] && tokens[i + 2].lexeme === '=') {
            const valTok = tokens[i + 3];
            if (valTok && valTok.category === 'literal') {
              if (valTok.type.includes('entero') || valTok.type.includes('decimal')) variableTypes.set(idToken.lexeme, 'number');
              else if (valTok.type.includes('Cadena') || valTok.type.includes('Plantilla')) variableTypes.set(idToken.lexeme, 'string');
            }
          }
        }
      }

      // Declaraciones const
      if (t.lexeme === 'const') {
        const idToken = tokens[i + 1];
        if (idToken && idToken.category === 'identifier') {
          if (declaredVariables.has(idToken.lexeme) && !this.builtins.has(idToken.lexeme)) {
            this.addSemanticError(
              'Redeclaración de identificador',
              idToken.lexeme,
              `El identificador '${idToken.lexeme}' ya ha sido declarado previamente en este ámbito.`,
              idToken.line,
              idToken.column,
              `Utilice un nombre diferente para la constante.`
            );
          }
          declaredVariables.add(idToken.lexeme);
          constVariables.add(idToken.lexeme);
        }
      }

      // Declaraciones de funciones: function nombre(a, b)
      if (t.lexeme === 'function' && tokens[i + 1] && tokens[i + 1].category === 'identifier') {
        const funcName = tokens[i + 1].lexeme;
        declaredVariables.add(funcName);

        // Recolectar parámetros
        const params = [];
        let j = i + 3;
        while (j < tokens.length && tokens[j].lexeme !== ')') {
          if (tokens[j].category === 'identifier') {
            params.push(tokens[j].lexeme);
            declaredVariables.add(tokens[j].lexeme);
          }
          j++;
        }
        declaredFunctions.set(funcName, {
          paramCount: params.length,
          line: tokens[i + 1].line
        });
      }

      // Clases: class Nombre
      if (t.lexeme === 'class' && tokens[i + 1] && tokens[i + 1].category === 'identifier') {
        declaredVariables.add(tokens[i + 1].lexeme);
      }
    }

    // Segunda pasada: verificación de reasignación a const, variables no declaradas y llamadas
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];

      // Verificación de reasignación a constante: const X = 10; X = 20;
      if (t.category === 'operator' && ['=', '+=', '-=', '*=', '/='].includes(t.lexeme)) {
        const prev = tokens[i - 1];
        const prevPrev = tokens[i - 2];

        // Si no es parte de la declaración inicial (const x =)
        if (prev && prev.category === 'identifier' && prevPrev && prevPrev.lexeme !== 'const' && prevPrev.lexeme !== 'let' && prevPrev.lexeme !== 'var') {
          if (constVariables.has(prev.lexeme)) {
            this.addSemanticError(
              'Reasignación a variable constante',
              prev.lexeme,
              `No se puede reasignar un valor a la variable constante '${prev.lexeme}' declarada con 'const' (TypeError: Assignment to constant variable).`,
              prev.line,
              prev.column,
              `Declare la variable con 'let' si su valor necesita cambiar, o no reasigne '${prev.lexeme}'.`
            );
          }
        }
      }

      // Verificación de llamadas a funciones y aridad
      if (t.category === 'identifier' && tokens[i + 1] && tokens[i + 1].lexeme === '(') {
        const funcName = t.lexeme;
        const prev = tokens[i - 1];

        // Ignorar métodos de objetos (obj.metodo())
        if (prev && (prev.lexeme === '.' || prev.lexeme === '?.')) {
          continue;
        }

        // Llamar a algo que es una variable de tipo primitivo: let x = 50; x();
        if (variableTypes.has(funcName)) {
          this.addSemanticError(
            'Llamada a variable no invocable',
            funcName,
            `'${funcName}' es una variable de tipo numérico/cadena y no es una función (TypeError: ${funcName} is not a function).`,
            t.line,
            t.column,
            `Verifique el nombre o no invoque '${funcName}' con paréntesis.`
          );
          continue;
        }

        if (declaredFunctions.has(funcName)) {
          const sig = declaredFunctions.get(funcName);
          const argsCount = this.countArgumentsInCall(tokens, i + 1);

          if (argsCount !== sig.paramCount) {
            this.addSemanticError(
              'Cantidad incorrecta de argumentos',
              funcName,
              `La función '${funcName}' espera ${sig.paramCount} argumento(s) según su declaración en la línea ${sig.line}, pero se pasaron ${argsCount}.`,
              t.line,
              t.column,
              `Ajuste los argumentos pasados a '${funcName}' para coincidir con ${sig.paramCount}.`
            );
          }
        } else if (!declaredVariables.has(funcName)) {
          this.addSemanticError(
            'Función no declarada',
            funcName,
            `Se intenta invocar la función '${funcName}()', pero no ha sido declarada ni importada.`,
            t.line,
            t.column,
            `Declare la función '${funcName}' antes de invocarla.`
          );
        }
        continue;
      }

      // Verificación de variables no declaradas
      if (t.category === 'identifier') {
        const prev = tokens[i - 1];
        const next = tokens[i + 1];

        // Ignorar si es propiedad de objeto (obj.prop), declaración (let x, const x, var x, function f, class C)
        if (prev && (['let', 'const', 'var', 'function', 'class', '.', '?.'].includes(prev.lexeme))) {
          continue;
        }
        // Ignorar etiquetas de propiedades de objetos { clave: valor }
        if (next && next.lexeme === ':' && prev && (prev.lexeme === '{' || prev.lexeme === ',')) {
          continue;
        }

        if (!declaredVariables.has(t.lexeme)) {
          this.addSemanticError(
            'Variable no declarada',
            t.lexeme,
            `El identificador '${t.lexeme}' se utiliza sin haber sido declarado con 'let', 'const' o 'var' (ReferenceError: ${t.lexeme} is not defined).`,
            t.line,
            t.column,
            `Declare la variable '${t.lexeme}' con 'let' o 'const' antes de utilizarla.`
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
  window.JavaScriptAnalyzer = JavaScriptAnalyzer;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = JavaScriptAnalyzer;
}
