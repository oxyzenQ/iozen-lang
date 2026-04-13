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
static const char* str_1 = "  ╭─────────────── System Information ───────────────╮";
static const char* str_2 = "  │                                                  │";
static const char* str_3 = "  │  OS:       ";
static const char* str_4 = "  │  Host:     ";
static const char* str_5 = "  │  User:     ";
static const char* str_6 = "  │  CPU:      ";
static const char* str_7 = "  │  RAM:      ";
static const char* str_8 = "  │  Uptime:   ";
static const char* str_9 = "  ╰──────────────────────────────────────────────────╯";

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
extern const char* str_9;

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

    // t0 = ""
    t0 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_0 };
    // print t0
    iz_print(t0);
    // t1 = "  ╭─────────────── System Information ───────────────╮"
    t1 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_1 };
    // print t1
    iz_print(t1);
    // t2 = "  │                                                  │"
    t2 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_2 };
    // print t2
    iz_print(t2);
    // t3 = "  │  OS:       "
    t3 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_3 };
    // t4 = get_os()
    t4 = get_os();
    // t5 = t3 add t4
    t5 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t3.data.number + t4.data.number };
    // print t5
    iz_print(t5);
    // t6 = "  │  Host:     "
    t6 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_4 };
    // t7 = get_hostname()
    t7 = get_hostname();
    // t8 = t6 add t7
    t8 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t6.data.number + t7.data.number };
    // print t8
    iz_print(t8);
    // t9 = "  │  User:     "
    t9 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_5 };
    // t10 = get_user()
    t10 = get_user();
    // t11 = t9 add t10
    t11 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t9.data.number + t10.data.number };
    // print t11
    iz_print(t11);
    // t12 = "  │  CPU:      "
    t12 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_6 };
    // t13 = get_cpu()
    t13 = get_cpu();
    // t14 = t12 add t13
    t14 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t12.data.number + t13.data.number };
    // print t14
    iz_print(t14);
    // t15 = "  │  RAM:      "
    t15 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_7 };
    // t16 = get_ram()
    t16 = get_ram();
    // t17 = t15 add t16
    t17 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t15.data.number + t16.data.number };
    // print t17
    iz_print(t17);
    // t18 = "  │  Uptime:   "
    t18 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_8 };
    // t19 = get_uptime()
    t19 = get_uptime();
    // t20 = t18 add t19
    t20 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t18.data.number + t19.data.number };
    // print t20
    iz_print(t20);
    // t21 = "  │                                                  │"
    t21 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_2 };
    // print t21
    iz_print(t21);
    // t22 = "  ╰──────────────────────────────────────────────────╯"
    t22 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_9 };
    // print t22
    iz_print(t22);
    // t23 = ""
    t23 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_0 };
    // print t23
    iz_print(t23);
    return;
  }
