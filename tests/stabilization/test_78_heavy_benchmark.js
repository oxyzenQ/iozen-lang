// Test 78: Heavy Workload Benchmark
// REAL CPU work (1-5ms per task) with imbalanced loads
// This is where work-stealing actually shines

const { Worker, isMainThread, workerData, parentPort } = require('worker_threads');
const { cpus } = require('os');
const { performance } = require('perf_hooks');

console.log('=== HEAVY WORKLOAD BENCHMARK ===\n');
console.log('Tasks: CPU-intensive (1-5ms each)');
console.log('Load: Imbalanced (tests rebalancing)\n');

const numCPUs = cpus().length;
console.log(`System: ${numCPUs} CPU cores\n`);

// Heavy task that takes 1-5ms
function heavyTask(id) {
  // Simulate CPU work (calculations that can't be optimized away)
  let result = id;
  for (let i = 0; i < 50000; i++) {
    result = (result * 31 + i) % 2147483647;
    result = Math.sqrt(result + 1);
    result = Math.floor(result);
  }
  return result;
}

// Test configuration
const TOTAL_WORK_TIME_MS = 5000; // 5 seconds of total CPU work
const HEAVY_TASK_TIME_MS = 2; // ~2ms per task
const TASK_COUNT = Math.floor(TOTAL_WORK_TIME_MS / HEAVY_TASK_TIME_MS); // ~2500 tasks

console.log(`Test Configuration:`);
console.log(`  Total work: ~${TOTAL_WORK_TIME_MS}ms CPU time`);
console.log(`  Task count: ${TASK_COUNT}`);
console.log(`  Per-task: ~${HEAVY_TASK_TIME_MS}ms\n`);

if (isMainThread) {
  async function runBenchmark(name, workerCount, useWorkStealing, imbalanced = false) {
    console.log(`\n--- ${name} (${workerCount} workers${imbalanced ? ', imbalanced' : ''}) ---`);

    const startTime = performance.now();

    // Create task list
    const tasks = [];
    for (let i = 0; i < TASK_COUNT; i++) {
      tasks.push({
        id: i,
        work: Math.random() * 50000 // Random work amount
      });
    }

    // For work-stealing: shared deque
    const dequeBuffer = useWorkStealing ? new SharedArrayBuffer(64 + 4096 * 4) : null;
    if (dequeBuffer) {
      const topView = new Int32Array(dequeBuffer, 0, 1);
      const bottomView = new Int32Array(dequeBuffer, 4, 1);
      Atomics.store(topView, 0, 0);
      Atomics.store(bottomView, 0, 0);

      // Push all tasks to deque
      const tasksView = new Int32Array(dequeBuffer, 64, 4096);
      const workView = new Float64Array(dequeBuffer, 64 + 4096 * 4, 4096);

      for (let i = 0; i < Math.min(tasks.length, 4096); i++) {
        tasksView[i] = tasks[i].id;
        workView[i] = tasks[i].work;
        Atomics.store(bottomView, 0, i + 1);
      }
    }

    // Completion tracking
    const completedBuffer = new SharedArrayBuffer(4);
    const completedView = new Int32Array(completedBuffer);
    Atomics.store(completedView, 0, 0);

    // Per-worker stats
    const workerStatsBuffer = new SharedArrayBuffer(workerCount * 8);
    const workerStatsView = new Float64Array(workerStatsBuffer);

    // Spawn workers
    const workers = [];
    for (let i = 0; i < workerCount; i++) {
      const worker = new Worker(__filename, {
        workerData: {
          workerId: i,
          totalWorkers: workerCount,
          taskCount: TASK_COUNT,
          useWorkStealing,
          dequeBuffer,
          completedBuffer,
          workerStatsBuffer,
          isOwner: i === 0,
          imbalanced,
          heavyTaskCode: heavyTask.toString()
        }
      });
      workers.push(worker);
    }

    // Wait for completion
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
    const completed = Atomics.load(completedView, 0);
    const throughput = completed / (duration / 1000);

    // Collect worker stats
    const workerLoads = [];
    for (let i = 0; i < workerCount; i++) {
      workerLoads.push(Atomics.load(new Int32Array(workerStatsBuffer, i * 4, 1), 0));
    }

    return {
      name,
      workerCount,
      duration: duration.toFixed(0),
      throughput: throughput.toFixed(0),
      completed,
      workerLoads,
      speedup: 0
    };
  }

  async function main() {
    const results = [];

    // Test 1: Balanced load, 4 workers
    const balancedSimple = await runBenchmark('Simple Pool (balanced)', 4, false, false);
    results.push(balancedSimple);

    const balancedWS = await runBenchmark('Work-Stealing (balanced)', 4, true, false);
    results.push(balancedWS);

    // Test 2: Imbalanced load (work-stealing advantage)
    const imbalancedSimple = await runBenchmark('Simple Pool (imbalanced)', 4, false, true);
    results.push(imbalancedSimple);

    const imbalancedWS = await runBenchmark('Work-Stealing (imbalanced)', 4, true, true);
    results.push(imbalancedWS);

    // Calculate speedups
    const balancedSpeedup = parseFloat(balancedWS.throughput) / parseFloat(balancedSimple.throughput);
    const imbalancedSpeedup = parseFloat(imbalancedWS.throughput) / parseFloat(imbalancedSimple.throughput);

    // Results
    console.log('\n\n========== HEAVY BENCHMARK RESULTS ==========\n');

    console.log('Balanced Load (4 workers):');
    console.log(`  Simple Pool:     ${balancedSimple.duration}ms (${balancedSimple.throughput} tasks/sec)`);
    console.log(`  Work-Stealing:   ${balancedWS.duration}ms (${balancedWS.throughput} tasks/sec)`);
    console.log(`  Speedup:         ${balancedSpeedup.toFixed(2)}x ${balancedSpeedup > 1 ? '🔥' : '⚠️'}`);

    console.log('\nImbalanced Load (4 workers):');
    console.log(`  Simple Pool:     ${imbalancedSimple.duration}ms (${imbalancedSimple.throughput} tasks/sec)`);
    console.log(`  Work-Stealing:   ${imbalancedWS.duration}ms (${imbalancedWS.throughput} tasks/sec)`);
    console.log(`  Speedup:         ${imbalancedSpeedup.toFixed(2)}x ${imbalancedSpeedup > 1 ? '🔥' : '⚠️'}`);

    console.log('\nLoad Distribution (Imbalanced Test):');
    console.log('  Work-Stealing per-worker:');
    imbalancedWS.workerLoads.forEach((load, i) => {
      const pct = (load / imbalancedWS.completed * 100).toFixed(1);
      console.log(`    Worker ${i}: ${load} tasks (${pct}%)`);
    });

    console.log('\n=== SUMMARY ===\n');

    if (imbalancedSpeedup > 1.2) {
      console.log('✅ Work-Stealing shows CLEAR advantage under imbalanced loads!');
      console.log(`   ${imbalancedSpeedup.toFixed(2)}x faster when load is uneven`);
      console.log('\n   This is the PRIMARY benefit of work-stealing:');
      console.log('   - Auto-rebalancing without coordination');
      console.log('   - Idle workers steal from busy workers');
    } else if (imbalancedSpeedup > 1.0) {
      console.log('⚠️ Work-Stealing shows marginal improvement');
      console.log('   Needs optimization or the imbalance was not severe enough');
    } else {
      console.log('❌ Work-Stealing did not improve imbalanced load handling');
      console.log('   Investigate implementation');
    }

    process.exit(0);
  }

  main().catch(err => {
    console.error('Benchmark error:', err);
    process.exit(1);
  });

} else {
  // Worker code
  const { workerId, totalWorkers, taskCount, useWorkStealing,
          dequeBuffer, completedBuffer, workerStatsBuffer,
          isOwner, imbalanced, heavyTaskCode } = workerData;

  // Parse heavy task function
  const heavyTask = eval(`(${heavyTaskCode})`);

  const completedView = new Int32Array(completedBuffer);
  const workerStatsView = new Int32Array(workerStatsBuffer, workerId * 4, 1);

  let processed = 0;

  if (useWorkStealing) {
    // Work-stealing mode
    const topView = new Int32Array(dequeBuffer, 0, 1);
    const bottomView = new Int32Array(dequeBuffer, 4, 1);
    const tasksView = new Int32Array(dequeBuffer, 64, 4096);
    const workView = new Float64Array(dequeBuffer, 64 + 4096 * 4, 4096);

    function popBottom() {
      const bottom = Atomics.load(bottomView, 0) - 1;
      Atomics.store(bottomView, 0, bottom);

      const top = Atomics.load(topView, 0);
      if (bottom < top) {
        Atomics.store(bottomView, 0, top);
        return null;
      }

      const index = bottom % 4096;
      const task = { id: tasksView[index], work: workView[index] };

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

      const index = top % 4096;
      const task = { id: tasksView[index], work: workView[index] };

      const casResult = Atomics.compareExchange(topView, 0, top, top + 1);
      if (casResult !== top) return null;

      return task;
    }

    // Owner pops, others steal
    let consecutiveEmpty = 0;
    const MAX_EMPTY = 500;

    while (consecutiveEmpty < MAX_EMPTY) {
      const task = isOwner ? popBottom() : steal();

      if (task !== null) {
        // Do heavy work
        heavyTask(task.id + task.work);

        Atomics.add(completedView, 0, 1);
        processed++;
        consecutiveEmpty = 0;
      } else {
        consecutiveEmpty++;
        Atomics.add(new Int32Array(new SharedArrayBuffer(4)), 0, 0);
      }
    }

  } else {
    // Simple pool mode
    if (imbalanced) {
      // Worker 0 gets 80% of work, others get 5% each
      const myShare = workerId === 0 ? 0.80 : 0.05;
      const startTask = Math.floor(taskCount * (workerId === 0 ? 0 : 0.80 + (workerId - 1) * 0.05));
      const endTask = Math.min(startTask + Math.floor(taskCount * myShare), taskCount);

      for (let i = startTask; i < endTask; i++) {
        heavyTask(i);
        Atomics.add(completedView, 0, 1);
        processed++;
      }
    } else {
      // Balanced division
      const chunkSize = Math.ceil(taskCount / totalWorkers);
      const start = workerId * chunkSize;
      const end = Math.min(start + chunkSize, taskCount);

      for (let i = start; i < end; i++) {
        heavyTask(i);
        Atomics.add(completedView, 0, 1);
        processed++;
      }
    }
  }

  Atomics.store(workerStatsView, 0, processed);
  parentPort.postMessage('done');
}
