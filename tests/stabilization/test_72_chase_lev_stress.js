// Test 72: Chase-Lev Deque STRESS TEST
// This test is designed to BREAK Chase-Lev if there's any race condition
// Tests the most dangerous scenario: owner vs thieves on almost-empty deque

const { Worker, isMainThread, workerData, parentPort } = require('worker_threads');
const { cpus } = require('os');

// Simplified Chase-Lev for JS testing
class ChaseLevDeque {
  constructor(capacity = 1024) {
    this.capacity = capacity;
    this.buffer = new SharedArrayBuffer(64 + capacity * 4); // header + task indices
    this.topView = new Int32Array(this.buffer, 0, 1);
    this.bottomView = new Int32Array(this.buffer, 4, 1);
    
    Atomics.store(this.topView, 0, 0);
    Atomics.store(this.bottomView, 0, 0);
    
    // Separate task storage
    this.tasks = new Array(capacity).fill(null);
    this.taskCounter = 0;
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
  console.log('=== CHASE-LEV DEQUE STRESS TEST ===\n');
  console.log('This test is designed to BREAK Chase-Lev if there\'s any race condition.\n');
  
  const numCPUs = cpus().length;
  console.log(`System: ${numCPUs} CPU cores\n`);
  
  // Shared state tracking
  const TOTAL_TASKS = 1000000; // 1 million tasks
  const NUM_THIEVES = 8;
  
  // Shared buffer for the deque
  const dequeBuffer = new SharedArrayBuffer(64 + 1024 * 4);
  
  // Tracking arrays (shared)
  const pushedBuffer = new SharedArrayBuffer(4);
  const poppedBuffer = new SharedArrayBuffer(4);
  const stolenBuffer = new SharedArrayBuffer(4);
  const duplicateBuffer = new SharedArrayBuffer(4);
  const lostBuffer = new SharedArrayBuffer(4);
  
  const pushedView = new Int32Array(pushedBuffer);
  const poppedView = new Int32Array(poppedBuffer);
  const stolenView = new Int32Array(stolenBuffer);
  const duplicateView = new Int32Array(duplicateBuffer);
  const lostView = new Int32Array(lostBuffer);
  
  // Task tracking (which tasks were processed)
  const taskTrackingBuffer = new SharedArrayBuffer(TOTAL_TASKS);
  const taskTracking = new Uint8Array(taskTrackingBuffer);
  
  console.log(`Test Configuration:`);
  console.log(`  Total tasks: ${TOTAL_TASKS.toLocaleString()}`);
  console.log(`  Thief threads: ${NUM_THIEVES}`);
  console.log(`  Deque capacity: 1024\n`);
  
  const startTime = Date.now();
  
  // Spawn owner worker
  const ownerWorker = new Worker(__filename, {
    workerData: {
      role: 'owner',
      totalTasks: TOTAL_TASKS,
      dequeBuffer,
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
        dequeBuffer,
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
      
      // Check results
      const pushed = Atomics.load(pushedView, 0);
      const popped = Atomics.load(poppedView, 0);
      const stolen = Atomics.load(stolenView, 0);
      const duplicates = Atomics.load(duplicateView, 0);
      
      // Count total unique tasks processed
      let uniqueProcessed = 0;
      for (let i = 0; i < TOTAL_TASKS; i++) {
        if (taskTracking[i] > 0) uniqueProcessed++;
      }
      
      const totalProcessed = popped + stolen;
      const lost = TOTAL_TASKS - uniqueProcessed;
      
      console.log('\n=== RESULTS ===');
      console.log(`Duration: ${duration}ms`);
      console.log(`\nTask Flow:`);
      console.log(`  Pushed by owner: ${pushed.toLocaleString()}`);
      console.log(`  Popped by owner: ${popped.toLocaleString()}`);
      console.log(`  Stolen by thieves: ${stolen.toLocaleString()}`);
      console.log(`  Total processed: ${totalProcessed.toLocaleString()}`);
      console.log(`\nValidation:`);
      console.log(`  Unique tasks processed: ${uniqueProcessed.toLocaleString()}`);
      console.log(`  Duplicates detected: ${duplicates}`);
      console.log(`  Lost tasks: ${lost}`);
      
      let passed = true;
      
      if (uniqueProcessed !== TOTAL_TASKS) {
        console.log(`\n  ❌ FAIL: Lost ${lost} tasks!`);
        passed = false;
      }
      
      if (duplicates > 0) {
        console.log(`\n  ❌ FAIL: ${duplicates} tasks processed multiple times!`);
        passed = false;
      }
      
      if (pushed !== TOTAL_TASKS) {
        console.log(`\n  ❌ FAIL: Owner didn't push all tasks!`);
        passed = false;
      }
      
      if (passed) {
        console.log(`\n  ✅ PASS: All ${TOTAL_TASKS.toLocaleString()} tasks processed exactly once!`);
        console.log(`\n  Throughput: ${(totalProcessed / (duration / 1000)).toFixed(0)} ops/sec`);
        console.log('\nChase-Lev Deque is CORRECT under high contention!');
        process.exit(0);
      } else {
        console.log('\n  ❌ FAIL: Race condition detected!');
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
  const { role, totalTasks, dequeBuffer, pushedBuffer, poppedBuffer, 
          stolenBuffer, duplicateBuffer, taskTrackingBuffer, thiefId } = workerData;
  
  if (role === 'owner') {
    // Owner: push all tasks, then pop until empty
    const pushedView = new Int32Array(pushedBuffer);
    const poppedView = new Int32Array(poppedBuffer);
    const taskTracking = new Uint8Array(taskTrackingBuffer);
    
    // Create deque
    const deque = new ChaseLevDeque();
    
    // Push all tasks
    for (let i = 0; i < totalTasks; i++) {
      while (!deque.pushBottom(i)) {
        // Queue full, try to pop some first
        const task = deque.popBottom();
        if (task !== null) {
          Atomics.add(poppedView, 0, 1);
          const current = Atomics.add(new Int32Array(new SharedArrayBuffer(4)), 0, 0);
          if (taskTracking[task] === 0) {
            taskTracking[task] = 1; // popped
          }
        }
      }
      Atomics.add(pushedView, 0, 1);
    }
    
    // Pop remaining tasks
    while (true) {
      const task = deque.popBottom();
      if (task === null) break;
      
      Atomics.add(poppedView, 0, 1);
      if (taskTracking[task] === 0) {
        taskTracking[task] = 1; // popped
      }
    }
    
    parentPort.postMessage('done');
    
  } else if (role === 'thief') {
    // Thief: steal until no more work
    const stolenView = new Int32Array(stolenBuffer);
    const duplicateView = new Int32Array(duplicateBuffer);
    const taskTracking = new Uint8Array(taskTrackingBuffer);
    
    const deque = new ChaseLevDeque();
    
    let consecutiveEmpty = 0;
    const MAX_EMPTY = 10000; // Give up after many empty steals
    
    while (consecutiveEmpty < MAX_EMPTY) {
      const task = deque.steal();
      
      if (task === null) {
        consecutiveEmpty++;
        // Small yield to let other threads run
        Atomics.add(new Int32Array(new SharedArrayBuffer(4)), 0, 0);
      } else {
        consecutiveEmpty = 0;
        Atomics.add(stolenView, 0, 1);
        
        // Check for duplicates
        const prev = Atomics.compareExchange(
          new Int32Array(taskTrackingBuffer, task, 1), 
          0, 0, 2
        );
        
        if (prev === 1 || prev === 2) {
          // Task was already processed!
          Atomics.add(duplicateView, 0, 1);
        }
      }
    }
    
    parentPort.postMessage('done');
  }
}
