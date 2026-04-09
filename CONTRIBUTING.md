# Contributing to IOZEN

Thank you for your interest in contributing to IOZEN! This guide will help you get set up and show you how to submit contributions.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
- [Testing](#testing)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [Reporting Bugs](#reporting-bugs)
- [Requesting Features](#requesting-features)

## Code of Conduct

Be respectful, constructive, and inclusive. Treat other contributors as you would want to be treated. We welcome contributors of all experience levels and backgrounds.

## Getting Started

### Prerequisites

- **Node.js** v18 or later
- **npm** v9 or later (or **bun** as an alternative package manager)
- **Git**

### Fork and Clone

1. Fork the [IOZEN repository](https://github.com/iozen-lang/iozen) on GitHub
2. Clone your fork locally:

```bash
git clone https://github.com/<your-username>/iozen.git
cd iozen
```

3. Add the upstream remote:

```bash
git remote add upstream https://github.com/iozen-lang/iozen.git
```

## Development Setup

1. **Install dependencies:**

```bash
npm install
```

2. **Build the project:**

```bash
npm run build
```

3. **Verify the CLI works:**

```bash
npx iozen version
```

4. **Try running an example:**

```bash
npx iozen run iozen-cli/examples/hello.iozen
```

## Project Structure

```
iozen/
├── src/lib/iozen/       # Core language implementation (TypeScript bootstrap)
│   ├── tokens.ts       # Token definitions and types
│   ├── lexer.ts        # Lexical analysis / tokenizer
│   ├── ast.ts          # Abstract Syntax Tree node definitions
│   ├── parser.ts       # Syntax analysis / parser
│   ├── interpreter.ts  # Tree-walk interpreter / evaluator
│   └── environment.ts  # Runtime scope and environment
├── iozen-cli/           # CLI tool and examples
│   └── src/cli.ts      # CLI entry point (run, build, init, tokens, ast, version)
├── bootstrap/          # Self-hosting IOZEN source code
│   └── lexer.iozen      # IOZEN self-hosting lexer (Phase 1)
└── examples/           # Web/other integration examples
```

### Key Areas

- **Language Core** (`src/lib/iozen/`): Lexer, parser, AST, interpreter, and environment
- **CLI** (`iozen-cli/src/`): Command-line interface with `run`, `build`, `init`, `tokens`, `ast`, and `version` commands
- **Bootstrap** (`bootstrap/`): The IOZEN self-hosting lexer written in IOZEN itself
- **Examples** (`iozen-cli/examples/`): Example IOZEN programs

## Development Workflow

1. **Create a branch** for your changes:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

2. **Make your changes** following the code style guidelines below.

3. **Test your changes** thoroughly (see [Testing](#testing)).

4. **Commit** with clear, descriptive messages:

```bash
git commit -m "feat(lexer): add support for multiline strings"
```

We follow [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | Usage |
|--------|-------|
| `feat:` | New features |
| `fix:` | Bug fixes |
| `docs:` | Documentation changes |
| `refactor:` | Code refactoring |
| `test:` | Adding or updating tests |
| `chore:` | Build process or tooling changes |

5. **Push** and open a pull request:

```bash
git push origin feature/your-feature-name
```

## Code Style

### TypeScript

- Use **TypeScript** with strict mode enabled
- Follow the existing code patterns in the codebase
- Use meaningful variable and function names
- Add JSDoc comments for public APIs and complex logic
- Keep functions focused and reasonably sized

### IOZEN (self-hosted code)

- Use natural language keywords consistently
- Follow the syntax conventions established in `bootstrap/lexer.iozen`
- Keep the code readable and self-documenting

## Testing

### Manual Testing

Run IOZEN programs to verify behavior:

```bash
# Run a specific example
npx iozen run iozen-cli/examples/hello.iozen

# Inspect tokens
npx iozen tokens iozen-cli/examples/fibonacci.iozen

# Inspect the AST
npx iozen ast iozen-cli/examples/fizzbuzz.iozen
```

### Testing Checklists

Before submitting a PR, verify:

- [ ] `npm run build` completes without errors
- [ ] All existing examples still run correctly
- [ ] `iozen tokens` output is correct for test programs
- [ ] `iozen ast` output is correct for test programs
- [ ] New features have corresponding example programs

## Submitting a Pull Request

1. Ensure your branch is up to date with `main`:

```bash
git fetch upstream
git rebase upstream/main
```

2. Open a pull request against the `main` branch
3. Fill out the PR template completely
4. Include a clear description of the changes and why they were made
5. Reference any related issues with `Closes #<number>`

## Reporting Bugs

If you find a bug, please open an issue using the [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.md) and include:

- A minimal IOZEN program that reproduces the issue
- The full error output or unexpected behavior
- Your environment details (OS, Node.js version, IOZEN version)

## Requesting Features

We welcome feature ideas! Please open an issue using the [Feature Request template](.github/ISSUE_TEMPLATE/feature_request.md) and include:

- A clear description of the proposed feature
- The motivation and use case
- Example IOZEN syntax if applicable

## Questions?

Feel free to open an issue with the `question` label, and we'll do our best to help. Thank you for contributing to IOZEN! 🚀
