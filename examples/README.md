# IOZEN Examples 📚

This directory contains example programs demonstrating IOZEN language features.

## Directory Structure

```
examples/
├── basics/          # Beginner-friendly examples
├── intermediate/    # Intermediate concepts
├── advanced/       # Advanced patterns and techniques
└── README.md       # This file
```

## Running Examples

All examples can be run with the IOZEN CLI:

```bash
# Run interpreted (development)
iozen run examples/basics/01_hello.iozen

# Or compile and run (production)
iozen compile examples/basics/01_hello.iozen --target binary
./01_hello
```

## Examples by Category

### Basics (Beginner)

| File | Topics |
|------|--------|
| `01_hello.iozen` | Hello world, print statement |
| `02_variables.iozen` | Variable declaration, types |
| `03_operators.iozen` | Arithmetic, comparison, logical operators |
| `04_functions.iozen` | Function definition and calls |
| `05_control_flow.iozen` | if/else, while, for loops |
| `06_arrays.iozen` | Array creation, access, iteration |
| `07_structs.iozen` | Custom types, struct definition |

### Intermediate

| File | Topics |
|------|--------|
| `08_modules_main.iozen` | Module usage |
| `08_modules_math.iozen` | Module definition, exports |
| `09_fibonacci.iozen` | Recursion, iteration |
| `10_prime_numbers.iozen` | Algorithms, number theory |
| `11_sorting.iozen` | Bubble sort algorithm |
| `12_searching.iozen` | Linear and binary search |
| `13_calculator.iozen` | Multiple operations, error handling |
| `14_temperature_converter.iozen` | Unit conversion, functions |
| `15_student_database.iozen` | Structs, arrays of structs |

### Advanced

| File | Topics |
|------|--------|
| `16_stack.iozen` | Data structure implementation |
| `17_file_logger.iozen` | File I/O operations |
| `18_guessing_game.iozen` | Game logic, simulation |

## Learning Path

### For Beginners

Start with the basics in order:
1. `01_hello.iozen` - Get something running
2. `02_variables.iozen` - Learn about data
3. `03_operators.iozen` - Do calculations
4. `04_functions.iozen` - Organize code
5. `05_control_flow.iozen` - Make decisions
6. `06_arrays.iozen` - Work with lists
7. `07_structs.iozen` - Create custom types

### For Intermediate Learners

After basics, explore:
1. `08_modules_*.iozen` - Code organization
2. `09_fibonacci.iozen` - Recursion
3. `11_sorting.iozen` - Algorithms
4. `15_student_database.iozen` - Data modeling

### For Advanced Users

Check out:
1. `16_stack.iozen` - Data structures
2. `17_file_logger.iozen` - I/O operations
3. `18_guessing_game.iozen` - Complete program

## Tips

1. **Run examples**: Don't just read, run them!
2. **Modify**: Change values and see what happens
3. **Experiment**: Try combining concepts
4. **Compile**: See the performance difference with `--target binary`

## Contributing

Have a cool example? Add it!

1. Choose appropriate category (basics/intermediate/advanced)
2. Include comments explaining the code
3. Add entry to this README
4. Submit a pull request

## See Also

- [Getting Started Guide](../docs/guide/getting-started.md)
- [Language Guide](../docs/guide/language-guide.md)
- [Examples Gallery](../docs/examples/index.md)
