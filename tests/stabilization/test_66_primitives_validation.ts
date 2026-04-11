// Test 66: Core Primitives Validation
// FOCUSED: Test only the basics that MUST work
// Rule: If this fails, everything else is broken

import {
  createAtomicCounter,
  createSharedInt32Array,
  SharedQueue,
} from '../../src/lib/iozen/shared_memory';

console.log('=== CORE PRIMITIVES VALIDATION ===\n');

let allPassed = true;

// ===== Test 1: AtomicCounter Basic Operations =====
console.log('Test 1: AtomicCounter Basic');
try {
  const counter = createAtomicCounter(0);

  // Single-threaded test first
  for (let i = 0; i < 1000; i++) {
    counter.increment();
  }

  if (counter.get() === 1000) {
    console.log('  ✅ Basic increment works');
  } else {
    console.log(`  ❌ Expected 1000, got ${counter.get()}`);
    allPassed = false;
  }

  // Test decrement
  for (let i = 0; i < 500; i++) {
    counter.decrement();
  }

  if (counter.get() === 500) {
    console.log('  ✅ Decrement works');
  } else {
    console.log(`  ❌ Expected 500, got ${counter.get()}`);
    allPassed = false;
  }

  // Test set/get
  counter.set(42);
  if (counter.get() === 42) {
    console.log('  ✅ Set/get works');
  } else {
    console.log(`  ❌ Set/get failed`);
    allPassed = false;
  }

  console.log();
} catch (e) {
  console.log(`  ❌ CRASH: ${e}\n`);
  allPassed = false;
}

// ===== Test 2: SharedArrayBuffer Creation =====
console.log('Test 2: SharedArrayBuffer Creation');
try {
  const arr = createSharedInt32Array(100);

  // Verify it's actually shared
  if (arr.buffer instanceof SharedArrayBuffer) {
    console.log('  ✅ Creates SharedArrayBuffer');
  } else {
    console.log('  ❌ Not a SharedArrayBuffer');
    allPassed = false;
  }

  // Basic read/write
  arr[0] = 123;
  arr[99] = 456;

  if (arr[0] === 123 && arr[99] === 456) {
    console.log('  ✅ Read/write works');
  } else {
    console.log('  ❌ Read/write failed');
    allPassed = false;
  }

  // Atomics operations
  Atomics.store(arr, 0, 999);
  const loaded = Atomics.load(arr, 0);

  if (loaded === 999) {
    console.log('  ✅ Atomics store/load works');
  } else {
    console.log(`  ❌ Atomics failed: expected 999, got ${loaded}`);
    allPassed = false;
  }

  // Atomics add
  const before = Atomics.add(arr, 0, 1);
  const after = Atomics.load(arr, 0);

  if (before === 999 && after === 1000) {
    console.log('  ✅ Atomics add works');
  } else {
    console.log(`  ❌ Atomics add failed: before=${before}, after=${after}`);
    allPassed = false;
  }

  console.log();
} catch (e) {
  console.log(`  ❌ CRASH: ${e}\n`);
  allPassed = false;
}

// ===== Test 3: SharedQueue Single Thread =====
console.log('Test 3: SharedQueue Single Thread');
try {
  const queue = new SharedQueue(10);

  // Enqueue
  for (let i = 1; i <= 5; i++) {
    const success = queue.enqueue(i);
    if (!success) {
      console.log(`  ❌ Failed to enqueue ${i}`);
      allPassed = false;
    }
  }

  if (queue.size() === 5) {
    console.log('  ✅ Enqueue works');
  } else {
    console.log(`  ❌ Size wrong: expected 5, got ${queue.size()}`);
    allPassed = false;
  }

  // Dequeue
  const items: number[] = [];
  for (let i = 0; i < 5; i++) {
    const item = queue.dequeue();
    if (item !== null) {
      items.push(item);
    }
  }

  if (items.length === 5 && items.join(',') === '1,2,3,4,5') {
    console.log('  ✅ Dequeue works (FIFO)');
  } else {
    console.log(`  ❌ Dequeue wrong: got [${items.join(',')}]`);
    allPassed = false;
  }

  if (queue.isEmpty()) {
    console.log('  ✅ Empty state correct');
  } else {
    console.log(`  ❌ Should be empty, size=${queue.size()}`);
    allPassed = false;
  }

  console.log();
} catch (e) {
  console.log(`  ❌ CRASH: ${e}\n`);
  allPassed = false;
}

// ===== Test 4: AtomicCounter Multi-Threaded Simulation =====
console.log('Test 4: AtomicCounter Concurrent Simulation');
try {
  const counter = createAtomicCounter(0);
  const arr = new Int32Array(counter.buffer);

  // Simulate concurrent increments
  const promises: Promise<void>[] = [];

  for (let t = 0; t < 4; t++) {
    const promise = new Promise<void>((resolve) => {
      // Use setImmediate to simulate async
      setImmediate(() => {
        for (let i = 0; i < 10000; i++) {
          Atomics.add(arr, 0, 1);
        }
        resolve();
      });
    });
    promises.push(promise);
  }

  Promise.all(promises).then(() => {
    const final = counter.get();
    const expected = 40000;

    if (final === expected) {
      console.log('  ✅ Concurrent increments correct');
      console.log(`     Expected: ${expected}, Got: ${final}`);
    } else {
      console.log(`  ❌ Race condition detected!`);
      console.log(`     Expected: ${expected}, Got: ${final}`);
      console.log(`     Lost: ${expected - final} increments`);
      allPassed = false;
    }

    // ===== Summary =====
    console.log('\n=== VALIDATION SUMMARY ===');
    if (allPassed) {
      console.log('✅ ALL PRIMITIVES VALIDATED');
      console.log('Core shared memory works correctly');
      console.log('\nReady for: Worker thread integration');
    } else {
      console.log('❌ SOME TESTS FAILED');
      console.log('Fix before claiming Phase 24 complete!');
      process.exit(1);
    }
  });
} catch (e) {
  console.log(`  ❌ CRASH: ${e}\n`);
  allPassed = false;
}
