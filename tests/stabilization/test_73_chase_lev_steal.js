// Test 73: REAL Work-Stealing Test (FORCES stealing to happen)
// Strategy: Owner pushes all, then processes SLOWLY while thieves steal FAST

const { Worker, isMainThread, workerData, parentPort } = require('worker_threads');
const { cpus } = require('os');

// Simplified Chase-Lev for JS testing
class ChaseLevDeque {
  constructor(capacity = 1024) {
    this.capacity = capacity;
    this.buffer = new SharedArrayBuffer(64 + capacity * 4);
    this.topView = new Int32Array(this.buffer, 0, 1);
    this.bottomView = new Int32Array(this.buffer, 4, 1);
    
    Atomics.store(this.topView, 0, 0);
    Atomics.store(this.bottomView, 0, 0);
    
    this.tasks = new Array(capacity).fill(null);
  }
  
  pushBottom(taskId) {
    const bottom = Atomics.load(this.bottomView, 0);
    const top = Atomics.load(this.topView, 0);
    const size = bottom - top;
    
    if (size >= this.capacity - 1) return false;
    
    const index = bottom % this.capacity;
    this.tasks[index] = taskId;
    Atomics.store(this.bottomView, 0, bottom + 1);
    return true;
  }
  
  popBottom() {
    const bottom = Atomics.load(this.bottomView, 0) - 1;
    Atomics.store(this.bottomView, 0, bottom);
    
    const top = Atomics.load(this.topView, 0);
    const size = bottom - top;
    
    if (size < 0) {
      Atomics.store(this.bottomView, 0, top);
      return null;
    }
    
    const index = bottom % this.capacity;
    const taskId = this.tasks[index];
    
    if (size > 0) {
      this.tasks[index] = null;
      return taskId;
    }
    
    // Last item - race with thieves
    const topPlusOne = top + 1;
    const casResult = Atomics.compareExchange(this.topView, 0, top, topPlusOne);
    
    if (casResult !== top) {
      Atomics.store(this.bottomView, 0, topPlusOne);
      return null;
    }
    
    Atomics.store(this.bottomView, 0, topPlusOne);
    this.tasks[index] = null;
    return taskId;
  }
  
  steal() {
    const top = Atomics.load(this.topView, 0);
    const bottom = Atomics.load(this.bottomView, 0);
    const size = bottom - top;
    
    if (size <= 0) return null;
    
    const index = top % this.capacity;
    const taskId = this.tasks[index];
    
    const topPlusOne = top + 1;
    const casResult = Atomics.compareExchange(this.topView, 0, top, topPlusOne);
    
    if (casResult !== top) return null;
    
    this.tasks[index] = null;
    return taskId;
  }
  
  size() {
    const top = Atomics.load(this.topView, 0);
    const bottom = Atomics.load(this.bottomView, 0);
    return Math.max(0, bottom - top);
  }
}

if (isMainThread) {
  console.log('=== REAL WORK-STEALING TEST ===\n');
  console.log('Strategy: Owner pushes ALL, then processes SLOWLY');
  console.log('          Thieves steal FAST during owner delays\n');
  
  const numCPUs = cpus().length;
  console.log(`System: ${numCPUs} CPU cores\n`);
  
  const TOTAL_TASKS = 100000;
  const NUM_THIEVES = 4;
  const DEQUE_CAPACITY = 1024;
  
  console.log(`Test Configuration:`);
  console.log(`  Total tasks: ${TOTAL_TASKS.toLocaleString()}`);
  console.log(`  Thief threads: ${NUM_THIEVES}`);
  console.log(`  Strategy: Owner slow (1ms delay every 10 tasks)`);
  console.log(`           Thieves fast (no delay)\n`);
  
  const startTime = Date.now();
  
  // Shared tracking
  const pushedBuffer = new SharedArrayBuffer(4);
  const poppedBuffer = new SharedArrayBuffer(4);
  const stolenBuffer = new SharedArrayBuffer(4 * NUM_THIEVES); // Per-thief count
  const duplicateBuffer = new SharedArrayBuffer(4);
  const taskTrackingBuffer = new SharedArrayBuffer(TOTAL_TASKS);
  
  const pushedView = new Int32Array(pushedBuffer);
  const poppedView = new Int32Array(poppedBuffer);
  const stolenViews = Array.from({length: NUM_THIEVES}, (_, i) => 
    new Int32Array(stolenBuffer, i * 4, 1)
  );
  const duplicateView = new Int32Array(duplicateBuffer);
  const taskTracking = new Uint8Array(taskTrackingBuffer);
  
  // Spawn owner worker
  const ownerWorker = new Worker(__filename, {
    workerData: {
      role: 'owner',
      totalTasks: TOTAL_TASKS,
      capacity: DEQUE_CAPACITY,
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
      
      // Calculate results
      const pushed = Atomics.load(pushedView, 0);
      const popped = Atomics.load(poppedView, 0);
      
      const stolenPerThief = stolenViews.map(v => Atomics.load(v, 0));
      const totalStolen = stolenPerThief.reduce((a, b) => a + b, 0);
      
      // Count unique processed
      let uniqueProcessed = 0;
      for (let i = 0; i < TOTAL_TASKS; i++) {
        if (taskTracking[i] > 0) uniqueProcessed++;
      }
      
      const duplicates = Atomics.load(duplicateView, 0);
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
      
      // Analysis
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
        console.log(`     This means the test didn't stress work-stealing.`);
        console.log(`     Try increasing owner delay or reducing tasks.`);
        passed = false;
      }
      
      if (passed) {
        console.log(`\n  ✅ PASS: Work-stealing is FUNCTIONAL!`);
        console.log(`     Owner: ${(popped/totalProcessed*100).toFixed(1)}%`);
        console.log(`     Thieves: ${(totalStolen/totalProcessed*100).toFixed(1)}%`);
        console.log(`\n  Throughput: ${(totalProcessed / (duration / 1000)).toFixed(0)} ops/sec`);
        process.exit(0);
      } else {
        console.log('\n  ❌ FAIL: Issues detected!');
        process.exit(1);
      }
    }
  }
  
  // Error handling
  const handleError = (err) => {
    console.error('\n  ❌ WORKER ERROR:', err);
    process.exit(1);
  };
  
  ownerWorker.on('error', handleError);
  for (const thief of thiefWorkers) {
    thief.on('error', handleError);
  }
  
} else {
  // Worker code
  const { role, totalTasks, capacity, pushedBuffer, poppedBuffer, 
          stolenBuffer, duplicateBuffer, taskTrackingBuffer, thiefId } = workerData;
  
  if (role === 'owner') {
    const pushedView = new Int32Array(pushedBuffer);
    const poppedView = new Int32Array(poppedBuffer);
    const taskTracking = new Uint8Array(taskTrackingBuffer);
    
    const deque = new ChaseLevDeque(capacity);
    
    // STEP 1: Push ALL tasks first (fills the deque)
    for (let i = 0; i < totalTasks; i++) {
      // Wait if deque is full
      while (!deque.pushBottom(i)) {
        // Try to make room by popping
        const task = deque.popBottom();
        if (task !== null) {
          Atomics.add(poppedView, 0, 1);
          const current = Atomics.add(new Int32Array(new SharedArrayBuffer(4)), 0, 0);
          if (taskTracking[task] === 0) {
            taskTracking[task] = 1;
          } else {
            // Duplicate!
          }
        }
      }
      Atomics.add(pushedView, 0, 1);
    }
    
    // STEP 2: Process remaining tasks SLOWLY (allows thieves to steal)
    let processedCount = 0;
    while (true) {
      const task = deque.popBottom();
      if (task === null) break;
      
      Atomics.add(poppedView, 0, 1);
      if (taskTracking[task] === 0) {
        taskTracking[task] = 1;
      }
      
      processedCount++;
      
      // ARTIFICIAL DELAY: Every 10 tasks, sleep 1ms
      // This creates opportunity for thieves to steal
      if (processedCount % 10 === 0) {
        const start = Date.now();
        while (Date.now() - start < 1) {
          // Busy-wait 1ms (prevents event loop issues)
        }
      }
    }
    
    parentPort.postMessage('done');
    
  } else if (role === 'thief') {
    const stolenView = new Int32Array(stolenBuffer, thiefId * 4, 1);
    const duplicateView = new Int32Array(duplicateBuffer);
    const taskTracking = new Uint8Array(taskTrackingBuffer);
    
    const deque = new ChaseLevDeque(capacity);
    
    // Thief: Steal aggressively with NO delay
    let consecutiveEmpty = 0;
    const MAX_EMPTY = 50000; // Give up after many empty attempts
    
    while (consecutiveEmpty < MAX_EMPTY) {
      const task = deque.steal();
      
      if (task === null) {
        consecutiveEmpty++;
        // Very short yield
        Atomics.add(new Int32Array(new SharedArrayBuffer(4)), 0, 0);
      } else {
        consecutiveEmpty = 0;
        Atomics.add(stolenView, 0, 1);
        
        // Track with CAS to detect duplicates
        const prev = Atomics.compareExchange(
          new Int32Array(taskTrackingBuffer, task, 1), 
          0, 0, 1
        );
        
        if (prev === 1) {
          // Already processed!
          Atomics.add(duplicateView, 0, 1);
        }
      }
    }
    
    parentPort.postMessage('done');
  }
}
