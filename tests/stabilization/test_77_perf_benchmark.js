// Test 77: Performance Benchmark - Work-Stealing vs Simple Pool
// THE TRUTH TEST: Is Chase-Lev actually faster?

const { Worker, isMainThread, workerData, parentPort } = require('worker_threads');
const { cpus } = require('os');
const { performance } = require('perf_hooks');

console.log('=== PERFORMANCE BENCHMARK ===\n');
console.log('Comparing: Simple Pool vs Work-Stealing (Chase-Lev)\n');

const numCPUs = cpus().length;
console.log(`System: ${numCPUs} CPU cores\n`);

// Test configuration
const TASK_COUNT = 100000;
const WORKER_COUNTS = [2, 4, numCPUs]; // Test scaling

if (isMainThread) {
  async function runBenchmark(name, workerCount, useWorkStealing) {
    console.log(`\n--- ${name} (${workerCount} workers) ---`);
    
    // Shared state
    const taskBuffer = new SharedArrayBuffer(TASK_COUNT * 4);
    const taskView = new Int32Array(taskBuffer);
    
    // Initialize tasks with work to do
    for (let i = 0; i < TASK_COUNT; i++) {
      taskView[i] = i + 1; // Task ID
    }
    
    // Completion tracking
    const completedBuffer = new SharedArrayBuffer(4);
    const completedView = new Int32Array(completedBuffer);
    Atomics.store(completedView, 0, 0);
    
    // For work-stealing: shared deque
    const dequeBuffer = useWorkStealing ? new SharedArrayBuffer(64 + 1024 * 4) : null;
    if (dequeBuffer) {
      const topView = new Int32Array(dequeBuffer, 0, 1);
      const bottomView = new Int32Array(dequeBuffer, 4, 1);
      Atomics.store(topView, 0, 0);
      Atomics.store(bottomView, 0, 0);
      
      // Push all tasks to deque
      const tasksView = new Int32Array(dequeBuffer, 64, 1024);
      for (let i = 0; i < Math.min(TASK_COUNT, 1024); i++) {
        tasksView[i] = i;
        Atomics.store(bottomView, 0, i + 1);
      }
    }
    
    const startTime = performance.now();
    
    // Spawn workers
    const workers = [];
    for (let i = 0; i < workerCount; i++) {
      const worker = new Worker(__filename, {
        workerData: {
          workerId: i,
          totalWorkers: workerCount,
          taskBuffer,
          completedBuffer,
          taskCount: TASK_COUNT,
          useWorkStealing,
          dequeBuffer,
          isOwner: i === 0
        }
      });
      workers.push(worker);
    }
    
    // Wait for all workers to complete
    await Promise.all(workers.map(w => 
      new Promise(resolve => {
        w.on('message', (msg) => {
          if (msg === 'done') resolve();
        });
      })
    ));
    
    // Terminate workers
    workers.forEach(w => w.terminate());
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    const throughput = TASK_COUNT / (duration / 1000);
    
    const completed = Atomics.load(completedView, 0);
    
    return {
      name,
      workerCount,
      duration: duration.toFixed(0),
      throughput: throughput.toFixed(0),
      completed,
      speedup: 0 // Will calculate later
    };
  }
  
  async function main() {
    const results = [];
    
    for (const workerCount of WORKER_COUNTS) {
      // Simple pool benchmark
      const simpleResult = await runBenchmark(
        'Simple Pool',
        workerCount,
        false
      );
      results.push(simpleResult);
      
      // Work-stealing benchmark
      const wsResult = await runBenchmark(
        'Work-Stealing',
        workerCount,
        true
      );
      results.push(wsResult);
    }
    
    // Calculate speedups and comparisons
    console.log('\n\n========== BENCHMARK RESULTS ==========\n');
    
    console.log('Configuration:');
    console.log(`  Tasks: ${TASK_COUNT.toLocaleString()}`);
    console.log(`  Workers tested: ${WORKER_COUNTS.join(', ')}\n`);
    
    console.log('Results by Worker Count:\n');
    
    for (const count of WORKER_COUNTS) {
      const simple = results.find(r => r.workerCount === count && r.name === 'Simple Pool');
      const ws = results.find(r => r.workerCount === count && r.name === 'Work-Stealing');
      
      const speedup = (parseFloat(ws.throughput) / parseFloat(simple.throughput));
      
      console.log(`${count} Workers:`);
      console.log(`  Simple Pool:     ${simple.duration}ms (${simple.throughput} tasks/sec)`);
      console.log(`  Work-Stealing:   ${ws.duration}ms (${ws.throughput} tasks/sec)`);
      console.log(`  Speedup:         ${speedup.toFixed(2)}x ${speedup > 1 ? '🔥' : '⚠️'}`);
      console.log();
    }
    
    // Summary
    const avgSpeedup = WORKER_COUNTS.map(count => {
      const simple = results.find(r => r.workerCount === count && r.name === 'Simple Pool');
      const ws = results.find(r => r.workerCount === count && r.name === 'Work-Stealing');
      return parseFloat(ws.throughput) / parseFloat(simple.throughput);
    }).reduce((a, b) => a + b, 0) / WORKER_COUNTS.length;
    
    console.log('=== SUMMARY ===\n');
    console.log(`Average Speedup: ${avgSpeedup.toFixed(2)}x`);
    
    if (avgSpeedup > 1.1) {
      console.log('\n✅ Work-Stealing is FASTER than Simple Pool!');
      console.log('Chase-Lev scheduling provides real performance benefits.');
    } else if (avgSpeedup > 0.9) {
      console.log('\n⚠️ Work-Stealing is COMPARABLE to Simple Pool');
      console.log('Overhead roughly equals benefits. Needs tuning.');
    } else {
      console.log('\n❌ Work-Stealing is SLOWER than Simple Pool');
      console.log('Overhead exceeds benefits. Needs investigation.');
    }
    
    // Best configuration
    const best = results.reduce((best, current) => 
      parseFloat(current.throughput) > parseFloat(best.throughput) ? current : best
    );
    
    console.log(`\nBest Configuration:`);
    console.log(`  ${best.name} with ${best.workerCount} workers`);
    console.log(`  ${best.throughput} tasks/sec (${best.duration}ms)`);
    
    process.exit(0);
  }
  
  main().catch(err => {
    console.error('Benchmark error:', err);
    process.exit(1);
  });
  
} else {
  // Worker code
  const { workerId, totalWorkers, taskBuffer, completedBuffer, 
          taskCount, useWorkStealing, dequeBuffer, isOwner } = workerData;
  
  const taskView = new Int32Array(taskBuffer);
  const completedView = new Int32Array(completedBuffer);
  
  let processed = 0;
  
  if (useWorkStealing) {
    // Work-stealing mode
    const topView = new Int32Array(dequeBuffer, 0, 1);
    const bottomView = new Int32Array(dequeBuffer, 4, 1);
    const tasksView = new Int32Array(dequeBuffer, 64, 1024);
    
    function popBottom() {
      const bottom = Atomics.load(bottomView, 0) - 1;
      Atomics.store(bottomView, 0, bottom);
      
      const top = Atomics.load(topView, 0);
      if (bottom < top) {
        Atomics.store(bottomView, 0, top);
        return null;
      }
      
      const index = bottom % 1024;
      const task = tasksView[index];
      
      if (bottom === top) {
        const casResult = Atomics.compareExchange(topView, 0, top, top + 1);
        if (casResult !== top) {
          Atomics.store(bottomView, 0, top + 1);
          return null;
        }
        Atomics.store(bottomView, 0, top + 1);
      }
      
      return task;
    }
    
    function steal() {
      const top = Atomics.load(topView, 0);
      const bottom = Atomics.load(bottomView, 0);
      if (bottom <= top) return null;
      
      const index = top % 1024;
      const task = tasksView[index];
      
      const casResult = Atomics.compareExchange(topView, 0, top, top + 1);
      if (casResult !== top) return null;
      
      return task;
    }
    
    // Owner pops, others steal
    let consecutiveEmpty = 0;
    const MAX_EMPTY = 1000;
    
    while (consecutiveEmpty < MAX_EMPTY) {
      const task = isOwner ? popBottom() : steal();
      
      if (task !== null) {
        // Simulate work
        let sum = 0;
        for (let i = 0; i < 100; i++) sum += i;
        
        Atomics.add(completedView, 0, 1);
        processed++;
        consecutiveEmpty = 0;
      } else {
        consecutiveEmpty++;
        Atomics.add(new Int32Array(new SharedArrayBuffer(4)), 0, 0);
      }
    }
    
  } else {
    // Simple pool mode: divide work evenly
    const chunkSize = Math.ceil(taskCount / totalWorkers);
    const start = workerId * chunkSize;
    const end = Math.min(start + chunkSize, taskCount);
    
    for (let i = start; i < end; i++) {
      // Simulate work
      let sum = 0;
      for (let j = 0; j < 100; j++) sum += j;
      
      Atomics.add(completedView, 0, 1);
      processed++;
    }
  }
  
  parentPort.postMessage('done');
}
