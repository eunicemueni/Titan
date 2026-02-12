import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const REDIS_URL = process.env.REDIS_URL;

let redisConnection = null;
let relayQueue = null;

// Graceful Redis Initialization for Background Mission Queues
if (REDIS_URL) {
  try {
    const redisOptions = {
      maxRetriesPerRequest: null,
      connectTimeout: 15000,
      tls: REDIS_URL.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined
    };
    redisConnection = new IORedis(REDIS_URL, redisOptions);
    redisConnection.on('error', (err) => console.warn('TITAN_REDIS_WAITING:', err.message));
    
    relayQueue = new Queue('RelayQueue', { connection: redisConnection });
    
    new Worker('RelayQueue', async job => {
      console.log(`[AUTONOMOUS_MISSION] Executing dispatch for: ${job.data.recipient}`);
      // Future Expansion: Puppeteer instance logic here
      return { status: 'SUCCESS' };
    }, { connection: redisConnection });
    
    console.log('TITAN_CORE: Mission Buffer Synchronized.');
  } catch (e) {
    console.error('TITAN_REDIS_ERROR:', e.message);
  }
}

// Serve static assets from the production /dist directory
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

let clients = [];
wss.on('connection', (ws) => {
  clients.push(ws);
  ws.send(JSON.stringify({ type: 'log', message: 'TITAN_NEURAL: Uplink established with Server Hub.', level: 'info' }));
  ws.on('close', () => { clients = clients.filter(c => c !== ws); });
});

app.post('/api/dispatch', async (req, res) => {
  if (!relayQueue) return res.status(503).json({ error: 'Background Queue Unavailable' });
  const { recipient, subject, body, type } = req.body;
  try {
    const job = await relayQueue.add('dispatch-job', { recipient, subject, body, type });
    res.json({ id: job.id, status: 'QUEUED' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * CRITICAL FOR RENDER: Rapid Health Check
 * Returning 200 OK signals Render that the container is healthy and ready to serve traffic.
 */
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ACTIVE',
    timestamp: new Date().toISOString(),
    node: 'TITAN_CORE_PRIMARY'
  });
});

// SPA Routing Fallback: Serve index.html for all non-API paths
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return;
  res.sendFile(path.join(distPath, 'index.html'));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`TITAN_OS: System online and listening on port ${PORT}`);
  console.log(`TITAN_OS: Serving production assets from ${distPath}`);
});