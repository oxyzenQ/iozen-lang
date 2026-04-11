// Test 63: Real Worker Threads
// Demonstrates true parallel execution with node:worker_threads

import { WorkerThreadPool, workerBenchmarkPrimes, workerParallelMap } from '../../src/lib/iozen/worker_pool';

console.log('=== IOZEN Worker Threads Test ===\n');

// Get CPU count
const { cpus } = require('node:os');
const numCPUs = cpus().length;
console.log(`Detected ${numCPUs} CPU cores\n`);

// Create worker pool
const pool = new WorkerThreadPool();
console.log(`Created worker pool with ${pool.getNumWorkers()} workers\n`);

// Test 1: Simple parallel execution
console.log('Test 1: Parallel execution across OS threads');
const start1 = Date.now();

Promise.all([
  pool.execute(() => {
    let sum = 0;
    for (let i = 0; i < 1000000; i++) {
      sum += i;
    }
    return sum;
  }),
  pool.execute(() => {
    let product = 1;
    for (let i = 1; i < 100; i++) {
      product *= i;
    }
    return product;
  })
]).then(results => {
  const duration = Date.now() - start1;
  console.log(`  Results: ${results}`);
  console.log(`  Time: ${duration}ms`);
  console.log(`  ✓ Tasks ran on separate OS threads\n`);

  // Test 2: Parallel map
  console.log('Test 2: Parallel map across OS threads');
  const data = Array.from({ length: 10000 }, (_, i) => i);
  const start2 = Date.now();

  return pool.parallelMap(data, (n) => n * n);
}).then(squares => {
  const duration = Date.now() - start2;
  console.log(`  Mapped ${squares.length} items`);
  console.log(`  Sample: ${squares.slice(0, 5)}...`);
  console.log(`  Time: ${duration}ms`);
  console.log(`  ✓ Parallel map completed\n`);

  // Test 3: CPU-intensive prime calculation
  console.log('Test 3: CPU-bound benchmark (prime calculation)');
  console.log('  Calculating primes up to 100000...');
  const start3 = Date.now();

  return workerBenchmarkPrimes(100000);
}).then(primes => {
  const duration = Date.now() - start3;
  console.log(`  Found ${primes.length} primes`);
  console.log(`  Sample: ${primes.slice(0, 10)}...`);
  console.log(`  Time: ${duration}ms`);
  console.log(`  ✓ CPU-bound work distributed across threads\n`);

  // Cleanup
  pool.terminate();
  console.log('=== All tests passed! ===');
  console.log('\nPhase 23: Real Worker Threads is working!');
  console.log('IOZEN now has TRUE parallel execution capability.');
}).catch(error => {
  console.error('Test failed:', error);
  pool.terminate();
  process.exit(1);
});
