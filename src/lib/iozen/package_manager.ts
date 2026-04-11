// ============================================================
// IOZEN Language — Package Manager
// Minimal npm/cargo-style package system
// ============================================================

import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';

/**
 * Phase 20: Package System
 * 
 * Design:
 * - iozen.json: package manifest (like package.json, Cargo.toml)
 * - iozen_modules/: local package directory (like node_modules/)
 * - Simple registry: local file-based (remote can be added later)
 * 
 * Commands:
 * - iozen init <name>     : create new project
 * - iozen install <pkg>   : install package
 * - iozen list            : list installed packages
 */

export interface IOZENManifest {
  name: string;
  version: string;
  description?: string;
  author?: string;
  license?: string;
  main?: string;                    // entry point (default: index.iozen)
  dependencies?: Record<string, string>;  // name -> version constraint
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>; // build, test, run, etc.
}

export interface InstalledPackage {
  name: string;
  version: string;
  path: string;
  manifest: IOZENManifest;
}

export class PackageManager {
  private projectRoot: string;
  private modulesDir: string;
  private manifestPath: string;

  constructor(projectRoot: string = '.') {
    this.projectRoot = resolve(projectRoot);
    this.modulesDir = join(this.projectRoot, 'iozen_modules');
    this.manifestPath = join(this.projectRoot, 'iozen.json');
  }

  // ===== Phase 20.1: Project Initialization =====

  init(projectName: string, options: Partial<IOZENManifest> = {}): IOZENManifest {
    const manifest: IOZENManifest = {
      name: projectName,
      version: options.version || '0.1.0',
      description: options.description || `A IOZEN project`,
      author: options.author,
      license: options.license || 'MIT',
      main: options.main || 'index.iozen',
      dependencies: {},
      devDependencies: {},
      scripts: {
        run: `iozen run ${options.main || 'index.iozen'}`,
        test: 'iozen test',
        build: 'iozen build',
      },
    };

    // Create iozen.json
    writeFileSync(this.manifestPath, JSON.stringify(manifest, null, 2));

    // Create iozen_modules directory
    if (!existsSync(this.modulesDir)) {
      mkdirSync(this.modulesDir, { recursive: true });
    }

    // Create main entry file
    const mainFile = join(this.projectRoot, manifest.main!);
    if (!existsSync(mainFile)) {
      const initialCode = `# ${manifest.name}
# ${manifest.description}

function main returns integer
    print "Hello from ${manifest.name}!"
    return 0
end

main()`;
      writeFileSync(mainFile, initialCode);
    }

    // Create .gitignore
    const gitignorePath = join(this.projectRoot, '.gitignore');
    if (!existsSync(gitignorePath)) {
      writeFileSync(gitignorePath, 'iozen_modules/\n*.iozenc\n');
    }

    return manifest;
  }

  // ===== Phase 20.2: Package Installation =====

  install(packageName: string, version?: string): InstalledPackage | null {
    // Check if already installed
    const existing = this.getInstalledPackage(packageName);
    if (existing) {
      console.log(`Package '${packageName}' is already installed (v${existing.version})`);
      return existing;
    }

    // Try to find package (local registry for now)
    const packageInfo = this.findPackage(packageName, version);
    if (!packageInfo) {
      console.error(`Package '${packageName}' not found`);
      return null;
    }

    // Install to iozen_modules/
    const installPath = join(this.modulesDir, packageName);
    this.installPackageFiles(packageInfo, installPath);

    // Update manifest
    const manifest = this.readManifest();
    if (manifest) {
      manifest.dependencies = manifest.dependencies || {};
      manifest.dependencies[packageName] = packageInfo.version;
      this.writeManifest(manifest);
    }

    console.log(`Installed '${packageName}@${packageInfo.version}'`);

    return {
      name: packageName,
      version: packageInfo.version,
      path: installPath,
      manifest: packageInfo.manifest,
    };
  }

  installAll(): InstalledPackage[] {
    const manifest = this.readManifest();
    if (!manifest || !manifest.dependencies) {
      return [];
    }

    const installed: InstalledPackage[] = [];
    for (const [name, version] of Object.entries(manifest.dependencies)) {
      const pkg = this.install(name, version);
      if (pkg) {
        installed.push(pkg);
      }
    }

    return installed;
  }

  // ===== Phase 20.3: List Packages =====

  list(): InstalledPackage[] {
    if (!existsSync(this.modulesDir)) {
      return [];
    }

    const packages: InstalledPackage[] = [];
    
    for (const entry of readdirSync(this.modulesDir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        const pkg = this.getInstalledPackage(entry.name);
        if (pkg) {
          packages.push(pkg);
        }
      }
    }

    return packages;
  }

  // ===== Helpers =====

  readManifest(): IOZENManifest | null {
    if (!existsSync(this.manifestPath)) {
      return null;
    }

    try {
      const content = readFileSync(this.manifestPath, 'utf-8');
      return JSON.parse(content) as IOZENManifest;
    } catch {
      return null;
    }
  }

  writeManifest(manifest: IOZENManifest): void {
    writeFileSync(this.manifestPath, JSON.stringify(manifest, null, 2));
  }

  hasManifest(): boolean {
    return existsSync(this.manifestPath);
  }

  getInstalledPackage(name: string): InstalledPackage | null {
    const packagePath = join(this.modulesDir, name);
    const manifestPath = join(packagePath, 'iozen.json');

    if (!existsSync(manifestPath)) {
      return null;
    }

    try {
      const content = readFileSync(manifestPath, 'utf-8');
      const manifest = JSON.parse(content) as IOZENManifest;

      return {
        name,
        version: manifest.version,
        path: packagePath,
        manifest,
      };
    } catch {
      return null;
    }
  }

  // ===== Local Registry (Phase 20.4 foundation) =====

  private findPackage(name: string, version?: string): { name: string; version: string; manifest: IOZENManifest } | null {
    // For now: look in local registry directory
    // Future: HTTP request to remote registry
    
    const localRegistry = join(this.projectRoot, '.iozen_registry');
    const packagePath = join(localRegistry, name);
    const manifestPath = join(packagePath, 'iozen.json');

    if (!existsSync(manifestPath)) {
      return null;
    }

    try {
      const content = readFileSync(manifestPath, 'utf-8');
      const manifest = JSON.parse(content) as IOZENManifest;

      // Check version constraint (simplified)
      if (version && !this.satisfiesVersion(manifest.version, version)) {
        return null;
      }

      return { name, version: manifest.version, manifest };
    } catch {
      return null;
    }
  }

  private installPackageFiles(pkgInfo: { name: string; version: string; manifest: IOZENManifest }, installPath: string): void {
    // Create directory
    if (!existsSync(installPath)) {
      mkdirSync(installPath, { recursive: true });
    }

    // Copy from local registry (simplified)
    const localRegistry = join(this.projectRoot, '.iozen_registry');
    const sourcePath = join(localRegistry, pkgInfo.name);

    // For now, just copy iozen.json
    // In real implementation, copy all files
    writeFileSync(
      join(installPath, 'iozen.json'),
      JSON.stringify(pkgInfo.manifest, null, 2)
    );

    // Create minimal index.iozen if not exists
    const indexPath = join(installPath, 'index.iozen');
    if (!existsSync(indexPath)) {
      const code = `# Package: ${pkgInfo.name}
# Version: ${pkgInfo.version}

export function hello returns integer
    print "Hello from ${pkgInfo.name}!"
    return 0
end`;
      writeFileSync(indexPath, code);
    }
  }

  private satisfiesVersion(actual: string, constraint: string): boolean {
    // Simplified version matching
    // Future: semver parsing (^, ~, >=, etc.)
    if (constraint.startsWith('^')) {
      // ^1.2.3 matches 1.x.x
      return actual.startsWith(constraint[1]);
    }
    if (constraint.startsWith('~')) {
      // ~1.2.3 matches 1.2.x
      return actual.startsWith(constraint.slice(1, constraint.lastIndexOf('.')));
    }
    return actual === constraint;
  }
}

export function createPackageManager(projectRoot?: string): PackageManager {
  return new PackageManager(projectRoot);
}
