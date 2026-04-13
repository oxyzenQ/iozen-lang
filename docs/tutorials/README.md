# IOZEN Tutorials 🎓

Step-by-step tutorials to learn IOZEN from scratch.

## Getting Started

New to IOZEN? Start here!

### Prerequisites

- IOZEN installed (`bun add -g iozen-lang`)
- Basic programming knowledge (helpful but not required)
- Text editor

### Tutorial Series

| # | Tutorial | Topics | Time |
|---|----------|--------|------|
| 1 | [Your First Program](01-first-program.md) | Installation, project creation, basic syntax | 15 min |
| 2 | [Variables and Types](02-variables-and-types.md) | Integer, decimal, text, boolean, arrays | 20 min |
| 3 | [Control Flow](03-control-flow.md) | If/else, while loops, for loops, break/continue | 25 min |
| 4 | [Functions](04-functions.md) | Defining functions, parameters, return values | 20 min |
| 5 | [Arrays and Structs](05-arrays-and-structs.md) | Collections, custom types | 25 min |

**Total learning time: ~1 hour 45 minutes**

## Learning Path

### 🔰 Beginner Path

Start with tutorials 1-3 to get comfortable with the basics:

1. **Tutorial 1** → Make your first program run
2. **Tutorial 2** → Store and manipulate data
3. **Tutorial 3** → Make decisions and repeat actions

After these, you'll be able to write simple programs!

### 🚀 Intermediate Path

Continue with tutorials 4-5:

4. **Tutorial 4** → Organize code with functions
5. **Tutorial 5** → Work with complex data

Then try the [examples](../../examples/README.md)!

### 🏆 Advanced Topics

After completing tutorials:
- [Modules](../guide/language-guide.md#modules) - Code organization
- [File I/O](../guide/language-guide.md#file-io) - Reading and writing files
- [Standard Library](../stdlib/index.md) - Built-in functions
- [Advanced Examples](../../examples/advanced/) - Complex programs

## How to Use These Tutorials

### Step-by-Step Approach

1. **Read the tutorial** - Understand the concepts
2. **Type the code** - Don't copy-paste, type it out
3. **Run it** - See it work
4. **Experiment** - Change things and observe
5. **Do the exercises** - Practice makes perfect

### Tips for Success

✅ **DO:**
- Complete each tutorial before moving to the next
- Run every code example
- Experiment with modifications
- Do all exercises
- Take breaks when needed

❌ **DON'T:**
- Skip tutorials (they build on each other)
- Just read without running code
- Rush through without understanding
- Skip the exercises

## Troubleshooting

### "iozen: command not found"

```bash
# Make sure IOZEN is installed
bun add -g iozen-lang

# Or use from project directory
bun iozen-cli/src/cli.ts run file.iozen
```

### "Error: File not found"

```bash
# Check your current directory
pwd

# List files to verify
cd your_project
ls
```

### Syntax Errors

```bash
# Check line numbers in error messages
iozen run file.iozen

# Use tokens/ast to debug
iozen tokens file.iozen
iozen ast file.iozen
```

## Practice Projects

After completing tutorials, try these:

### 🥉 Bronze (Easy)
- Temperature converter
- Simple calculator
- Todo list (print only)

### 🥈 Silver (Medium)
- Number guessing game
- Grade calculator
- Shopping cart

### 🥇 Gold (Hard)
- Student database
- File processor
- Text adventure game

## Getting Help

- 📖 [Language Guide](../guide/language-guide.md) - Complete reference
- 📚 [Syntax Reference](../reference/syntax.md) - Full syntax
- 🎯 [Examples](../../examples/README.md) - Sample code
- 🐛 [GitHub Issues](https://github.com/oxyzenQ/iozen-lang/issues)

## Next Steps

After completing all tutorials:

1. **Build a project** - Apply what you learned
2. **Read the language guide** - Deep dive into features
3. **Explore examples** - See real-world code
4. **Contribute** - Help improve IOZEN!

---

**Ready to start?** → [Tutorial 1: Your First Program](01-first-program.md)

Happy learning! 🎉
