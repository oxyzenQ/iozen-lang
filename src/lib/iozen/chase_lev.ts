// ============================================================
// IOZEN Language — Chase-Lev Work-Stealing Deque
// Lock-free task scheduling for efficient parallel execution
// ============================================================

/**
 * Phase 25: Chase-Lev Work-Stealing Deque
 * 
 * This is THE algorithm that makes modern parallel runtimes fast:
 * - Rust Rayon uses this
 * - Go scheduler uses this
 * - Java Fork/Join uses this
 * - Cilk uses this
 * 
 * The key insight: Each worker has its own queue.
 * - Owner thread: push/pop at bottom (LIFO - hot cache)
 * - Thief threads: steal from top (FIFO - fairness)
 * 
 * This minimizes contention and maximizes cache locality.
 * 
 * Architecture:
 * 
 *   Worker A              Worker B              Worker C
 *   ┌─────────┐          ┌─────────┐          ┌─────────┐
 *   │ ┌─────┐ │          │ ┌─────┐ │          │ ┌─────┐ │
 *   │ │Task3│ │ ← pop    │ │Task7│ │ ← pop    │ │Task9│ │ ← pop
 *   │ ├─────┤ │          │ ├─────┤ │          │ ├─────┤ │
 *   │ │Task2│ │          │ │Task6│ │          │ │Task8│ │
 *   │ ├─────┤ │          │ ├─────┤ │          │ ├─────┤ │
 *   │ │Task1│ │ ← steal  │ │Task5│ │ ← steal  │ │Task4│ │ ← steal
 *   │ └─────┘ │          │ └─────┘ │          │ └─────┘ │
 *   └─────────┘          └─────────┘          └─────────┘
 *        │                    │                    │
 *        └────────────────────┴────────────────────┘
 *                           │
 *                    Steal from other queues
 *                    when idle
 */

import { Worker } from 'worker_threads';

// ===== Task Types =====

export interface Task {
  id: number;
  fn: () => unknown;
  result?: unknown;
  error?: Error;
}

// ===== Chase-Lev Deque =====

/**
 * Lock-free work-stealing deque
 * Based on "Dynamic Circular Work-Stealing Deque" by Chase & Lev
 * 
 * Key operations:
 * - pushBottom(): Owner adds work (fast, no contention)
 * - popBottom(): Owner takes work (fast, no contention)
 * - steal(): Other threads steal work (lock-free)
 */

export class ChaseLevDeque {
  private buffer: SharedArrayBuffer;
  private topView: Int32Array;      // Index for steals (thieves read)
  private bottomView: Int32Array;   // Index for push/pop (owner only)
  private capacity: number;
  private tasks: (Task | null)[];   // Task storage (need to be serializable)
  
  constructor(capacity = 1024) {
    this.capacity = capacity;
    
    // Layout: [top(4), bottom(4), padding(56), ...data...]
    // 64-byte aligned to prevent false sharing
    const headerSize = 64;
    const dataSize = capacity * 8; // 8 bytes per task reference (index)
    this.buffer = new SharedArrayBuffer(headerSize + dataSize);
    
    // Top index - thieves read/write with CAS
    this.topView = new Int32Array(this.buffer, 0, 1);
    // Bottom index - owner writes without lock
    this.bottomView = new Int32Array(this.buffer, 4, 1);
    
    // Initialize empty
    Atomics.store(this.topView, 0, 0);
    Atomics.store(this.bottomView, 0, 0);
    
    // Task storage (separate from shared buffer for now - can optimize later)
    this.tasks = new Array(capacity).fill(null);
  }
  
  /**
   * OWNER ONLY: Push task to bottom of deque
   * Fast path, no contention (only owner calls this)
   */
  pushBottom(task: Task): boolean {
    const bottom = Atomics.load(this.bottomView, 0);
    const top = Atomics.load(this.topView, 0);
    const size = bottom - top;
    
    // Check if full (reserve 1 slot to distinguish empty/full)
    if (size >= this.capacity - 1) {
      return false; // Deque full
    }
    
    // Store task at bottom position
    const index = bottom % this.capacity;
    this.tasks[index] = task;
    
    // Update bottom (memory barrier implied by store)
    Atomics.store(this.bottomView, 0, bottom + 1);
    
    return true;
  }
  
  /**
   * OWNER ONLY: Pop task from bottom of deque
   * Fast path, no contention (only owner calls this)
   */
  popBottom(): Task | null {
    const bottom = Atomics.load(this.bottomView, 0) - 1;
    Atomics.store(this.bottomView, 0, bottom);
    
    // Memory barrier to ensure store is visible before we read top
    Atomics.add(new Int32Array(new SharedArrayBuffer(4)), 0, 0);
    
    const top = Atomics.load(this.topView, 0);
    const size = bottom - top;
    
    if (size < 0) {
      // Queue is empty, restore bottom
      Atomics.store(this.bottomView, 0, top);
      return null;
    }
    
    const index = bottom % this.capacity;
    const task = this.tasks[index];
    
    if (size > 0) {
      // More tasks remain, just return this one
      this.tasks[index] = null;
      return task;
    }
    
    // This is the last task - need to race with thieves
    // Try to CAS top to top + 1
    const topPlusOne = top + 1;
    const casResult = Atomics.compareExchange(this.topView, 0, top, topPlusOne);
    
    if (casResult !== top) {
      // Lost race with thief, restore and return null
      Atomics.store(this.bottomView, 0, top + 1);
      return null;
    }
    
    // Won the race, queue is now empty
    Atomics.store(this.bottomView, 0, topPlusOne);
    this.tasks[index] = null;
    return task;
  }
  
  /**
   * THIEF: Steal task from top of deque
   * Lock-free, can be called by any thread
   */
  steal(): Task | null {
    const top = Atomics.load(this.topView, 0);
    
    // Memory barrier
    Atomics.add(new Int32Array(new SharedArrayBuffer(4)), 0, 0);
    
    const bottom = Atomics.load(this.bottomView, 0);
    const size = bottom - top;
    
    if (size <= 0) {
      return null; // Empty or owner is about to take last task
    }
    
    const index = top % this.capacity;
    const task = this.tasks[index];
    
    // Try to CAS top to steal this task
    const topPlusOne = top + 1;
    const casResult = Atomics.compareExchange(this.topView, 0, top, topPlusOne);
    
    if (casResult !== top) {
      // CAS failed, someone else got it or owner took it
      return null;
    }
    
    // Successfully stole
    this.tasks[index] = null;
    return task;
  }
  
  /**
   * Get current size (approximate - may be stale)
   */
  size(): number {
    const top = Atomics.load(this.topView, 0);
    const bottom = Atomics.load(this.bottomView, 0);
    return Math.max(0, bottom - top);
  }
  
  isEmpty(): boolean {
    return this.size() === 0;
  }
}

// ===== Work-Stealing Thread Pool =====

export class WorkStealingPool {
  private workers: Worker[] = [];
  private deques: ChaseLevDeque[] = [];
  private numWorkers: number;
  private taskId = 0;
  
  constructor(numWorkers?: number) {
    this.numWorkers = numWorkers || require('os').cpus().length;
    this.initWorkers();
  }
  
  private initWorkers(): void {
    for (let i = 0; i < this.numWorkers; i++) {
      this.deques[i] = new ChaseLevDeque();
      // Workers would be created here with steal logic
      // For now, we just have the deques
    }
  }
  
  /**
   * Submit task to a specific worker (typically round-robin or based on load)
   */
  submitTask(task: Task, workerId?: number): boolean {
    const id = workerId ?? (this.taskId++ % this.numWorkers);
    return this.deques[id].pushBottom(task);
  }
  
  /**
   * Worker gets its own work (pop from bottom)
   */
  getOwnWork(workerId: number): Task | null {
    return this.deques[workerId].popBottom();
  }
  
  /**
   * Steal work from other workers
   */
  stealWork(thiefId: number): Task | null {
    // Try to steal from other workers (random order)
    const order: number[] = [];
    for (let i = 0; i < this.numWorkers; i++) {
      if (i !== thiefId) order.push(i);
    }
    
    // Shuffle order
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    
    // Try to steal from each
    for (const victimId of order) {
      const task = this.deques[victimId].steal();
      if (task) return task;
    }
    
    return null;
  }
  
  /**
   * Get total number of pending tasks
   */
  pendingTasks(): number {
    return this.deques.reduce((sum, d) => sum + d.size(), 0);
  }
}

// ===== Constants for Work-Stealing =====

export const WORK_STEALING_CONFIG = {
  // How many times to try stealing before giving up
  STEAL_ATTEMPTS: 100,
  
  // Yield duration when no work (microseconds)
  IDLE_YIELD_US: 1000,
  
  // Number of tasks to process before attempting to steal
  LOCAL_BATCH_SIZE: 64,
};
