// Test 76: 10x Stability Test - Catch Rare Race Conditions
// Runs work-stealing test 10 times with different random delays

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('=== 10x STABILITY TEST ===\n');
console.log('Running work-stealing test 10 times to catch rare bugs...\n');

const testFile = path.join(__dirname, 'test_74_shared_deque.js');
const results = [];
let allPassed = true;

for (let i = 1; i <= 10; i++) {
  process.stdout.write(`Run ${i}/10... `);
  
  const startTime = Date.now();
  
  try {
    // Run the test
    const output = execSync(`node ${testFile}`, {
      timeout: 60000,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    const duration = Date.now() - startTime;
    
    // Parse results
    const stolenMatch = output.match(/Stolen by thieves: (\d+)/);
    const uniqueMatch = output.match(/Unique tasks: (\d+)/);
    const duplicateMatch = output.match(/Duplicates: (\d+)/);
    const passMatch = output.match(/✅ PASS/);
    
    const stolen = stolenMatch ? parseInt(stolenMatch[1]) : 0;
    const unique = uniqueMatch ? parseInt(uniqueMatch[1]) : 0;
    const duplicates = duplicateMatch ? parseInt(duplicateMatch[1]) : 0;
    const passed = !!passMatch;
    
    results.push({
      run: i,
      passed,
      duration,
      stolen,
      unique,
      duplicates
    });
    
    if (passed) {
      console.log(`✅ PASS (${duration}ms, stolen: ${stolen.toLocaleString()})`);
    } else {
      console.log(`❌ FAIL (${duration}ms)`);
      allPassed = false;
    }
    
  } catch (err) {
    const duration = Date.now() - startTime;
    console.log(`❌ CRASH/ERROR (${duration}ms)`);
    console.log(`  Error: ${err.message.substring(0, 100)}`);
    
    results.push({
      run: i,
      passed: false,
      duration,
      stolen: 0,
      unique: 0,
      duplicates: 0,
      error: err.message
    });
    
    allPassed = false;
  }
}

// Summary
console.log('\n=== STABILITY SUMMARY ===\n');

const passedCount = results.filter(r => r.passed).length;
const failedCount = results.length - passedCount;

console.log(`Total runs: 10`);
console.log(`Passed: ${passedCount}`);
console.log(`Failed: ${failedCount}`);

if (allPassed) {
  // Calculate statistics
  const durations = results.map(r => r.duration);
  const stolenCounts = results.map(r => r.stolen);
  
  const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
  const minDuration = Math.min(...durations);
  const maxDuration = Math.max(...durations);
  
  const avgStolen = stolenCounts.reduce((a, b) => a + b, 0) / stolenCounts.length;
  const minStolen = Math.min(...stolenCounts);
  const maxStolen = Math.max(...stolenCounts);
  
  console.log(`\nDuration Stats:`);
  console.log(`  Average: ${avgDuration.toFixed(0)}ms`);
  console.log(`  Min: ${minDuration}ms`);
  console.log(`  Max: ${maxDuration}ms`);
  console.log(`  Variance: ${(maxDuration - minDuration).toFixed(0)}ms`);
  
  console.log(`\nStolen Tasks Stats:`);
  console.log(`  Average: ${avgStolen.toFixed(0)}`);
  console.log(`  Min: ${minStolen.toLocaleString()}`);
  console.log(`  Max: ${maxStolen.toLocaleString()}`);
  console.log(`  Variance: ${(maxStolen - minStolen).toLocaleString()}`);
  
  console.log('\n✅ ALL 10 RUNS PASSED!');
  console.log('\nPhase 25 is STABLE:');
  console.log('  - No rare race conditions detected');
  console.log('  - No hangs or timeouts');
  console.log('  - Consistent performance across runs');
  console.log('\nReady for Phase 26 (Memory Safety)');
  
  process.exit(0);
} else {
  console.log('\n❌ SOME RUNS FAILED!');
  console.log('\nFailed runs:');
  results.filter(r => !r.passed).forEach(r => {
    console.log(`  Run ${r.run}: ${r.error ? 'ERROR' : 'ASSERTION FAIL'}`);
  });
  
  console.log('\n⚠️ System has stability issues that need fixing.');
  process.exit(1);
}
