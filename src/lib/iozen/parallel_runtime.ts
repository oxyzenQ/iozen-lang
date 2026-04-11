// ============================================================
// IOZEN Language — Parallel Runtime
// High-performance thread pool with work-stealing scheduler
// ============================================================

/**
 * Phase 22: Parallel Runtime
 * 
 * Design goals:
 * - Zero-cost abstraction (no overhead for sequential code)
 * - Work-stealing scheduler (similar to Rayon/Go)
 * - Lock-free data structures where possible
 * - Auto chunking for parallel loops
 * 
 * Architecture:
 * 
 *   Main Thread          Thread Pool (N workers)
 *   ┌─────────┐         ┌─────────┐ ┌─────────┐ ┌─────────┐
 *   │ Program │────────▶│ Worker 0│ │ Worker 1│ │ Worker N│
 *   │         │         │ ┌─────┐ │ │ ┌─────┐ │ │ ┌─────┐ │
 *   │  spawn  │────────▶│ │Queue│ │ │ │Queue│ │ │ │Queue│ │
 *   │  join   │◀────────│ └─────┘ │ │ └─────┘ │ │ └─────┘ │
 *   │         │ steal   │         │ │         │ │         │
 *   └─────────┘         └─────────┘ └─────────┘ └─────────┘
 * 
 * Work Stealing:
 * - Each worker has local task queue (LIFO)
 * - When idle, steal from other workers (FIFO)
 * - Reduces contention, improves locality
 */

import { cpus } from 'node:os';
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';

// ===== Types =====

export type TaskFunction = () => void;
export type TaskResult<T> = T | Promise<T>;

export interface Task<T = unknown> {
  id: number;
  fn: () => T;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
}

export interface ParallelOptions {
  minTasks?: number;      // Min tasks to spawn parallel (default: 1000)
  chunkSize?: number;     // Items per task (default: auto)
  maxConcurrency?: number; // Max threads (default: num CPUs)
}

// ===== Lock-Free Queue (Simplified) =====

/**
 * Simple work queue with minimal locking
 * In production: use lock-free ring buffer
 */
class WorkQueue<T> {
  private items: T[] = [];
  private lock = false;

  push(item: T): void {
    this.acquireLock();
    this.items.push(item);
    this.releaseLock();
  }

  pop(): T | undefined {
    this.acquireLock();
    const item = this.items.pop(); // LIFO for own queue
    this.releaseLock();
    return item;
  }

  steal(): T | undefined {
    this.acquireLock();
    const item = this.items.shift(); // FIFO for stealing
    this.releaseLock();
    return item;
  }

  size(): number {
    return this.items.length;
  }

  private acquireLock(): void {
    // Spin-lock (simplified)
    while (this.lock) {
      // Busy wait - in production use atomics
    }
    this.lock = true;
  }

  private releaseLock(): void {
    this.lock = false;
  }
}

// ===== Thread Pool =====

export class ThreadPool {
  private workers: Worker[] = [];
  private queues: WorkQueue<Task>[] = [];
  private taskId = 0;
  private terminated = false;
  private numWorkers: number;

  constructor(numWorkers?: number) {
    this.numWorkers = numWorkers || cpus().length;
    this.initWorkers();
  }

  private initWorkers(): void {
    for (let i = 0; i < this.numWorkers; i++) {
      const queue = new WorkQueue<Task>();
      this.queues.push(queue);

      // In real implementation, create Worker threads
      // For now, simulate with async processing
      this.spawnWorker(i, queue);
    }
  }

  private spawnWorker(id: number, queue: WorkQueue<Task>): void {
    // Worker loop - in production this runs in separate thread
    const workerLoop = async () => {
      while (!this.terminated) {
        // Try own queue first (LIFO)
        let task = queue.pop();

        // If empty, try stealing from other workers (FIFO)
        if (!task) {
          task = this.stealTask(id);
        }

        if (task) {
          try {
            const result = task.fn();
            task.resolve(result);
          } catch (error) {
            task.reject(error as Error);
          }
        } else {
          // No work - sleep briefly
          await this.sleep(1);
        }
      }
    };

    // Start worker loop
    workerLoop();
  }

  private stealTask(fromWorkerId: number): Task | undefined {
    // Try to steal from other workers
    for (let i = 0; i < this.numWorkers; i++) {
      if (i !== fromWorkerId) {
        const task = this.queues[i].steal();
        if (task) return task;
      }
    }
    return undefined;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Execute function in parallel
   */
  execute<T>(fn: () => T): Promise<T> {
    return new Promise((resolve, reject) => {
      const task: Task<T> = {
        id: ++this.taskId,
        fn,
        resolve,
        reject,
      };

      // Push to random worker queue
      const workerId = Math.floor(Math.random() * this.numWorkers);
      this.queues[workerId].push(task as Task);
    });
  }

  /**
   * Parallel for-each with auto chunking
   */
  async parallelForEach<T, R>(
    items: T[],
    fn: (item: T, index: number) => R,
    options: ParallelOptions = {}
  ): Promise<R[]> {
    const { minTasks = 1000, chunkSize: customChunkSize } = options;

    // Auto chunking
    const chunkSize = customChunkSize || Math.max(
      Math.ceil(items.length / (this.numWorkers * 4)), // 4x oversubscription
      minTasks
    );

    // Create chunks
    const chunks: { items: T[]; startIndex: number }[] = [];
    for (let i = 0; i < items.length; i += chunkSize) {
      chunks.push({
        items: items.slice(i, i + chunkSize),
        startIndex: i,
      });
    }

    // Process chunks in parallel
    const results: R[][] = await Promise.all(
      chunks.map(chunk =>
        this.execute(() =>
          chunk.items.map((item, idx) => fn(item, chunk.startIndex + idx))
        )
      )
    );

    // Flatten results
    return results.flat();
  }

  /**
   * Parallel map - transform array in parallel
   */
  async parallelMap<T, R>(
    items: T[],
    fn: (item: T, index: number) => R,
    options?: ParallelOptions
  ): Promise<R[]> {
    return this.parallelForEach(items, fn, options);
  }

  /**
   * Parallel reduce - aggregate in parallel
   */
  async parallelReduce<T, R>(
    items: T[],
    fn: (acc: R, item: T) => R,
    initial: R,
    options?: ParallelOptions
  ): Promise<R> {
    const { chunkSize: customChunkSize } = options || {};
    const chunkSize = customChunkSize || Math.max(
      Math.ceil(items.length / (this.numWorkers * 4)),
      1000
    );

    // Create chunks
    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += chunkSize) {
      chunks.push(items.slice(i, i + chunkSize));
    }

    // Reduce each chunk in parallel
    const partialResults = await Promise.all(
      chunks.map(chunk =>
        this.execute(() =>
          chunk.reduce(fn, initial)
        )
      )
    );

    // Final reduce
    return partialResults.reduce((a, b) => fn(a, b as unknown as T), initial);
  }

  /**
   * Terminate thread pool
   */
  terminate(): void {
    this.terminated = true;
    // In real implementation: terminate Worker threads
  }
}

// ===== Global Thread Pool =====

let globalPool: ThreadPool | null = null;

export function getGlobalThreadPool(): ThreadPool {
  if (!globalPool) {
    globalPool = new ThreadPool();
  }
  return globalPool;
}

export function setGlobalThreadPool(pool: ThreadPool): void {
  if (globalPool) {
    globalPool.terminate();
  }
  globalPool = pool;
}

// ===== Convenience Functions =====

export function parallelForEach<T, R>(
  items: T[],
  fn: (item: T, index: number) => R,
  options?: ParallelOptions
): Promise<R[]> {
  return getGlobalThreadPool().parallelForEach(items, fn, options);
}

export function parallelMap<T, R>(
  items: T[],
  fn: (item: T, index: number) => R,
  options?: ParallelOptions
): Promise<R[]> {
  return getGlobalThreadPool().parallelMap(items, fn, options);
}

export function parallelReduce<T, R>(
  items: T[],
  fn: (acc: R, item: T) => R,
  initial: R,
  options?: ParallelOptions
): Promise<R> {
  return getGlobalThreadPool().parallelReduce(items, fn, initial, options);
}

export function executeParallel<T>(fn: () => T): Promise<T> {
  return getGlobalThreadPool().execute(fn);
}
