# IOZEN CLI Reference 🛠️

Complete guide to the IOZEN command-line interface.

## Installation

### Global Install

```bash
bun add -g iozen-lang
```

### Local Development

```bash
git clone https://github.com/oxyzenQ/iozen-lang.git
cd iozen-lang
bun iozen-cli/src/cli.ts --help
```

---

## Commands Overview

```
iozen <command> [options]
```

| Command | Description |
|---------|-------------|
| `run` | Execute IOZEN program |
| `compile` | Compile to C code or binary |
| `build` | Build standalone executable |
| `init` | Create new project |
| `install` | Install dependencies |
| `list` | List installed packages |
| `repl` | Interactive shell |
| `eval` | Execute code directly |
| `tokens` | Show token output |
| `ast` | Show AST output |
| `version` | Show version info |
| `help` | Show help message |

---

## Command Details

### `iozen run`

Execute an IOZEN program.

```bash
iozen run <file.iozen>
```

**Examples:**
```bash
# Run a program
iozen run main.iozen

# Run with relative path
iozen run ./examples/hello.iozen

# Run with absolute path
iozen run /home/user/projects/test/main.iozen
```

**Output:**
```
⚙  Running main.iozen
  ✔ Success
```

**Error Handling:**
- Shows parse errors with line numbers and context
- Shows runtime errors with clear messages

---

### `iozen compile`

Compile IOZEN to C code or native binary.

```bash
iozen compile <file.iozen> [options]
```

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `--target <type>` | Output type: `c` or `binary` | `c` |
| `--output <name>` | Output filename | Same as input |
| `-o <name>` | Shorthand for `--output` | - |
| `-t <type>` | Shorthand for `--target` | - |

**Examples:**

```bash
# Compile to C code
iozen compile main.iozen
# Creates: main.c

# Compile to C with custom name
iozen compile main.iozen --output myprogram --target c
# Creates: myprogram.c

# Compile to binary
iozen compile main.iozen --target binary
# Creates: main.out (after compiling C with GCC)

# Compile to binary with custom name
iozen compile main.iozen --target binary --output myapp
# Creates: myapp
```

**Requirements for Binary:**
- GCC or Clang installed
- `gcc --version` or `clang --version` should work

**Performance:**
- Compiled binaries are **100x faster** than interpreted code
- Recommended for production use

---

### `iozen build`

Build standalone executable with bundled runtime.

```bash
iozen build <file.iozen> [options]
```

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `--output <name>` | Output executable name | Same as input |

**Examples:**
```bash
# Build executable
iozen build main.iozen --output myprogram

# Run the executable
./myprogram
```

**Note:** Requires local Bun installation.

---

### `iozen init`

Create a new IOZEN project.

```bash
iozen init <project-name>
```

**Creates:**
```
project-name/
├── iozen.json          # Project manifest
├── main.iozen          # Entry point
├── README.md           # Project documentation
└── iozen_modules/      # Dependencies directory
```

**Example:**
```bash
iozen init my_project
cd my_project
iozen run main.iozen
```

**iozen.json:**
```json
{
  "name": "my_project",
  "version": "0.1.0",
  "description": "A IOZEN project",
  "license": "MIT",
  "main": "main.iozen",
  "dependencies": {},
  "devDependencies": {},
  "scripts": {
    "run": "iozen run main.iozen",
    "test": "iozen test",
    "build": "iozen build"
  }
}
```

---

### `iozen install`

Install dependencies.

```bash
# Install all dependencies from iozen.json
iozen install

# Install specific package
iozen install <package-name>

# Install specific version
iozen install <package-name> <version>
```

**Examples:**
```bash
# Install all dependencies
cd my_project
iozen install

# Install a package
iozen install math-lib

# Install specific version
iozen install math-lib 1.2.0
```

**Package Registry:**
- Local registry: `.iozen_registry/` directory
- Searches for packages in project root

**Version Constraints:**
```bash
iozen install pkg 1.0.0      # Exact version
iozen install pkg ^1.0.0     # Compatible with 1.x.x
iozen install pkg ~1.0.0    # Compatible with 1.0.x
```

---

### `iozen list`

List installed packages.

```bash
iozen list
```

**Output:**
```
📋 Project: my_project@0.1.0
   A IOZEN project

📦 Installed packages:
  • math-lib@1.0.0 (dep)
  • string-utils@2.1.0 (dev)
```

**Shows:**
- Project name and version
- Project description
- All installed packages
- Version numbers
- Dependency type (dep/dev)

---

### `iozen repl`

Start interactive shell (Read-Eval-Print Loop).

```bash
iozen repl
```

**Commands:**
| Command | Description |
|---------|-------------|
| `:quit`, `:q` | Exit REPL |
| `:help` | Show help |
| `:reset` | Reset environment |
| `:tokens` | Show tokens of current buffer |
| `:ast` | Show AST of current buffer |

**Examples:**
```bash
$ iozen repl

IOZEN Interactive Shell v1.0.0
Type IOZEN expressions or statements. Type :quit to exit.

iozen> print "Hello"
Hello
iozen> create variable x as integer with value 10
iozen> print x
10
iozen> function square takes n as integer returns integer
...>     return n * n
...> end
iozen> print square 5
25
iozen> :quit
Bye!
```

---

### `iozen eval`

Execute IOZEN code directly.

```bash
iozen eval "<code>"
```

**Examples:**
```bash
# Simple expression
iozen eval 'print "Hello"'

# Multiple statements
iozen eval 'create variable x as integer with value 5; print x * 2'

# Function
iozen eval 'function add takes a as integer, b as integer returns integer; return a + b; end; print add 3 4'
```

**Use Cases:**
- Quick testing
- One-liners
- Scripting

---

### `iozen tokens`

Show lexical token output (for debugging).

```bash
iozen tokens <file.iozen>
```

**Output:**
```
Tokens (24):
    1:1  KEYWORD             create
    1:8  IDENTIFIER          variable
   ...
```

**Use Case:** Debugging lexer/tokenizer issues.

---

### `iozen ast`

Show Abstract Syntax Tree output (for debugging).

```bash
iozen ast <file.iozen>
```

**Output:**
```
AST (5 top-level nodes):
  VariableDeclaration
    name: "x"
    type: "integer"
    value: IntegerLiteral(10)
  ...
```

**Use Case:** Understanding how code is parsed.

---

### `iozen version`

Show version information.

```bash
iozen version
# or
iozen --version
# or
iozen -v
```

**Output:**
```
IOZEN v1.0.0
Safe, expressive systems programming language
Lexer + Parser + Tree-Walking Interpreter
```

---

### `iozen help`

Show help message.

```bash
iozen help
# or
iozen --help
# or
iozen -h
```

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CC` | C compiler to use | `gcc` |
| `IOZEN_PATH` | Additional module search paths | - |

**Examples:**
```bash
# Use Clang instead of GCC
export CC=clang
iozen compile main.iozen --target binary

# Add custom module path
export IOZEN_PATH=/path/to/custom/modules
```

---

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |
| 2 | Parse error |
| 3 | Runtime error |
| 127 | Command not found |

---

## Typical Workflows

### Development Workflow

```bash
# 1. Create project
iozen init my_app
cd my_app

# 2. Edit code
# ... edit main.iozen ...

# 3. Run (interpreted - fast feedback)
iozen run main.iozen

# 4. Test
iozen eval 'testFunction'

# 5. Install dependencies
iozen install some-lib

# 6. Compile for production
iozen compile main.iozen --target binary --output my_app
./my_app
```

### Library Development

```bash
# 1. Create library project
iozen init my_lib

# 2. Export functions in index.iozen
export function useful takes x as integer returns integer
    return x * 2
end

# 3. Install in another project
cd other_project
iozen install my_lib
```

### Debugging Workflow

```bash
# Check tokens
iozen tokens buggy.iozen

# Check AST
iozen ast buggy.iozen

# Interactive testing
iozen repl
```

---

## Troubleshooting

### "iozen: command not found"

```bash
# Add Bun global bin to PATH
export PATH="$HOME/.bun/bin:$PATH"

# Or use npx
npx iozen-lang run main.iozen
```

### "File not found"

```bash
# Use absolute path
iozen run /full/path/to/file.iozen

# Or check current directory
pwd
ls -la
```

### Compilation Errors

```bash
# Check GCC installation
gcc --version

# Or install GCC
# Ubuntu: sudo apt-get install gcc
# macOS: xcode-select --install
```

### Permission Denied

```bash
chmod +x ./compiled_binary
./compiled_binary
```

---

## Quick Reference Card

```bash
# Project setup
iozen init my_project

# Development
iozen run main.iozen           # Run interpreted
iozen repl                     # Interactive

# Production
iozen compile main.iozen --target binary --output app
./app

# Dependencies
iozen install                  # Install all from iozen.json
iozen install package_name     # Install specific package
iozen list                     # List installed

# Debugging
iozen tokens main.iozen        # Show tokens
iozen ast main.iozen           # Show AST
iozen eval "print 42"          # Quick test

# Info
iozen version                  # Show version
iozen help                     # Show help
```

---

See also:
- [Getting Started](../guide/getting-started.md) - Tutorial
- [Language Guide](../guide/language-guide.md) - Language details
- [Standard Library](../stdlib/index.md) - Built-in functions
