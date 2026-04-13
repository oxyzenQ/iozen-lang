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
static const char* str_0 = "=== Week 11: File I/O ===";
static const char* str_1 = "/tmp/iozen_test.txt";
static const char* str_2 = "Hello from IOZEN!";
static const char* str_3 = "exists before: ";
static const char* str_4 = "Writing file...";
static const char* str_5 = "writeFile: ";
static const char* str_6 = "exists after: ";
static const char* str_7 = "Reading file...";
static const char* str_8 = "readFile: ";
static const char* str_9 = "SUCCESS: Content matches!";
static const char* str_10 = "FAILED: Content mismatch";
static const char* str_11 = "";
static const char* str_12 = "=== File I/O Working! ===";

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

// Math wrapper functions
iz_value_t iz_sin_wrapper(iz_value_t x) {
  double v = (x.type == IZ_NUMBER) ? x.data.number : 0;
  return (iz_value_t){ .type = IZ_NUMBER, .data.number = sin(v) };
}

iz_value_t iz_cos_wrapper(iz_value_t x) {
  double v = (x.type == IZ_NUMBER) ? x.data.number : 0;
  return (iz_value_t){ .type = IZ_NUMBER, .data.number = cos(v) };
}

iz_value_t iz_sqrt_wrapper(iz_value_t x) {
  double v = (x.type == IZ_NUMBER) ? x.data.number : 0;
  return (iz_value_t){ .type = IZ_NUMBER, .data.number = sqrt(v) };
}

iz_value_t iz_pow_wrapper(iz_value_t base, iz_value_t exp) {
  double b = (base.type == IZ_NUMBER) ? base.data.number : 0;
  double e = (exp.type == IZ_NUMBER) ? exp.data.number : 0;
  return (iz_value_t){ .type = IZ_NUMBER, .data.number = pow(b, e) };
}

iz_value_t iz_abs_wrapper(iz_value_t x) {
  double v = (x.type == IZ_NUMBER) ? x.data.number : 0;
  return (iz_value_t){ .type = IZ_NUMBER, .data.number = fabs(v) };
}

iz_value_t iz_floor_wrapper(iz_value_t x) {
  double v = (x.type == IZ_NUMBER) ? x.data.number : 0;
  return (iz_value_t){ .type = IZ_NUMBER, .data.number = floor(v) };
}

iz_value_t iz_ceil_wrapper(iz_value_t x) {
  double v = (x.type == IZ_NUMBER) ? x.data.number : 0;
  return (iz_value_t){ .type = IZ_NUMBER, .data.number = ceil(v) };
}

iz_value_t iz_get_pi() {
  return (iz_value_t){ .type = IZ_NUMBER, .data.number = M_PI };
}

iz_value_t iz_get_e() {
  return (iz_value_t){ .type = IZ_NUMBER, .data.number = M_E };
}

// File I/O wrappers
iz_value_t iz_readFile_wrapper(iz_value_t path) {
  const char* p = (path.type == IZ_STRING) ? path.data.string : "";
  FILE* f = fopen(p, "r");
  if (!f) return (iz_value_t){ .type = IZ_NULL };
  fseek(f, 0, SEEK_END);
  long len = ftell(f);
  fseek(f, 0, SEEK_SET);
  char* buf = malloc(len + 1);
  fread(buf, 1, len, f);
  buf[len] = 0;
  fclose(f);
  return (iz_value_t){ .type = IZ_STRING, .data.string = buf };
}

iz_value_t iz_writeFile_wrapper(iz_value_t path, iz_value_t content) {
  const char* p = (path.type == IZ_STRING) ? path.data.string : "";
  const char* c = (content.type == IZ_STRING) ? content.data.string : "";
  FILE* f = fopen(p, "w");
  if (!f) return (iz_value_t){ .type = IZ_BOOL, .data.boolean = 0 };
  fputs(c, f);
  fclose(f);
  return (iz_value_t){ .type = IZ_BOOL, .data.boolean = 1 };
}

iz_value_t iz_exists_wrapper(iz_value_t path) {
  const char* p = (path.type == IZ_STRING) ? path.data.string : "";
  struct stat st;
  int result = stat(p, &st) == 0;
  return (iz_value_t){ .type = IZ_BOOL, .data.boolean = result };
}


  void main() {
    iz_value_t t0 = { .type = IZ_NULL };
    iz_value_t t1 = { .type = IZ_NULL };
    iz_value_t testFile = { .type = IZ_NULL };
    iz_value_t t2 = { .type = IZ_NULL };
    iz_value_t content = { .type = IZ_NULL };
    iz_value_t t3 = { .type = IZ_NULL };
    iz_value_t t4 = { .type = IZ_NULL };
    iz_value_t t5 = { .type = IZ_NULL };
    iz_value_t t6 = { .type = IZ_NULL };
    iz_value_t t7 = { .type = IZ_NULL };
    iz_value_t t8 = { .type = IZ_NULL };
    iz_value_t t9 = { .type = IZ_NULL };
    iz_value_t t10 = { .type = IZ_NULL };
    iz_value_t writeOk = { .type = IZ_NULL };
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
    iz_value_t readContent = { .type = IZ_NULL };
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
    iz_value_t t31 = { .type = IZ_NULL };

    // t0 = "=== Week 11: File I/O ==="
    t0 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_0 };
    // print t0
    iz_print(t0);
    // t1 = "/tmp/iozen_test.txt"
    t1 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_1 };
    // testFile = t1
    testFile = t1;
    // t2 = "Hello from IOZEN!"
    t2 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_2 };
    // content = t2
    content = t2;
    // t3 = "exists before: "
    t3 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_3 };
    // t4 = testFile
    t4 = testFile;
    // t5 = exists(t4)
    t5 = iz_exists_wrapper(t4);
    // t6 = t3 add t5
    t6 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t3.data.number + t5.data.number };
    // print t6
    iz_print(t6);
    // t7 = "Writing file..."
    t7 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_4 };
    // print t7
    iz_print(t7);
    // t8 = testFile
    t8 = testFile;
    // t9 = content
    t9 = content;
    // t10 = writeFile(t8, t9)
    t10 = iz_writeFile_wrapper(t8, t9);
    // writeOk = t10
    writeOk = t10;
    // t11 = "writeFile: "
    t11 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_5 };
    // t12 = writeOk
    t12 = writeOk;
    // t13 = t11 add t12
    t13 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t11.data.number + t12.data.number };
    // print t13
    iz_print(t13);
    // t14 = "exists after: "
    t14 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_6 };
    // t15 = testFile
    t15 = testFile;
    // t16 = exists(t15)
    t16 = iz_exists_wrapper(t15);
    // t17 = t14 add t16
    t17 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t14.data.number + t16.data.number };
    // print t17
    iz_print(t17);
    // t18 = "Reading file..."
    t18 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_7 };
    // print t18
    iz_print(t18);
    // t19 = testFile
    t19 = testFile;
    // t20 = readFile(t19)
    t20 = iz_readFile_wrapper(t19);
    // readContent = t20
    readContent = t20;
    // t21 = "readFile: "
    t21 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_8 };
    // t22 = readContent
    t22 = readContent;
    // t23 = t21 add t22
    t23 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t21.data.number + t22.data.number };
    // print t23
    iz_print(t23);
    // t24 = readContent
    t24 = readContent;
    // t25 = content
    t25 = content;
    // t26 = t24 eq t25
    t26 = (iz_value_t){ .type = IZ_BOOL, .data.boolean = t24.data.number == t25.data.number };
    // t27 = !t26
    t27 = (iz_value_t){ .type = IZ_BOOL, .data.boolean = !t26.data.boolean };
    // if !t26 goto else1
    if (t27.data.boolean) goto else1;
then0:
    // t28 = "SUCCESS: Content matches!"
    t28 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_9 };
    // print t28
    iz_print(t28);
    // goto endif2
    goto endif2;
else1:
    // t29 = "FAILED: Content mismatch"
    t29 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_10 };
    // print t29
    iz_print(t29);
endif2:
    // t30 = ""
    t30 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_11 };
    // print t30
    iz_print(t30);
    // t31 = "=== File I/O Working! ==="
    t31 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_12 };
    // print t31
    iz_print(t31);
    return;
  }
