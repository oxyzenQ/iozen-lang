#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
#include <stdbool.h>

// IOZEN Value Type (dynamic typing)
typedef enum {
  IZ_NUMBER,
  IZ_STRING,
  IZ_BOOL,
  IZ_ARRAY,
  IZ_STRUCT,
  IZ_NULL
} iz_type_t;

typedef struct iz_value {
  iz_type_t type;
  union {
    double number;
    char* string;
    bool boolean;
    struct iz_array* array;
    struct iz_struct* structure;
  } data;
} iz_value_t;

typedef struct iz_array {
  iz_value_t* items;
  int length;
  int capacity;
} iz_array_t;

// String literals
static const char* str_0 = "";
static const char* str_1 = "=== Week 7: First-Class Functions & Higher-Order Functions ===";
static const char* str_2 = "1. Function as Value:";
static const char* str_3 = "sayHello";
static const char* str_4 = "  Stored function name: ";
static const char* str_5 = "World";
static const char* str_6 = "2. Counter with State:";
static const char* str_7 = "  Count: ";
static const char* str_8 = "3. Higher-Order Functions (map):";
static const char* str_9 = "double";
static const char* str_10 = "  Original: [1, 2, 3, 4, 5]";
static const char* str_11 = "  Mapped: ";
static const char* str_12 = "4. Math Operations:";
static const char* str_13 = "  double(5) = ";
static const char* str_14 = "  triple(5) = ";
static const char* str_15 = "  addOne(5) = ";
static const char* str_16 = "5. Function Composition:";
static const char* str_17 = "  double then addOne(5) = ";
static const char* str_18 = "6. Array Processing:";
static const char* str_19 = "  Sum: ";
static const char* str_20 = "  Avg: ";
static const char* str_21 = "7. Callback Pattern:";
static const char* str_22 = "printResult";
static const char* str_23 = "=== Demo Complete ===";
static const char* str_24 = "  Hello, ";
static const char* str_25 = "!";
static const char* str_26 = "  Processing: ";
static const char* str_27 = "  Result would be sent to: ";
static const char* str_28 = "  Result: ";

// Forward declarations
void main();
void initCounter();
void nextCount();
void sayHello(iz_value_t name);
void double(iz_value_t x);
void triple(iz_value_t x);
void addOne(iz_value_t x);
void sumArray(iz_value_t arr);
void processWithCallback(iz_value_t value, iz_value_t callbackName);
void printResult(iz_value_t x);

// String literal forward declarations
extern const char* str_0;
extern const char* str_1;
extern const char* str_2;
extern const char* str_3;
extern const char* str_4;
extern const char* str_5;
extern const char* str_6;
extern const char* str_7;
extern const char* str_8;
extern const char* str_9;
extern const char* str_10;
extern const char* str_11;
extern const char* str_12;
extern const char* str_13;
extern const char* str_14;
extern const char* str_15;
extern const char* str_16;
extern const char* str_17;
extern const char* str_18;
extern const char* str_19;
extern const char* str_20;
extern const char* str_21;
extern const char* str_22;
extern const char* str_23;
extern const char* str_24;
extern const char* str_25;
extern const char* str_26;
extern const char* str_27;
extern const char* str_28;

// Built-in: print
void iz_print(iz_value_t value) {
  switch (value.type) {
    case IZ_NUMBER:
      printf("%g\n", value.data.number);
      break;
    case IZ_STRING:
      printf("%s\n", value.data.string);
      break;
    case IZ_BOOL:
      printf("%s\n", value.data.boolean ? "true" : "false");
      break;
    default:
      printf("null\n");
  }
}

// Built-in: array operations
iz_array_t* iz_array_new() {
  iz_array_t* arr = malloc(sizeof(iz_array_t));
  arr->items = malloc(16 * sizeof(iz_value_t));
  arr->length = 0;
  arr->capacity = 16;
  return arr;
}

iz_value_t iz_array_get(iz_array_t* arr, int index) {
  if (index >= 0 && index < arr->length) {
    return arr->items[index];
  }
  return (iz_value_t){ .type = IZ_NULL };
}

void iz_array_push(iz_array_t* arr, iz_value_t value) {
  if (arr->length >= arr->capacity) {
    arr->capacity *= 2;
    arr->items = realloc(arr->items, arr->capacity * sizeof(iz_value_t));
  }
  arr->items[arr->length++] = value;
}

int iz_array_length(iz_array_t* arr) {
  return arr ? arr->length : 0;
}


  void main() {
    iz_value_t t0 = { .type = IZ_NULL };
    iz_value_t t1 = { .type = IZ_NULL };
    iz_value_t t2 = { .type = IZ_NULL };
    iz_value_t t3 = { .type = IZ_NULL };
    iz_value_t t4 = { .type = IZ_NULL };
    iz_value_t greet = { .type = IZ_NULL };
    iz_value_t t5 = { .type = IZ_NULL };
    iz_value_t t6 = { .type = IZ_NULL };
    iz_value_t t7 = { .type = IZ_NULL };
    iz_value_t t8 = { .type = IZ_NULL };
    iz_value_t t9 = { .type = IZ_NULL };
    iz_value_t t10 = { .type = IZ_NULL };
    iz_value_t t11 = { .type = IZ_NULL };
    iz_value_t t12 = { .type = IZ_NULL };
    iz_value_t t13 = { .type = IZ_NULL };
    iz_value_t t14 = { .type = IZ_NULL };
    iz_value_t t15 = { .type = IZ_NULL };
    iz_value_t t16 = { .type = IZ_NULL };
    iz_value_t t17 = { .type = IZ_NULL };
    iz_value_t t18 = { .type = IZ_NULL };
    iz_value_t t19 = { .type = IZ_NULL };
    iz_value_t t20 = { .type = IZ_NULL };
    iz_value_t t21 = { .type = IZ_NULL };
    iz_value_t t22 = { .type = IZ_NULL };
    iz_value_t t23 = { .type = IZ_NULL };
    iz_value_t t24 = { .type = IZ_NULL };
    iz_value_t t25 = { .type = IZ_NULL };
    iz_value_t t26 = { .type = IZ_NULL };
    iz_value_t t27 = { .type = IZ_NULL };
    iz_value_t t28 = { .type = IZ_NULL };
    iz_value_t t29 = { .type = IZ_NULL };
    iz_value_t nums = { .type = IZ_NULL };
    iz_value_t t30 = { .type = IZ_NULL };
    iz_value_t t31 = { .type = IZ_NULL };
    iz_value_t t32 = { .type = IZ_NULL };
    iz_value_t mapped = { .type = IZ_NULL };
    iz_value_t t33 = { .type = IZ_NULL };
    iz_value_t t34 = { .type = IZ_NULL };
    iz_value_t t35 = { .type = IZ_NULL };
    iz_value_t t36 = { .type = IZ_NULL };
    iz_value_t t37 = { .type = IZ_NULL };
    iz_value_t t38 = { .type = IZ_NULL };
    iz_value_t t39 = { .type = IZ_NULL };
    iz_value_t t40 = { .type = IZ_NULL };
    iz_value_t t41 = { .type = IZ_NULL };
    iz_value_t t42 = { .type = IZ_NULL };
    iz_value_t t43 = { .type = IZ_NULL };
    iz_value_t t44 = { .type = IZ_NULL };
    iz_value_t t45 = { .type = IZ_NULL };
    iz_value_t t46 = { .type = IZ_NULL };
    iz_value_t t47 = { .type = IZ_NULL };
    iz_value_t t48 = { .type = IZ_NULL };
    iz_value_t t49 = { .type = IZ_NULL };
    iz_value_t t50 = { .type = IZ_NULL };
    iz_value_t t51 = { .type = IZ_NULL };
    iz_value_t t52 = { .type = IZ_NULL };
    iz_value_t t53 = { .type = IZ_NULL };
    iz_value_t x = { .type = IZ_NULL };
    iz_value_t t54 = { .type = IZ_NULL };
    iz_value_t t55 = { .type = IZ_NULL };
    iz_value_t step1 = { .type = IZ_NULL };
    iz_value_t t56 = { .type = IZ_NULL };
    iz_value_t t57 = { .type = IZ_NULL };
    iz_value_t step2 = { .type = IZ_NULL };
    iz_value_t t58 = { .type = IZ_NULL };
    iz_value_t t59 = { .type = IZ_NULL };
    iz_value_t t60 = { .type = IZ_NULL };
    iz_value_t t61 = { .type = IZ_NULL };
    iz_value_t t62 = { .type = IZ_NULL };
    iz_value_t t63 = { .type = IZ_NULL };
    iz_value_t t64 = { .type = IZ_NULL };
    iz_value_t t65 = { .type = IZ_NULL };
    iz_value_t t66 = { .type = IZ_NULL };
    iz_value_t t67 = { .type = IZ_NULL };
    iz_value_t t68 = { .type = IZ_NULL };
    iz_value_t values = { .type = IZ_NULL };
    iz_value_t t69 = { .type = IZ_NULL };
    iz_value_t t70 = { .type = IZ_NULL };
    iz_value_t t71 = { .type = IZ_NULL };
    iz_value_t t72 = { .type = IZ_NULL };
    iz_value_t t73 = { .type = IZ_NULL };
    iz_value_t t74 = { .type = IZ_NULL };
    iz_value_t t75 = { .type = IZ_NULL };
    iz_value_t t76 = { .type = IZ_NULL };
    iz_value_t t77 = { .type = IZ_NULL };
    iz_value_t t78 = { .type = IZ_NULL };
    iz_value_t t79 = { .type = IZ_NULL };
    iz_value_t t80 = { .type = IZ_NULL };
    iz_value_t t81 = { .type = IZ_NULL };
    iz_value_t t82 = { .type = IZ_NULL };
    iz_value_t t83 = { .type = IZ_NULL };
    iz_value_t t84 = { .type = IZ_NULL };
    iz_value_t t85 = { .type = IZ_NULL };
    iz_value_t t86 = { .type = IZ_NULL };
    iz_value_t t87 = { .type = IZ_NULL };

    // t0 = ""
    t0 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_0 };
    // print t0
    iz_print(t0);
    // t1 = "=== Week 7: First-Class Functions & Higher-Order Functions ==="
    t1 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_1 };
    // print t1
    iz_print(t1);
    // t2 = ""
    t2 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_0 };
    // print t2
    iz_print(t2);
    // t3 = "1. Function as Value:"
    t3 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_2 };
    // print t3
    iz_print(t3);
    // t4 = "sayHello"
    t4 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_3 };
    // greet = t4
    greet = t4;
    // t5 = "  Stored function name: "
    t5 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_4 };
    // t6 = greet
    t6 = greet;
    // t7 = t5 add t6
    t7 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t5.data.number + t6.data.number };
    // print t7
    iz_print(t7);
    // t8 = "World"
    t8 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_5 };
    // t9 = sayHello(t8)
    t9 = sayHello(t8);
    // t10 = ""
    t10 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_0 };
    // print t10
    iz_print(t10);
    // t11 = "2. Counter with State:"
    t11 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_6 };
    // print t11
    iz_print(t11);
    // t12 = initCounter()
    t12 = initCounter();
    // t13 = "  Count: "
    t13 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_7 };
    // t14 = nextCount()
    t14 = nextCount();
    // t15 = t13 add t14
    t15 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t13.data.number + t14.data.number };
    // print t15
    iz_print(t15);
    // t16 = "  Count: "
    t16 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_7 };
    // t17 = nextCount()
    t17 = nextCount();
    // t18 = t16 add t17
    t18 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t16.data.number + t17.data.number };
    // print t18
    iz_print(t18);
    // t19 = "  Count: "
    t19 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_7 };
    // t20 = nextCount()
    t20 = nextCount();
    // t21 = t19 add t20
    t21 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t19.data.number + t20.data.number };
    // print t21
    iz_print(t21);
    // t22 = ""
    t22 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_0 };
    // print t22
    iz_print(t22);
    // t23 = "3. Higher-Order Functions (map):"
    t23 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_8 };
    // print t23
    iz_print(t23);
    // array literal
    t24 = iz_array_new();
    // t25 = 1
    t25 = (iz_value_t){ .type = IZ_NUMBER, .data.number = 1 };
    // push t25 to t24
    // t26 = 2
    t26 = (iz_value_t){ .type = IZ_NUMBER, .data.number = 2 };
    // push t26 to t24
    // t27 = 3
    t27 = (iz_value_t){ .type = IZ_NUMBER, .data.number = 3 };
    // push t27 to t24
    // t28 = 4
    t28 = (iz_value_t){ .type = IZ_NUMBER, .data.number = 4 };
    // push t28 to t24
    // t29 = 5
    t29 = (iz_value_t){ .type = IZ_NUMBER, .data.number = 5 };
    // push t29 to t24
    // nums = t24
    nums = t24;
    // t30 = nums
    t30 = nums;
    // t31 = "double"
    t31 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_9 };
    // t32 = map(t30, t31)
    t32 = map(t30, t31);
    // mapped = t32
    mapped = t32;
    // t33 = "  Original: [1, 2, 3, 4, 5]"
    t33 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_10 };
    // print t33
    iz_print(t33);
    // t34 = "  Mapped: "
    t34 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_11 };
    // t35 = mapped
    t35 = mapped;
    // t36 = t34 add t35
    t36 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t34.data.number + t35.data.number };
    // print t36
    iz_print(t36);
    // t37 = ""
    t37 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_0 };
    // print t37
    iz_print(t37);
    // t38 = "4. Math Operations:"
    t38 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_12 };
    // print t38
    iz_print(t38);
    // t39 = "  double(5) = "
    t39 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_13 };
    // t40 = 5
    t40 = (iz_value_t){ .type = IZ_NUMBER, .data.number = 5 };
    // t41 = double(t40)
    t41 = double(t40);
    // t42 = t39 add t41
    t42 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t39.data.number + t41.data.number };
    // print t42
    iz_print(t42);
    // t43 = "  triple(5) = "
    t43 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_14 };
    // t44 = 5
    t44 = (iz_value_t){ .type = IZ_NUMBER, .data.number = 5 };
    // t45 = triple(t44)
    t45 = triple(t44);
    // t46 = t43 add t45
    t46 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t43.data.number + t45.data.number };
    // print t46
    iz_print(t46);
    // t47 = "  addOne(5) = "
    t47 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_15 };
    // t48 = 5
    t48 = (iz_value_t){ .type = IZ_NUMBER, .data.number = 5 };
    // t49 = addOne(t48)
    t49 = addOne(t48);
    // t50 = t47 add t49
    t50 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t47.data.number + t49.data.number };
    // print t50
    iz_print(t50);
    // t51 = ""
    t51 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_0 };
    // print t51
    iz_print(t51);
    // t52 = "5. Function Composition:"
    t52 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_16 };
    // print t52
    iz_print(t52);
    // t53 = 5
    t53 = (iz_value_t){ .type = IZ_NUMBER, .data.number = 5 };
    // x = t53
    x = t53;
    // t54 = x
    t54 = x;
    // t55 = double(t54)
    t55 = double(t54);
    // step1 = t55
    step1 = t55;
    // t56 = step1
    t56 = step1;
    // t57 = addOne(t56)
    t57 = addOne(t56);
    // step2 = t57
    step2 = t57;
    // t58 = "  double then addOne(5) = "
    t58 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_17 };
    // t59 = step2
    t59 = step2;
    // t60 = t58 add t59
    t60 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t58.data.number + t59.data.number };
    // print t60
    iz_print(t60);
    // t61 = ""
    t61 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_0 };
    // print t61
    iz_print(t61);
    // t62 = "6. Array Processing:"
    t62 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_18 };
    // print t62
    iz_print(t62);
    // array literal
    t63 = iz_array_new();
    // t64 = 10
    t64 = (iz_value_t){ .type = IZ_NUMBER, .data.number = 10 };
    // push t64 to t63
    // t65 = 20
    t65 = (iz_value_t){ .type = IZ_NUMBER, .data.number = 20 };
    // push t65 to t63
    // t66 = 30
    t66 = (iz_value_t){ .type = IZ_NUMBER, .data.number = 30 };
    // push t66 to t63
    // t67 = 40
    t67 = (iz_value_t){ .type = IZ_NUMBER, .data.number = 40 };
    // push t67 to t63
    // t68 = 50
    t68 = (iz_value_t){ .type = IZ_NUMBER, .data.number = 50 };
    // push t68 to t63
    // values = t63
    values = t63;
    // t69 = "  Sum: "
    t69 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_19 };
    // t70 = values
    t70 = values;
    // t71 = sumArray(t70)
    t71 = sumArray(t70);
    // t72 = t69 add t71
    t72 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t69.data.number + t71.data.number };
    // print t72
    iz_print(t72);
    // t73 = "  Avg: "
    t73 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_20 };
    // t74 = values
    t74 = values;
    // t75 = sumArray(t74)
    t75 = sumArray(t74);
    // t76 = values
    t76 = values;
    // t77 = arrayLen(t76)
    t77 = arrayLen(t76);
    // t78 = t75 div t77
    t78 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t75.data.number / t77.data.number };
    // t79 = t73 add t78
    t79 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t73.data.number + t78.data.number };
    // print t79
    iz_print(t79);
    // t80 = ""
    t80 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_0 };
    // print t80
    iz_print(t80);
    // t81 = "7. Callback Pattern:"
    t81 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_21 };
    // print t81
    iz_print(t81);
    // t82 = 42
    t82 = (iz_value_t){ .type = IZ_NUMBER, .data.number = 42 };
    // t83 = "printResult"
    t83 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_22 };
    // t84 = processWithCallback(t82, t83)
    t84 = processWithCallback(t82, t83);
    // t85 = ""
    t85 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_0 };
    // print t85
    iz_print(t85);
    // t86 = "=== Demo Complete ==="
    t86 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_23 };
    // print t86
    iz_print(t86);
    // t87 = ""
    t87 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_0 };
    // print t87
    iz_print(t87);
    return;
  }

  void initCounter() {
    iz_value_t t0 = { .type = IZ_NULL };

    // t0 = 0
    t0 = (iz_value_t){ .type = IZ_NUMBER, .data.number = 0 };
    // counterValue = t0
    counterValue = t0;
    return;
  }

  void nextCount() {
    iz_value_t t0 = { .type = IZ_NULL };
    iz_value_t t1 = { .type = IZ_NULL };
    iz_value_t t2 = { .type = IZ_NULL };
    iz_value_t t3 = { .type = IZ_NULL };

    // t0 = counterValue
    t0 = counterValue;
    // t1 = 1
    t1 = (iz_value_t){ .type = IZ_NUMBER, .data.number = 1 };
    // t2 = t0 add t1
    t2 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t0.data.number + t1.data.number };
    // counterValue = t2
    counterValue = t2;
    // t3 = counterValue
    t3 = counterValue;
    // return t3
    return t3;
  }

  void sayHello(iz_value_t name) {
    iz_value_t t0 = { .type = IZ_NULL };
    iz_value_t t1 = { .type = IZ_NULL };
    iz_value_t t2 = { .type = IZ_NULL };
    iz_value_t t3 = { .type = IZ_NULL };
    iz_value_t t4 = { .type = IZ_NULL };

    // t0 = "  Hello, "
    t0 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_24 };
    // t1 = name
    t1 = name;
    // t2 = t0 add t1
    t2 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t0.data.number + t1.data.number };
    // t3 = "!"
    t3 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_25 };
    // t4 = t2 add t3
    t4 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t2.data.number + t3.data.number };
    // print t4
    iz_print(t4);
    return;
  }

  void double(iz_value_t x) {
    iz_value_t t0 = { .type = IZ_NULL };
    iz_value_t t1 = { .type = IZ_NULL };
    iz_value_t t2 = { .type = IZ_NULL };

    // t0 = x
    t0 = x;
    // t1 = 2
    t1 = (iz_value_t){ .type = IZ_NUMBER, .data.number = 2 };
    // t2 = t0 mul t1
    t2 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t0.data.number * t1.data.number };
    // return t2
    return t2;
  }

  void triple(iz_value_t x) {
    iz_value_t t0 = { .type = IZ_NULL };
    iz_value_t t1 = { .type = IZ_NULL };
    iz_value_t t2 = { .type = IZ_NULL };

    // t0 = x
    t0 = x;
    // t1 = 3
    t1 = (iz_value_t){ .type = IZ_NUMBER, .data.number = 3 };
    // t2 = t0 mul t1
    t2 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t0.data.number * t1.data.number };
    // return t2
    return t2;
  }

  void addOne(iz_value_t x) {
    iz_value_t t0 = { .type = IZ_NULL };
    iz_value_t t1 = { .type = IZ_NULL };
    iz_value_t t2 = { .type = IZ_NULL };

    // t0 = x
    t0 = x;
    // t1 = 1
    t1 = (iz_value_t){ .type = IZ_NUMBER, .data.number = 1 };
    // t2 = t0 add t1
    t2 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t0.data.number + t1.data.number };
    // return t2
    return t2;
  }

  void sumArray(iz_value_t arr) {
    iz_value_t t0 = { .type = IZ_NULL };
    iz_value_t sum = { .type = IZ_NULL };
    iz_value_t t1 = { .type = IZ_NULL };
    iz_value_t i = { .type = IZ_NULL };
    iz_value_t t2 = { .type = IZ_NULL };
    iz_value_t t3 = { .type = IZ_NULL };
    iz_value_t t4 = { .type = IZ_NULL };
    iz_value_t t5 = { .type = IZ_NULL };
    iz_value_t t6 = { .type = IZ_NULL };
    iz_value_t t7 = { .type = IZ_NULL };
    iz_value_t t8 = { .type = IZ_NULL };
    iz_value_t t9 = { .type = IZ_NULL };
    iz_value_t t10 = { .type = IZ_NULL };
    iz_value_t t11 = { .type = IZ_NULL };
    iz_value_t t12 = { .type = IZ_NULL };
    iz_value_t t13 = { .type = IZ_NULL };
    iz_value_t t14 = { .type = IZ_NULL };

    // t0 = 0
    t0 = (iz_value_t){ .type = IZ_NUMBER, .data.number = 0 };
    // sum = t0
    sum = t0;
    // t1 = 0
    t1 = (iz_value_t){ .type = IZ_NUMBER, .data.number = 0 };
    // i = t1
    i = t1;
while0:
    // t2 = i
    t2 = i;
    // t3 = arr
    t3 = arr;
    // t4 = arrayLen(t3)
    t4 = arrayLen(t3);
    // t5 = t2 lt t4
    t5 = (iz_value_t){ .type = IZ_BOOL, .data.boolean = t2.data.number < t4.data.number };
    // if t5 goto while_body1
    if (t5.data.boolean) goto while_body1;
    // goto while_end2
    goto while_end2;
while_body1:
    // t6 = sum
    t6 = sum;
    // t7 = arr
    t7 = arr;
    // t8 = i
    t8 = i;
    // t9 = t7[t8]
    t9 = iz_array_get(t7.data.array, t8.data.number);
    // t10 = t6 add t9
    t10 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t6.data.number + t9.data.number };
    // sum = t10
    sum = t10;
    // t11 = i
    t11 = i;
    // t12 = 1
    t12 = (iz_value_t){ .type = IZ_NUMBER, .data.number = 1 };
    // t13 = t11 add t12
    t13 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t11.data.number + t12.data.number };
    // i = t13
    i = t13;
    // goto while0
    goto while0;
while_end2:
    // t14 = sum
    t14 = sum;
    // return t14
    return t14;
  }

  void processWithCallback(iz_value_t value, iz_value_t callbackName) {
    iz_value_t t0 = { .type = IZ_NULL };
    iz_value_t t1 = { .type = IZ_NULL };
    iz_value_t t2 = { .type = IZ_NULL };
    iz_value_t t3 = { .type = IZ_NULL };
    iz_value_t t4 = { .type = IZ_NULL };
    iz_value_t t5 = { .type = IZ_NULL };

    // t0 = "  Processing: "
    t0 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_26 };
    // t1 = value
    t1 = value;
    // t2 = t0 add t1
    t2 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t0.data.number + t1.data.number };
    // print t2
    iz_print(t2);
    // t3 = "  Result would be sent to: "
    t3 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_27 };
    // t4 = callbackName
    t4 = callbackName;
    // t5 = t3 add t4
    t5 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t3.data.number + t4.data.number };
    // print t5
    iz_print(t5);
    return;
  }

  void printResult(iz_value_t x) {
    iz_value_t t0 = { .type = IZ_NULL };
    iz_value_t t1 = { .type = IZ_NULL };
    iz_value_t t2 = { .type = IZ_NULL };

    // t0 = "  Result: "
    t0 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_28 };
    // t1 = x
    t1 = x;
    // t2 = t0 add t1
    t2 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t0.data.number + t1.data.number };
    // print t2
    iz_print(t2);
    return;
  }
