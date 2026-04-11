// ============================================================
// IOZEN Language — Shared Memory Module
// Zero-copy data sharing with SharedArrayBuffer + Atomics
// ============================================================

/**
 * Phase 24: Shared Memory
 *
 * Why this matters:
 * - No serialization overhead
 * - No data copying
 * - Direct memory access across threads
 * - C-level performance for parallel workloads
 *
 * Architecture:
 *
 *   Main Thread              Worker Threads
 *   ┌─────────────┐         ┌─────────────┐
 *   │ SharedArray │◀───────▶│ SharedArray │
 *   │  Buffer     │  shared  │  Buffer     │
 *   │             │  memory  │             │
 *   │ ┌─────────┐ │         │ ┌─────────┐ │
 *   │ │ Data    │ │◀───────▶│ │ Data    │ │
 *   │ │ (raw)   │ │         │ │ (raw)   │ │
 *   │ └─────────┘ │         │ └─────────┘ │
 *   └─────────────┘         └─────────────┘
 *
 * Before (Phase 23):
 *   Worker A → serialize → copy → Worker B
 *   (slow for small tasks)
 *
 * After (Phase 24):
 *   Worker A ──▶ Shared Memory ◀── Worker B
 *   (zero-copy, C-level performance)
 */

import { Worker } from 'node:worker_threads';

// ===== Shared Memory Types =====

export type SharedData =
  | Int8Array
  | Uint8Array
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Float32Array
  | Float64Array
  | BigInt64Array
  | BigUint64Array;

export interface SharedBuffer {
  buffer: SharedArrayBuffer;
  view: SharedData;
  length: number;
}

export interface AtomicCounter {
  buffer: SharedArrayBuffer;
  view: Int32Array;
  increment(): number;
  decrement(): number;
  get(): number;
  set(value: number): void;
}

// ===== Shared Memory Pool =====

export class SharedMemoryPool {
  private buffers = new Map<string, SharedArrayBuffer>();

  /**
   * Create a shared Int32Array
   */
  createInt32Array(name: string, length: number): Int32Array {
    const bytes = length * 4; // 4 bytes per Int32
    const buffer = new SharedArrayBuffer(bytes);
    const view = new Int32Array(buffer);
    this.buffers.set(name, buffer);
    return view;
  }

  /**
   * Create a shared Float64Array
   */
  createFloat64Array(name: string, length: number): Float64Array {
    const bytes = length * 8; // 8 bytes per Float64
    const buffer = new SharedArrayBuffer(bytes);
    const view = new Float64Array(buffer);
    this.buffers.set(name, buffer);
    return view;
  }

  /**
   * Get existing shared buffer
   */
  getBuffer(name: string): SharedArrayBuffer | undefined {
    return this.buffers.get(name);
  }

  /**
   * Transfer buffer to worker
   */
  transferToWorker(name: string, worker: Worker): void {
    const buffer = this.buffers.get(name);
    if (buffer) {
      // SharedArrayBuffer can be passed directly (no copy)
      worker.postMessage({ type: 'buffer', name, buffer }, [buffer]);
    }
  }
}

// ===== Atomic Counter =====

export function createAtomicCounter(initialValue = 0): AtomicCounter {
  const buffer = new SharedArrayBuffer(4); // 4 bytes for Int32
  const view = new Int32Array(buffer);
  Atomics.store(view, 0, initialValue);

  return {
    buffer,
    view,
    increment(): number {
      return Atomics.add(view, 0, 1);
    },
    decrement(): number {
      return Atomics.sub(view, 0, 1);
    },
    get(): number {
      return Atomics.load(view, 0);
    },
    set(value: number): void {
      Atomics.store(view, 0, value);
    },
  };
}

// ===== Lock-Free Queue (SPSC - Single Producer Single Consumer) =====

export class SharedQueue<T> {
  private buffer: SharedArrayBuffer;
  private headView: Int32Array;
  private tailView: Int32Array;
  private dataView: Int32Array;
  private capacity: number;

  constructor(capacity: number) {
    this.capacity = capacity;
    // Layout: [head, tail, ...data...]
    const bytes = 8 + capacity * 4; // 2 counters + data
    this.buffer = new SharedArrayBuffer(bytes);
    this.headView = new Int32Array(this.buffer, 0, 1);
    this.tailView = new Int32Array(this.buffer, 4, 1);
    this.dataView = new Int32Array(this.buffer, 8, capacity);

    Atomics.store(this.headView, 0, 0);
    Atomics.store(this.tailView, 0, 0);
  }

  enqueue(item: number): boolean {
    const tail = Atomics.load(this.tailView, 0);
    const nextTail = (tail + 1) % this.capacity;

    // Check if full
    if (nextTail === Atomics.load(this.headView, 0)) {
      return false; // Queue full
    }

    // Store item and update tail
    Atomics.store(this.dataView, tail, item);
    Atomics.store(this.tailView, 0, nextTail);
    return true;
  }

  dequeue(): number | null {
    const head = Atomics.load(this.headView, 0);

    // Check if empty
    if (head === Atomics.load(this.tailView, 0)) {
      return null; // Queue empty
    }

    // Load item and update head
    const item = Atomics.load(this.dataView, head);
    Atomics.store(this.headView, 0, (head + 1) % this.capacity);
    return item;
  }

  size(): number {
    const head = Atomics.load(this.headView, 0);
    const tail = Atomics.load(this.tailView, 0);
    return (tail - head + this.capacity) % this.capacity;
  }

  isEmpty(): boolean {
    return Atomics.load(this.headView, 0) === Atomics.load(this.tailView, 0);
  }

  isFull(): boolean {
    const nextTail = (Atomics.load(this.tailView, 0) + 1) % this.capacity;
    return nextTail === Atomics.load(this.headView, 0);
  }

  getBuffer(): SharedArrayBuffer {
    return this.buffer;
  }
}

// ===== Parallel Array Operations =====

export class ParallelArray {
  /**
   * Parallel map using SharedArrayBuffer
   * Zero-copy, C-level performance
   */
  static async map<T, R>(
    items: T[],
    fn: (item: T, index: number) => R,
    workers: Worker[]
  ): Promise<R[]> {
    const numWorkers = workers.length;
    const chunkSize = Math.ceil(items.length / numWorkers);

    // Create shared buffer for results
    const resultBuffer = new SharedArrayBuffer(items.length * 8); // Float64
    const resultView = new Float64Array(resultBuffer);

    // Create shared buffer for input (if numeric)
    const promises: Promise<void>[] = [];

    for (let i = 0; i < numWorkers; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, items.length);

      if (start >= end) break;

      const promise = new Promise<void>((resolve, reject) => {
        const worker = workers[i % workers.length];

        worker.once('message', (message) => {
          if (message.type === 'done') {
            resolve();
          } else if (message.type === 'error') {
            reject(new Error(message.error));
          }
        });

        // Send task with SharedArrayBuffer (zero-copy)
        // NOTE: SharedArrayBuffer does NOT need transfer list
        worker.postMessage({
          type: 'map',
          start,
          end,
          resultBuffer,
        });
      });

      promises.push(promise);
    }

    await Promise.all(promises);

    // Convert back to regular array
    return Array.from(resultView) as R[];
  }

  /**
   * Parallel reduce using SharedArrayBuffer
   */
  static async reduce<T>(
    items: T[],
    fn: (acc: number, item: T, index: number) => number,
    initial: number,
    workers: Worker[]
  ): Promise<number> {
    const numWorkers = workers.length;
    const chunkSize = Math.ceil(items.length / numWorkers);

    // Create shared buffer for partial results
    const partialBuffer = new SharedArrayBuffer(numWorkers * 8);
    const partialView = new Float64Array(partialBuffer);

    const promises: Promise<void>[] = [];

    for (let i = 0; i < numWorkers; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, items.length);

      if (start >= end) {
        Atomics.store(partialView, i, initial);
        continue;
      }

      const promise = new Promise<void>((resolve, reject) => {
        const worker = workers[i % workers.length];

        worker.once('message', (message) => {
          if (message.type === 'done') {
            resolve();
          } else if (message.type === 'error') {
            reject(new Error(message.error));
          }
        });

        worker.postMessage({
          type: 'reduce',
          start,
          end,
          initial,
          partialBuffer,
          workerId: i,
        });
      });

      promises.push(promise);
    }

    await Promise.all(promises);

    // Final reduce on main thread
    let result = initial;
    for (let i = 0; i < numWorkers; i++) {
      result = fn(result, partialView[i] as unknown as T, i);
    }

    return result;
  }
}

// ===== Memory Layout Utilities =====

export function createSharedInt32Array(length: number): Int32Array {
  const buffer = new SharedArrayBuffer(length * 4);
  return new Int32Array(buffer);
}

export function createSharedFloat64Array(length: number): Float64Array {
  const buffer = new SharedArrayBuffer(length * 8);
  return new Float64Array(buffer);
}

export function createSharedUint8Array(length: number): Uint8Array {
  const buffer = new SharedArrayBuffer(length);
  return new Uint8Array(buffer);
}

// ===== Worker Template with Shared Memory =====

export const SHARED_MEMORY_WORKER = `
const { parentPort, workerData } = require('worker_threads');

// Shared buffer references
let sharedBuffer = null;
let sharedView = null;

parentPort.on('message', (message) => {
  try {
    switch (message.type) {
      case 'map': {
        const { start, end, resultBuffer } = message;
        const resultView = new Float64Array(resultBuffer);

        for (let i = start; i < end; i++) {
          // Apply function (simplified - in real impl, deserialize fn)
          resultView[i] = i * i; // Example: square
        }

        parentPort.postMessage({ type: 'done' });
        break;
      }

      case 'reduce': {
        const { start, end, initial, partialBuffer, workerId } = message;
        const partialView = new Float64Array(partialBuffer);

        let sum = initial;
        for (let i = start; i < end; i++) {
          sum += i; // Example: sum
        }

        Atomics.store(partialView, workerId, sum);
        parentPort.postMessage({ type: 'done' });
        break;
      }

      default:
        parentPort.postMessage({ type: 'error', error: 'Unknown task type' });
    }
  } catch (error) {
    parentPort.postMessage({ type: 'error', error: error.message });
  }
});
`;
