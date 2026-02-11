const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const path = require('path');
const { Queue } = require('bullmq');
const IORedis = require('ioredis');

const app = express();
app.use(cors());
app.use(express.json());

// TITAN_OS CLOUD NODE UPLINK
const REDIS_URL = "rediss://default:WR4PsdBO788Qyav9olhP50pmO9rLt80e@redis-13106.c17.us-east-1-4.ec2.cloud.redislabs.com:13106";

const redisOptions = {
  maxRetriesPerRequest: null,
  connectTimeout: 20000,
  reconnectOnError: (err) => {
    if (err.message.includes('READONLY')) return true;
    return false;
  }
};

if (REDIS_URL.startsWith('rediss://')) {
  redisOptions.tls = { rejectUnauthorized: false };
}

let redisConnection;
try {
  redisConnection = new IORedis(REDIS_URL, redisOptions);
  redisConnection.on('error', (err) => console.error('TITAN_REDIS_ERROR:', err.message));
  redisConnection.on('connect', () => console.log('TITAN_UPLINK_STABLE: Node database-MLIN3KYX synchronized.'));
} catch (e) {
  console.error('TITAN_REDIS_INIT_CRITICAL_FAIL:', e.message);
}

const relayQueue = redisConnection ? new Queue('RelayQueue', { connection: redisConnection }) : null;

const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let clients = [];
wss.on('connection', (ws) => {
  clients.push(ws);
  ws.send(JSON.stringify({ type: 'log', message: 'TITAN_NEURAL: Mission Hub Live. Cloud Bridge established.' }));
  ws.on('close', () => { clients = clients.filter(c => c !== ws); });
});

const broadcast = (data) => {
  const payload = JSON.stringify(data);
  clients.forEach(ws => { if (ws.readyState === WebSocket.OPEN) ws.send(payload); });
};

app.get('/api/health', async (req, res) => {
  try {
    const redisStatus = redisConnection ? redisConnection.status : 'disconnected';
    const waitingCount = (redisConnection && relayQueue) ? await relayQueue.getWaitingCount() : 0;
    res.json({
      status: 'UP',
      redis: redisStatus,
      queue: { waiting: waitingCount },
      uptime: process.uptime(),
      node: 'database-MLIN3KYX'
    });
  } catch (e) { res.status(500).json({ status: 'DOWN', error: e.message }); }
});

setInterval(async () => {
  if (!redisConnection || redisConnection.status !== 'ready' || !relayQueue) return;
  try {
    const [waiting, active, completed, failed] = await Promise.all([
      relayQueue.getWaitingCount(),
      relayQueue.getActiveCount(),
      relayQueue.getCompletedCount(),
      relayQueue.getFailedCount(),
    ]);
    broadcast({ type: 'queue_stats', stats: { waiting, active, completed, failed } });
  } catch (e) {}
}, 5000);

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return;
  res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n==========================================`);
  console.log(`TITAN OS COMMAND HUB: ONLINE`);
  console.log(`PORT: ${PORT}`);
  console.log(`NODE: database-MLIN3KYX`);
  console.log(`==========================================\n`);
});