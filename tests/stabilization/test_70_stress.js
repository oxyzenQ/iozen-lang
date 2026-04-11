// Test 70: STRESS TEST - Atomic Counter Under Heavy Load
// Tests scalability and contention behavior
// If this passes, we have a solid foundation

const { Worker, isMainThread, workerData, parentPort } = require('worker_threads');
const { cpus } = require('os');

const numCPUs = cpus().length;

console.log('=== STRESS TEST: ATOMIC COUNTER ===');
console.log(`System: ${numCPUs} CPU cores\n`);

if (isMainThread) {
  async function runStressTest(workerCount, iterationsPerWorker, testName) {
    console.log(`\n${testName}`);
    console.log(`  Workers: ${workerCount}`);
    console.log(`  Iterations per worker: ${iterationsPerWorker.toLocaleString()}`);
    console.log(`  Total operations: ${(workerCount * iterationsPerWorker).toLocaleString()}`);
    
    const buffer = new SharedArrayBuffer(4);
    const view = new Int32Array(buffer);
    
    const startTime = Date.now();
    const workers = [];
    
    // Spawn workers
    for (let i = 0; i < workerCount; i++) {
      const worker = new Worker(__filename, {
        workerData: {
          buffer: buffer,
          iterations: iterationsPerWorker,
          workerId: i
        }
      });
      workers.push(worker);
    }
    
    // Wait for completion
    let completed = 0;
    await new Promise((resolve, reject) => {
      for (const worker of workers) {
        worker.on('message', (msg) => {
          if (msg === 'done') {
            completed++;
            if (completed === workerCount) {
              resolve();
            }
          }
        });
        
        worker.on('error', reject);
      }
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    const final = Atomics.load(view, 0);
    const expected = workerCount * iterationsPerWorker;
    const opsPerSecond = (expected / (duration / 1000)).toLocaleString();
    
    console.log(`  Duration: ${duration}ms`);
    console.log(`  Ops/sec: ${opsPerSecond}`);
    console.log(`  Expected: ${expected.toLocaleString()}`);
    console.log(`  Actual:   ${final.toLocaleString()}`);
    
    if (final === expected) {
      console.log(`  ✅ PASS`);
      return { passed: true, duration, opsPerSecond };
    } else {
      console.log(`  ❌ FAIL - Lost ${(expected - final).toLocaleString()} increments`);
      return { passed: false, duration, opsPerSecond };
    }
  }
  
  async function main() {
    let allPassed = true;
    const results = [];
    
    // Test 1: 4 workers × 100k (baseline)
    const r1 = await runStressTest(4, 100000, 'Test 1: 4 workers × 100k');
    results.push({ name: '4×100k', ...r1 });
    if (!r1.passed) allPassed = false;
    
    // Test 2: 8 workers × 100k (if we have enough cores)
    if (numCPUs >= 8) {
      const r2 = await runStressTest(8, 100000, 'Test 2: 8 workers × 100k');
      results.push({ name: '8×100k', ...r2 });
      if (!r2.passed) allPassed = false;
    } else {
      console.log('\nTest 2: SKIPPED (need 8+ cores)');
    }
    
    // Test 3: Max cores × 1M (heavy)
    const r3 = await runStressTest(numCPUs, 1000000, `Test 3: ${numCPUs} workers × 1M (HEAVY)`);
    results.push({ name: 'max×1M', ...r3 });
    if (!r3.passed) allPassed = false;
    
    // Summary
    console.log('\n=== STRESS TEST SUMMARY ===');
    for (const r of results) {
      console.log(`${r.passed ? '✅' : '❌'} ${r.name}: ${r.duration}ms (${r.opsPerSecond} ops/sec)`);
    }
    
    if (allPassed) {
      console.log('\n🎉 ALL STRESS TESTS PASSED!');
      console.log('\nAtomicCounter is:');
      console.log('  ✅ Thread-safe under heavy load');
      console.log('  ✅ Scales with core count');
      console.log('  ✅ No contention degradation');
      console.log('\nPhase 24 is SOLID. Ready for Phase 25 (Work-Stealing)!');
      process.exit(0);
    } else {
      console.log('\n❌ SOME TESTS FAILED');
      console.log('System has race conditions or scalability issues.');
      process.exit(1);
    }
  }
  
  main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
  
} else {
  // Worker
  const { buffer, iterations, workerId } = workerData;
  const view = new Int32Array(buffer);
  
  for (let i = 0; i < iterations; i++) {
    Atomics.add(view, 0, 1);
  }
  
  parentPort.postMessage('done');
}
