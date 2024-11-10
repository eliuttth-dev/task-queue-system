
const net = require('net');
const Logger = require('../utils/logger');

const logger = new Logger(`WORKER ${process.pid}`);
const MASTER_PORT = 8000;
const MASTER_HOST = 'localhost';

const client = new net.Socket();

client.connect(MASTER_PORT, MASTER_HOST, () => {
  logger.log('Connected to master');

  requestTask();
});

client.on('data', data => {
  const messages = data.toString().split('\n').filter(Boolean);
  messages.forEach(messageStr => {
    const message = JSON.parse(messageStr);

    if (message.type === 'TASK') {
      const task = message.task;
      logger.log(`Received task ${task.id}`);

      // Process the task
      processTask(task)
        .then(() => {
          // Notify master of completion
          client.write(JSON.stringify({ type: 'TASK_COMPLETE', taskId: task.id }) + '\n');
          // Request next task
          requestTask();
        })
        .catch(err => {
          logger.error('Error processing task:', err.message);
          // Request next task
          requestTask();
        });
    } else if (message.type === 'NO_TASK') {
      // No task available, wait before requesting again
      setTimeout(() => {
        requestTask();
      }, 1000);
    }
  });
});

client.on('error', err => {
  logger.error('Connection error:', err.message);
});

function requestTask() {
  client.write(JSON.stringify({ type: 'REQUEST_TASK' }) + '\n');
}

function processTask(task) {
  return new Promise((resolve, reject) => {
    // Simulate task processing
    setTimeout(() => {
      logger.log(`Processed task ${task.id} with data ${task.data}`);
      resolve();
    }, Math.random() * 2000 + 1000); // Random delay between 1-3 seconds
  });
}

