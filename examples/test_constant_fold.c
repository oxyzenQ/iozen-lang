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
static const char* str_0 = "Hello, World!";
static const char* str_1 = "Constant folding test:";
static const char* str_2 = "a = 2 + 3 = ";
static const char* str_3 = "b = 10 * 5 = ";
static const char* str_4 = "c = 100 / 4 = ";
static const char* str_5 = "d = 17 % 5 = ";
static const char* str_6 = "e = (2 + 3) * 4 = ";
static const char* str_7 = "f = 10 + 20 + 30 = ";
static const char* str_8 = "greeting = ";

// Forward declarations
void main();

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
    iz_value_t a = { .type = IZ_NULL };
    iz_value_t t1 = { .type = IZ_NULL };
    iz_value_t b = { .type = IZ_NULL };
    iz_value_t t2 = { .type = IZ_NULL };
    iz_value_t c = { .type = IZ_NULL };
    iz_value_t t3 = { .type = IZ_NULL };
    iz_value_t d = { .type = IZ_NULL };
    iz_value_t t4 = { .type = IZ_NULL };
    iz_value_t e = { .type = IZ_NULL };
    iz_value_t t5 = { .type = IZ_NULL };
    iz_value_t f = { .type = IZ_NULL };
    iz_value_t t6 = { .type = IZ_NULL };
    iz_value_t greeting = { .type = IZ_NULL };
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

    // t0 = 5
    t0 = (iz_value_t){ .type = IZ_NUMBER, .data.number = 5 };
    // a = t0
    a = t0;
    // t1 = 50
    t1 = (iz_value_t){ .type = IZ_NUMBER, .data.number = 50 };
    // b = t1
    b = t1;
    // t2 = 25
    t2 = (iz_value_t){ .type = IZ_NUMBER, .data.number = 25 };
    // c = t2
    c = t2;
    // t3 = 2
    t3 = (iz_value_t){ .type = IZ_NUMBER, .data.number = 2 };
    // d = t3
    d = t3;
    // t4 = 20
    t4 = (iz_value_t){ .type = IZ_NUMBER, .data.number = 20 };
    // e = t4
    e = t4;
    // t5 = 60
    t5 = (iz_value_t){ .type = IZ_NUMBER, .data.number = 60 };
    // f = t5
    f = t5;
    // t6 = "Hello, World!"
    t6 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_0 };
    // greeting = t6
    greeting = t6;
    // t7 = "Constant folding test:"
    t7 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_1 };
    // print t7
    iz_print(t7);
    // t8 = "a = 2 + 3 = "
    t8 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_2 };
    // t9 = a
    t9 = a;
    // t10 = t8 add t9
    t10 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t8.data.number + t9.data.number };
    // print t10
    iz_print(t10);
    // t11 = "b = 10 * 5 = "
    t11 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_3 };
    // t12 = b
    t12 = b;
    // t13 = t11 add t12
    t13 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t11.data.number + t12.data.number };
    // print t13
    iz_print(t13);
    // t14 = "c = 100 / 4 = "
    t14 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_4 };
    // t15 = c
    t15 = c;
    // t16 = t14 add t15
    t16 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t14.data.number + t15.data.number };
    // print t16
    iz_print(t16);
    // t17 = "d = 17 % 5 = "
    t17 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_5 };
    // t18 = d
    t18 = d;
    // t19 = t17 add t18
    t19 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t17.data.number + t18.data.number };
    // print t19
    iz_print(t19);
    // t20 = "e = (2 + 3) * 4 = "
    t20 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_6 };
    // t21 = e
    t21 = e;
    // t22 = t20 add t21
    t22 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t20.data.number + t21.data.number };
    // print t22
    iz_print(t22);
    // t23 = "f = 10 + 20 + 30 = "
    t23 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_7 };
    // t24 = f
    t24 = f;
    // t25 = t23 add t24
    t25 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t23.data.number + t24.data.number };
    // print t25
    iz_print(t25);
    // t26 = "greeting = "
    t26 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_8 };
    // t27 = greeting
    t27 = greeting;
    // t28 = t26 add t27
    t28 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t26.data.number + t27.data.number };
    // print t28
    iz_print(t28);
    return;
  }
