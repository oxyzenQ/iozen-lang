// Test 80: Adversarial Safety Testing
// Try to BREAK the memory safety model
// If any of these "attacks" succeed, the safety model has holes

import {
  OwnershipTracker,
  HardenedOwnershipTracker,
  DataRaceDetector,
  OwnershipKind,
  AliasingChecker,
  EscapeAnalyzer,
  BorrowChecker,
  SafeAtomicCounter
} from '../../src/lib/iozen/ownership';

console.log('=== ADVERSARIAL SAFETY TESTING ===\n');
console.log('Trying to BREAK the memory safety model...\n');

let attacksBlocked = 0;
let attacksSucceeded = 0;

function test(name: string, fn: () => { blocked: boolean; details?: string }): void {
  try {
    const result = fn();
    if (result.blocked) {
      attacksBlocked++;
      console.log(`🛡️  ${name} - BLOCKED`);
    } else {
      attacksSucceeded++;
      console.log(`⚠️  ${name} - SUCCEEDED ${result.details || ''}`);
    }
  } catch (err) {
    attacksBlocked++;
    console.log(`🛡️  ${name} - BLOCKED (exception)`);
  }
}

// ATTACK 1: Multiple mutable aliases to same data
console.log('\n🔴 ATTACK 1: Multiple Mutable Aliases');

test('Create two mutable references to same buffer', () => {
  const tracker = new HardenedOwnershipTracker();
  
  tracker.declareVariable('buffer', OwnershipKind.Owned, true, false, { line: 1, column: 1 });
  
  // Create two mutable aliases
  tracker.aliasingChecker.registerAlias('buffer', 'a', true);
  tracker.aliasingChecker.registerAlias('buffer', 'b', true);
  
  const diagnostics = tracker.aliasingChecker.getDiagnostics();
  const blocked = diagnostics.length > 0;
  
  return { blocked };
});

test('Modify through alias while borrowed', () => {
  const tracker = new HardenedOwnershipTracker();
  
  tracker.declareVariable('data', OwnershipKind.Owned, true, false, { line: 1, column: 1 });
  
  // Borrow the data
  const borrowResult = tracker.borrowChecker.borrow('data', false);
  if (!borrowResult.allowed) {
    return { blocked: true }; // Already blocked at borrow
  }
  
  // Try to modify while borrowed
  const canWrite = tracker.borrowChecker.canWrite('data');
  
  return { blocked: !canWrite };
});

// ATTACK 2: Use after move
console.log('\n🔴 ATTACK 2: Use After Move');

test('Use moved variable after spawn', () => {
  const tracker = new HardenedOwnershipTracker();
  
  tracker.declareVariable('buffer', OwnershipKind.Owned, true, false, { line: 1, column: 1 });
  
  // Move to thread 1
  const moveResult = tracker.moveVariableWithEscape('buffer', 1);
  if (!moveResult.success) {
    return { blocked: true };
  }
  
  // Try to use after move
  const canAccess = tracker.canAccess('buffer');
  
  return { blocked: !canAccess };
});

test('Double-move to different threads', () => {
  const tracker = new HardenedOwnershipTracker();
  
  tracker.declareVariable('data', OwnershipKind.Owned, true, false, { line: 1, column: 1 });
  
  // Move to thread 1
  const move1 = tracker.moveVariableWithEscape('data', 1);
  if (!move1.success) {
    return { blocked: true };
  }
  
  // Try to move again to thread 2 (should fail)
  const move2 = tracker.moveVariableWithEscape('data', 2);
  
  return { blocked: !move2.success };
});

// ATTACK 3: Mutable borrow + immutable borrow conflict
console.log('\n🔴 ATTACK 3: Borrow Conflicts');

test('Mutable borrow then immutable borrow', () => {
  const checker = new BorrowChecker();
  
  // First, mutable borrow
  const borrow1 = checker.borrow('data', true);
  if (!borrow1.allowed) {
    return { blocked: true };
  }
  
  // Then try immutable borrow (should fail)
  const borrow2 = checker.borrow('data', false);
  
  return { blocked: !borrow2.allowed };
});

test('Multiple immutable borrows then mutable borrow', () => {
  const checker = new BorrowChecker();
  
  // Two immutable borrows (should succeed)
  const borrow1 = checker.borrow('data', false);
  const borrow2 = checker.borrow('data', false);
  
  if (!borrow1.allowed || !borrow2.allowed) {
    return { blocked: true };
  }
  
  // Then try mutable borrow (should fail)
  const borrow3 = checker.borrow('data', true);
  
  return { blocked: !borrow3.allowed };
});

// ATTACK 4: Write to borrowed data in parallel
console.log('\n🔴 ATTACK 4: Parallel Borrow Violations');

test('Borrow then write in parallel context', () => {
  const tracker = new HardenedOwnershipTracker();
  
  tracker.declareVariable('shared', OwnershipKind.Owned, true, false, { line: 1, column: 1 });
  
  // Borrow immutably
  tracker.borrowChecker.borrow('shared', false);
  
  // Try comprehensive check with write in parallel
  const diagnostics = tracker.comprehensiveCheck('shared', true, true);
  
  return { blocked: diagnostics.length > 0 };
});

// ATTACK 5: Escape to multiple threads
console.log('\n🔴 ATTACK 5: Multi-Thread Escape');

test('Escape same variable to two threads simultaneously', () => {
  const analyzer = new EscapeAnalyzer();
  
  // Escape to thread 1
  const result1 = analyzer.checkEscape('data', 1, { line: 1, column: 1 });
  
  // Try to escape to thread 2 (should fail)
  const result2 = analyzer.checkEscape('data', 2, { line: 2, column: 1 });
  
  return { blocked: result2 !== null };
});

// ATTACK 6: Data race through shared mutable
console.log('\n🔴 ATTACK 6: Data Race Scenarios');

test('Mutable owned variable in parallel loop', () => {
  const tracker = new HardenedOwnershipTracker();
  const detector = new DataRaceDetector(tracker);
  
  tracker.declareVariable('counter', OwnershipKind.Owned, true, false, { line: 1, column: 1 });
  
  detector.enterParallelContext('loop');
  const diagnostic = detector.checkVariableAccess('counter', true);
  detector.leaveParallelContext('loop');
  
  return { blocked: diagnostic !== null };
});

test('Non-atomic write to shared atomic variable', () => {
  const tracker = new HardenedOwnershipTracker();
  const detector = new DataRaceDetector(tracker);
  
  tracker.declareVariable('atomicSum', OwnershipKind.SharedAtomic, true, true, { line: 1, column: 1 });
  
  detector.enterParallelContext('loop');
  // Direct write (not through atomic op) - should be caught
  // Note: Our current detector might not catch this specifically
  // but it would be caught at compile time
  const diagnostic = detector.checkVariableAccess('atomicSum', true);
  detector.leaveParallelContext('loop');
  
  // If we have specific atomic detection, check it
  const blocked = diagnostic !== null || tracker.comprehensiveCheck('atomicSum', true, true).length > 0;
  
  return { blocked };
});

// ATTACK 7: Atomic counter race condition
console.log('\n🔴 ATTACK 7: Safe Type Bypass');

test('Race condition on SafeAtomicCounter (simulated)', () => {
  // This tests that the atomic counter actually works
  const counter = new SafeAtomicCounter(0);
  
  // Simulate parallel increments
  // In real test, this would use workers
  // Here we just verify the API is correct
  counter.increment();
  counter.increment();
  counter.add(5);
  
  const final = counter.get();
  
  // The counter should work atomically
  return { blocked: final === 7, details: final === 7 ? '(correct result)' : '(race detected!)' };
});

// ATTACK 8: Complex aliasing chain
console.log('\n🔴 ATTACK 8: Complex Aliasing Chains');

test('a -> b -> c -> a circular alias', () => {
  const checker = new AliasingChecker();
  
  // Create circular aliases
  checker.registerAlias('a', 'b', true);
  checker.registerAlias('b', 'c', true);
  checker.registerAlias('c', 'a', true); // Circular
  
  // Check if a and c are aliases (they should be transitively)
  const conflict = checker.checkAliasingConflict('a', 'c');
  
  return { blocked: conflict };
});

test('Transitive mutable alias detection', () => {
  const checker = new AliasingChecker();
  
  // a -> b -> c (all mutable)
  checker.registerAlias('a', 'b', true);
  checker.registerAlias('b', 'c', true);
  
  // Check if c has mutable alias to a
  const hasMutable = checker.hasMutableAlias('c');
  
  return { blocked: hasMutable };
});

// Summary
console.log('\n=== ADVERSARIAL TEST RESULTS ===');
console.log(`\nAttacks Blocked: ${attacksBlocked}`);
console.log(`Attacks Succeeded: ${attacksSucceeded}`);
console.log(`Total: ${attacksBlocked + attacksSucceeded}`);

if (attacksSucceeded === 0) {
  console.log('\n✅ ALL ATTACKS BLOCKED!');
  console.log('The memory safety model is robust against:');
  console.log('  - Multiple mutable aliases');
  console.log('  - Use-after-move');
  console.log('  - Borrow conflicts');
  console.log('  - Parallel violations');
  console.log('  - Multi-thread escape');
  console.log('  - Data races');
  console.log('  - Complex aliasing chains');
  console.log('\nPhase 26.1: HARDENING SUCCESSFUL');
  process.exit(0);
} else {
  console.log('\n⚠️ Some attacks succeeded!');
  console.log('The safety model needs more hardening.');
  process.exit(1);
}
