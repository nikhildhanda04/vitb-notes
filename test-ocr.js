const path = require('path');
const { createWorker, OEM } = require('tesseract.js');

async function test() {
  console.log("Testing Tesseract worker creation...");
  console.log("CWD:", process.cwd());
  const workerPath = path.join(process.cwd(), "node_modules/tesseract.js/src/worker-script/node/index.js");
  console.log("Worker Path:", workerPath);
  
  try {
    const worker = await createWorker("eng", 1, {
        workerPath: workerPath,
    });
    console.log("Worker created successfully");
    await worker.terminate();
    console.log("Worker terminated");
  } catch (e) {
    console.error("Worker creation failed:", e);
  }
}

test();
