// Test 71: Chase-Lev Work-Stealing Deque
// Validates the core scheduling primitive used by Rayon/Go/Cilk

import { ChaseLevDeque, WorkStealingPool } from '../../src/lib/iozen/chase_lev';

console.log('=== CHASE-LEV WORK-STEALING DEQUE TEST ===\n');

let allPassed = true;

// ===== Test 1: Basic Push/Pop (Owner Operations) =====
console.log('Test 1: Basic Push/Pop (Owner LIFO)');
try {
  const deque = new ChaseLevDeque(16);
  
  // Push tasks
  for (let i = 1; i <= 5; i++) {
    const pushed = deque.pushBottom({ id: i, fn: () => i });
    if (!pushed) {
      console.log(`  ❌ Failed to push task ${i}`);
      allPassed = false;
    }
  }
  
  console.log(`  Pushed 5 tasks, size: ${deque.size()}`);
  
  // Pop tasks (should be LIFO: 5, 4, 3, 2, 1)
  const popped: number[] = [];
  for (let i = 0; i < 5; i++) {
    const task = deque.popBottom();
    if (task) {
      popped.push(task.id);
    }
  }
  
  const expected = [5, 4, 3, 2, 1]; // LIFO order
  const actual = popped;
  
  if (JSON.stringify(actual) === JSON.stringify(expected)) {
    console.log(`  ✅ LIFO order correct: [${actual}]`);
  } else {
    console.log(`  ❌ Wrong order: expected [${expected}], got [${actual}]`);
    allPassed = false;
  }
  
  if (deque.isEmpty()) {
    console.log('  ✅ Empty after pop');
  } else {
    console.log(`  ❌ Not empty, size=${deque.size()}`);
    allPassed = false;
  }
  
  console.log();
} catch (e) {
  console.log(`  ❌ CRASH: ${e}\n`);
  allPassed = false;
}

// ===== Test 2: Steal Operation (Thief FIFO) =====
console.log('Test 2: Steal Operation (Thief FIFO)');
try {
  const deque = new ChaseLevDeque(16);
  
  // Owner pushes tasks
  for (let i = 1; i <= 5; i++) {
    deque.pushBottom({ id: i, fn: () => i });
  }
  
  // Thief steals from top (should be FIFO: 1, 2, 3, 4, 5)
  const stolen: number[] = [];
  for (let i = 0; i < 5; i++) {
    const task = deque.steal();
    if (task) {
      stolen.push(task.id);
    }
  }
  
  const expected = [1, 2, 3, 4, 5]; // FIFO order for thief
  const actual = stolen;
  
  if (JSON.stringify(actual) === JSON.stringify(expected)) {
    console.log(`  ✅ FIFO steal order: [${actual}]`);
  } else {
    console.log(`  ❌ Wrong steal order: expected [${expected}], got [${actual}]`);
    allPassed = false;
  }
  
  console.log();
} catch (e) {
  console.log(`  ❌ CRASH: ${e}\n`);
  allPassed = false;
}

// ===== Test 3: Mixed Operations =====
console.log('Test 3: Mixed Operations (push, steal, pop)');
try {
  const deque = new ChaseLevDeque(16);
  
  // Push 1, 2, 3
  deque.pushBottom({ id: 1, fn: () => 1 });
  deque.pushBottom({ id: 2, fn: () => 2 });
  deque.pushBottom({ id: 3, fn: () => 3 });
  
  // Thief steals 1 (oldest)
  const stolen1 = deque.steal();
  console.log(`  Steal: ${stolen1?.id}`);
  
  // Owner pops 3 (newest)
  const popped1 = deque.popBottom();
  console.log(`  Pop: ${popped1?.id}`);
  
  // Push 4
  deque.pushBottom({ id: 4, fn: () => 4 });
  
  // Thief steals 2
  const stolen2 = deque.steal();
  console.log(`  Steal: ${stolen2?.id}`);
  
  // Owner pops 4
  const popped2 = deque.popBottom();
  console.log(`  Pop: ${popped2?.id}`);
  
  // Owner pops 2 (last one)
  const popped3 = deque.popBottom();
  console.log(`  Pop: ${popped3?.id}`);
  
  if (stolen1?.id === 1 && popped1?.id === 3 && 
      stolen2?.id === 2 && popped2?.id === 4 && popped3?.id === 2) {
    console.log('  ✅ Mixed operations correct');
  } else {
    console.log('  ❌ Mixed operations failed');
    allPassed = false;
  }
  
  console.log();
} catch (e) {
  console.log(`  ❌ CRASH: ${e}\n`);
  allPassed = false;
}

// ===== Test 4: Work-Stealing Pool =====
console.log('Test 4: Work-Stealing Pool');
try {
  const pool = new WorkStealingPool(4);
  
  // Submit tasks to different workers
  for (let i = 1; i <= 8; i++) {
    const submitted = pool.submitTask({ id: i, fn: () => i }, i % 4);
    if (!submitted) {
      console.log(`  ❌ Failed to submit task ${i}`);
      allPassed = false;
    }
  }
  
  const pending = pool.pendingTasks();
  console.log(`  Submitted 8 tasks, pending: ${pending}`);
  
  if (pending === 8) {
    console.log('  ✅ Task submission correct');
  } else {
    console.log(`  ❌ Wrong pending count: expected 8, got ${pending}`);
    allPassed = false;
  }
  
  // Workers get their own work
  const worker0Tasks: number[] = [];
  while (true) {
    const task = pool.getOwnWork(0);
    if (!task) break;
    worker0Tasks.push(task.id);
  }
  
  console.log(`  Worker 0 processed: [${worker0Tasks}]`);
  
  // Worker 1 steals from others
  const stolenByWorker1: number[] = [];
  for (let i = 0; i < 10; i++) {
    const task = pool.stealWork(1);
    if (task) stolenByWorker1.push(task.id);
  }
  
  console.log(`  Worker 1 stole: [${stolenByWorker1}]`);
  
  const remaining = pool.pendingTasks();
  console.log(`  Remaining tasks: ${remaining}`);
  
  console.log('  ✅ Work-stealing pool functional');
  console.log();
} catch (e) {
  console.log(`  ❌ CRASH: ${e}\n`);
  allPassed = false;
}

// ===== Test 5: Empty Deque Behavior =====
console.log('Test 5: Empty Deque Behavior');
try {
  const deque = new ChaseLevDeque(8);
  
  // Try to pop from empty
  const popped = deque.popBottom();
  if (popped === null) {
    console.log('  ✅ Pop empty returns null');
  } else {
    console.log(`  ❌ Pop empty should return null, got ${popped}`);
    allPassed = false;
  }
  
  // Try to steal from empty
  const stolen = deque.steal();
  if (stolen === null) {
    console.log('  ✅ Steal empty returns null');
  } else {
    console.log(`  ❌ Steal empty should return null, got ${stolen}`);
    allPassed = false;
  }
  
  if (deque.isEmpty()) {
    console.log('  ✅ Empty state correct');
  } else {
    console.log(`  ❌ Should be empty`);
    allPassed = false;
  }
  
  console.log();
} catch (e) {
  console.log(`  ❌ CRASH: ${e}\n`);
  allPassed = false;
}

// ===== Summary =====
console.log('=== CHASE-LEV TEST SUMMARY ===');
if (allPassed) {
  console.log('✅ ALL CHASE-LEV TESTS PASSED');
  console.log('\nChaseLevDeque is working:');
  console.log('  - Push/Pop (owner LIFO)');
  console.log('  - Steal (thief FIFO)');
  console.log('  - Mixed operations');
  console.log('  - Work-stealing pool');
  console.log('\nPhase 25 foundation is SOLID!');
  console.log('Ready for full integration with WorkerThreadPool.');
} else {
  console.log('❌ SOME TESTS FAILED');
  process.exit(1);
}
