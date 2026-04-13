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
static const char* str_0 = "brightCyan";
static const char* str_1 = "cyan";
static const char* str_2 = "white";
static const char* str_3 = "";
static const char* str_4 = "  ╭─────────────── System Information ───────────────╮";
static const char* str_5 = "  │                                                  │";
static const char* str_6 = "  │  OS:       ";
static const char* str_7 = "  │  Host:     ";
static const char* str_8 = "  │  User:     ";
static const char* str_9 = "  │  Shell:    ";
static const char* str_10 = "  │  CPU:      ";
static const char* str_11 = "  │  RAM:      ";
static const char* str_12 = "  │  Disk:     ";
static const char* str_13 = "  │  Display:  ";
static const char* str_14 = "  │  Uptime:   ";
static const char* str_15 = "  ╰──────────────────────────────────────────────────╯";

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
    iz_value_t title_color = { .type = IZ_NULL };
    iz_value_t t1 = { .type = IZ_NULL };
    iz_value_t label_color = { .type = IZ_NULL };
    iz_value_t t2 = { .type = IZ_NULL };
    iz_value_t value_color = { .type = IZ_NULL };
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
    iz_value_t t24 = { .type = IZ_NULL };
    iz_value_t t25 = { .type = IZ_NULL };
    iz_value_t t26 = { .type = IZ_NULL };
    iz_value_t t27 = { .type = IZ_NULL };
    iz_value_t t28 = { .type = IZ_NULL };
    iz_value_t t29 = { .type = IZ_NULL };
    iz_value_t t30 = { .type = IZ_NULL };
    iz_value_t t31 = { .type = IZ_NULL };
    iz_value_t t32 = { .type = IZ_NULL };
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
    iz_value_t t66 = { .type = IZ_NULL };
    iz_value_t t67 = { .type = IZ_NULL };
    iz_value_t t68 = { .type = IZ_NULL };
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

    // t0 = "brightCyan"
    t0 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_0 };
    // title_color = t0
    title_color = t0;
    // t1 = "cyan"
    t1 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_1 };
    // label_color = t1
    label_color = t1;
    // t2 = "white"
    t2 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_2 };
    // value_color = t2
    value_color = t2;
    // t3 = ""
    t3 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_3 };
    // print t3
    iz_print(t3);
    // t4 = title_color
    t4 = title_color;
    // t5 = "  ╭─────────────── System Information ───────────────╮"
    t5 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_4 };
    // t6 = color(t4, t5)
    t6 = color(t4, t5);
    // print t6
    iz_print(t6);
    // t7 = label_color
    t7 = label_color;
    // t8 = "  │                                                  │"
    t8 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_5 };
    // t9 = color(t7, t8)
    t9 = color(t7, t8);
    // print t9
    iz_print(t9);
    // t10 = label_color
    t10 = label_color;
    // t11 = "  │  OS:       "
    t11 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_6 };
    // t12 = color(t10, t11)
    t12 = color(t10, t11);
    // t13 = value_color
    t13 = value_color;
    // t14 = get_os()
    t14 = get_os();
    // t15 = color(t13, t14)
    t15 = color(t13, t14);
    // t16 = t12 add t15
    t16 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t12.data.number + t15.data.number };
    // print t16
    iz_print(t16);
    // t17 = label_color
    t17 = label_color;
    // t18 = "  │  Host:     "
    t18 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_7 };
    // t19 = color(t17, t18)
    t19 = color(t17, t18);
    // t20 = value_color
    t20 = value_color;
    // t21 = get_hostname()
    t21 = get_hostname();
    // t22 = color(t20, t21)
    t22 = color(t20, t21);
    // t23 = t19 add t22
    t23 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t19.data.number + t22.data.number };
    // print t23
    iz_print(t23);
    // t24 = label_color
    t24 = label_color;
    // t25 = "  │  User:     "
    t25 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_8 };
    // t26 = color(t24, t25)
    t26 = color(t24, t25);
    // t27 = value_color
    t27 = value_color;
    // t28 = get_user()
    t28 = get_user();
    // t29 = color(t27, t28)
    t29 = color(t27, t28);
    // t30 = t26 add t29
    t30 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t26.data.number + t29.data.number };
    // print t30
    iz_print(t30);
    // t31 = label_color
    t31 = label_color;
    // t32 = "  │  Shell:    "
    t32 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_9 };
    // t33 = color(t31, t32)
    t33 = color(t31, t32);
    // t34 = value_color
    t34 = value_color;
    // t35 = get_shell()
    t35 = get_shell();
    // t36 = color(t34, t35)
    t36 = color(t34, t35);
    // t37 = t33 add t36
    t37 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t33.data.number + t36.data.number };
    // print t37
    iz_print(t37);
    // t38 = label_color
    t38 = label_color;
    // t39 = "  │  CPU:      "
    t39 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_10 };
    // t40 = color(t38, t39)
    t40 = color(t38, t39);
    // t41 = value_color
    t41 = value_color;
    // t42 = get_cpu()
    t42 = get_cpu();
    // t43 = color(t41, t42)
    t43 = color(t41, t42);
    // t44 = t40 add t43
    t44 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t40.data.number + t43.data.number };
    // print t44
    iz_print(t44);
    // t45 = label_color
    t45 = label_color;
    // t46 = "  │  RAM:      "
    t46 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_11 };
    // t47 = color(t45, t46)
    t47 = color(t45, t46);
    // t48 = value_color
    t48 = value_color;
    // t49 = get_ram()
    t49 = get_ram();
    // t50 = color(t48, t49)
    t50 = color(t48, t49);
    // t51 = t47 add t50
    t51 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t47.data.number + t50.data.number };
    // print t51
    iz_print(t51);
    // t52 = label_color
    t52 = label_color;
    // t53 = "  │  Disk:     "
    t53 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_12 };
    // t54 = color(t52, t53)
    t54 = color(t52, t53);
    // t55 = value_color
    t55 = value_color;
    // t56 = get_disk()
    t56 = get_disk();
    // t57 = color(t55, t56)
    t57 = color(t55, t56);
    // t58 = t54 add t57
    t58 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t54.data.number + t57.data.number };
    // print t58
    iz_print(t58);
    // t59 = label_color
    t59 = label_color;
    // t60 = "  │  Display:  "
    t60 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_13 };
    // t61 = color(t59, t60)
    t61 = color(t59, t60);
    // t62 = value_color
    t62 = value_color;
    // t63 = get_resolution()
    t63 = get_resolution();
    // t64 = color(t62, t63)
    t64 = color(t62, t63);
    // t65 = t61 add t64
    t65 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t61.data.number + t64.data.number };
    // print t65
    iz_print(t65);
    // t66 = label_color
    t66 = label_color;
    // t67 = "  │  Uptime:   "
    t67 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_14 };
    // t68 = color(t66, t67)
    t68 = color(t66, t67);
    // t69 = value_color
    t69 = value_color;
    // t70 = get_uptime()
    t70 = get_uptime();
    // t71 = color(t69, t70)
    t71 = color(t69, t70);
    // t72 = t68 add t71
    t72 = (iz_value_t){ .type = IZ_NUMBER, .data.number = t68.data.number + t71.data.number };
    // print t72
    iz_print(t72);
    // t73 = label_color
    t73 = label_color;
    // t74 = "  │                                                  │"
    t74 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_5 };
    // t75 = color(t73, t74)
    t75 = color(t73, t74);
    // print t75
    iz_print(t75);
    // t76 = title_color
    t76 = title_color;
    // t77 = "  ╰──────────────────────────────────────────────────╯"
    t77 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_15 };
    // t78 = color(t76, t77)
    t78 = color(t76, t77);
    // print t78
    iz_print(t78);
    // t79 = ""
    t79 = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)str_3 };
    // print t79
    iz_print(t79);
    return;
  }
