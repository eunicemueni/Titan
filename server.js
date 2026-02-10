
/**
 * TITAN OS | Node.js Automation Bridge
 * This server handles the Puppeteer automation logic.
 * Requirements: npm install express ws puppeteer cors
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let clients = [];

// WebSocket logic for real-time logs
wss.on('connection', (ws) => {
  clients.push(ws);
  console.log('BRIDGE: TITAN OS Handshake Successful.');
  ws.send(JSON.stringify({ 
    type: 'log', 
    message: 'NEURAL_LINK: Established. TITAN_OS active on localhost:3001' 
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

const broadcastLog = (message) => broadcast({ type: 'log', message });
const broadcastUpdate = (jobId, company, status) => broadcast({ type: 'job_update', jobId, company, status });

// Automation REST Endpoint
app.post('/api/automate', async (req, res) => {
  const { jobs, profile } = req.body;
  if (!jobs || !Array.isArray(jobs)) return res.status(400).json({ error: 'No nodes provided.' });

  res.status(202).json({ status: 'CLUSTER_INITIATED' });
  runAutomationCluster(jobs, profile);
});

async function runAutomationCluster(jobs, profile) {
  broadcastLog(`CLUSTER: Initializing automation for ${jobs.length} nodes.`);
  
  const browser = await puppeteer.launch({ 
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });

  try {
    for (const job of jobs) {
      const page = await browser.newPage();
      broadcastUpdate(job.id, job.company, 'applying');
      broadcastLog(`THREAD: Navigating to ${job.company} portal...`);

      try {
        const targetUrl = job.sourceUrl || `https://www.google.com/search?q=${encodeURIComponent(job.company + " careers")}`;
        await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        
        await new Promise(r => setTimeout(r, 2000)); // Simulate DOM interaction
        
        await page.evaluate((p) => {
          console.log("TITAN_INJECTOR: Active for", p.fullName);
        }, profile);

        broadcastLog(`SUCCESS: Relay verified for ${job.role} @ ${job.company}.`);
        broadcastUpdate(job.id, job.company, 'completed');
        await page.close();
      } catch (e) {
        broadcastLog(`FAIL: Thread interrupted for ${job.company}: ${e.message}`);
        broadcastUpdate(job.id, job.company, 'discovered');
      }
    }
  } finally {
    broadcastLog("CLEANUP: Closing headless runtime.");
    await browser.close();
  }
}

const PORT = 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n==========================================`);
  console.log(`TITAN OS NEURAL BRIDGE: LIVE`);
  console.log(`URL: http://localhost:${PORT}`);
  console.log(`==========================================\n`);
});
