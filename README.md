# Analizador de Errores: Léxico, Sintáctico y Semántico – Autómatas I

Una aplicación web interactiva, moderna y completamente funcional desarrollada para la asignatura de **Autómatas I / Compiladores**. Permite introducir código fuente en **Python**, **JavaScript** y **C++**, realizando un **análisis real en tres niveles de compilación** para identificar y clasificar cada problema según su naturaleza:

- 🔴 **Nivel Léxico (Rojo):** Formación de tokens, caracteres ilegales, identificadores con dígitos, literales numéricos mal formados y cadenas sin cerrar.
- 🟠 **Nivel Sintáctico (Naranja):** Estructura y gramática, delimitadores desbalanceados (`()`, `{}`, `[]`), falta de dos puntos (`:`) en Python, falta de punto y coma (`;`) en C++, L-values inválidos y expresiones incompletas.
- 🟡 **Nivel Semántico (Amarillo):** Significado y uso, variables no declaradas o no definidas, funciones inexistentes, aridad de argumentos, incompatibilidad de tipos y modificación de constantes (`const`).

---

## 🌟 Características Principales

### 1. Interfaz Visual "Light Premium Developer Studio"
- **Nueva Identidad Visual:**
  - Fondo principal: Gris muy claro (`#F5F6FA`).
  - Tarjetas y paneles: Blanco puro (`#FFFFFF`) con sombras suaves y bordes gris suave (`#E7E8F0`).
  - Color principal de acento: Morado tecnológico (`#7047EB`) y violeta (`#A78BFA`).
  - Tipografía de lectura: Gris oscuro principal (`#202033`) y gris medio secundario (`#77788B`).
  - Código de colores de clasificación por nivel:
    - 🔴 **Rojo (`#EF4444`):** Errores léxicos.
    - 🟠 **Naranja (`#F97316`):** Errores sintácticos.
    - 🟡 **Amarillo / Ámbar (`#EAB308`):** Errores semánticos.
    - 🟢 **Verde (`#10B981`):** Código válido y resultados correctos.

### 2. Distribución y Arquitectura de la Interfaz
- **Barra Lateral Izquierda (Sidebar Minimalista):**
  - Logotipo e identidad **LexiCode**.
  - Accesos directos con iconos: **Inicio**, **Analizador**, **Historial** (con contador en vivo) e **Información**.
  - Tarjeta inferior de contexto de la asignatura: **Autómatas I**.
- **Encabezado Superior (Topbar):**
  - Título: **"Analizador de código"**.
  - Subtítulo: *"Identifica y comprende los errores de tu programación"*.
  - Indicador oficial de asignatura **Autómatas I** y chip con atajo de teclado (`Ctrl + Enter`).
- **Área Principal de Trabajo (Editor de Código):**
  - Posicionado como protagonista de ancho completo.
  - Selector de lenguaje: **Python 3**, **JavaScript (ES2024)** y **C++ (C++20)**.
  - Badge dinámico con el lenguaje activo.
  - Editor con números de línea y marcadores de error circulares en el gutter.
  - Botones de acción principales: **Analizar código**, **Limpiar** y **Copiar**.
  - Botones presets de prueba rápida por nivel: **Válido**, **Léxicos**, **Sintácticos**, **Semánticos** y **Combinados**.
  - Barra de estado inferior con cursor (`Lín: X, Col: Y`), total de líneas y caracteres.
- **Panel de Resultados (Ancho Completo Inferior):**
  - **Tarjetas independientes de métricas:** Lenguaje analizado, Errores Léxicos, Errores Sintácticos, Errores Semánticos y Total Errores.
  - **Pestañas organizadas:**
    1. **Resumen:** Banner de estado general y panel de rendimiento con tiempo de ejecución en milisegundos.
    2. **Reporte de errores:** Tarjetas clasificadas con nivel, ubicación (`Línea, Columna`), elemento involucrado, descripción, sugerencia de corrección y botón para ubicar el error en el editor con animación.
    3. **Tabla de tokens:** Buscador en tiempo real, filtro por categorías y botones para exportar a **CSV** y **JSON**.
    4. **Categorías:** Desglose cuantitativo de palabras reservadas, identificadores, operadores, literales y delimitadores.
- **Apartado Educativo: "Conoce el análisis léxico y de compiladores":**
  - 4 tarjetas conceptuales: *¿Qué es un token?*, *¿Qué es un error léxico?*, *¿Qué es un error sintáctico?*, *¿Qué es un error semántico?*.
  - Cuadro comparativo tridimensional con criterios de fase, modelo formal (DFA vs PDA vs Tabla de símbolos), pregunta clave y ejemplos por lenguaje.
- **Historial de Sesión (Drawer Lateral):**
  - Panel deslizante con el registro de análisis realizados en la sesión.
  - Permite hacer clic en cualquier ejecución previa para restaurar el código y el lenguaje automáticamente.

---

## 🧠 Lógica de Análisis Multinivel por Lenguaje

La aplicación no utiliza respuestas fijas ni mocks; procesa el código carácter por carácter y token por token mediante tres analizadores independientes:

### A. Python (Python 3)
1. **Léxico:** Escaneo mediante expresiones regulares y autómatas de cadenas simples/triples, comentarios `#`, números en bases (`0x`, `0b`, `0o`), notación científica, identificadores y operadores válidos.
2. **Sintáctico:**
   - Balanceo estricto de delimitadores `()`, `[]`, `{}`.
   - Detección de falta de dos puntos `:` en `def`, `class`, `if`, `elif`, `else`, `for`, `while`, `try`, `except`, `finally`, `with`.
   - Asignación inválida a literales o expresiones (`100 = total`).
   - Operadores consecutivos erróneos (`a + * b`).
   - Argumento posicional colocado después de un argumento por clave (`func(a=1, 2)`).
   - Estructuras incompletas (`if :`, `while :`, `def :`).
3. **Semántico:**
   - Tabla de símbolos con ámbito global y local.
   - Reconocimiento de funciones y tipos estándar de Python (`print`, `len`, `range`, `int`, `str`, `math`, etc.).
   - Detección de variables no definidas antes de su asignación.
   - Detección de funciones inexistentes.
   - Comprobación de aridad (número de argumentos esperados vs proporcionados).
   - Detección de suma incompatible entre tipos de datos (`int + str` e.g. `10 + "cinco"`).

### B. JavaScript (ECMAScript 2024)
1. **Léxico:** Tokens, comentarios `//` y `/* */`, cadenas, literales de plantilla `` `...` `` con saltos de línea, BigInt, campos privados `#campo`.
2. **Sintáctico:**
   - Balanceo de llaves, corchetes y paréntesis.
   - Declaraciones `const` sin inicializar (`const x;`).
   - Estructuras condicionales sin condición entre paréntesis (`if () { ... }` o `if { ... }`).
   - Asignaciones a L-Values inválidos (`50 = x`).
   - Operadores binarios consecutivos y expresiones incompletas.
3. **Semántico:**
   - Reasignación a variables constantes (`const X = 1; X = 2;`).
   - Redeclaración de identificadores con `let` o `const` en el mismo ámbito.
   - Detección de variables no declaradas (sin `let`, `const`, `var`).
   - Aridad de funciones declaradas.
   - Invocar como función una variable de tipo primitivo (`let x = 42; x();`).

### C. C++ (C++20/C++23)
1. **Léxico:** Tokens, directivas de preprocesador (`#include`, `#define`), cadenas raw `R"(...)"`, literales `char` individuales, operadores específicos (`::`, `->`, `<=>`, `<<`, `>>`).
2. **Sintáctico:**
   - Balanceo de delimitadores.
   - Falta de punto y coma `;` obligatorio tras la definición de `class` o `struct` (`class Foo { ... };`).
   - Falta de punto y coma `;` al final de instrucciones y sentencias.
   - Declaraciones incompletas (`int ;`, `double = 10;`).
   - Paréntesis obligatorios en `if (...)`, `while (...)`, `for (...)`.
   - L-Values inválidos en asignación.
3. **Semántico:**
   - Tabla de tipos primitivos (`int`, `double`, `float`, `char`, `bool`, `void`, `string`, etc.).
   - Detección de variables no declaradas (`total = 5;` sin tipo previo).
   - Detección de funciones no declaradas en el ámbito.
   - Redefinición de variables en el mismo bloque (`int x = 10; int x = 20;`).
   - Modificación de variables constantes (`const int MAX = 100; MAX = 200;`).
   - Incompatibilidad de tipos en asignación (`int x = "texto";`).
   - Comprobación de aridad en funciones definidas.

---

## 📊 Visualización y Exportación

- **Banner de Estado:** Refleja con precisión si el código superó los 3 niveles o detalla la cantidad de errores encontrados en cada categoría.
- **Métricas:** Tarjetas con el desglose exacto:
  - Lenguaje analizado
  - Errores Léxicos (Rojo)
  - Errores Sintácticos (Naranja)
  - Errores Semánticos (Amarillo)
  - Total Errores
- **Pestaña de Reporte de Errores con Filtros:** Filtre rápidamente por `Todos`, `Léxicos`, `Sintácticos` o `Semánticos`.
- **Pestaña de Tabla de Tokens:** Búsqueda en tiempo real, filtro por categoría léxica y exportación.
- **Exportación de Datos:** Descarga de reportes estructurados en formato **CSV** y **JSON**.
- **Panel Educativo Teórico:** Cuadro comparativo tridimensional que explica con rigor pedagógico las diferencias entre las 3 fases del compilador.

---

## 📁 Estructura del Proyecto

```
analizador-lexico-automatas/
├── index.html                   # Interfaz de usuario completa, semántica y responsiva
├── css/
│   └── style.css                # Estilos CSS3: tema azul oscuro / eléctrico y código de colores
├── js/
│   ├── lexer-base.js            # Clase BaseLexer: seguimiento de punteros, tokens y errores
│   ├── sample-codes.js          # Códigos de prueba con ejemplos válidos y errores por nivel
│   ├── app.js                   # Controlador principal: eventos, gutter, resaltes y exportación
│   ├── lexers/
│   │   ├── python-lexer.js      # Analizador léxico para Python 3
│   │   ├── javascript-lexer.js  # Analizador léxico para JavaScript (ES2024)
│   │   └── cpp-lexer.js         # Analizador léxico para C++ (C++20)
│   └── analyzers/
│       ├── python-analyzer.js   # Analizador multinivel (Léxico, Sintáctico, Semántico) de Python
│       ├── javascript-analyzer.js # Analizador multinivel de JavaScript
│       └── cpp-analyzer.js      # Analizador multinivel de C++
├── test/
│   └── test-runner.html         # Suite de pruebas unitarias automatizadas para los tres niveles
└── README.md                    # Documentación técnica completa
```

---

## 🚀 Cómo Ejecutar la Aplicación

No se requiere ningún paso de compilación, servidor backend ni instalación de dependencias externas:

1. **Abrir directamente:**
   Haga doble clic en el archivo `index.html` o ábralo con cualquier navegador web moderno (Google Chrome, Microsoft Edge, Firefox, Safari, Brave).

2. **Opcional con Live Server en VS Code:**
   Abra la carpeta en Visual Studio Code, haga clic derecho en `index.html` y seleccione **"Open with Live Server"**.

3. **Opcional con Python:**
   En una terminal dentro del directorio del proyecto, ejecute:
   ```bash
   python -m http.server 8000
   ```
   Luego abra su navegador en `http://localhost:8000`.

---

## 🧪 Pruebas y Verificación

Abra el archivo `test/test-runner.html` en su navegador para ejecutar la batería completa de pruebas unitarias que valida:
- Reconocimiento de código válido sin errores en los 3 lenguajes.
- Detección precisa de errores léxicos clasificados como **Rojo**.
- Detección de errores sintácticos clasificados como **Naranja**.
- Detección de errores semánticos clasificados como **Amarillo**.
- Validación de todos los presets de prueba de cada lenguaje.
