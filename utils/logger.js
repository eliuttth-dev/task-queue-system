
const chalk = require('chalk');

class Logger {
  constructor(context) {
    this.context = context;
  }

  log(...args) {
    console.log(chalk.green(`[${this.context}]`), ...args);
  }

  error(...args) {
    console.error(chalk.red(`[${this.context}]`), ...args);
  }
}

module.exports = Logger;

