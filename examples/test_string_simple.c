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
static const char* str_0 = "=== Simple String Test ===";
static const char* str_1 = "Test 1: split";
static const char* str_2 = "a,b,c";
static const char* str_3 = ",";
static const char* str_4 = "Split done";
static const char* str_5 = "Test 2: join";
static const char* str_6 = "Hello";
static const char* str_7 = "World";
static const char* str_8 = " ";
static const char* str_9 = "Join done: ";
static const char* str_10 = "Test 3: indexOf";
static const char* str_11 = "Hello, World!";
static const char* str_12 = "indexOf done: ";
static const char* str_13 = "=== Done ===";

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
extern const char* str_10;
extern const char* str_11;
extern const char* str_12;
extern const char* str_13;

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

// Built-in: string operations
int iz_string_length(const char* str) {
  return str ? strlen(str) : 0;
}

char* iz_string_concat(const char* a, const char* b) {
  int len = strlen(a) + strlen(b) + 1;
  char* result = malloc(len);
  strcpy(result, a);
  strcat(result, b);
  return result;
}

int iz_string_contains(const char* str, const char* substr) {
  return strstr(str, substr) != NULL;
}

int iz_string_indexOf(const char* str, const char* substr) {
  const char* pos = strstr(str, substr);
  return pos ? (pos - str) : -1;
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

iz_array_t* iz_string_split(const char* str, const char* delim) {
  iz_array_t* arr = iz_array_new();
  char* copy = strdup(str);
  char* token = strtok(copy, delim);
  while (token) {
    iz_value_t val = { .type = IZ_STRING, .data.string = strdup(token) };
    iz_array_push(arr, val);
    token = strtok(NULL, delim);
  }
  free(copy);
  return arr;
}

char* iz_string_join(iz_array_t* arr, const char* delim) {
  if (!arr || arr->length == 0) return strdup("");
  int total_len = 0;
  for (int i = 0; i < arr->length; i++) {
    if (arr->items[i].type == IZ_STRING) {
      total_len += strlen(arr->items[i].data.string);
    }
  }
  total_len += (arr->length - 1) * strlen(delim) + 1;
  char* result = malloc(total_len);
  result[0] = '\0';
  for (int i = 0; i < arr->length; i++) {
    if (arr->items[i].type == IZ_STRING) {
      if (i > 0) strcat(result, delim);
      strcat(result, arr->items[i].data.string);
    }
  }
  return result;
}

char* iz_string_substring(const char* str, int start, int end) {
  int len = strlen(str);
  if (start < 0) start = 0;
  if (end > len) end = len;
  if (end < start) end = start;
  int sublen = end - start;
  char* result = malloc(sublen + 1);
  strncpy(result, str + start, sublen);
  result[sublen] = '\0';
  return result;
}

int iz_string_lastIndexOf(const char* str, const char* substr) {
  int len = strlen(str);
  int sublen = strlen(substr);
  if (sublen == 0) return len;
  for (int i = len - sublen; i >= 0; i--) {
    if (strncmp(str + i, substr, sublen) == 0) return i;
  }
  return -1;
}

// Wrapper functions for IOZEN type system
iz_value_t iz_split_wrapper(iz_value_t str, iz_value_t delim) {
  const char* s = (str.type == IZ_STRING) ? str.data.string : "";
  const char* d = (delim.type == IZ_STRING) ? delim.data.string : ",";
  iz_array_t* arr = iz_string_split(s, d);
  return (iz_value_t){ .type = IZ_ARRAY, .data.array = arr };
}

iz_value_t iz_join_wrapper(iz_value_t arr, iz_value_t delim) {
  iz_array_t* a = (arr.type == IZ_ARRAY) ? arr.data.array : NULL;
  const char* d = (delim.type == IZ_STRING) ? delim.data.string : "";
  char* result = iz_string_join(a, d);
  return (iz_value_t){ .type = IZ_STRING, .data.string = result };
}

iz_value_t iz_indexOf_wrapper(iz_value_t str, iz_value_t substr) {
  const char* s = (str.type == IZ_STRING) ? str.data.string : "";
  const char* sub = (substr.type == IZ_STRING) ? substr.data.string : "";
  int result = iz_string_indexOf(s, sub);
  return (iz_value_t){ .type = IZ_NUMBER, .data.number = result };
}

iz_value_t iz_lastIndexOf_wrapper(iz_value_t str, iz_value_t substr) {
  const char* s = (str.type == IZ_STRING) ? str.data.string : "";
  const char* sub = (substr.type == IZ_STRING) ? substr.data.string : "";
  int result = iz_string_lastIndexOf(s, sub);
  return (iz_value_t){ .type = IZ_NUMBER, .data.number = result };
}

iz_value_t iz_substring_wrapper(iz_value_t str, iz_value_t start, iz_value_t end) {
  const char* s = (str.type == IZ_STRING) ? str.data.string : "";
  int st = (start.type == IZ_NUMBER) ? (int)start.data.number : 0;
  int en = (end.type == IZ_NUMBER) ? (int)end.data.number : strlen(s);
  char* result = iz_string_substring(s, st, en);
  return (iz_value_t){ .type = IZ_STRING, .data.string = result };
}

iz_value_t iz_contains_wrapper(iz_value_t str, iz_value_t substr) {
  const char* s = (str.type == IZ_STRING) ? str.data.string : "";
  const char* sub = (substr.type == IZ_STRING) ? substr.data.string : "";
  int result = iz_string_contains(s, sub);
  return (iz_value_t){ .type = IZ_BOOL, .data.boolean = result };
}

iz_value_t iz_arrayLen_wrapper(iz_value_t arr) {
  iz_array_t* a = (arr.type == IZ_ARRAY) ? arr.data.array : NULL;
  int result = iz_array_length(a);
  return (iz_value_t){ .type = IZ_NUMBER, .data.number = result };
}


  void main() {
    iz_value_t t0 = { .type = IZ_NULL };
    iz_value_t t1 = { .type = IZ_NULL };
    iz_value_t t2 = { .type = IZ_NULL };
    iz_value_t text = { .type = IZ_NULL };
    iz_value_t t3 = { .type = IZ_NULL };
    iz_value_t t4 = { .type = IZ_NULL };
    iz_value_t t5 = { .type = IZ_NULL };
    iz_value_t fruits = { .type = IZ_NULL };
    iz_value_t t6 = { .type = IZ_NULL };
    iz_value_t t7 = { .type = IZ_NULL };
    iz_value_t t8 = { .type = IZ_NULL };
    iz_value_t t9 = { .type = IZ_NULL };
    iz_value_t t10 = { .type = IZ_NULL };
    iz_value_t words = { .type = IZ_NULL };
    iz_value_t t11 = { .type = IZ_NULL };
    iz_value_t t12 = { .type = IZ_NULL };
    iz_value_t t13 = { .type = IZ_NULL };
    iz_value_t sentence = { .type = IZ_NULL };
    iz_value_t t14 = { .type = IZ_NULL };
    iz_value_t t15 = { .type = IZ_NULL };
    iz_value_t t16 = { .type = IZ_NULL };
    iz_value_t t17 = { .type = IZ_NULL };
    iz_value_t t18 = { .type = IZ_NULL };
    iz_value_t str = { .type = IZ_NULL };
    iz_value_t t19 = { .type = IZ_NULL };
    iz_value_t t20 = { .type = IZ_NULL };
    iz_value_t t21 = { .type = IZ_NULL };
    iz_value_t idx = { .type = IZ_NULL };
    iz_value_t t22 = { .type = IZ_NULL };
    iz_value_t t23 = { .type = IZ_NULL };
    iz_value_t t24 = { .type = IZ_NULL };
    iz_value_t t25 = { .type = IZ_NULL };

    // t0 = "=== Simple String Test ==="
    t0 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_0 };
    // print t0
    iz_print(t0);
    // t1 = "Test 1: split"
    t1 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_1 };
    // print t1
    iz_print(t1);
    // t2 = "a,b,c"
    t2 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_2 };
    // text = t2
    text = t2;
    // t3 = text
    t3 = text;
    // t4 = ","
    t4 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_3 };
    // t5 = split(t3, t4)
    t5 = iz_split_wrapper(t3, t4);
    // fruits = t5
    fruits = t5;
    // t6 = "Split done"
    t6 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_4 };
    // print t6
    iz_print(t6);
    // t7 = "Test 2: join"
    t7 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_5 };
    // print t7
    iz_print(t7);
    // array literal
    t8 = (iz_value_t){ .type = IZ_ARRAY, .data.array = iz_array_new() };
    // t9 = "Hello"
    t9 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_6 };
    // push t9 to t8
    // t10 = "World"
    t10 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_7 };
    // push t10 to t8
    // words = t8
    words = t8;
    // t11 = words
    t11 = words;
    // t12 = " "
    t12 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_8 };
    // t13 = join(t11, t12)
    t13 = iz_join_wrapper(t11, t12);
    // sentence = t13
    sentence = t13;
    // t14 = "Join done: "
    t14 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_9 };
    // t15 = sentence
    t15 = sentence;
    // t16 = t14 add t15
    t16 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t14.data.number + t15.data.number };
    // print t16
    iz_print(t16);
    // t17 = "Test 3: indexOf"
    t17 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_10 };
    // print t17
    iz_print(t17);
    // t18 = "Hello, World!"
    t18 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_11 };
    // str = t18
    str = t18;
    // t19 = str
    t19 = str;
    // t20 = "World"
    t20 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_7 };
    // t21 = indexOf(t19, t20)
    t21 = iz_indexOf_wrapper(t19, t20);
    // idx = t21
    idx = t21;
    // t22 = "indexOf done: "
    t22 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_12 };
    // t23 = idx
    t23 = idx;
    // t24 = t22 add t23
    t24 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t22.data.number + t23.data.number };
    // print t24
    iz_print(t24);
    // t25 = "=== Done ==="
    t25 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_13 };
    // print t25
    iz_print(t25);
    return;
  }
