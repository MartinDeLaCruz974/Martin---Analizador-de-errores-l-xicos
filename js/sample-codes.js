/**
 * Códigos de ejemplo predefinidos para pruebas del Analizador Multinivel
 * Niveles: Léxico, Sintáctico y Semántico
 * Asignatura: Autómatas I / Compiladores
 */

const SAMPLE_CODES = {
  python: {
    valid: `# ==============================================
# Programa válido en Python 3 - Autómatas I
# Demostración limpia de sintaxis y semántica
# ==============================================

def calcular_descuento(precio: float, porcentaje: float) -> float:
    # Variables inicializadas y utilizadas correctamente
    descuento = precio * (porcentaje / 100.0)
    total_final = precio - descuento
    return total_final

def main():
    nombre_producto = "Laptop Pro"
    precio_base = 1250.0
    tasa = 15.0

    # Llamada válida con la aridad exacta (2 argumentos)
    precio_con_descuento = calcular_descuento(precio_base, tasa)

    if precio_con_descuento > 1000.0:
        estado = "Artículo Premium"
    else:
        estado = "Artículo Estándar"

    print(f"Producto: {nombre_producto} | Total: {precio_con_descuento} | {estado}")

main()
`,

    lexicalErrors: `# ==============================================
# Errores LÉXICOS en Python (Tokens y Alfabeto)
# ==============================================

# 1. Identificador inválido (inicia con dígitos)
123total_inventario = 500

# 2. Caracteres ilegales fuera de cadenas ($ y ¿)
precio_dolar = 24.50 $
¿es_activo? = True

# 3. Número mal formado (múltiples puntos decimales y exponente incompleto)
pi_invalido = 3.14.159
coeficiente = 2.5e

# 4. Bases numéricas con caracteres inválidos
hex_erroneo = 0xG99F
bin_erroneo = 0b1021

# 5. Cadena de texto sin cerrar
mensaje = "Cadena que nunca se cierra antes del salto
`,

    syntacticErrors: `# ==============================================
# Errores SINTÁCTICOS en Python (Estructura y Gramática)
# ==============================================

# 1. Falta de dos puntos (:) obligatorios en funciones y condicionales
def procesar_datos(x, y)
    if x > 0
        resultado = x + y

# 2. Delimitadores desbalanceados (paréntesis y corchetes sin cerrar)
valores = [10, 20, 30
total = (a + b * (c - d)

# 3. Destino de asignación inválido (L-Value inválido)
100 = total_articulos

# 4. Operadores consecutivos y expresión incompleta
calculo = valor + * factor
incompleto = base *

# 5. Argumento posicional colocado después de argumento por clave
def configurar(modo="normal", depurar=False):
    pass

configurar(modo="rapido", 100)
`,

    semanticErrors: `# ==============================================
# Errores SEMÁNTICOS en Python (Ámbitos, Tipos y Aridad)
# ==============================================

def multiplicar(a, b):
    return a * b

# 1. Variable no definida utilizada en una expresión
total_general = cantidad_no_declarada * 2.5

# 2. Invocación de función inexistente o no declarada
resultado = funcion_fantasma(10, 20)

# 3. Aridad incorrecta: 'multiplicar' espera 2 argumentos, se pasa 1 o 3
val1 = multiplicar(10)
val2 = multiplicar(5, 10, 15)

# 4. Incompatibilidad de tipos: sumar número y cadena directamente
edad = 25
texto = "Años cumplidos: " + edad
`,

    allErrors: `# ==============================================
# Errores COMBINADOS (Léxicos, Sintácticos y Semánticos)
# ==============================================

# Error Léxico: identificador iniciado con dígito y carácter ilegal $
99variable_invalida = 50 $

# Error Sintáctico: falta de dos puntos ':' y paréntesis sin cerrar
def calcular_area(base, altura)
    return (base * altura / 2

# Error Semántico: variable no definida y llamada a función inexistente
total = variable_no_existente * 10
ejecutar_proceso_desconocido()

# Error Semántico: suma incompatible entre tipos de datos (int + str)
suma_invalida = 100 + "doscientos"
`
  },

  javascript: {
    valid: `// ==============================================
// Programa válido en JavaScript (ES2024) - Autómatas I
// Demostración limpia de sintaxis y semántica
// ==============================================

class CalculadoraFinanciera {
  constructor(tasaInteres) {
    this.tasa = tasaInteres;
  }

  calcularInteresSimple(capital, plazoMeses) {
    const interesGenerado = capital * (this.tasa / 100) * (plazoMeses / 12);
    const montoTotal = capital + interesGenerado;
    return montoTotal;
  }
}

function principal() {
  const banco = new CalculadoraFinanciera(5.5);
  const inversion = 10000;
  const meses = 24;

  const resultado = banco.calcularInteresSimple(inversion, meses);
  console.log("Monto proyectado:", resultado);
}

principal();
`,

    lexicalErrors: `// ==============================================
// Errores LÉXICOS en JavaScript (Tokens y Alfabeto)
// ==============================================

// 1. Identificador inválido que inicia con número
const 99usuarioActivo = "Ana";

// 2. Caracteres ilegales (§ y ¿)
let permiso = §ADMIN;
¿estaHabilitado? = false;

// 3. Número con múltiples puntos decimales
let versionSistema = 1.0.4.8;

// 4. Base numérica inválida
let colorHex = 0xZZ55;

// 5. Cadena de texto sin cerrar
let aviso = "Este texto no cierra su comilla antes del salto

// 6. Comentario de bloque sin cerrar
/* Se abrió este comentario multilínea
   pero nunca se colocó el delimitador de cierre
`,

    syntacticErrors: `// ==============================================
// Errores SINTÁCTICOS en JavaScript (Estructura y Gramática)
// ==============================================

// 1. Declaración 'const' sin inicialización obligatoria
const VALOR_LIMITE;

// 2. Delimitadores desbalanceados (llaves y paréntesis sin cerrar)
function procesarLista(items) {
  if (items.length > 0 {
    console.log(items[0];
}

// 3. Estructura condicional sin expresión lógica
if () {
  ejecutar();
}

// 4. Asignación a literal (L-Value inválido)
50 = totalPuntos;

// 5. Operadores binarios consecutivos y expresión incompleta
let calculo = a + * b;
let incompleto = precio * ;
`,

    semanticErrors: `// ==============================================
// Errores SEMÁNTICOS en JavaScript (Ámbitos, Tipos y Aridad)
// ==============================================

function sumar(x, y) {
  return x + y;
}

// 1. Reasignación a variable declarada con 'const'
const IMPUESTO = 0.16;
IMPUESTO = 0.21;

// 2. Redeclaración de identificador en el mismo ámbito
let contador = 10;
let contador = 20;

// 3. Uso de variable no declarada
let subtotal = 100;
let total = subtotal + recargoNoDefinido;

// 4. Invocación de función no declarada
let salida = funcionInexistente(1, 2);

// 5. Aridad incorrecta: 'sumar' espera 2 argumentos
let test1 = sumar(5);
let test2 = sumar(10, 20, 30);

// 6. Invocar una variable primitiva como función
let numeroSimple = 42;
numeroSimple();
`,

    allErrors: `// ==============================================
// Errores COMBINADOS (Léxicos, Sintácticos y Semánticos)
// ==============================================

// Error Léxico: identificador inválido y símbolo ilegal §
let 77total = 100 §;

// Error Sintáctico: const sin inicializar y paréntesis sin cerrar
const CONFIG_MAX;
if (activo > 0 {
  50 = resultado;
}

// Error Semántico: variable no declarada y reasignación a const
const DIAS_SEMANA = 7;
DIAS_SEMANA = 8;
let reporte = totalVentasNoDeclaradas + 500;
`
  },

  cpp: {
    valid: `// ==============================================
// Programa válido en C++ (C++20) - Autómatas I
// Demostración limpia de sintaxis y semántica
// ==============================================

#include <iostream>
#include <string>

using namespace std;

class Rectangulo {
private:
    double base;
    double altura;

public:
    Rectangulo(double b, double h) : base(b), altura(h) {}

    double calcularArea() const {
        return base * altura;
    }

    double calcularPerimetro() const {
        return 2.0 * (base + altura);
    }
};

int main() {
    double b = 10.5;
    double h = 5.2;

    Rectangulo r1(b, h);
    double area = r1.calcularArea();

    cout << "Área del rectángulo: " << area << endl;
    return 0;
}
`,

    lexicalErrors: `// ==============================================
// Errores LÉXICOS en C++ (Tokens y Alfabeto)
// ==============================================

#include <iostream>

int main() {
    // 1. Identificador inválido iniciado con dígito
    int 100contador = 0;

    // 2. Caracteres ilegales fuera de cadenas ($ y @)
    int precio$ = 50;
    char @letra = 'X';

    // 3. Número con múltiples puntos decimales y exponente incompleto
    double medicion = 9.8.0665;
    float escala = 1.5e;

    // 4. Literal de carácter 'char' inválido (múltiples caracteres o sin cerrar)
    char letraErronea = 'ABC';
    char sinCerrar = 'Z

    // 5. Cadena de texto sin cerrar
    std::string aviso = "Texto sin comilla de cierre en C++;

    return 0;
}
`,

    syntacticErrors: `// ==============================================
// Errores SINTÁCTICOS en C++ (Estructura y Gramática)
// ==============================================

#include <iostream>

// 1. Falta de ';' obligatorio tras definición de clase
class Triangulo {
public:
    double base;
    double altura;
}

// 2. Declaración incompleta (tipo sin nombre) y asignación a literal
int ;
50 = x;

int main() {
    // 3. Falta de ';' al final de instrucción
    int a = 10
    int b = 20;

    // 4. Delimitadores desbalanceados
    if (a > 5 {
        std::cout << a << std::endl;
    }

    // 5. Operadores binarios consecutivos
    int total = a + * b;

    return 0;
}
`,

    semanticErrors: `// ==============================================
// Errores SEMÁNTICOS en C++ (Ámbitos, Tipos y Aridad)
// ==============================================

#include <iostream>

void imprimirMultiplicacion(int a, int b) {
    std::cout << (a * b) << std::endl;
}

int main() {
    // 1. Variable no declarada
    totalCalculado = 150;

    // 2. Redefinición de variable en el mismo ámbito
    int duplicado = 10;
    int duplicado = 20;

    // 3. Modificación de variable constante (read-only)
    const int MAXIMO = 500;
    MAXIMO = 1000;

    // 4. Invocación de función no declarada
    ejecutarProcesoDesconocido(10);

    // 5. Aridad incorrecta: 'imprimirMultiplicacion' espera 2 argumentos
    imprimirMultiplicacion(5);
    imprimirMultiplicacion(5, 10, 15);

    // 6. Asignación de tipos incompatibles (cadena a int)
    int valorEntero = "texto no compatible";

    return 0;
}
`,

    allErrors: `// ==============================================
// Errores COMBINADOS (Léxicos, Sintácticos y Semánticos)
// ==============================================

#include <iostream>

// Error Sintáctico: falta ';' tras class
class Sensor {
    double valor;
}

int main() {
    // Error Léxico: identificador inválido y símbolo ilegal $
    int 99sensor = 10 $;

    // Error Sintáctico: delimitador sin cerrar y falta ';'
    if (x > 0 {
        int a = 5
    }

    // Error Semántico: variable no declarada y modificación de const
    const int LIMITE = 100;
    LIMITE = 200;
    variableNoDeclarada = 50;

    return 0;
}
`
  }
};

if (typeof window !== 'undefined') {
  window.SAMPLE_CODES = SAMPLE_CODES;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SAMPLE_CODES;
}
