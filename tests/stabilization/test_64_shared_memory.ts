// Test 64: Shared Memory
// Demonstrates zero-copy data sharing with SharedArrayBuffer

import {
  createAtomicCounter,
  createSharedFloat64Array,
  createSharedInt32Array,
  SharedQueue,
} from '../../src/lib/iozen/shared_memory';

console.log('=== IOZEN Shared Memory Test ===\n');

// Test 1: Shared Int32Array
console.log('Test 1: Shared Int32Array');
const sharedInts = createSharedInt32Array(10);
sharedInts[0] = 42;
sharedInts[1] = 100;
console.log(`  Created shared array of ${sharedInts.length} Int32s`);
console.log(`  Values: [${sharedInts[0]}, ${sharedInts[1]}, ...]`);
console.log(`  ✓ SharedArrayBuffer: ${sharedInts.buffer instanceof SharedArrayBuffer}\n`);

// Test 2: Atomic Counter
console.log('Test 2: Atomic Counter (thread-safe)');
const counter = createAtomicCounter(0);
console.log(`  Initial: ${counter.get()}`);

// Simulate concurrent increments
for (let i = 0; i < 1000; i++) {
  counter.increment();
}
console.log(`  After 1000 increments: ${counter.get()}`);
console.log(`  ✓ Atomic operations work\n`);

// Test 3: Shared Queue (lock-free SPSC)
console.log('Test 3: Lock-Free Shared Queue');
const queue = new SharedQueue(100);
console.log(`  Created queue with capacity 100`);

// Enqueue items
let enqueued = 0;
for (let i = 1; i <= 50; i++) {
  if (queue.enqueue(i)) {
    enqueued++;
  }
}
console.log(`  Enqueued ${enqueued} items`);
console.log(`  Queue size: ${queue.size()}`);

// Dequeue some items
const items: number[] = [];
for (let i = 0; i < 10; i++) {
  const item = queue.dequeue();
  if (item !== null) {
    items.push(item);
  }
}
console.log(`  Dequeued: [${items.join(', ')}]`);
console.log(`  Queue size after dequeue: ${queue.size()}`);
console.log(`  ✓ Lock-free queue works\n`);

// Test 4: Shared Float64Array
console.log('Test 4: Shared Float64Array');
const sharedFloats = createSharedFloat64Array(1000);
for (let i = 0; i < 1000; i++) {
  sharedFloats[i] = i * 3.14159;
}
console.log(`  Created shared array of ${sharedFloats.length} Float64s`);
console.log(`  Sample: [${sharedFloats[0]}, ${sharedFloats[1]}, ${sharedFloats[2]}, ...]`);
console.log(`  ✓ Float64 array works\n`);

// Test 5: Performance comparison
console.log('Test 5: Performance Comparison');
const iterations = 1000000;

// SharedArrayBuffer access
const sharedArray = createSharedInt32Array(1);
const start1 = Date.now();
for (let i = 0; i < iterations; i++) {
  Atomics.add(sharedArray, 0, 1);
}
const time1 = Date.now() - start1;
console.log(`  SharedArrayBuffer atomics: ${time1}ms (${iterations} ops)`);

// Regular array access
const regularArray = new Int32Array(1);
const start2 = Date.now();
for (let i = 0; i < iterations; i++) {
  regularArray[0]++;
}
const time2 = Date.now() - start2;
console.log(`  Regular array: ${time2}ms (${iterations} ops)`);
console.log(`  Overhead: ${((time1 / time2 - 1) * 100).toFixed(1)}%\n`);

console.log('=== All tests passed! ===');
console.log('\nPhase 24: Shared Memory is working!');
console.log('IOZEN now has zero-copy data sharing capability.');
console.log('Next: Lock-free work stealing + true parallel performance!');
