// ============================================================
// IOZEN Language — Real Worker Thread Pool
// True parallel execution with node:worker_threads
// ============================================================

import { cpus } from 'node:os';
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { join } from 'node:path';

/**
 * Phase 23: Real Worker Threads
 * 
 * Architecture:
 * 
 *   Main Thread (Event Loop)          Worker Threads (OS Threads)
 *   ┌─────────────────────┐          ┌─────────┐ ┌─────────┐ ┌─────────┐
 *   │ ThreadPool          │          │ Worker 0│ │ Worker 1│ │ Worker N│
 *   │ ┌─────────────────┐ │          │ ┌─────┐ │ │ ┌─────┐ │ │ ┌─────┐ │
 *   │ │ Task Queue      │ │──────▶   │ │Loop │ │ │ │Loop │ │ │ │Loop │ │
 *   │ │ - serialize fn  │ │  post    │ │     │ │ │ │     │ │ │ │     │ │
 *   │ │ - send to worker│ │ Message  │ │Run  │ │ │ │Run  │ │ │ │Run  │ │
 *   │ └─────────────────┘ │◀──────   │ │Task│ │ │ │Task│ │ │ │Task│ │
 *   │                     │  result    │ └─────┘ │ │ └─────┘ │ │ └─────┘ │
 *   └─────────────────────┘          └─────────┘ └─────────┘ └─────────┘
 * 
 * Key Differences from Phase 22:
 * - TRUE OS threads (not simulated)
 * - Each worker runs in separate V8 isolate
 * - Real CPU parallelism (utilize all cores)
 * - Message passing for coordination
 * 
 * Limitations (Node.js worker_threads):
 * - SharedArrayBuffer for shared memory
 * - Structured Clone Algorithm for data transfer
 * - No shared JS objects between threads
 */

// ===== Types =====

export interface WorkerTask<T = unknown> {
  id: number;
  type: 'execute' | 'map' | 'reduce' | 'foreach';
  fn: string;        // Serialized function
  data: unknown;     // Task data
  resolve: (value: T) => void;
  reject: (error: Error) => void;
}

export interface WorkerMessage {
  type: 'result' | 'error' | 'ready';
  taskId?: number;
  result?: unknown;
  error?: string;
}

export interface ParallelOptions {
  minChunkSize?: number;    // Minimum items per task
  maxConcurrency?: number;    // Max threads to use
  useThreads?: boolean;     // Use true threads (default: true)
}

// ===== Worker Thread Code =====

/**
 * Worker thread entry point - runs in separate OS thread
 */
const WORKER_CODE = `
const { parentPort } = require('worker_threads');

// Task execution loop
parentPort.on('message', (message) => {
  const { taskId, type, fn, data } = message;
  
  try {
    // Deserialize function
    const func = eval('(' + fn + ')');
    
    // Execute task
    const result = func(data);
    
    // Send result back
    parentPort.postMessage({
      type: 'result',
      taskId,
      result
    });
  } catch (error) {
    parentPort.postMessage({
      type: 'error',
      taskId,
      error: error.message
    });
  }
});

// Signal ready
parentPort.postMessage({ type: 'ready' });
`;

// ===== Thread Pool =====

export class WorkerThreadPool {
  private workers: Worker[] = [];
  private taskQueue: WorkerTask[] = [];
  private pendingTasks = new Map<number, WorkerTask>();
  private taskId = 0;
  private terminated = false;
  private numWorkers: number;
  private readyWorkers = new Set<number>();

  constructor(numWorkers?: number) {
    this.numWorkers = numWorkers || cpus().length;
    this.initWorkers();
  }

  private initWorkers(): void {
    for (let i = 0; i < this.numWorkers; i++) {
      this.spawnWorker(i);
    }
  }

  private spawnWorker(id: number): void {
    // Create worker with inline code
    const worker = new Worker(WORKER_CODE, {
      eval: true,
      workerData: { id }
    });

    worker.on('message', (message: WorkerMessage) => {
      this.handleWorkerMessage(message, id);
    });

    worker.on('error', (error) => {
      console.error(`Worker ${id} error:`, error);
    });

    worker.on('exit', (code) => {
      if (code !== 0) {
        console.error(`Worker ${id} stopped with exit code ${code}`);
      }
    });

    this.workers[id] = worker;
  }

  private handleWorkerMessage(message: WorkerMessage, workerId: number): void {
    switch (message.type) {
      case 'ready':
        this.readyWorkers.add(workerId);
        this.processQueue();
        break;

      case 'result':
        if (message.taskId !== undefined) {
          const task = this.pendingTasks.get(message.taskId);
          if (task) {
            this.pendingTasks.delete(message.taskId);
            task.resolve(message.result as any);
            // Process next task
            this.processQueue();
          }
        }
        break;

      case 'error':
        if (message.taskId !== undefined) {
          const task = this.pendingTasks.get(message.taskId);
          if (task) {
            this.pendingTasks.delete(message.taskId);
            task.reject(new Error(message.error || 'Worker error'));
            this.processQueue();
          }
        }
        break;
    }
  }

  private processQueue(): void {
    while (this.taskQueue.length > 0 && this.readyWorkers.size > 0) {
      const task = this.taskQueue.shift();
      if (!task) break;

      // Find ready worker
      const workerId = this.readyWorkers.values().next().value;
      this.readyWorkers.delete(workerId);

      // Send to worker
      this.pendingTasks.set(task.id, task);
      this.workers[workerId].postMessage({
        taskId: task.id,
        type: task.type,
        fn: task.fn,
        data: task.data
      });
    }
  }

  /**
   * Execute function in parallel on separate OS thread
   */
  execute<T>(fn: () => T): Promise<T> {
    return new Promise((resolve, reject) => {
      const task: WorkerTask<T> = {
        id: ++this.taskId,
        type: 'execute',
        fn: fn.toString(),
        data: null,
        resolve,
        reject
      };

      this.taskQueue.push(task as WorkerTask);
      this.processQueue();
    });
  }

  /**
   * Parallel for-each with auto chunking across real OS threads
   */
  async parallelForEach<T, R>(
    items: T[],
    fn: (item: T, index: number) => R,
    options: ParallelOptions = {}
  ): Promise<R[]> {
    const { minChunkSize = 100 } = options;

    // Auto chunking
    const chunkSize = Math.max(
      Math.ceil(items.length / (this.numWorkers * 2)),
      minChunkSize
    );

    // Create chunks
    const chunks: { items: T[]; startIndex: number }[] = [];
    for (let i = 0; i < items.length; i += chunkSize) {
      chunks.push({
        items: items.slice(i, i + chunkSize),
        startIndex: i
      });
    }

    // Process chunks in parallel across OS threads
    const results = await Promise.all(
      chunks.map(chunk =>
        this.execute(() =>
          chunk.items.map((item, idx) => fn(item, chunk.startIndex + idx))
        )
      )
    );

    return results.flat();
  }

  /**
   * Parallel map across OS threads
   */
  async parallelMap<T, R>(
    items: T[],
    fn: (item: T, index: number) => R,
    options?: ParallelOptions
  ): Promise<R[]> {
    return this.parallelForEach(items, fn, options);
  }

  /**
   * Parallel reduce across OS threads
   */
  async parallelReduce<T, R>(
    items: T[],
    fn: (acc: R, item: T) => R,
    initial: R,
    options?: ParallelOptions
  ): Promise<R> {
    const { minChunkSize = 100 } = options || {};
    const chunkSize = Math.max(
      Math.ceil(items.length / (this.numWorkers * 2)),
      minChunkSize
    );

    // Create chunks
    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += chunkSize) {
      chunks.push(items.slice(i, i + chunkSize));
    }

    // Reduce each chunk in parallel across OS threads
    const partialResults = await Promise.all(
      chunks.map(chunk =>
        this.execute(() => chunk.reduce(fn, initial))
      )
    );

    // Final reduce
    return partialResults.reduce((a, b) => fn(a, b as unknown as T), initial);
  }

  /**
   * CPU-intensive benchmark: Calculate primes
   */
  async benchmarkPrimes(count: number): Promise<number[]> {
    const chunks: number[][] = [];
    const chunkSize = Math.ceil(count / this.numWorkers);

    for (let i = 0; i < count; i += chunkSize) {
      const start = i + 2;
      const end = Math.min(i + chunkSize + 2, count + 2);
      chunks.push([start, end]);
    }

    const results = await Promise.all(
      chunks.map(([start, end]) =>
        this.execute(() => {
          const isPrime = (n: number): boolean => {
            if (n < 2) return false;
            for (let i = 2; i <= Math.sqrt(n); i++) {
              if (n % i === 0) return false;
            }
            return true;
          };

          const primes: number[] = [];
          for (let n = start; n < end; n++) {
            if (isPrime(n)) primes.push(n);
          }
          return primes;
        })
      )
    );

    return results.flat();
  }

  /**
   * Terminate all workers
   */
  terminate(): void {
    this.terminated = true;
    for (const worker of this.workers) {
      worker.terminate();
    }
    this.workers = [];
  }

  getNumWorkers(): number {
    return this.numWorkers;
  }
}

// ===== Global Instance =====

let globalWorkerPool: WorkerThreadPool | null = null;

export function getGlobalWorkerPool(): WorkerThreadPool {
  if (!globalWorkerPool) {
    globalWorkerPool = new WorkerThreadPool();
  }
  return globalWorkerPool;
}

export function setGlobalWorkerPool(pool: WorkerThreadPool): void {
  if (globalWorkerPool) {
    globalWorkerPool.terminate();
  }
  globalWorkerPool = pool;
}

// ===== Convenience Functions =====

export function workerExecute<T>(fn: () => T): Promise<T> {
  return getGlobalWorkerPool().execute(fn);
}

export function workerParallelForEach<T, R>(
  items: T[],
  fn: (item: T, index: number) => R,
  options?: ParallelOptions
): Promise<R[]> {
  return getGlobalWorkerPool().parallelForEach(items, fn, options);
}

export function workerParallelMap<T, R>(
  items: T[],
  fn: (item: T, index: number) => R,
  options?: ParallelOptions
): Promise<R[]> {
  return getGlobalWorkerPool().parallelMap(items, fn, options);
}

export function workerParallelReduce<T, R>(
  items: T[],
  fn: (acc: R, item: T) => R,
  initial: R,
  options?: ParallelOptions
): Promise<R> {
  return getGlobalWorkerPool().parallelReduce(items, fn, initial, options);
}

export function workerBenchmarkPrimes(count: number): Promise<number[]> {
  return getGlobalWorkerPool().benchmarkPrimes(count);
}
