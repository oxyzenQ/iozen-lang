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
static const char* str_0 = "=== Week 11: String Methods ===";
static const char* str_1 = "";
static const char* str_2 = "Test 1: split()";
static const char* str_3 = "apple,banana,cherry";
static const char* str_4 = ",";
static const char* str_5 = "Split result:";
static const char* str_6 = "  [";
static const char* str_7 = "] = ";
static const char* str_8 = "Test 2: join()";
static const char* str_9 = "Hello";
static const char* str_10 = "World";
static const char* str_11 = "IOZEN";
static const char* str_12 = " ";
static const char* str_13 = "Joined: ";
static const char* str_14 = "Test 3: substring()";
static const char* str_15 = "Hello, World!";
static const char* str_16 = "substring(0, 5): ";
static const char* str_17 = "substring(7): ";
static const char* str_18 = "Test 4: indexOf()";
static const char* str_19 = "indexOf('World'): ";
static const char* str_20 = "indexOf('xyz'): ";
static const char* str_21 = "xyz";
static const char* str_22 = "Test 5: lastIndexOf()";
static const char* str_23 = "abc abc abc";
static const char* str_24 = "lastIndexOf('abc'): ";
static const char* str_25 = "abc";
static const char* str_26 = "=== All String Methods Working! ===";

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
    iz_value_t t3 = { .type = IZ_NULL };
    iz_value_t text = { .type = IZ_NULL };
    iz_value_t t4 = { .type = IZ_NULL };
    iz_value_t t5 = { .type = IZ_NULL };
    iz_value_t t6 = { .type = IZ_NULL };
    iz_value_t fruits = { .type = IZ_NULL };
    iz_value_t t7 = { .type = IZ_NULL };
    iz_value_t t8 = { .type = IZ_NULL };
    iz_value_t i = { .type = IZ_NULL };
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
    iz_value_t t30 = { .type = IZ_NULL };
    iz_value_t words = { .type = IZ_NULL };
    iz_value_t t31 = { .type = IZ_NULL };
    iz_value_t t32 = { .type = IZ_NULL };
    iz_value_t t33 = { .type = IZ_NULL };
    iz_value_t sentence = { .type = IZ_NULL };
    iz_value_t t34 = { .type = IZ_NULL };
    iz_value_t t35 = { .type = IZ_NULL };
    iz_value_t t36 = { .type = IZ_NULL };
    iz_value_t t37 = { .type = IZ_NULL };
    iz_value_t t38 = { .type = IZ_NULL };
    iz_value_t t39 = { .type = IZ_NULL };
    iz_value_t str = { .type = IZ_NULL };
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
    iz_value_t t54 = { .type = IZ_NULL };
    iz_value_t t55 = { .type = IZ_NULL };
    iz_value_t t56 = { .type = IZ_NULL };
    iz_value_t t57 = { .type = IZ_NULL };
    iz_value_t t58 = { .type = IZ_NULL };
    iz_value_t t59 = { .type = IZ_NULL };
    iz_value_t t60 = { .type = IZ_NULL };
    iz_value_t t61 = { .type = IZ_NULL };
    iz_value_t t62 = { .type = IZ_NULL };
    iz_value_t t63 = { .type = IZ_NULL };
    iz_value_t t64 = { .type = IZ_NULL };
    iz_value_t t65 = { .type = IZ_NULL };
    iz_value_t repeatStr = { .type = IZ_NULL };
    iz_value_t t66 = { .type = IZ_NULL };
    iz_value_t t67 = { .type = IZ_NULL };
    iz_value_t t68 = { .type = IZ_NULL };
    iz_value_t t69 = { .type = IZ_NULL };
    iz_value_t t70 = { .type = IZ_NULL };
    iz_value_t t71 = { .type = IZ_NULL };
    iz_value_t t72 = { .type = IZ_NULL };

    // t0 = "=== Week 11: String Methods ==="
    t0 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_0 };
    // print t0
    iz_print(t0);
    // t1 = ""
    t1 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_1 };
    // print t1
    iz_print(t1);
    // t2 = "Test 1: split()"
    t2 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_2 };
    // print t2
    iz_print(t2);
    // t3 = "apple,banana,cherry"
    t3 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_3 };
    // text = t3
    text = t3;
    // t4 = text
    t4 = text;
    // t5 = ","
    t5 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_4 };
    // t6 = split(t4, t5)
    t6 = iz_split_wrapper(t4, t5);
    // fruits = t6
    fruits = t6;
    // t7 = "Split result:"
    t7 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_5 };
    // print t7
    iz_print(t7);
    // t8 = 0
    t8 = (iz_value_t){ .type = IZ_NUMBER, .data.number = 0 };
    // i = t8
    i = t8;
while0:
    // t9 = i
    t9 = i;
    // t10 = fruits
    t10 = fruits;
    // t11 = arrayLen(t10)
    t11 = iz_arrayLen_wrapper(t10);
    // t12 = t9 lt t11
    t12 = (iz_value_t){ .type = IZ_BOOL, .data.boolean = t9.data.number < t11.data.number };
    // if t12 goto while_body1
    if (t12.data.boolean) goto while_body1;
    // goto while_end2
    goto while_end2;
while_body1:
    // t13 = "  ["
    t13 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_6 };
    // t14 = i
    t14 = i;
    // t15 = t13 add t14
    t15 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t13.data.number + t14.data.number };
    // t16 = "] = "
    t16 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_7 };
    // t17 = t15 add t16
    t17 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t15.data.number + t16.data.number };
    // t18 = fruits
    t18 = fruits;
    // t19 = i
    t19 = i;
    // t20 = t18[t19]
    t20 = iz_array_get(t18.data.array, t19.data.number);
    // t21 = t17 add t20
    t21 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t17.data.number + t20.data.number };
    // print t21
    iz_print(t21);
    // t22 = i
    t22 = i;
    // t23 = 1
    t23 = (iz_value_t){ .type = IZ_NUMBER, .data.number = 1 };
    // t24 = t22 add t23
    t24 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t22.data.number + t23.data.number };
    // i = t24
    i = t24;
    // goto while0
    goto while0;
while_end2:
    // t25 = ""
    t25 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_1 };
    // print t25
    iz_print(t25);
    // t26 = "Test 2: join()"
    t26 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_8 };
    // print t26
    iz_print(t26);
    // array literal
    t27 = (iz_value_t){ .type = IZ_ARRAY, .data.array = iz_array_new() };
    // t28 = "Hello"
    t28 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_9 };
    // push t28 to t27
    // t29 = "World"
    t29 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_10 };
    // push t29 to t27
    // t30 = "IOZEN"
    t30 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_11 };
    // push t30 to t27
    // words = t27
    words = t27;
    // t31 = words
    t31 = words;
    // t32 = " "
    t32 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_12 };
    // t33 = join(t31, t32)
    t33 = iz_join_wrapper(t31, t32);
    // sentence = t33
    sentence = t33;
    // t34 = "Joined: "
    t34 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_13 };
    // t35 = sentence
    t35 = sentence;
    // t36 = t34 add t35
    t36 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t34.data.number + t35.data.number };
    // print t36
    iz_print(t36);
    // t37 = ""
    t37 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_1 };
    // print t37
    iz_print(t37);
    // t38 = "Test 3: substring()"
    t38 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_14 };
    // print t38
    iz_print(t38);
    // t39 = "Hello, World!"
    t39 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_15 };
    // str = t39
    str = t39;
    // t40 = "substring(0, 5): "
    t40 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_16 };
    // t41 = str
    t41 = str;
    // t42 = 0
    t42 = (iz_value_t){ .type = IZ_NUMBER, .data.number = 0 };
    // t43 = 5
    t43 = (iz_value_t){ .type = IZ_NUMBER, .data.number = 5 };
    // t44 = substring(t41, t42, t43)
    t44 = iz_substring_wrapper(t41, t42, t43);
    // t45 = t40 add t44
    t45 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t40.data.number + t44.data.number };
    // print t45
    iz_print(t45);
    // t46 = "substring(7): "
    t46 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_17 };
    // t47 = str
    t47 = str;
    // t48 = 7
    t48 = (iz_value_t){ .type = IZ_NUMBER, .data.number = 7 };
    // t49 = substring(t47, t48)
    t49 = iz_substring_wrapper(t47, t48);
    // t50 = t46 add t49
    t50 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t46.data.number + t49.data.number };
    // print t50
    iz_print(t50);
    // t51 = ""
    t51 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_1 };
    // print t51
    iz_print(t51);
    // t52 = "Test 4: indexOf()"
    t52 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_18 };
    // print t52
    iz_print(t52);
    // t53 = "indexOf('World'): "
    t53 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_19 };
    // t54 = str
    t54 = str;
    // t55 = "World"
    t55 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_10 };
    // t56 = indexOf(t54, t55)
    t56 = iz_indexOf_wrapper(t54, t55);
    // t57 = t53 add t56
    t57 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t53.data.number + t56.data.number };
    // print t57
    iz_print(t57);
    // t58 = "indexOf('xyz'): "
    t58 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_20 };
    // t59 = str
    t59 = str;
    // t60 = "xyz"
    t60 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_21 };
    // t61 = indexOf(t59, t60)
    t61 = iz_indexOf_wrapper(t59, t60);
    // t62 = t58 add t61
    t62 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t58.data.number + t61.data.number };
    // print t62
    iz_print(t62);
    // t63 = ""
    t63 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_1 };
    // print t63
    iz_print(t63);
    // t64 = "Test 5: lastIndexOf()"
    t64 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_22 };
    // print t64
    iz_print(t64);
    // t65 = "abc abc abc"
    t65 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_23 };
    // repeatStr = t65
    repeatStr = t65;
    // t66 = "lastIndexOf('abc'): "
    t66 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_24 };
    // t67 = repeatStr
    t67 = repeatStr;
    // t68 = "abc"
    t68 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_25 };
    // t69 = lastIndexOf(t67, t68)
    t69 = iz_lastIndexOf_wrapper(t67, t68);
    // t70 = t66 add t69
    t70 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t66.data.number + t69.data.number };
    // print t70
    iz_print(t70);
    // t71 = ""
    t71 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_1 };
    // print t71
    iz_print(t71);
    // t72 = "=== All String Methods Working! ==="
    t72 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_26 };
    // print t72
    iz_print(t72);
    return;
  }
