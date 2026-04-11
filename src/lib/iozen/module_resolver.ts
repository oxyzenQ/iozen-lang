// ============================================================
// IOZEN Language — Module Resolver
// Resolves import paths and loads module files
// ============================================================

import { resolve, dirname, join, extname } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

/**
 * Phase 19: Module Resolver
 * 
 * Resolves import paths like:
 * - "./utils.iozen" (relative)
 * - "../lib/math.iozen" (relative parent)
 * - "math" (builtin/library - future)
 */

export interface ResolvedModule {
  path: string;
  source: string;
}

export class ModuleResolver {
  private basePath: string;
  private extensions = ['.iozen', '.ioz'];
  private builtinModules = new Set<string>([
    // Future: built-in modules like "math", "io", "json"
  ]);

  constructor(basePath: string) {
    this.basePath = resolve(basePath);
  }

  /**
   * Resolve an import path to an absolute file path
   */
  resolve(modulePath: string, fromFile?: string): string | null {
    // If already absolute path
    if (modulePath.startsWith('/')) {
      return this.findFile(modulePath);
    }

    // Relative path
    if (modulePath.startsWith('./') || modulePath.startsWith('../')) {
      const baseDir = fromFile ? dirname(fromFile) : this.basePath;
      const fullPath = resolve(baseDir, modulePath);
      return this.findFile(fullPath);
    }

    // Library/Builtin module (future)
    if (this.builtinModules.has(modulePath)) {
      return null; // Builtins handled separately
    }

    // Try as relative from base path
    const fromBasePath = resolve(this.basePath, modulePath);
    return this.findFile(fromBasePath);
  }

  /**
   * Load a module file
   */
  load(modulePath: string, fromFile?: string): ResolvedModule | null {
    const resolvedPath = this.resolve(modulePath, fromFile);
    
    if (!resolvedPath) {
      return null;
    }

    if (!existsSync(resolvedPath)) {
      return null;
    }

    try {
      const source = readFileSync(resolvedPath, 'utf-8');
      return { path: resolvedPath, source };
    } catch {
      return null;
    }
  }

  /**
   * Check if a module is a builtin
   */
  isBuiltin(modulePath: string): boolean {
    return this.builtinModules.has(modulePath);
  }

  private findFile(path: string): string | null {
    // If path already has extension and exists
    if (extname(path)) {
      if (existsSync(path)) {
        return path;
      }
      return null;
    }

    // Try adding extensions
    for (const ext of this.extensions) {
      const withExt = path + ext;
      if (existsSync(withExt)) {
        return withExt;
      }
    }

    // Try index file in directory
    for (const ext of this.extensions) {
      const indexPath = join(path, 'index' + ext);
      if (existsSync(indexPath)) {
        return indexPath;
      }
    }

    return null;
  }
}

export function createModuleResolver(basePath: string): ModuleResolver {
  return new ModuleResolver(basePath);
}
