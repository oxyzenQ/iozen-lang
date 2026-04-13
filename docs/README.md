# IOZEN Documentation 📚

Welcome to the IOZEN programming language documentation!

## Quick Links

- **[Getting Started](guide/getting-started.md)** - Install and write your first program
- **[Language Guide](guide/language-guide.md)** - Complete language tutorial
- **[Syntax Reference](reference/syntax.md)** - Full syntax documentation
- **[Standard Library](stdlib/index.md)** - Built-in functions and modules
- **[CLI Reference](cli/index.md)** - Command-line tools
- **[Examples](examples/index.md)** - Sample programs

## What is IOZEN?

IOZEN is a safe, expressive systems programming language with natural English-like syntax. It compiles to native binaries for maximum performance.

```iozen
# Hello world in IOZEN
print "Hello, World!"

# Variables
create variable message as text with value "Welcome to IOZEN"
print message

# Functions
function greet takes name as text returns nothing
    print "Hello, " attach name attach "!"
end

greet "Developer"
```

## Key Features

- 🚀 **Native Performance** - Compiles to native binaries via C backend
- 🛡️ **Memory Safe** - Ownership system prevents memory errors
- 📝 **Readable Syntax** - Natural English-like code
- 📦 **Package Manager** - Built-in dependency management
- 🔄 **Modern Features** - First-class functions, modules, closures

## Installation

```bash
# Using Bun (recommended)
bun add -g iozen-lang

# Or clone and run
git clone https://github.com/oxyzenQ/iozen-lang.git
cd iozen-lang
bun iozen-cli/src/cli.ts --help
```

## Quick Start

```bash
# Create new project
iozen init my_project
cd my_project

# Run the program
iozen run main.iozen

# Compile to native binary
iozen compile main.iozen --target binary
./main
```

## Documentation Structure

```
docs/
├── guide/           # Tutorials and guides
│   ├── getting-started.md
│   └── language-guide.md
├── reference/       # Reference documentation
│   └── syntax.md
├── stdlib/          # Standard library docs
│   └── index.md
├── cli/             # CLI documentation
│   └── index.md
└── examples/        # Example programs
    └── index.md
```

## Version

This documentation is for **IOZEN v1.0** (released June 2026).

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for how to contribute to IOZEN.

## License

IOZEN is released under the MIT License.
