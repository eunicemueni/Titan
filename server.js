import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import puppeteer from 'puppeteer-core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const REDIS_URL = process.env.REDIS_URL;
const PUPPETEER_PATH = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium';

let redisConnection = null;
let relayQueue = null;

// Autonomous Core Initialization
if (REDIS_URL) {
  try {
    redisConnection = new IORedis(REDIS_URL, { 
      maxRetriesPerRequest: null,
      connectTimeout: 20000,
      tls: REDIS_URL.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined
    });

    relayQueue = new Queue('RelayQueue', { connection: redisConnection });
    
    // THE AUTONOMOUS WORKER: This is where TITAN performs actions on the web
    new Worker('RelayQueue', async job => {
      console.log(`[AUTONOMOUS_MISSION] Dispatching for: ${job.data.recipient}`);
      
      const browser = await puppeteer.launch({
        executablePath: PUPPETEER_PATH,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
      });

      try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        // Logical Mission Routine: Find application page or contact form
        await page.goto(`https://www.google.com/search?q=${encodeURIComponent(job.data.recipient + " careers application")}`);
        await page.waitForTimeout(2000);
        
        const screenshot = await page.screenshot({ encoding: 'base64' });
        console.log(`[MISSION_LOG] Target node ${job.data.recipient} visualized.`);
        return { status: 'SUCCESS', node_visual: screenshot };
      } catch (err) {
        console.error(`[MISSION_CRASH] ${job.data.recipient}:`, err.message);
        throw err;
      } finally {
        await browser.close();
      }
    }, { connection: redisConnection });

    console.log('TITAN_CORE: Neural Worker Synchronized.');
  } catch (e) {
    console.warn('TITAN_REDIS_SYNC_WAITING:', e.message);
  }
}

// Scraper Relay: Handles web requests on behalf of the UI to bypass CORS
app.post('/api/scrape', async (req, res) => {
  const { query, type } = req.body;
  
  if (process.env.OXYLABS_USER && process.env.OXYLABS_PASS) {
    const auth = Buffer.from(`${process.env.OXYLABS_USER}:${process.env.OXYLABS_PASS}`).toString('base64');
    try {
      const response = await fetch('https://realtime.oxylabs.io/v1/queries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`,
        },
        body: JSON.stringify({ source: "google_search", query: query, parse: true }),
      });
      const data = await response.json();
      return res.json(data);
    } catch (e) {
      console.error('OXYLABS_RELAY_FAIL');
    }
  }

  // Fallback to local Puppeteer for scraping if no proxy service is configured
  try {
    const browser = await puppeteer.launch({
      executablePath: PUPPETEER_PATH,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}`);
    const results = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.g')).slice(0, 10).map(el => ({
        title: el.querySelector('h3')?.innerText,
        url: el.querySelector('a')?.href,
        snippet: el.querySelector('.VwiC3b')?.innerText
      }));
    });
    await browser.close();
    res.json({ results: [{ content: { results: { organic: results } } }] });
  } catch (e) {
    res.status(500).json({ error: 'Scraper Relay Offline' });
  }
});

app.post('/api/dispatch', async (req, res) => {
  if (!relayQueue) return res.status(503).json({ error: 'Background Queue Unavailable' });
  try {
    const job = await relayQueue.add('dispatch-job', req.body);
    res.json({ id: job.id, status: 'QUEUED' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ACTIVE',
    redis: redisConnection ? 'CONNECTED' : 'OFFLINE',
    puppeteer: 'READY',
    node: 'TITAN_CORE_PRIME'
  });
});

const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return;
  res.sendFile(path.join(distPath, 'index.html'));
});

const server = http.createServer(app);
server.listen(PORT, '0.0.0.0', () => {
  console.log(`TITAN_OS: Command Hub active on port ${PORT}`);
});