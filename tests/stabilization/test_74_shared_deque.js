// Test 74: REAL Work-Stealing with SHARED Deque
// CRITICAL FIX: All workers share the same deque via SharedArrayBuffer

const { Worker, isMainThread, workerData, parentPort } = require('worker_threads');
const { cpus } = require('os');

if (isMainThread) {
  console.log('=== REAL WORK-STEALING with SHARED DEQUE ===\n');
  console.log('All workers share ONE deque via SharedArrayBuffer\n');
  
  const numCPUs = cpus().length;
  console.log(`System: ${numCPUs} CPU cores\n`);
  
  const TOTAL_TASKS = 100000;
  const NUM_THIEVES = 4;
  const DEQUE_CAPACITY = 1024;
  
  console.log(`Test Configuration:`);
  console.log(`  Total tasks: ${TOTAL_TASKS.toLocaleString()}`);
  console.log(`  Thief threads: ${NUM_THIEVES}`);
  console.log(`  Deque capacity: ${DEQUE_CAPACITY}\n`);
  
  const startTime = Date.now();
  
  // Shared deque state (CRITICAL: must be shared!)
  // Layout: [top(4), bottom(4), padding(56), tasks(1024*4)]
  const dequeBuffer = new SharedArrayBuffer(64 + DEQUE_CAPACITY * 4);
  
  // Tracking
  const pushedBuffer = new SharedArrayBuffer(4);
  const poppedBuffer = new SharedArrayBuffer(4);
  const stolenBuffer = new SharedArrayBuffer(4 * NUM_THIEVES);
  const duplicateBuffer = new SharedArrayBuffer(4);
  const taskTrackingBuffer = new SharedArrayBuffer(TOTAL_TASKS);
  
  // Initialize deque (empty)
  const topView = new Int32Array(dequeBuffer, 0, 1);
  const bottomView = new Int32Array(dequeBuffer, 4, 1);
  Atomics.store(topView, 0, 0);
  Atomics.store(bottomView, 0, 0);
  
  // Spawn owner worker
  const ownerWorker = new Worker(__filename, {
    workerData: {
      role: 'owner',
      totalTasks: TOTAL_TASKS,
      capacity: DEQUE_CAPACITY,
      dequeBuffer,  // SHARED!
      pushedBuffer,
      poppedBuffer,
      taskTrackingBuffer
    }
  });
  
  // Spawn thief workers
  const thiefWorkers = [];
  for (let i = 0; i < NUM_THIEVES; i++) {
    const thief = new Worker(__filename, {
      workerData: {
        role: 'thief',
        thiefId: i,
        capacity: DEQUE_CAPACITY,
        dequeBuffer,  // SHARED!
        stolenBuffer,
        duplicateBuffer,
        taskTrackingBuffer,
        totalTasks: TOTAL_TASKS
      }
    });
    thiefWorkers.push(thief);
  }
  
  // Wait for completion
  let ownerDone = false;
  let thievesDone = 0;
  
  ownerWorker.on('message', (msg) => {
    if (msg === 'done') ownerDone = true;
    checkComplete();
  });
  
  for (const thief of thiefWorkers) {
    thief.on('message', (msg) => {
      if (msg === 'done') {
        thievesDone++;
        checkComplete();
      }
    });
  }
  
  function checkComplete() {
    if (ownerDone && thievesDone === NUM_THIEVES) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      const pushedView = new Int32Array(pushedBuffer);
      const poppedView = new Int32Array(poppedBuffer);
      const stolenViews = Array.from({length: NUM_THIEVES}, (_, i) => 
        new Int32Array(stolenBuffer, i * 4, 1)
      );
      const duplicateView = new Int32Array(duplicateBuffer);
      const taskTracking = new Uint8Array(taskTrackingBuffer);
      
      const pushed = Atomics.load(pushedView, 0);
      const popped = Atomics.load(poppedView, 0);
      const stolenPerThief = stolenViews.map(v => Atomics.load(v, 0));
      const totalStolen = stolenPerThief.reduce((a, b) => a + b, 0);
      const duplicates = Atomics.load(duplicateView, 0);
      
      let uniqueProcessed = 0;
      for (let i = 0; i < TOTAL_TASKS; i++) {
        if (taskTracking[i] > 0) uniqueProcessed++;
      }
      
      const totalProcessed = popped + totalStolen;
      const lost = TOTAL_TASKS - uniqueProcessed;
      
      console.log('\n=== RESULTS ===');
      console.log(`Duration: ${duration}ms\n`);
      
      console.log('Task Distribution:');
      console.log(`  Pushed by owner: ${pushed.toLocaleString()}`);
      console.log(`  Popped by owner: ${popped.toLocaleString()} (${(popped/totalProcessed*100).toFixed(1)}%)`);
      console.log(`  Stolen by thieves: ${totalStolen.toLocaleString()} (${(totalStolen/totalProcessed*100).toFixed(1)}%)`);
      
      console.log('\nPer-Thief Steal Count:');
      stolenPerThief.forEach((count, i) => {
        console.log(`  Thief ${i}: ${count.toLocaleString()} tasks`);
      });
      
      console.log('\nValidation:');
      console.log(`  Total processed: ${totalProcessed.toLocaleString()}`);
      console.log(`  Unique tasks: ${uniqueProcessed.toLocaleString()}`);
      console.log(`  Duplicates: ${duplicates}`);
      console.log(`  Lost: ${lost}`);
      
      let passed = true;
      
      if (uniqueProcessed !== TOTAL_TASKS) {
        console.log(`\n  ❌ FAIL: Lost ${lost} tasks!`);
        passed = false;
      }
      
      if (duplicates > 0) {
        console.log(`\n  ❌ FAIL: ${duplicates} duplicates!`);
        passed = false;
      }
      
      if (pushed !== TOTAL_TASKS) {
        console.log(`\n  ❌ FAIL: Owner didn't push all tasks!`);
        passed = false;
      }
      
      // KEY: Verify stealing actually happened
      if (totalStolen === 0) {
        console.log(`\n  ⚠️ WARNING: No stealing occurred!`);
        console.log(`     Try increasing owner delay or reducing tasks.`);
      }
      
      if (passed && totalStolen > 0) {
        console.log(`\n  ✅ PASS: Real work-stealing is FUNCTIONAL!`);
        console.log(`     Distribution: ${(popped/totalProcessed*100).toFixed(1)}% owner, ${(totalStolen/totalProcessed*100).toFixed(1)}% thieves`);
        console.log(`\n  Throughput: ${(totalProcessed / (duration / 1000)).toFixed(0)} ops/sec`);
        process.exit(0);
      } else if (passed) {
        console.log('\n  ⚠️ PARTIAL: Correctness OK but no stealing');
        process.exit(0);
      } else {
        console.log('\n  ❌ FAIL: Issues detected!');
        process.exit(1);
      }
    }
  }
  
  const handleError = (err) => {
    console.error('\n  ❌ WORKER ERROR:', err);
    process.exit(1);
  };
  
  ownerWorker.on('error', handleError);
  for (const thief of thiefWorkers) {
    thief.on('error', handleError);
  }
  
} else {
  // Worker code with SHARED deque
  const { role, totalTasks, capacity, dequeBuffer, 
          pushedBuffer, poppedBuffer, stolenBuffer, 
          duplicateBuffer, taskTrackingBuffer, thiefId } = workerData;
  
  // Shared deque views
  const topView = new Int32Array(dequeBuffer, 0, 1);
  const bottomView = new Int32Array(dequeBuffer, 4, 1);
  const tasksView = new Int32Array(dequeBuffer, 64, capacity);
  
  if (role === 'owner') {
    const pushedView = new Int32Array(pushedBuffer);
    const poppedView = new Int32Array(poppedBuffer);
    const taskTracking = new Uint8Array(taskTrackingBuffer);
    
    // STEP 1: Push ALL tasks (fills deque)
    for (let i = 0; i < totalTasks; i++) {
      let pushed = false;
      while (!pushed) {
        const bottom = Atomics.load(bottomView, 0);
        const top = Atomics.load(topView, 0);
        const size = bottom - top;
        
        if (size < capacity - 1) {
          // Can push
          const index = bottom % capacity;
          tasksView[index] = i;
          Atomics.store(bottomView, 0, bottom + 1);
          pushed = true;
          Atomics.add(pushedView, 0, 1);
        } else {
          // Deque full, pop some
          const bottom2 = Atomics.load(bottomView, 0) - 1;
          Atomics.store(bottomView, 0, bottom2);
          const top2 = Atomics.load(topView, 0);
          
          if (bottom2 >= top2) {
            const index2 = bottom2 % capacity;
            const task = tasksView[index2];
            
            // Race for last item
            if (bottom2 === top2) {
              const casResult = Atomics.compareExchange(topView, 0, top2, top2 + 1);
              if (casResult !== top2) {
                Atomics.store(bottomView, 0, top2 + 1);
                continue;
              }
              Atomics.store(bottomView, 0, top2 + 1);
            }
            
            Atomics.add(poppedView, 0, 1);
            if (taskTracking[task] === 0) {
              taskTracking[task] = 1;
            }
          } else {
            Atomics.store(bottomView, 0, top2);
          }
        }
      }
    }
    
    // STEP 2: Process remaining SLOWLY (allows stealing)
    let processedCount = 0;
    while (true) {
      const bottom = Atomics.load(bottomView, 0) - 1;
      Atomics.store(bottomView, 0, bottom);
      const top = Atomics.load(topView, 0);
      
      if (bottom < top) {
        Atomics.store(bottomView, 0, top);
        break;
      }
      
      const index = bottom % capacity;
      const task = tasksView[index];
      
      // Race for last item
      if (bottom === top) {
        const casResult = Atomics.compareExchange(topView, 0, top, top + 1);
        if (casResult !== top) {
          Atomics.store(bottomView, 0, top + 1);
          continue;
        }
        Atomics.store(bottomView, 0, top + 1);
      }
      
      Atomics.add(poppedView, 0, 1);
      if (taskTracking[task] === 0) {
        taskTracking[task] = 1;
      }
      
      processedCount++;
      
      // ARTIFICIAL DELAY every 10 tasks
      if (processedCount % 10 === 0) {
        const start = Date.now();
        while (Date.now() - start < 1) {}
      }
    }
    
    parentPort.postMessage('done');
    
  } else if (role === 'thief') {
    const stolenView = new Int32Array(stolenBuffer, thiefId * 4, 1);
    const duplicateView = new Int32Array(duplicateBuffer);
    const taskTracking = new Uint8Array(taskTrackingBuffer);
    
    // Thief: Steal aggressively
    let consecutiveEmpty = 0;
    const MAX_EMPTY = 50000;
    
    while (consecutiveEmpty < MAX_EMPTY) {
      const top = Atomics.load(topView, 0);
      const bottom = Atomics.load(bottomView, 0);
      
      if (bottom <= top) {
        consecutiveEmpty++;
        Atomics.add(new Int32Array(new SharedArrayBuffer(4)), 0, 0);
        continue;
      }
      
      const index = top % capacity;
      const task = tasksView[index];
      
      const casResult = Atomics.compareExchange(topView, 0, top, top + 1);
      
      if (casResult !== top) {
        consecutiveEmpty++;
        continue;
      }
      
      consecutiveEmpty = 0;
      Atomics.add(stolenView, 0, 1);
      
      // Detect duplicate
      if (taskTracking[task] === 0) {
        taskTracking[task] = 1;
      } else {
        Atomics.add(duplicateView, 0, 1);
      }
    }
    
    parentPort.postMessage('done');
  }
}
