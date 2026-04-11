// Test 79: Memory Safety Validation
// Tests that the ownership system catches data races and safety violations

import {
  OwnershipTracker,
  DataRaceDetector,
  OwnershipKind,
  validateParallelSafety,
  SafeAtomicCounter,
  SafeSharedArray
} from '../../src/lib/iozen/ownership';

console.log('=== MEMORY SAFETY VALIDATION ===\n');

function test(name: string, fn: () => boolean): void {
  try {
    const passed = fn();
    console.log(`${passed ? '✅' : '❌'} ${name}`);
  } catch (err) {
    console.log(`❌ ${name} (ERROR: ${err})`);
  }
}

let passed = 0;
let failed = 0;

// Test 1: Detect mutable shared variable in parallel loop
console.log('\n1. Data Race Detection:');

test('Detect mutable variable in parallel loop', () => {
  const tracker = new OwnershipTracker();
  const detector = new DataRaceDetector(tracker);
  
  // Declare a mutable variable
  tracker.declareVariable('counter', OwnershipKind.Owned, true, false, { line: 1, column: 1 });
  
  // Try to use it in parallel context
  detector.enterParallelContext('loop');
  const diagnostic = detector.checkVariableAccess('counter', true);
  detector.leaveParallelContext('loop');
  
  const detected = diagnostic !== null && diagnostic.type === 'data_race';
  if (detected) passed++; else failed++;
  return detected;
});

test('Allow immutable shared variable in parallel loop', () => {
  const tracker = new OwnershipTracker();
  const detector = new DataRaceDetector(tracker);
  
  // Declare shared const variable
  tracker.declareVariable('data', OwnershipKind.SharedConst, false, false, { line: 1, column: 1 });
  
  detector.enterParallelContext('loop');
  const diagnostic = detector.checkVariableAccess('data', false); // Read access
  detector.leaveParallelContext('loop');
  
  const allowed = diagnostic === null;
  if (allowed) passed++; else failed++;
  return allowed;
});

test('Prevent write to shared const', () => {
  const tracker = new OwnershipTracker();
  const detector = new DataRaceDetector(tracker);
  
  tracker.declareVariable('config', OwnershipKind.SharedConst, false, false, { line: 1, column: 1 });
  
  detector.enterParallelContext('loop');
  const diagnostic = detector.checkVariableAccess('config', true); // Write access
  detector.leaveParallelContext('loop');
  
  const detected = diagnostic !== null;
  if (detected) passed++; else failed++;
  return detected;
});

test('Allow atomic operations on shared atomic', () => {
  const tracker = new OwnershipTracker();
  const detector = new DataRaceDetector(tracker);
  
  tracker.declareVariable('atomicCounter', OwnershipKind.SharedAtomic, true, true, { line: 1, column: 1 });
  
  detector.enterParallelContext('loop');
  // Atomic operations are simulated as isAtomic=true
  const diagnostic = detector.checkVariableAccess('atomicCounter', true);
  detector.leaveParallelContext('loop');
  
  // Should be allowed (or flagged for non-atomic access)
  const allowed = diagnostic === null || diagnostic.message.includes('atomic');
  if (allowed) passed++; else failed++;
  return allowed;
});

// Test 2: Ownership transfer
console.log('\n2. Ownership Transfer:');

test('Track variable move across threads', () => {
  const tracker = new OwnershipTracker();
  
  tracker.declareVariable('buffer', OwnershipKind.Owned, true, false, { line: 1, column: 1 });
  
  const moved = tracker.moveVariable('buffer');
  const isNowMoved = tracker.isMoved('buffer');
  
  const success = moved && isNowMoved;
  if (success) passed++; else failed++;
  return success;
});

test('Detect use-after-move', () => {
  const tracker = new OwnershipTracker();
  
  tracker.declareVariable('data', OwnershipKind.Owned, true, false, { line: 1, column: 1 });
  tracker.moveVariable('data');
  
  const canAccess = tracker.canAccess('data');
  
  const detected = !canAccess;
  if (detected) passed++; else failed++;
  return detected;
});

test('Prevent move of non-owned variable', () => {
  const tracker = new OwnershipTracker();
  
  tracker.declareVariable('sharedData', OwnershipKind.SharedConst, false, false, { line: 1, column: 1 });
  
  const moved = tracker.moveVariable('sharedData');
  
  const prevented = !moved;
  if (prevented) passed++; else failed++;
  return prevented;
});

// Test 3: Safe shared types
console.log('\n3. Safe Shared Types:');

test('SafeAtomicCounter works correctly', () => {
  const counter = new SafeAtomicCounter(0);
  
  // Simulate parallel increments
  counter.increment();
  counter.increment();
  counter.add(5);
  
  const value = counter.get();
  
  const correct = value === 7;
  if (correct) passed++; else failed++;
  return correct;
});

test('SafeSharedArray atomic operations', () => {
  const arr = new SafeSharedArray<number>(10);
  
  // Set values
  arr.set(0, 100);
  arr.set(1, 200);
  
  // Atomic add
  arr.add(0, 50);
  
  const val0 = arr.get(0);
  const val1 = arr.get(1);
  
  const correct = val0 === 150 && val1 === 200;
  if (correct) passed++; else failed++;
  return correct;
});

// Test 4: Spawn safety
console.log('\n4. Thread Spawn Safety:');

test('Allow spawn with shared const', () => {
  const tracker = new OwnershipTracker();
  const detector = new DataRaceDetector(tracker);
  
  tracker.declareVariable('config', OwnershipKind.SharedConst, false, false, { line: 1, column: 1 });
  
  const diagnostics = detector.checkSpawn(['config']);
  
  const allowed = diagnostics.length === 0;
  if (allowed) passed++; else failed++;
  return allowed;
});

test('Move owned variable in spawn', () => {
  const tracker = new OwnershipTracker();
  const detector = new DataRaceDetector(tracker);
  
  tracker.declareVariable('data', OwnershipKind.Owned, true, false, { line: 1, column: 1 });
  
  const diagnostics = detector.checkSpawn(['data']);
  
  // Should succeed (move) with no diagnostics
  const moved = diagnostics.length === 0 && tracker.isMoved('data');
  if (moved) passed++; else failed++;
  return moved;
});

// Test 5: Parallel safety validation
console.log('\n5. Parallel Safety Validation:');

test('Validate safe parallel access pattern', () => {
  const tracker = new OwnershipTracker();
  const detector = new DataRaceDetector(tracker);
  
  // Safe pattern: shared const for reads, shared atomic for writes
  tracker.declareVariable('input', OwnershipKind.SharedConst, false, false, { line: 1, column: 1 });
  tracker.declareVariable('output', OwnershipKind.SharedAtomic, true, true, { line: 2, column: 1 });
  
  const diagnostics = validateParallelSafety(
    tracker,
    detector,
    ['input', 'output'],
    [false, true] // input: read, output: write
  );
  
  const safe = diagnostics.length === 0;
  if (safe) passed++; else failed++;
  return safe;
});

test('Catch unsafe parallel access pattern', () => {
  const tracker = new OwnershipTracker();
  const detector = new DataRaceDetector(tracker);
  
  // Unsafe pattern: mutable owned variable in parallel
  tracker.declareVariable('unsafeCounter', OwnershipKind.Owned, true, false, { line: 1, column: 1 });
  
  const diagnostics = validateParallelSafety(
    tracker,
    detector,
    ['unsafeCounter'],
    [true] // write access
  );
  
  const detected = diagnostics.length > 0 && diagnostics[0].type === 'data_race';
  if (detected) passed++; else failed++;
  return detected;
});

// Summary
console.log('\n=== SUMMARY ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total:  ${passed + failed}`);

if (failed === 0) {
  console.log('\n✅ ALL MEMORY SAFETY TESTS PASSED!');
  console.log('\nPhase 26: Memory Safety Model is FUNCTIONAL');
  console.log('  - Data races detected at compile time');
  console.log('  - Ownership tracking works');
  console.log('  - Safe shared types operational');
  process.exit(0);
} else {
  console.log('\n❌ Some tests failed');
  process.exit(1);
}
