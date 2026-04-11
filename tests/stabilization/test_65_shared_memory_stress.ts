// Test 65: Shared Memory Stress Test
// CRITICAL: Verify atomicity, consistency, and correctness under heavy load
// Rule: NO CLAIM without passing these tests

import {
    createAtomicCounter,
    createSharedInt32Array,
    SharedQueue,
} from '../../src/lib/iozen/shared_memory';
import { WorkerThreadPool } from '../../src/lib/iozen/worker_pool';

console.log('=== SHARED MEMORY STRESS TEST ===');
console.log('Rule: If any test fails, Phase 24 is NOT complete\n');

// ===== Test 1: Atomic Counter Correctness =====
// 1M increments from multiple threads must equal exactly 1M

async function testAtomicCounter(): Promise<boolean> {
  console.log('Test 1: Atomic Counter (1M increments from 4 threads)');
  console.log('  Expected: 1,000,000');

  const counter = createAtomicCounter(0);
  const pool = new WorkerThreadPool(4);

  // 4 threads, each incrementing 250,000 times
  const incrementsPerWorker = 250000;
  const promises: Promise<void>[] = [];

  for (let w = 0; w < 4; w++) {
    const promise = pool.execute(() => {
      // Worker receives counter buffer and performs increments
      const view = new Int32Array(counter.buffer);
      for (let i = 0; i < incrementsPerWorker; i++) {
        Atomics.add(view, 0, 1);
      }
    });
    promises.push(promise.then(() => {}));
  }

  await Promise.all(promises);

  const finalValue = counter.get();
  const expected = 1000000;
  const passed = finalValue === expected;

  console.log(`  Actual: ${finalValue.toLocaleString()}`);
  console.log(`  Status: ${passed ? '✅ PASS' : '❌ FAIL - RACE CONDITION DETECTED'}`);
  if (!passed) {
    console.log(`  ERROR: Lost ${expected - finalValue} increments!`);
  }
  console.log();

  pool.terminate();
  return passed;
}

// ===== Test 2: Shared Array Consistency =====
// Multiple threads write to different indices, verify no corruption

async function testSharedArrayConsistency(): Promise<boolean> {
  console.log('Test 2: Shared Array Consistency (1000 elements, 4 writers)');

  const ARRAY_SIZE = 1000;
  const NUM_WORKERS = 4;
  const WRITES_PER_WORKER = 10000;

  const sharedArray = createSharedInt32Array(ARRAY_SIZE);
  const pool = new WorkerThreadPool(NUM_WORKERS);

  // Each worker writes to specific indices
  // Worker 0: indices 0-249, Worker 1: 250-499, etc.
  const promises: Promise<void>[] = [];

  for (let w = 0; w < NUM_WORKERS; w++) {
    const startIdx = w * (ARRAY_SIZE / NUM_WORKERS);
    const endIdx = startIdx + (ARRAY_SIZE / NUM_WORKERS);

    const promise = pool.execute(() => {
      const view = new Int32Array(sharedArray.buffer);
      for (let i = 0; i < WRITES_PER_WORKER; i++) {
        const idx = Math.floor(Math.random() * (endIdx - startIdx)) + startIdx;
        view[idx] = w + 1; // Write worker ID + 1
      }
    });
    promises.push(promise.then(() => {}));
  }

  await Promise.all(promises);

  // Verify: Each element should have a valid worker ID (1-4)
  let errors = 0;
  for (let i = 0; i < ARRAY_SIZE; i++) {
    const value = sharedArray[i];
    if (value < 1 || value > NUM_WORKERS) {
      errors++;
    }
  }

  const passed = errors === 0;
  console.log(`  Elements written: ${ARRAY_SIZE}`);
  console.log(`  Corruption errors: ${errors}`);
  console.log(`  Status: ${passed ? '✅ PASS' : '❌ FAIL - MEMORY CORRUPTION'}`);
  console.log();

  pool.terminate();
  return passed;
}

// ===== Test 3: Shared Queue Stress Test =====
// Multi-producer / multi-consumer scenario

async function testSharedQueue(): Promise<boolean> {
  console.log('Test 3: Shared Queue (3 producers, 3 consumers, 100k items)');

  const queue = new SharedQueue(1000);
  const pool = new WorkerThreadPool(6);
  const ITEMS_PER_PRODUCER = 33333;
  const NUM_PRODUCERS = 3;
  const NUM_CONSUMERS = 3;

  // Track produced/consumed
  const producedCounter = createAtomicCounter(0);
  const consumedCounter = createAtomicCounter(0);

  // Producers
  const producerPromises: Promise<void>[] = [];
  for (let p = 0; p < NUM_PRODUCERS; p++) {
    const promise = pool.execute(() => {
      const prodView = new Int32Array(producedCounter.buffer);
      for (let i = 0; i < ITEMS_PER_PRODUCER; i++) {
        // Retry until enqueue succeeds
        while (!queue.enqueue(p + 1)) {
          // Queue full, retry
        }
        Atomics.add(prodView, 0, 1);
      }
    });
    producerPromises.push(promise.then(() => {}));
  }

  // Consumers
  const consumerPromises: Promise<void>[] = [];
  for (let c = 0; c < NUM_CONSUMERS; c++) {
    const promise = pool.execute(() => {
      const consView = new Int32Array(consumedCounter.buffer);
      let consumed = 0;
      while (consumed < ITEMS_PER_PRODUCER) {
        const item = queue.dequeue();
        if (item !== null) {
          consumed++;
          Atomics.add(consView, 0, 1);
        }
      }
    });
    consumerPromises.push(promise.then(() => {}));
  }

  await Promise.all([...producerPromises, ...consumerPromises]);

  const produced = producedCounter.get();
  const consumed = consumedCounter.get();
  const expected = ITEMS_PER_PRODUCER * NUM_PRODUCERS;

  const passed = produced === expected && consumed === expected;

  console.log(`  Expected produced/consumed: ${expected.toLocaleString()}`);
  console.log(`  Actually produced: ${produced.toLocaleString()}`);
  console.log(`  Actually consumed: ${consumed.toLocaleString()}`);
  console.log(`  Status: ${passed ? '✅ PASS' : '❌ FAIL - QUEUE INCONSISTENCY'}`);
  console.log();

  pool.terminate();
  return passed;
}

// ===== Test 4: Performance Baseline =====
// Compare 1 thread vs N threads speedup

async function testPerformanceSpeedup(): Promise<boolean> {
  console.log('Test 4: Performance Speedup (1 thread vs N threads)');

  const WORKLOAD_SIZE = 10000000; // 10M operations

  // Single thread baseline
  console.log('  Running single-threaded baseline...');
  const singleStart = Date.now();
  let singleResult = 0;
  for (let i = 0; i < WORKLOAD_SIZE; i++) {
    singleResult += i * i; // Some computation
  }
  const singleTime = Date.now() - singleStart;

  // Multi-threaded
  const pool = new WorkerThreadPool();
  const numWorkers = pool.getNumWorkers();
  const chunkSize = Math.ceil(WORKLOAD_SIZE / numWorkers);

  console.log(`  Running with ${numWorkers} threads...`);
  const multiStart = Date.now();

  const promises: Promise<number>[] = [];
  for (let w = 0; w < numWorkers; w++) {
    const start = w * chunkSize;
    const end = Math.min(start + chunkSize, WORKLOAD_SIZE);

    const promise = pool.execute(() => {
      let sum = 0;
      for (let i = start; i < end; i++) {
        sum += i * i;
      }
      return sum;
    });
    promises.push(promise);
  }

  const results = await Promise.all(promises);
  const multiResult = results.reduce((a, b) => a + b, 0);
  const multiTime = Date.now() - multiStart;

  // Verify correctness
  const resultsMatch = singleResult === multiResult;
  const speedup = singleTime / multiTime;

  console.log(`  Single-threaded: ${singleTime}ms (result: ${singleResult})`);
  console.log(`  Multi-threaded:  ${multiTime}ms (result: ${multiResult})`);
  console.log(`  Speedup: ${speedup.toFixed(2)}x`);
  console.log(`  Results match: ${resultsMatch ? '✅' : '❌'}`);

  // Accept if speedup > 1.5x (not perfect scaling but significant)
  const passed = resultsMatch && speedup > 1.5;
  console.log(`  Status: ${passed ? '✅ PASS' : '❌ FAIL - Poor parallelization'}`);
  console.log();

  pool.terminate();
  return passed;
}

// ===== Run All Tests =====

async function runAllTests() {
  const results: { name: string; passed: boolean }[] = [];

  try {
    results.push({ name: 'Atomic Counter', passed: await testAtomicCounter() });
  } catch (e) {
    console.log(`  ❌ CRASH: ${e}\n`);
    results.push({ name: 'Atomic Counter', passed: false });
  }

  try {
    results.push({ name: 'Array Consistency', passed: await testSharedArrayConsistency() });
  } catch (e) {
    console.log(`  ❌ CRASH: ${e}\n`);
    results.push({ name: 'Array Consistency', passed: false });
  }

  try {
    results.push({ name: 'Queue Stress', passed: await testSharedQueue() });
  } catch (e) {
    console.log(`  ❌ CRASH: ${e}\n`);
    results.push({ name: 'Queue Stress', passed: false });
  }

  try {
    results.push({ name: 'Performance Speedup', passed: await testPerformanceSpeedup() });
  } catch (e) {
    console.log(`  ❌ CRASH: ${e}\n`);
    results.push({ name: 'Performance Speedup', passed: false });
  }

  // ===== Summary =====
  console.log('=== TEST SUMMARY ===');
  const allPassed = results.every(r => r.passed);

  for (const result of results) {
    console.log(`  ${result.passed ? '✅' : '❌'} ${result.name}`);
  }

  console.log();
  if (allPassed) {
    console.log('🎉 ALL TESTS PASSED - Phase 24 is VERIFIED');
    console.log('Shared memory implementation is CORRECT and SAFE');
    process.exit(0);
  } else {
    console.log('❌ SOME TESTS FAILED - Phase 24 needs fixes');
    console.log('Do NOT claim complete until all tests pass!');
    process.exit(1);
  }
}

runAllTests();
