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
static const char* str_0 = "apple";
static const char* str_1 = "banana";
static const char* str_2 = "cherry";

// Forward declarations
void main();

// String literal forward declarations
extern const char* str_0;
extern const char* str_1;
extern const char* str_2;

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
    iz_value_t fruits = { .type = IZ_NULL };
    iz_value_t t4 = { .type = IZ_NULL };
    iz_value_t t5 = { .type = IZ_NULL };
    iz_value_t t6 = { .type = IZ_NULL };
    iz_value_t t7 = { .type = IZ_NULL };
    iz_value_t t8 = { .type = IZ_NULL };
    iz_value_t t9 = { .type = IZ_NULL };
    iz_value_t t10 = { .type = IZ_NULL };
    iz_value_t t11 = { .type = IZ_NULL };
    iz_value_t t12 = { .type = IZ_NULL };

    // array literal
    t0 = iz_array_new();
    // t1 = "apple"
    t1 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_0 };
    // push t1 to t0
    // t2 = "banana"
    t2 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_1 };
    // push t2 to t0
    // t3 = "cherry"
    t3 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_2 };
    // push t3 to t0
    // fruits = t0
    fruits = t0;
    // t4 = fruits
    t4 = fruits;
    // t5 = 0
    t5 = (iz_value_t){ .type = IZ_NUMBER, .data.number = 0 };
    // t6 = t4[t5]
    t6 = iz_array_get(t4.data.array, t5.data.number);
    // print t6
    iz_print(t6);
    // t7 = fruits
    t7 = fruits;
    // t8 = 1
    t8 = (iz_value_t){ .type = IZ_NUMBER, .data.number = 1 };
    // t9 = t7[t8]
    t9 = iz_array_get(t7.data.array, t8.data.number);
    // print t9
    iz_print(t9);
    // t10 = fruits
    t10 = fruits;
    // t11 = 2
    t11 = (iz_value_t){ .type = IZ_NUMBER, .data.number = 2 };
    // t12 = t10[t11]
    t12 = iz_array_get(t10.data.array, t11.data.number);
    // print t12
    iz_print(t12);
    return;
  }
