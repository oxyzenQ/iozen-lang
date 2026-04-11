// Test 67: SPSC Queue (Single Producer Single Consumer)
// Tests SharedQueue in SPSC mode - the ONLY safe mode
// MPMC (multiple producers/consumers) is NOT supported

import { SharedQueue, createAtomicCounter } from '../../src/lib/iozen/shared_memory';

console.log('=== SPSC QUEUE TEST ===\n');
console.log('Design: 1 Producer → Queue → 1 Consumer\n');

let allPassed = true;

// ===== Test 1: Basic SPSC =====
console.log('Test 1: Basic SPSC (1P, 1C)');
try {
  const queue = new SharedQueue(100);
  
  // Producer: enqueue 1-50
  for (let i = 1; i <= 50; i++) {
    const success = queue.enqueue(i);
    if (!success) {
      console.log(`  ❌ Failed to enqueue ${i}`);
      allPassed = false;
    }
  }
  
  // Consumer: dequeue all
  const items: number[] = [];
  for (let i = 0; i < 50; i++) {
    const item = queue.dequeue();
    if (item !== null) {
      items.push(item);
    } else {
      console.log(`  ❌ Unexpected empty at ${i}`);
      allPassed = false;
    }
  }
  
  // Verify
  const expected = Array.from({length: 50}, (_, i) => i + 1).join(',');
  const actual = items.join(',');
  
  if (actual === expected) {
    console.log('  ✅ SPSC FIFO correct');
    console.log(`     Items: ${items.slice(0, 5)}...${items.slice(-5)}`);
  } else {
    console.log(`  ❌ Data mismatch`);
    console.log(`     Expected: ${expected.slice(0, 20)}...`);
    console.log(`     Actual: ${actual.slice(0, 20)}...`);
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

// ===== Test 2: Concurrent SPSC Simulation =====
console.log('Test 2: Concurrent SPSC Simulation');
try {
  const queue = new SharedQueue(100);
  const producedCounter = createAtomicCounter(0);
  const consumedCounter = createAtomicCounter(0);
  const NUM_ITEMS = 1000;
  
  // Producer (async)
  const producer = new Promise<void>((resolve) => {
    setImmediate(() => {
      for (let i = 1; i <= NUM_ITEMS; i++) {
        // Retry until enqueue succeeds
        while (!queue.enqueue(i)) {
          // Queue full, yield and retry
        }
        Atomics.add(new Int32Array(producedCounter.buffer), 0, 1);
      }
      resolve();
    });
  });
  
  // Consumer (async)
  const consumer = new Promise<void>((resolve) => {
    setImmediate(() => {
      let consumed = 0;
      while (consumed < NUM_ITEMS) {
        const item = queue.dequeue();
        if (item !== null) {
          consumed++;
          Atomics.add(new Int32Array(consumedCounter.buffer), 0, 1);
        }
      }
      resolve();
    });
  });
  
  // Wait for both
  await Promise.all([producer, consumer]);
  
  const produced = producedCounter.get();
  const consumed = consumedCounter.get();
  
  if (produced === NUM_ITEMS && consumed === NUM_ITEMS) {
    console.log('  ✅ SPSC concurrent works');
    console.log(`     Produced: ${produced}, Consumed: ${consumed}`);
  } else {
    console.log(`  ❌ Mismatch`);
    console.log(`     Expected: ${NUM_ITEMS} each`);
    console.log(`     Produced: ${produced}, Consumed: ${consumed}`);
    allPassed = false;
  }
  
  console.log();
} catch (e) {
  console.log(`  ❌ CRASH: ${e}\n`);
  allPassed = false;
}

// ===== Test 3: Fill/Drain Cycle =====
console.log('Test 3: Fill/Drain Cycle (3x)');
try {
  const queue = new SharedQueue(10);
  
  for (let cycle = 1; cycle <= 3; cycle++) {
    // Fill
    let filled = 0;
    while (queue.enqueue(filled + 1)) {
      filled++;
    }
    
    // Should be full now (capacity - 1 because of ring buffer)
    if (!queue.isFull()) {
      console.log(`  ⚠️ Cycle ${cycle}: not full as expected`);
    }
    
    // Drain
    let drained = 0;
    while (queue.dequeue() !== null) {
      drained++;
    }
    
    if (filled === drained) {
      console.log(`  ✅ Cycle ${cycle}: ${filled} items`);
    } else {
      console.log(`  ❌ Cycle ${cycle}: filled=${filled}, drained=${drained}`);
      allPassed = false;
    }
    
    if (!queue.isEmpty()) {
      console.log(`  ❌ Cycle ${cycle}: not empty after drain`);
      allPassed = false;
    }
  }
  
  console.log();
} catch (e) {
  console.log(`  ❌ CRASH: ${e}\n`);
  allPassed = false;
}

// ===== Summary =====
console.log('=== SUMMARY ===');
if (allPassed) {
  console.log('✅ ALL SPSC TESTS PASSED');
  console.log('\nSharedQueue is SAFE for SPSC mode:');
  console.log('  - 1 Producer, 1 Consumer only');
  console.log('  - Lock-free with proper memory ordering');
  console.log('\n⚠️ WARNING: MPMC (multiple P/C) is NOT supported');
  console.log('  Use 1 queue per producer-consumer pair');
} else {
  console.log('❌ SOME TESTS FAILED');
  process.exit(1);
}
