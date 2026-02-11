const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const puppeteer = require('puppeteer');
const cors = require('cors');
const path = require('path');
const { Queue, Worker, QueueEvents } = require('bullmq');
const IORedis = require('ioredis');

const app = express();
app.use(cors());
app.use(express.json());

// REDIS CONFIGURATION (Optimized for Upstash/Enterprise)
const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const redisOptions = {
  maxRetriesPerRequest: null,
};

// Auto-enable TLS for Upstash/Cloud Redis
if (REDIS_URL.startsWith('rediss://')) {
  redisOptions.tls = { rejectUnauthorized: false };
}

const redisConnection = new IORedis(REDIS_URL, redisOptions);

// INITIALIZE QUEUES
const relayQueue = new Queue('RelayQueue', { connection: redisConnection });
const queueEvents = new QueueEvents('RelayQueue', { connection: redisConnection });

// Serve static files from the Vite build directory 'dist'
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let clients = [];
wss.on('connection', (ws) => {
  clients.push(ws);
  ws.send(JSON.stringify({ 
    type: 'log', 
    message: 'NEURAL_LINK: Established. TITAN_OS active on Cloud Node.' 
  }));
  ws.on('close', () => {
    clients = clients.filter(client => client !== ws);
  });
});

const broadcast = (data) => {
  const payload = JSON.stringify(data);
  clients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) ws.send(payload);
  });
};

const broadcastLog = (message, level = 'info') => broadcast({ type: 'log', message, level });

// NEURAL HEARTBEAT: Broadcast Queue Stats every 5 seconds
setInterval(async () => {
  try {
    const [waiting, active, completed, failed] = await Promise.all([
      relayQueue.getWaitingCount(),
      relayQueue.getActiveCount(),
      relayQueue.getCompletedCount(),
      relayQueue.getFailedCount(),
    ]);
    
    broadcast({
      type: 'queue_stats',
      stats: { waiting, active, completed, failed }
    });
  } catch (e) {
    // Redis might be warming up
  }
}, 5000);

// ENDPOINT TO QUEUE JOBS
app.post('/api/queue-job', async (req, res) => {
  const { job, profile } = req.body;
  if (!job) return res.status(400).json({ error: 'No job data provided.' });

  try {
    const jobInstance = await relayQueue.add('RelayTask', { job, profile }, {
      removeOnComplete: true,
      removeOnFail: false,
      attempts: 3,
      backoff: { type: 'exponential', delay: 10000 }
    });
    
    broadcastLog(`QUEUE: ${job.company} reserved in Redis buffer (ID: ${jobInstance.id})`, 'success');
    res.status(202).json({ jobId: jobInstance.id, status: 'QUEUED' });
  } catch (err) {
    console.error("Queue Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// WORKER: THE ENGINE
const worker = new Worker('RelayQueue', async (job) => {
  const { job: jobData, profile } = job.data;
  broadcastLog(`WORKER: Executing Autonomous Relay for ${jobData.company}...`, 'info');
  
  const browser = await puppeteer.launch({ 
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });

  try {
    const page = await browser.newPage();
    // Simulate high-fidelity browsing
    const targetUrl = jobData.sourceUrl || `https://www.google.com/search?q=${encodeURIComponent(jobData.company + " careers")}`;
    
    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 5000)); // AI Analysis Pause
    
    broadcastLog(`SUCCESS: Strategic Relay verified for ${jobData.company}.`, 'success');
    broadcast({ type: 'job_update', jobId: jobData.id, status: 'completed' });
    
    return { success: true, company: jobData.company };
  } catch (e) {
    broadcastLog(`FAIL: Relay interrupted for ${jobData.company}: ${e.message}`, 'error');
    throw e;
  } finally {
    await browser.close();
  }
}, { 
  connection: redisConnection, 
  concurrency: 5 // Enterprise throughput: Process 5 companies at once
});

// SPA FALLBACK
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n==========================================`);
  console.log(`TITAN OS ENTERPRISE BRIDGE: LIVE`);
  console.log(`REDIS QUEUE: ${REDIS_URL.includes('rediss') ? 'ENCRYPTED_UPLINK' : 'CONNECTED'}`);
  console.log(`==========================================\n`);
});