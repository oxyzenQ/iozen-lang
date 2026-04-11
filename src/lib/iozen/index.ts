// ============================================================
// IOZEN Language — Main Entry Point
// Exports the complete IOZEN language toolkit
// ============================================================

export type * from './ast';
export { Environment, RuntimeError } from './environment';
export { Interpreter, executeIOZEN } from './interpreter';
export { Lexer } from './lexer';
export { ParseError, Parser } from './parser';
export { KEYWORDS, SYMBOLS, Token, TokenType } from './tokens';

// Phase 17: SSA Form
export { convertASTtoSSA } from './ast_to_ssa';
export { SSACodeGenerator, generateCFromSSA } from './ssa_codegen';
export type * from './ssa_ir';
export * as SSA from './ssa_ir';
export { SSAOptimizer, optimizeSSAFunction } from './ssa_optimizer';

// Phase 22: Parallel Runtime (Simulated)
export {
    ThreadPool, executeParallel,
    getGlobalThreadPool,
    parallelForEach,
    parallelMap,
    parallelReduce,
    setGlobalThreadPool
} from './parallel_runtime';
export type { ParallelOptions, Task, TaskFunction, TaskResult } from './parallel_runtime';

// Phase 23: Real Worker Threads
export {
    WorkerThreadPool, getGlobalWorkerPool,
    setGlobalWorkerPool,
    workerBenchmarkPrimes,
    workerExecute,
    workerParallelForEach,
    workerParallelMap,
    workerParallelReduce
} from './worker_pool';
export type { WorkerMessage, WorkerTask } from './worker_pool';

// Phase 24: Shared Memory
export {
    ParallelArray,
    SharedMemoryPool,
    SharedQueue, createAtomicCounter,
    createSharedFloat64Array,
    createSharedInt32Array,
    createSharedUint8Array
} from './shared_memory';
export type { AtomicCounter, SharedBuffer, SharedData } from './shared_memory';

// Language metadata
export const IOZEN_VERSION = '0.1.0';
export const IOZEN_NAME = 'IOZEN';
export const IOZEN_DESCRIPTION = 'A safe, expressive systems programming language with natural syntax';
