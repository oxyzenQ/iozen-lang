// Test 69: Atomic Counter with Real Workers
// Tests if Atomics work correctly across REAL OS threads

import { Worker, isMainThread, workerData, parentPort } from 'worker_threads';
import { createAtomicCounter } from '../../src/lib/iozen/shared_memory';

console.log('=== ATOMIC COUNTER + REAL WORKERS ===\n');

if (isMainThread) {
  // Main thread
  console.log('Main: Creating atomic counter...');
  const counter = createAtomicCounter(0);
  
  console.log('Main: Spawning 4 workers...');
  const workers: Worker[] = [];
  const iterations = 10000;
  
  // Create workers
  for (let i = 0; i < 4; i++) {
    const worker = new Worker(__filename, {
      workerData: {
        buffer: counter.buffer,
        iterations: iterations,
        workerId: i
      }
    });
    workers.push(worker);
  }
  
  // Wait for all workers to finish
  let completed = 0;
  for (const worker of workers) {
    worker.on('message', (msg) => {
      if (msg === 'done') {
        completed++;
        if (completed === 4) {
          const final = counter.get();
          const expected = 4 * iterations;
          
          console.log('\n=== RESULT ===');
          console.log(`Expected: ${expected}`);
          console.log(`Actual:   ${final}`);
          
          if (final === expected) {
            console.log('✅ PASS - No race conditions!');
            process.exit(0);
          } else {
            console.log(`❌ FAIL - Lost ${expected - final} increments`);
            process.exit(1);
          }
        }
      }
    });
    
    worker.on('error', (err) => {
      console.error('Worker error:', err);
      process.exit(1);
    });
  }
  
} else {
  // Worker thread
  const { buffer, iterations, workerId } = workerData;
  const view = new Int32Array(buffer);
  
  // Perform increments
  for (let i = 0; i < iterations; i++) {
    Atomics.add(view, 0, 1);
  }
  
  parentPort?.postMessage('done');
}
