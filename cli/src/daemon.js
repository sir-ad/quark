const clipboard = require('./clipboard');
const transformers = require('./transformers');
const network = require('./network');
const http = require('http');

console.log('🌌 Quark Daemon Started at', new Date().toISOString());

let lastClip = clipboard.read();
let lastActiveApp = clipboard.getActiveApp();
let lastProcessedResult = null;
let isSyncingFromNetwork = false;

// Initialize P2P Network
network.init((remoteData) => {
  isSyncingFromNetwork = true;
  console.log('📥 Received clipboard from network peer');
  if (remoteData.html) {
    clipboard.writeHtml(remoteData.html, remoteData.text);
  } else {
    clipboard.writeText(remoteData.text);
  }
  lastClip = clipboard.read(); // Update local state
  setTimeout(() => { isSyncingFromNetwork = false; }, 1000);
});

// Local HTTP Server for MCP Bridge
// The MCP stdio process will call this to read/write clipboard
const API_PORT = 14314;

function logEvent(type, message, metadata = {}) {
  const ts = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
  const icon = {
    CLIP: '📋',
    TRANSFORM: '✨',
    SYNC: '📡',
    INFO: '💡',
    WARN: '⚠️'
  }[type] || '⚪';

  console.log(`[${ts}] ${icon} ${type}: ${message}`);
  if (Object.keys(metadata).length > 0) {
    console.log(`    ${JSON.stringify(metadata)}`);
  }
}

let writeGuard = false;

const server = http.createServer((req, res) => {
  if (req.url === '/clipboard' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ text: clipboard.read().text }));
  } else if (req.url === '/clipboard' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        if (data.text) {
          logEvent('INFO', 'Writing to clipboard via MCP');
          writeGuard = true;
          clipboard.writeText(data.text);
          lastClip = clipboard.read();
          network.broadcast(data.text);
        }
        res.writeHead(200);
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400);
        res.end();
      }
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(API_PORT, '127.0.0.1', () => {
  logEvent('INFO', `Local API for MCP Bridge listening on port ${API_PORT}`);
});

// Main Clipboard Polling Loop
const pollInterval = setInterval(async () => {
  if (isSyncingFromNetwork) return;

  const currentClip = clipboard.read();

  // Self-Write Guard: Check if this change was triggered by our own write
  if (writeGuard) {
    if (currentClip.text === lastClip.text && currentClip.html === lastClip.html) {
      writeGuard = false; // Reset guard after confirming parity
      return;
    }
    // If it's different, maybe the OS modified it or user copied something else simultaneously
    writeGuard = false;
  }

  if (currentClip.text && (currentClip.text !== lastClip.text || currentClip.html !== lastClip.html)) {
    lastClip = currentClip;

    logEvent('CLIP', 'New content detected', {
      textLength: currentClip.text.length,
      hasHtml: !!currentClip.html
    });

    const activeApp = clipboard.getActiveApp();
    if (activeApp !== lastActiveApp) {
      logEvent('INFO', `Active App changed: ${activeApp}`);
      // JIT Injection: If we have a cached result, re-optimize for the new app
      if (lastProcessedResult) {
        writeGuard = true;
        injectForTarget(activeApp, lastProcessedResult);
      }
      lastActiveApp = activeApp;
    }

    // Process through transformers with context
    const result = await transformers.processClipboard(currentClip.text, currentClip.html, activeApp);

    if (result.changed || result.markdown) {
      lastProcessedResult = result;

      if (result.changed) {
        logEvent('TRANSFORM', result.skipReason || 'Applying transformations');
        writeGuard = true;
        injectForTarget(activeApp, result);

        lastClip = clipboard.read(); // Update to OS state
        network.broadcast(result.text, result.html);
      }
    } else {
      if (result.skipReason) {
        logEvent('INFO', `Skipped: ${result.skipReason}`);
      }
      // No transformation, just broadcast raw text and html to peers
      network.broadcast(currentClip.text, currentClip.html);
    }
  }
}, 500);

function injectForTarget(app, result) {
  const markdownApps = ['Obsidian', 'Visual Studio Code', 'Cursor', 'Linear', 'GitHub'];
  const isMarkdownTarget = markdownApps.some(m => app && app.includes(m));

  if (isMarkdownTarget && result.markdown) {
    // For Markdown-friendly apps, we prioritize Markdown in the plain-text flavor
    // This allows pasting into Obsidian to get MD, while keeping HTML for table support if they want it
    clipboard.writeHtml(result.html, result.markdown);
  } else {
    // Standard injection
    if (result.html) {
      clipboard.writeHtml(result.html, result.text);
    } else {
      clipboard.writeText(result.text);
    }
  }
}

// Graceful Shutdown
function shutdown() {
  logEvent('INFO', 'Shutting down Quark Daemon gracefully...');
  clearInterval(pollInterval);
  server.close(() => {
    logEvent('INFO', 'MCP Bridge API closed.');
    process.exit(0);
  });

  // Force exit if server takes too long
  setTimeout(() => {
    console.error('⚠️ Forced shutdown due to timeout.');
    process.exit(1);
  }, 3000);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('SIGHUP', shutdown);

