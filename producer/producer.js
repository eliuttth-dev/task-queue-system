
const net = require('net');
const { program } = require('commander');
const Logger = require('../utils/logger');

program
  .option('-h, --host <host>', 'Master host', 'localhost')
  .option('-p, --port <port>', 'Master port', 8000)
  .parse(process.argv);

const MASTER_HOST = program.host;
const MASTER_PORT = parseInt(program.port);
const logger = new Logger('PRODUCER');

const client = new net.Socket();

client.connect(MASTER_PORT, MASTER_HOST, () => {
  logger.log('Connected to master');

  // Send tasks periodically
  setInterval(() => {
    const task = {
      id: Date.now(),
      data: Math.floor(Math.random() * 100),
    };

    client.write(JSON.stringify({ type: 'NEW_TASK', task }) + '\n');
    logger.log(`Submitted task ${task.id}`);
  }, 1000);
});

client.on('data', data => {
  const messages = data.toString().split('\n').filter(Boolean);
  messages.forEach(messageStr => {
    const message = JSON.parse(messageStr);
    logger.log('Received from master:', message);
  });
});

client.on('error', err => {
  logger.error('Connection error:', err.message);
});

client.on('close', () => {
  logger.log('Connection closed');
});

