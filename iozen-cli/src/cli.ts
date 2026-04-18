#!/usr/bin/env node
// ============================================================
// IOZEN Language — CLI (Command Line Interface)
// Usage:
//   iozen run <file.iozen>        — Execute a IOZEN program
//   iozen build <file.iozen>      — Compile to standalone binary
//   iozen init <project>         — Create new IOZEN project
//   iozen version                — Show version info
//   iozen tokens <file.iozen>     — Show token output
//   iozen ast <file.iozen>        — Show AST output
// ============================================================

import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, join, resolve, isAbsolute } from "node:path";
import { Interpreter, Lexer, ParseError, Parser } from "../../src/lib/iozen";
import type { ProgramNode } from "../../src/lib/iozen/ast";

// ---- ANSI Colors (no external dependency) ----
const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  blue: "\x1b[34m",
  gray: "\x1b[90m",
  white: "\x1b[97m",
  bgBlue: "\x1b[44m",
  bgGreen: "\x1b[42m",
};

// ---- Version ----
const VERSION = "1.1.0";

// ---- Main Entry ----
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    printBanner();
    printUsage();
    process.exit(0);
  }

  const command = args[0];

  switch (command) {
    case "run":
      await cmdRun(args.slice(1));
      break;
    case "compile":
      await cmdCompile(args.slice(1));
      break;
    case "build":
      await cmdBuild(args.slice(1));
      break;
    case "init":
      await cmdInit(args.slice(1));
      break;
    case "install":
      await cmdInstall(args.slice(1));
      break;
    case "list":
      await cmdList(args.slice(1));
      break;
    case "version":
    case "-v":
    case "--version":
      cmdVersion();
      break;
    case "tokens":
      await cmdTokens(args.slice(1));
      break;
    case "ast":
      await cmdAst(args.slice(1));
      break;
    case "ssa":
      await cmdSSA(args.slice(1));
      break;
    case "repl":
    case "shell":
      await cmdRepl();
      break;
    case "eval":
      await cmdEval(args.slice(1));
      break;
    case "help":
    case "-h":
    case "--help":
      printUsage();
      break;
    default:
      error(`Unknown command: "${command}"`);
      printUsage();
      process.exit(1);
  }
}

// ---- Commands ----

async function cmdRun(args: string[]) {
  if (args.length === 0) {
    error('Usage: iozen run <file.iozen>');
    process.exit(1);
  }

  // Resolve relative to current working directory (shell CWD)
  const filePath = resolve(process.cwd(), args[0]);

  if (!existsSync(filePath)) {
    error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const source = await readFile(filePath, "utf-8");

  log(`${C.cyan}⚙  Running ${C.white}${basename(filePath)}${C.reset}`);

  try {
    // Week 1: Use v2 pipeline (minimal, fast)
    const { tokenize } = await import('../../src/lib/iozen/tokenizer_v2');
    const { parse } = await import('../../src/lib/iozen/parser_v2');
    const { execute } = await import('../../src/lib/iozen/interpreter_v2');

    const tokens = tokenize(source);
    const ast = parse(tokens);
    execute(ast);

    log(`${C.green}  ✔ Success${C.reset}`);
  } catch (e: any) {
    // Week 8: Better error messages with source context
    const { ParseError } = await import('../../src/lib/iozen/parser_v2');
    const { RuntimeError } = await import('../../src/lib/iozen/interpreter_v2');

    if (e instanceof ParseError) {
      const lines = source.split('\n');
      const lineNum = e.line;
      const colNum = e.column;
      const lineIdx = lineNum - 1;

      error(`Parse error: ${e.message}`);
      if (lineIdx >= 0 && lineIdx < lines.length) {
        const lineContent = lines[lineIdx];
        process.stderr.write(`${C.dim}  --> ${C.cyan}${basename(filePath)}:${lineNum}:${colNum}${C.reset}\n`);
        process.stderr.write(`${C.dim}   |${C.reset}\n`);
        process.stderr.write(`${C.dim}${String(lineNum).padStart(3)}| ${C.white}${lineContent}${C.reset}\n`);
        process.stderr.write(`${C.dim}   | ${C.red}${'~'.repeat(colNum - 1)}^${C.reset}\n`);
      }
    } else if (e.name === 'RuntimeError') {
      error(e.message);
    } else if (e instanceof Error) {
      error(`${e.name}: ${e.message}`);
    } else {
      error(String(e));
    }
    process.exit(1);
  }
}

// Compiler v2.0: Compile IOZEN to C code or binary
async function cmdCompile(args: string[]) {
  if (args.length === 0) {
    error('Usage: iozen compile <file.iozen> [--output <name>] [--target c|binary]');
    process.exit(1);
  }

  // Try multiple locations for the file
  // 1. As-is (absolute or relative to shell CWD)
  // 2. In examples/ directory
  // 3. In project root
  let filePath = args[0];
  const possiblePaths = [
    filePath,                                            // As provided
    resolve(process.cwd(), filePath),                     // Relative to shell CWD
    resolve(process.cwd(), 'examples', filePath),          // In examples/ directory
    resolve(dirname(__dirname), filePath),               // Relative to CLI location
    resolve(dirname(__dirname), '..', 'examples', filePath) // In examples from CLI
  ];

  let foundPath: string | null = null;
  for (const tryPath of possiblePaths) {
    if (existsSync(tryPath)) {
      foundPath = tryPath;
      break;
    }
  }

  if (!foundPath) {
    error(`File not found: ${filePath}`);
    error('Tried locations:');
    possiblePaths.forEach(p => error(`  - ${p}`));
    process.exit(1);
  }

  filePath = foundPath;

  let outputName = basename(filePath, ".iozen");
  let target: 'c' | 'binary' | 'llvm' | 'llvm-bc' = 'c';
  let backend: 'c' | 'llvm' = 'c';

  // Parse optional arguments
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--output' || args[i] === '-o') {
      outputName = args[++i];
    } else if (args[i] === '--target' || args[i] === '-t') {
      const t = args[++i] as string;
      if (t === 'llvm' || t === 'llvm-bc') {
        target = t as 'llvm' | 'llvm-bc';
        backend = 'llvm';
      } else {
        target = t as 'c' | 'binary';
      }
    } else if (args[i] === '--backend' || args[i] === '-b') {
      backend = args[++i] as 'c' | 'llvm';
    }
  }

  const ext = target === 'c' ? 'c' : target === 'llvm' || target === 'llvm-bc' ? 'll' : 'out';
  const outDir = dirname(filePath);
  const outputPath = join(outDir, `${outputName}.${ext}`);

  try {
    const source = readFileSync(filePath, 'utf-8');

    log(`${C.cyan}⚙  Compiling ${C.white}${basename(filePath)}${C.reset}`);

    // Compile using the new compiler
    const { compile } = await import('../../src/lib/iozen/compiler');

    if (target === 'binary') {
      // Full pipeline: IOZEN → C → Binary
      const binPath = isAbsolute(outputName) ? outputName : join(outDir, outputName);
      const result = compile(source, { target: 'binary', outputFile: binPath, backend });

      if (!result.success) {
        for (const err of result.errors) {
          error(err);
        }
        process.exit(1);
      }

      // Also save the C code for debugging
      const cPath = isAbsolute(outputName) ? `${outputName}.c` : join(outDir, `${outputName}.c`);
      if (result.output) {
        writeFileSync(cPath, result.output);
        log(`${C.dim}  💾 C source saved: ${cPath}${C.reset}`);
      }

      log(`${C.green}  ✔ Binary: ${result.binaryPath}${C.reset}`);
    } else if (target === 'llvm' || target === 'llvm-bc') {
      // LLVM backend: IOZEN → LLVM IR
      const result = compile(source, { target, backend, outputFile: outputPath });

      if (!result.success) {
        for (const err of result.errors) {
          error(err);
        }
        process.exit(1);
      }

      writeFileSync(outputPath, result.output || '');
      log(`${C.green}  ✔ Generated LLVM IR: ${outputPath}${C.reset}`);
      
      if (target === 'llvm-bc') {
        log(`${C.yellow}  ℹ To generate bitcode: clang -c ${outputPath} -o ${outputName}.bc${C.reset}`);
      }
    } else {
      // C output only
      const result = compile(source, { target: 'c', backend });

      if (!result.success) {
        for (const err of result.errors) {
          error(err);
        }
        process.exit(1);
      }

      writeFileSync(outputPath, result.output || '');
      log(`${C.green}  ✔ Generated C code: ${outputPath}${C.reset}`);
    }

  } catch (e) {
    error(`Compilation failed: ${e}`);
    process.exit(1);
  }
}

async function cmdBuild(args: string[]) {
  if (args.length === 0) {
    error('Usage: iozen build <file.iozen> [--output <name>]');
    process.exit(1);
  }

  const filePath = resolve(args[0]);
  if (!existsSync(filePath)) {
    error(`File not found: ${filePath}`);
    process.exit(1);
  }

  let outputName = basename(filePath, ".iozen");

  const outputIdx = args.indexOf("--output");
  if (outputIdx !== -1 && args[outputIdx + 1]) {
    outputName = args[outputIdx + 1];
  }

  const source = await readFile(filePath, "utf-8");

  log(`${C.cyan}🔨 Building ${C.white}${basename(filePath)}${C.cyan} → ${C.white}${outputName}${C.reset}`);

  // Step 1: Validate (lex + parse + interpret test)
  const lexer = new Lexer(source);
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  parser.parse();

  log(`${C.gray}  ✓ Lexed ${tokens.length} tokens, parsed AST${C.reset}`);

  // Step 2: Build standalone runner
  const runnerCode = generateStandaloneRunner(source, filePath);
  const runnerPath = join(dirname(filePath), `.iozen-runner-${Date.now()}.ts`);
  await writeFile(runnerPath, runnerCode);

  log(`${C.gray}  ✓ Generated standalone runner${C.reset}`);

  // Step 3: Compile with Bun
  const outputPath = resolve(join(dirname(filePath), outputName));

  try {
    const { execSync } = await import("node:child_process");
    const cmd = `bun build "${runnerPath}" --compile --outfile "${outputPath}"`;

    log(`${C.gray}  ✓ Compiling to binary...${C.reset}`);
    execSync(cmd, { stdio: "inherit", cwd: process.cwd() });

    // Cleanup runner
    const { unlinkSync } = await import("node:fs");
    try { unlinkSync(runnerPath); } catch {}

    log("");
    log(`${C.green}  ✔ Build successful!${C.reset}`);
    log(`${C.white}  Binary: ${outputPath}${C.reset}`);
    log(`${C.dim}  Run with: ./${outputName}${C.reset}`);
  } catch (e) {
    log(`${C.yellow}  ⚠ Bun compile not available in this environment.${C.reset}`);
    log(`${C.dim}  Note: Standalone binary build requires a local Bun installation.${C.reset}`);
    log(`${C.dim}  You can still run with: iozen run ${basename(filePath)}${C.reset}`);
  }
}

async function cmdInit(args: string[]) {
  if (args.length === 0) {
    error('Usage: iozen init <project-name>');
    process.exit(1);
  }

  const projectName = args[0];
  const projectDir = resolve(projectName);

  if (existsSync(projectDir)) {
    error(`Directory already exists: ${projectDir}`);
    process.exit(1);
  }

  await mkdir(projectDir, { recursive: true });

  // Use PackageManager to initialize project with iozen.json
  const { createPackageManager } = await import('../../src/lib/iozen/package_manager');
  const pm = createPackageManager(projectDir);
  const manifest = pm.init(projectName, {
    version: '0.1.0',
    description: `A IOZEN project`,
    license: 'MIT',
    main: 'main.iozen',
  });

  // Overwrite the default index.iozen with our main.iozen template
  const mainCode = `# ${projectName} — IOZEN Project
# Created with IOZEN CLI ${VERSION}

print("Hello, World from ${projectName}!")

create variable version as text with value "${VERSION}"
print("Running on IOZEN version " attach version)

# Try writing your own code below:
create variable x as integer with value 10
create variable y as integer with value 20
print(x attach " + " attach y attach " = " attach x + y)
`;
  await writeFile(join(projectDir, "main.iozen"), mainCode);

  // Remove the default index.iozen if it was created
  try {
    const { unlinkSync } = await import('node:fs');
    unlinkSync(join(projectDir, "index.iozen"));
  } catch { /* ignore */ }

  // Create README
  const readme = `# ${projectName}

${manifest.description}

## Run

\`\`\`bash
iozen run ${manifest.main}
\`\`\`

## Install dependencies

\`\`\`bash
iozen install <package-name>
\`\`\`

## Build (requires local Bun)

\`\`\`bash
iozen build ${manifest.main} --output ${projectName}
./${projectName}
\`\`\`

## Project Structure

- \`${manifest.main}\` - Entry point
- \`iozen.json\` - Project manifest
- \`iozen_modules/\` - Installed packages
`;
  await writeFile(join(projectDir, "README.md"), readme);

  log(`${C.green}  ✔ Project "${projectName}" created!${C.reset}`);
  log(`${C.white}  ${projectDir}/${C.reset}`);
  log(`${C.dim}  └── iozen.json${C.reset}`);
  log(`${C.dim}  └── ${manifest.main}${C.reset}`);
  log(`${C.dim}  └── README.md${C.reset}`);
  log(`${C.dim}  └── iozen_modules/${C.reset}`);
  log("");
  log(`${C.cyan}  Next:${C.reset}`);
  log(`  cd ${projectName}`);
  log(`  iozen run ${manifest.main}`);
}

function cmdVersion() {
  log(`${C.cyan}IOZEN${C.reset} v${VERSION}`);
  log(`${C.dim}Safe, expressive systems programming language${C.reset}`);
  log(`${C.dim}Lexer + Parser + Tree-Walking Interpreter${C.reset}`);
}

async function cmdTokens(args: string[]) {
  if (args.length === 0) {
    error('Usage: iozen tokens <file.iozen>');
    process.exit(1);
  }

  const filePath = resolve(args[0]);
  if (!existsSync(filePath)) {
    error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const source = await readFile(filePath, "utf-8");
  const lexer = new Lexer(source);
  const tokens = lexer.tokenize();

  log(`${C.cyan}Tokens (${tokens.length}):${C.reset}\n`);

  for (const token of tokens) {
    const loc = `${String(token.line).padStart(3)}:${String(token.column).padStart(3)}`;
    const type = token.type.padEnd(18);
    const val = token.value.length > 40 ? token.value.substring(0, 37) + "..." : token.value;
    log(`  ${C.gray}${loc}${C.reset}  ${C.yellow}${type}${C.reset}  ${C.white}${val}${C.reset}`);
  }
}

async function cmdAst(args: string[]) {
  if (args.length === 0) {
    error('Usage: iozen ast <file.iozen>');
    process.exit(1);
  }

  const filePath = resolve(args[0]);
  if (!existsSync(filePath)) {
    error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const source = await readFile(filePath, "utf-8");
  const lexer = new Lexer(source);
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  const ast = parser.parse() as ProgramNode;

  log(`${C.cyan}AST (${ast.statements.length} top-level nodes):${C.reset}\n`);

  for (const stmt of ast.statements) {
    log(`  ${C.green}${stmt.kind}${C.reset}`);
    printASTNode(stmt, 2);
    log("");
  }
}

function printASTNode(node: any, indent: number): void {
  const pad = " ".repeat(indent);
  if (!node || typeof node !== "object") return;

  for (const [key, value] of Object.entries(node)) {
    if (key === "kind") continue;

    if (Array.isArray(value)) {
      log(`${pad}${C.dim}${key}:${C.reset}`);
      for (const item of value) {
        if (item && typeof item === "object" && item.kind) {
          log(`${pad}  ${C.cyan}${item.kind}${C.reset}`);
          printASTNode(item, indent + 4);
        } else {
          log(`${pad}  ${C.white}${JSON.stringify(item)}${C.reset}`);
        }
      }
    } else if (value && typeof value === "object" && value.kind) {
      log(`${pad}${C.dim}${key}:${C.reset} ${C.cyan}${value.kind}${C.reset}`);
      printASTNode(value, indent + 2);
    } else if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      log(`${pad}${C.dim}${key}:${C.reset} ${C.white}${JSON.stringify(value)}${C.reset}`);
    }
  }
}

async function cmdSSA(args: string[]) {
  if (args.length === 0) {
    error('Usage: iozen ssa <file.iozen> [--opt] [--c]');
    process.exit(1);
  }

  const filePath = resolve(args[0]);
  if (!existsSync(filePath)) {
    error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const optimize = args.includes('--opt');
  const genC = args.includes('--c');

  try {
    const source = await readFile(filePath, 'utf-8');

    log(`${C.cyan}=== SSA IR Generation ===${C.reset}\n`);

    // Parse
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    // Convert to SSA
    const ssa = convertASTtoSSA(ast);

    log(`${C.green}Generated SSA for ${ssa.functions.length} functions${C.reset}\n`);

    // Optionally optimize
    if (optimize) {
      log(`${C.yellow}Running SSA optimizations...${C.reset}\n`);
      for (const func of ssa.functions) {
        optimizeSSAFunction(func);
      }
    }

    // Print SSA IR
    log(`${C.cyan}=== SSA IR ===${C.reset}`);
    for (const func of ssa.functions) {
      log('');
      log(SSA.formatFunction(func));
    }

    // Optionally generate C
    if (genC) {
      log('\n');
      log(`${C.cyan}=== Generated C Code ===${C.reset}`);
      log('');
      const cCode = generateCFromSSA(ssa);
      log(cCode);
    }

  } catch (e) {
    if (e instanceof ParseError) {
      error(`Parse error: ${e.message}`);
    } else {
      error(`Error: ${e}`);
    }
    process.exit(1);
  }
}

async function cmdInstall(args: string[]) {
  const { createPackageManager } = await import('../../src/lib/iozen/package_manager');
  const pm = createPackageManager(process.cwd());

  // Check if we're in a project with iozen.json
  if (!pm.hasManifest()) {
    error('No iozen.json found. Run "iozen init <project>" first.');
    process.exit(1);
  }

  if (args.length === 0) {
    // Install all dependencies from iozen.json
    log(`${C.cyan}📦 Installing dependencies from iozen.json...${C.reset}`);
    const installed = pm.installAll();
    if (installed.length === 0) {
      log(`${C.dim}No dependencies to install.${C.reset}`);
    } else {
      log(`${C.green}✓${C.reset} Installed ${installed.length} package(s):`);
      for (const pkg of installed) {
        log(`  ${C.green}•${C.reset} ${pkg.name}@${C.green}${pkg.version}${C.reset}`);
      }
    }
    return;
  }

  // Install specific package
  const packageName = args[0];
  const version = args[1]; // optional version

  log(`${C.cyan}📦 Installing ${C.white}${packageName}${C.cyan}...${C.reset}`);
  const pkg = pm.install(packageName, version);

  if (pkg) {
    log(`${C.green}✓${C.reset} ${pkg.name}@${C.green}${pkg.version}${C.reset}`);
    log(`${C.dim}  Location: ${pkg.path}${C.reset}`);
  } else {
    error(`Failed to install ${packageName}`);
    log(`${C.dim}Note: Package not found in local registry (.iozen_registry/)${C.reset}`);
    process.exit(1);
  }
}

async function cmdList(args: string[]) {
  const { createPackageManager } = await import('../../src/lib/iozen/package_manager');
  const pm = createPackageManager(process.cwd());

  // Show project info if manifest exists
  const manifest = pm.readManifest();
  if (manifest) {
    log(`${C.cyan}📋 Project: ${C.white}${manifest.name}${C.cyan}@${manifest.version}${C.reset}`);
    if (manifest.description) {
      log(`${C.dim}   ${manifest.description}${C.reset}`);
    }
    log('');
  }

  const packages = pm.list();

  if (packages.length === 0) {
    log(`${C.dim}No packages installed in iozen_modules/${C.reset}`);
    if (manifest && manifest.dependencies && Object.keys(manifest.dependencies).length > 0) {
      log(`${C.yellow}⚠ Dependencies in iozen.json but not installed. Run: iozen install${C.reset}`);
    }
    return;
  }

  log(`${C.cyan}📦 Installed packages:${C.reset}`);
  for (const pkg of packages) {
    const isDep = manifest?.dependencies?.[pkg.name];
    const isDevDep = manifest?.devDependencies?.[pkg.name];
    const marker = isDep ? '(dep)' : isDevDep ? '(dev)' : '';
    log(`  ${C.green}•${C.reset} ${pkg.name}@${C.green}${pkg.version}${C.reset} ${C.dim}${marker}${C.reset}`);
  }
}

function generateStandaloneRunner(source: string, filePath: string): string {
  return `#!/usr/bin/env bun
// IOZEN Standalone Runner — Generated by iozen build
// Source: ${basename(filePath)}

${getIOZENRuntimeCode()}

const SOURCE = ${JSON.stringify(source)};
const interpreter = new Interpreter();
const result = interpreter.run(SOURCE);

for (const line of result.output) {
  console.log(line);
}
for (const err of result.errors) {
  console.error("Error: " + err);
  process.exit(1);
}
`;
}

function getIOZENRuntimeCode(): string {
  // Returns the IOZEN runtime as inline code for standalone compilation
  return `
// === IOZEN Runtime (bundled) ===
import { Interpreter } from "../../src/lib/iozen/interpreter";
import { Lexer } from "../../src/lib/iozen/lexer";
import { ParseError, Parser } from "../../src/lib/iozen/parser";
import { createPackageManager, PackageManager } from "../../src/lib/iozen/package_manager";
`;
}

function cmdEval(args: string[]): Promise<void> {
  if (args.length === 0) {
    error('Usage: iozen eval <code>');
    process.exit(1);
  }

  const source = args.join(' ');

  try {
    const interpreter = new Interpreter();
    const result = interpreter.run(source);

    for (const line of result.output) {
      console.log(line);
    }

    for (const err of result.errors) {
      console.error(`${C.red}  ✗ ${err}${C.reset}`);
    }

    if (result.errors.length > 0) {
      process.exit(1);
    }
  } catch (e) {
    if (e instanceof ParseError) {
      error(`Parse error: ${e.message}`);
    } else if (e instanceof Error) {
      error(`${e.name}: ${e.message}`);
    } else {
      error(String(e));
    }
    process.exit(1);
  }
}

async function cmdRepl(): Promise<void> {
  const { createInterface } = await import('node:readline');
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  log('');
  log(`${C.bold}${C.cyan}IOZEN Interactive Shell${C.reset} v${VERSION}`);
  log(`${C.dim}Type IOZEN expressions or statements. Type :quit to exit.${C.reset}`);
  log('');

  let interpreter = new Interpreter();
  let buffer = '';

  const prompt = () => {
    rl.question(`${C.green}iozen>${C.reset} `, (line) => {
      const trimmed = line.trim();

      if (trimmed === '' || trimmed.startsWith('#')) {
        prompt();
        return;
      }

      // REPL commands
      if (trimmed === ':quit' || trimmed === ':q' || trimmed === ':exit') {
        log(`${C.dim}Bye!${C.reset}`);
        rl.close();
        return;
      }
      if (trimmed === ':help') {
        log(`  ${C.dim}:quit  — Exit REPL${C.reset}`);
        log(`  ${C.dim}:help  — Show help${C.reset}`);
        log(`  ${C.dim}:reset — Reset environment${C.reset}`);
        log(`  ${C.dim}:tokens — Show tokens of current buffer${C.reset}`);
        log(`  ${C.dim}:ast    — Show AST of current buffer${C.reset}`);
        prompt();
        return;
      }
      if (trimmed === ':reset') {
        buffer = '';
        interpreter = new Interpreter();
        log(`${C.dim}Environment reset.${C.reset}`);
        prompt();
        return;
      }
      if (trimmed === ':tokens') {
        if (buffer.trim()) {
          const lexer = new Lexer(buffer);
          const tokens = lexer.tokenize();
          for (const t of tokens) {
            log(`  ${C.gray}${String(t.line).padStart(3)}:${String(t.column).padStart(3)}${C.reset}  ${C.yellow}${t.type.padEnd(18)}${C.reset}  ${C.white}${t.value}${C.reset}`);
          }
        }
        prompt();
        return;
      }
      if (trimmed === ':ast') {
        if (buffer.trim()) {
          const lexer = new Lexer(buffer);
          const tokens = lexer.tokenize();
          const parser = new Parser(tokens);
          const ast = parser.parse();
          log(JSON.stringify(ast, null, 2).split('\n').map(l => `  ${C.dim}${l}${C.reset}`).join('\n'));
        }
        prompt();
        return;
      }

      buffer += trimmed + '\n';

      // Try to parse and execute the buffer
      try {
        const lexer = new Lexer(buffer);
        const tokens = lexer.tokenize();
        const parser = new Parser(tokens);
        const ast = parser.parse();
        const result = interpreter.run(buffer);

        if (result.output.length > 0) {
          for (const line of result.output) {
            console.log(`  ${C.white}${line}${C.reset}`);
          }
        }

        if (result.errors.length > 0) {
          // If parse error, might be incomplete input — keep buffering
          const isParseError = result.errors.some(e => e.includes('Parse error'));
          if (isParseError && !buffer.trimEnd().endsWith('end')) {
            // Keep buffering for multi-line input
            rl.question(`${C.green}...>${C.reset} `, (cont) => {
              buffer += cont + '\n';
              prompt();
            });
            return;
          }
          for (const err of result.errors) {
            console.error(`  ${C.red}${err}${C.reset}`);
          }
        }

        // Clear buffer after successful execution
        buffer = '';
      } catch (e) {
        // If parse error on incomplete statement, keep buffering
        if (e instanceof ParseError) {
          // Likely incomplete input, continue buffering
          buffer = buffer.slice(0, -(trimmed.length + 1)); // remove last line
          console.error(`  ${C.yellow}Parse error: ${e.message}${C.reset}`);
          console.error(`  ${C.dim}(keeping previous buffer)${C.reset}`);
        } else {
          console.error(`  ${C.red}${e instanceof Error ? e.message : String(e)}${C.reset}`);
        }
      }

      prompt();
    });
  };

  prompt();
}

// ---- Helpers ----

function printBanner(): void {
  log("");
  log(`${C.bold}${C.cyan}  ╦   ╦ ╔╗╔ ═╗ ╔═╗ ╦ ╦╔═╗╦  ╦╔═╗${C.reset}`);
  log(`${C.bold}${C.cyan}  ║   ║ ║║║  ║ ║ ╦ ║║╣ ║  ║║╣ ${C.reset}`);
  log(`${C.bold}${C.cyan}  ╩═╝╩═╝╝╚╝  ╩ ╚═╝╩╚═╩═╝╩╚═╝${C.reset}`);
  log(`${C.dim}  Safe, expressive systems programming language${C.reset}`);
  log(`${C.dim}  v${VERSION}${C.reset}`);
  log("");
}

function printUsage(): void {
  log(`${C.bold}Usage:${C.reset}`);
  log(`  iozen run <file.iozen>        Execute a IOZEN program`);
  log(`  iozen eval <code>             Execute inline IOZEN code`);
  log(`  iozen build <file.iozen>      Compile to standalone binary`);
  log(`  iozen repl                    Interactive shell (REPL)`);
  log(`  iozen init <project>          Create new IOZEN project`);
  log(`  iozen install [pkg]           Install dependencies or package`);
  log(`  iozen list                    List installed packages`);
  log(`  iozen tokens <file.iozen>     Show token output`);
  log(`  iozen ast <file.iozen>        Show AST output`);
  log(`  iozen version                 Show version info`);
  log(`  iozen help                    Show this help`);
  log("");
  log(`${C.bold}Examples:${C.reset}`);
  log(`  ${C.dim}iozen repl${C.reset}`);
  log(`  ${C.dim}iozen init hello_world${C.reset}`);
  log(`  ${C.dim}cd hello_world${C.reset}`);
  log(`  ${C.dim}iozen install${C.reset}`);
  log(`  ${C.dim}iozen run main.iozen${C.reset}`);
  log("");
  log(`${C.dim}Like Rust's flow:${C.reset}`);
  log(`  ${C.dim}rustup install    → bun add iozen-lang${C.reset}`);
  log(`  ${C.dim}cargo new hello   → iozen init hello${C.reset}`);
  log(`  ${C.dim}cargo build       → iozen build main.iozen${C.reset}`);
  log(`  ${C.dim}./hello           → iozen run main.iozen${C.reset}`);
  log("");
}

function log(msg: string): void {
  process.stdout.write(msg + "\n");
}

function error(msg: string): void {
  process.stderr.write(`${C.red}Error: ${msg}${C.reset}\n`);
}

// ---- Run ----
main().catch((e) => {
  error(`Fatal: ${e instanceof Error ? e.message : String(e)}`);
  process.exit(1);
});
