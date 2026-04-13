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
static const char* str_1 = "=== Week 9: Type Annotations Demo ===";
static const char* str_2 = "1. Typed Variables:";
static const char* str_3 = "IOZEN";
static const char* str_4 = "  age: ";
static const char* str_5 = " (number)";
static const char* str_6 = "  name: ";
static const char* str_7 = " (string)";
static const char* str_8 = "  isAwesome: ";
static const char* str_9 = " (bool)";
static const char* str_10 = "2. Untyped Variables (any):";
static const char* str_11 = "can be anything";
static const char* str_12 = "  flexible = ";
static const char* str_13 = "3. Typed Functions:";
static const char* str_14 = "  add(10, 20) = ";
static const char* str_15 = "World";
static const char* str_16 = "  ";
static const char* str_17 = "4. Untyped Functions (backward compatible):";
static const char* str_18 = "  legacyAdd(5, 10) = ";
static const char* str_19 = "=== Demo Complete ===";
static const char* str_20 = "Hello, ";
static const char* str_21 = "!";

// Forward declarations
void main();
iz_value_t add(iz_value_t x, iz_value_t y);
iz_value_t greet(iz_value_t name);
void legacyAdd(iz_value_t a, iz_value_t b);

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
    iz_value_t age = { .type = IZ_NULL };
    iz_value_t t5 = { .type = IZ_NULL };
    iz_value_t name = { .type = IZ_NULL };
    iz_value_t t6 = { .type = IZ_NULL };
    iz_value_t isAwesome = { .type = IZ_NULL };
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
    iz_value_t flexible = { .type = IZ_NULL };
    iz_value_t t25 = { .type = IZ_NULL };
    iz_value_t t26 = { .type = IZ_NULL };
    iz_value_t t27 = { .type = IZ_NULL };
    iz_value_t t28 = { .type = IZ_NULL };
    iz_value_t t29 = { .type = IZ_NULL };
    iz_value_t t30 = { .type = IZ_NULL };
    iz_value_t t31 = { .type = IZ_NULL };
    iz_value_t t32 = { .type = IZ_NULL };
    iz_value_t t33 = { .type = IZ_NULL };
    iz_value_t result = { .type = IZ_NULL };
    iz_value_t t34 = { .type = IZ_NULL };
    iz_value_t t35 = { .type = IZ_NULL };
    iz_value_t t36 = { .type = IZ_NULL };
    iz_value_t t37 = { .type = IZ_NULL };
    iz_value_t t38 = { .type = IZ_NULL };
    iz_value_t greeting = { .type = IZ_NULL };
    iz_value_t t39 = { .type = IZ_NULL };
    iz_value_t t40 = { .type = IZ_NULL };
    iz_value_t t41 = { .type = IZ_NULL };
    iz_value_t t42 = { .type = IZ_NULL };
    iz_value_t t43 = { .type = IZ_NULL };
    iz_value_t t44 = { .type = IZ_NULL };
    iz_value_t t45 = { .type = IZ_NULL };
    iz_value_t t46 = { .type = IZ_NULL };
    iz_value_t oldStyle = { .type = IZ_NULL };
    iz_value_t t47 = { .type = IZ_NULL };
    iz_value_t t48 = { .type = IZ_NULL };
    iz_value_t t49 = { .type = IZ_NULL };
    iz_value_t t50 = { .type = IZ_NULL };
    iz_value_t t51 = { .type = IZ_NULL };
    iz_value_t t52 = { .type = IZ_NULL };

    // t0 = ""
    t0 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_0 };
    // print t0
    iz_print(t0);
    // t1 = "=== Week 9: Type Annotations Demo ==="
    t1 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_1 };
    // print t1
    iz_print(t1);
    // t2 = ""
    t2 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_0 };
    // print t2
    iz_print(t2);
    // t3 = "1. Typed Variables:"
    t3 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_2 };
    // print t3
    iz_print(t3);
    // t4 = 25
    t4 = (iz_value_t){ .type = IZ_NUMBER, .data.number = 25 };
    // age = t4
    age = t4;
    // t5 = "IOZEN"
    t5 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_3 };
    // name = t5
    name = t5;
    // t6 = true
    t6 = true;
    // isAwesome = t6
    isAwesome = t6;
    // t7 = "  age: "
    t7 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_4 };
    // t8 = age
    t8 = age;
    // t9 = t7 add t8
    t9 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t7.data.number + t8.data.number };
    // t10 = " (number)"
    t10 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_5 };
    // t11 = t9 add t10
    t11 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t9.data.number + t10.data.number };
    // print t11
    iz_print(t11);
    // t12 = "  name: "
    t12 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_6 };
    // t13 = name
    t13 = name;
    // t14 = t12 add t13
    t14 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t12.data.number + t13.data.number };
    // t15 = " (string)"
    t15 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_7 };
    // t16 = t14 add t15
    t16 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t14.data.number + t15.data.number };
    // print t16
    iz_print(t16);
    // t17 = "  isAwesome: "
    t17 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_8 };
    // t18 = isAwesome
    t18 = isAwesome;
    // t19 = t17 add t18
    t19 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t17.data.number + t18.data.number };
    // t20 = " (bool)"
    t20 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_9 };
    // t21 = t19 add t20
    t21 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t19.data.number + t20.data.number };
    // print t21
    iz_print(t21);
    // t22 = ""
    t22 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_0 };
    // print t22
    iz_print(t22);
    // t23 = "2. Untyped Variables (any):"
    t23 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_10 };
    // print t23
    iz_print(t23);
    // t24 = "can be anything"
    t24 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_11 };
    // flexible = t24
    flexible = t24;
    // t25 = 42
    t25 = (iz_value_t){ .type = IZ_NUMBER, .data.number = 42 };
    // flexible = t25
    flexible = t25;
    // t26 = "  flexible = "
    t26 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_12 };
    // t27 = flexible
    t27 = flexible;
    // t28 = t26 add t27
    t28 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t26.data.number + t27.data.number };
    // print t28
    iz_print(t28);
    // t29 = ""
    t29 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_0 };
    // print t29
    iz_print(t29);
    // t30 = "3. Typed Functions:"
    t30 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_13 };
    // print t30
    iz_print(t30);
    // t31 = 10
    t31 = (iz_value_t){ .type = IZ_NUMBER, .data.number = 10 };
    // t32 = 20
    t32 = (iz_value_t){ .type = IZ_NUMBER, .data.number = 20 };
    // t33 = add(t31, t32)
    t33 = add(t31, t32);
    // result = t33
    result = t33;
    // t34 = "  add(10, 20) = "
    t34 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_14 };
    // t35 = result
    t35 = result;
    // t36 = t34 add t35
    t36 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t34.data.number + t35.data.number };
    // print t36
    iz_print(t36);
    // t37 = "World"
    t37 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_15 };
    // t38 = greet(t37)
    t38 = greet(t37);
    // greeting = t38
    greeting = t38;
    // t39 = "  "
    t39 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_16 };
    // t40 = greeting
    t40 = greeting;
    // t41 = t39 add t40
    t41 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t39.data.number + t40.data.number };
    // print t41
    iz_print(t41);
    // t42 = ""
    t42 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_0 };
    // print t42
    iz_print(t42);
    // t43 = "4. Untyped Functions (backward compatible):"
    t43 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_17 };
    // print t43
    iz_print(t43);
    // t44 = 5
    t44 = (iz_value_t){ .type = IZ_NUMBER, .data.number = 5 };
    // t45 = 10
    t45 = (iz_value_t){ .type = IZ_NUMBER, .data.number = 10 };
    // t46 = legacyAdd(t44, t45)
    t46 = legacyAdd(t44, t45);
    // oldStyle = t46
    oldStyle = t46;
    // t47 = "  legacyAdd(5, 10) = "
    t47 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_18 };
    // t48 = oldStyle
    t48 = oldStyle;
    // t49 = t47 add t48
    t49 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t47.data.number + t48.data.number };
    // print t49
    iz_print(t49);
    // t50 = ""
    t50 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_0 };
    // print t50
    iz_print(t50);
    // t51 = "=== Demo Complete ==="
    t51 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_19 };
    // print t51
    iz_print(t51);
    // t52 = ""
    t52 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_0 };
    // print t52
    iz_print(t52);
    return;
  }

  iz_value_t add(iz_value_t x, iz_value_t y) {
    iz_value_t t0 = { .type = IZ_NULL };
    iz_value_t t1 = { .type = IZ_NULL };
    iz_value_t t2 = { .type = IZ_NULL };

    // t0 = x
    t0 = x;
    // t1 = y
    t1 = y;
    // t2 = t0 add t1
    t2 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t0.data.number + t1.data.number };
    // return t2
    return t2;
  }

  iz_value_t greet(iz_value_t name) {
    iz_value_t t0 = { .type = IZ_NULL };
    iz_value_t t1 = { .type = IZ_NULL };
    iz_value_t t2 = { .type = IZ_NULL };
    iz_value_t t3 = { .type = IZ_NULL };
    iz_value_t t4 = { .type = IZ_NULL };

    // t0 = "Hello, "
    t0 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_20 };
    // t1 = name
    t1 = name;
    // t2 = t0 add t1
    t2 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t0.data.number + t1.data.number };
    // t3 = "!"
    t3 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_21 };
    // t4 = t2 add t3
    t4 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t2.data.number + t3.data.number };
    // return t4
    return t4;
  }

  void legacyAdd(iz_value_t a, iz_value_t b) {
    iz_value_t t0 = { .type = IZ_NULL };
    iz_value_t t1 = { .type = IZ_NULL };
    iz_value_t t2 = { .type = IZ_NULL };

    // t0 = a
    t0 = a;
    // t1 = b
    t1 = b;
    // t2 = t0 add t1
    t2 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t0.data.number + t1.data.number };
    // return t2
    return t2;
  }
