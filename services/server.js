import express from 'express';
import http from 'http';
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

// Autonomous Core Initialization (Requires Redis)
if (REDIS_URL) {
  try {
    redisConnection = new IORedis(REDIS_URL, { 
      maxRetriesPerRequest: null,
      connectTimeout: 20000,
      tls: REDIS_URL.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined
    });

    relayQueue = new Queue('RelayQueue', { connection: redisConnection });
    
    // THE AUTONOMOUS WORKER: Spawns the headless browser to take actions
    new Worker('RelayQueue', async job => {
      console.log(`[MISSION] Initiating for: ${job.data.recipient}`);
      
      const browser = await puppeteer.launch({
        executablePath: PUPPETEER_PATH,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
      });

      try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        // Logical Mission Routine: Find application page
        await page.goto(`https://www.google.com/search?q=${encodeURIComponent(job.data.recipient + " careers application")}`);
        
        const results = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('.g')).slice(0, 3).map(el => ({
            title: el.querySelector('h3')?.innerText,
            url: el.querySelector('a')?.href
          }));
        });

        console.log(`[SUCCESS] Mission target identified for ${job.data.recipient}`);
        return { status: 'SUCCESS', results };
      } catch (err) {
        console.error(`[CRASH] ${job.data.recipient}:`, err.message);
        throw err;
      } finally {
        await browser.close();
      }
    }, { connection: redisConnection });

    console.log('TITAN_OS: Neural Worker Synchronized.');
  } catch (e) {
    console.warn('TITAN_REDIS: Waiting for connection...', e.message);
  }
}

// Scraper Relay Proxy
app.post('/api/scrape', async (req, res) => {
  const { query } = req.body;
  
  // Local Puppeteer fallback for search
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
    res.status(500).json({ error: 'Scraper Relay Offline. Ensure Chromium is installed.' });
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

// Serve static frontend files
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return;
  res.sendFile(path.join(distPath, 'index.html'));
});

const server = http.createServer(app);
server.listen(PORT, '0.0.0.0', () => {
  console.log(`TITAN_OS: Command Core active on port ${PORT}`);
});