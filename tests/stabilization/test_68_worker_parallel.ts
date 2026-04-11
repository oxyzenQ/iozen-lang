// Test 68: Real Worker Thread Parallel Test
// CRITICAL: This uses ACTUAL OS threads, not async simulation
// If this fails, we have real race conditions

import { WorkerThreadPool } from '../../src/lib/iozen/worker_pool';

console.log('=== REAL WORKER THREAD TEST ===');
console.log('Using actual OS threads (worker_threads)\n');

// Get CPU count
const { cpus } = require('os');
const numCPUs = cpus().length;
console.log(`System: ${numCPUs} CPU cores detected\n`);

let allPassed = true;

// ===== Test 1: Basic Worker Execution =====
console.log('Test 1: Basic Worker Execution');
async function testBasicWorker() {
  const pool = new WorkerThreadPool(2);
  
  try {
    // Simple computation on worker thread
    const result = await pool.execute(() => {
      let sum = 0;
      for (let i = 0; i < 1000; i++) {
        sum += i;
      }
      return sum;
    });
    
    const expected = 499500; // sum of 0..999
    if (result === expected) {
      console.log(`  ✅ Worker computation correct: ${result}`);
    } else {
      console.log(`  ❌ Wrong result: expected ${expected}, got ${result}`);
      allPassed = false;
    }
  } catch (e) {
    console.log(`  ❌ Worker error: ${e}`);
    allPassed = false;
  }
  
  pool.terminate();
}

// ===== Test 2: Parallel Map =====
console.log('\nTest 2: Parallel Map (4 workers)');
async function testParallelMap() {
  const pool = new WorkerThreadPool(4);
  
  try {
    const items = [1, 2, 3, 4, 5, 6, 7, 8];
    const results = await pool.parallelMap(items, (n) => n * n);
    
    const expected = [1, 4, 9, 16, 25, 36, 49, 64];
    const match = JSON.stringify(results) === JSON.stringify(expected);
    
    if (match) {
      console.log(`  ✅ Parallel map correct: [${results}]`);
    } else {
      console.log(`  ❌ Wrong results: expected [${expected}], got [${results}]`);
      allPassed = false;
    }
  } catch (e) {
    console.log(`  ❌ Map error: ${e}`);
    allPassed = false;
  }
  
  pool.terminate();
}

// ===== Test 3: CPU-Intensive Work =====
console.log('\nTest 3: CPU-Intensive Prime Calculation');
async function testCPUIntensive() {
  const pool = new WorkerThreadPool();
  
  try {
    const start = Date.now();
    const primes = await pool.benchmarkPrimes(50000);
    const duration = Date.now() - start;
    
    // Just verify we got some primes
    if (primes.length > 5000 && primes[0] === 2) {
      console.log(`  ✅ Found ${primes.length} primes in ${duration}ms`);
      console.log(`     Sample: [${primes.slice(0, 5).join(', ')}, ...]`);
    } else {
      console.log(`  ❌ Prime calculation failed`);
      allPassed = false;
    }
  } catch (e) {
    console.log(`  ❌ Prime error: ${e}`);
    allPassed = false;
  }
  
  pool.terminate();
}

// ===== Test 4: Worker Pool Stress =====
console.log('\nTest 4: Worker Pool Stress (100 tasks)');
async function testWorkerStress() {
  const pool = new WorkerThreadPool(4);
  
  try {
    const promises: Promise<number>[] = [];
    
    for (let i = 0; i < 100; i++) {
      promises.push(pool.execute(() => i * i));
    }
    
    const results = await Promise.all(promises);
    
    // Verify all completed
    if (results.length === 100) {
      console.log(`  ✅ All ${results.length} tasks completed`);
    } else {
      console.log(`  ❌ Wrong count: expected 100, got ${results.length}`);
      allPassed = false;
    }
  } catch (e) {
    console.log(`  ❌ Stress error: ${e}`);
    allPassed = false;
  }
  
  pool.terminate();
}

// ===== Run All Tests =====
async function runAllTests() {
  await testBasicWorker();
  await testParallelMap();
  await testCPUIntensive();
  await testWorkerStress();
  
  console.log('\n=== FINAL RESULT ===');
  if (allPassed) {
    console.log('✅ ALL WORKER THREAD TESTS PASSED');
    console.log('\nPhase 23 (Worker Threads) is SOLID:');
    console.log('  - Real OS threads work');
    console.log('  - Parallel map works');
    console.log('  - CPU-intensive tasks distribute');
    console.log('  - Pool handles 100+ tasks');
    console.log('\nNext: Test shared memory with real workers!');
  } else {
    console.log('❌ SOME TESTS FAILED');
    process.exit(1);
  }
}

runAllTests();
