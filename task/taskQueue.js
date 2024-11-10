
class TaskQueue {
  constructor() {
    this.queue = [];
  }

  addTask(task) {
    this.queue.push(task);
  }

  getNextTask() {
    return this.queue.shift();
  }

  getQueueLength() {
    return this.queue.length;
  }
}

module.exports = TaskQueue;

