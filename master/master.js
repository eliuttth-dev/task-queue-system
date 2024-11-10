
const net = require('net');
const { EventEmitter } = require('events');
const chalk = require('chalk');
const { fork } = require('child_process');
const path = require('path');

const TaskQueue = require('../task/taskQueue.js');
const Logger = require('../utils/logger.js');

const PORT = 8000;

const taskQueue = new TaskQueue();
const events = new EventEmitter();
const logger = new Logger('MASTER');

let workers = [];

// Start the server for IPC
const server = net.createServer(socket => {
  logger.log('Worker connected');

  socket.on('data', data => {
    const messages = data.toString().split('\n').filter(Boolean);
    messages.forEach(messageStr => {
      const message = JSON.parse(messageStr);

      if (message.type === 'REQUEST_TASK') {
        const task = taskQueue.getNextTask();

        if (task) {
          socket.write(JSON.stringify({ type: 'TASK', task }) + '\n');
          logger.log(`Assigned task ${task.id} to worker`);
        } else {
          socket.write(JSON.stringify({ type: 'NO_TASK' }) + '\n');
        }
      } else if (message.type === 'TASK_COMPLETE') {
        logger.log(`Task ${message.taskId} completed by worker`);
      } else if (message.type === 'NEW_TASK') {
        taskQueue.addTask(message.task);
        logger.log(`Received new task from producer: ${message.task.id}`);
        socket.write(JSON.stringify({ type: 'TASK_RECEIVED', taskId: message.task.id }) + '\n');
      }
    });
  });

  socket.on('error', err => {
    logger.error('Socket error:', err.message);
  });
});

server.listen(PORT, () => {
  logger.log(`Master listening on port ${PORT}`);

  // Spawn worker processes
  const numCPUs = require('os').cpus().length;
  for (let i = 0; i < numCPUs; i++) {
    spawnWorker();
  }
});

function spawnWorker() {
  const workerProcess = fork(path.join(__dirname, '../worker/worker.js'));
  workers.push(workerProcess);

  workerProcess.on('exit', code => {
    logger.error(`Worker exited with code ${code}`);
    // Remove worker from list
    workers = workers.filter(w => w !== workerProcess);
    // Optionally respawn the worker
    spawnWorker();
  });
}

