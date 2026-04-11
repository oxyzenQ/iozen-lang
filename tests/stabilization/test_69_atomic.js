// Test 69: Atomic Counter with Real Workers (JS version)
// Tests if Atomics work correctly across REAL OS threads

const { Worker, isMainThread, workerData, parentPort } = require('worker_threads');

console.log('=== ATOMIC COUNTER + REAL WORKERS (JS) ===\n');

if (isMainThread) {
  // Main thread
  console.log('Main: Creating atomic counter...');
  
  // Create shared counter
  const buffer = new SharedArrayBuffer(4);
  const view = new Int32Array(buffer);
  
  console.log('Main: Spawning 4 workers...');
  const workers = [];
  const iterations = 10000;
  
  // Create workers
  for (let i = 0; i < 4; i++) {
    const worker = new Worker(__filename, {
      workerData: {
        buffer: buffer,
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
          const final = Atomics.load(view, 0);
          const expected = 4 * iterations;
          
          console.log('\n=== RESULT ===');
          console.log(`Expected: ${expected}`);
          console.log(`Actual:   ${final}`);
          
          if (final === expected) {
            console.log('✅ PASS - No race conditions!');
            console.log('\nAtomicCounter works correctly with real OS threads!');
            process.exit(0);
          } else {
            console.log(`❌ FAIL - Lost ${expected - final} increments`);
            console.log('This indicates a race condition or atomic bug!');
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
  
  parentPort.postMessage('done');
}
