const { Bonjour } = require('bonjour-service');
const WebSocket = require('ws');
const os = require('os');
const crypto = require('crypto');

const PORT = 41235; // Fixed port for P2P WS
const SERVICE_TYPE = 'quark-clip';
const NODE_ID = crypto.randomUUID();

let wss = null;
let peers = new Map(); // ip -> ws
let bonjourInstance = null;
let onRemoteClipboardReceived = null;

function init(clipboardCallback) {
  onRemoteClipboardReceived = clipboardCallback;
  
  // 1. Start WebSocket Server
  wss = new WebSocket.Server({ port: PORT, host: '0.0.0.0' });
  
  wss.on('connection', (ws, req) => {
    const ip = req.socket.remoteAddress;
    peers.set(ip, ws);
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        if (data.type === 'CLIPBOARD_SYNC' && data.nodeId !== NODE_ID) {
          if (onRemoteClipboardReceived) {
            onRemoteClipboardReceived(data.payload);
          }
        }
      } catch (e) { console.error('WS Parse Error', e); }
    });
    
    ws.on('close', () => peers.delete(ip));
  });

  // 2. Start mDNS Discovery
  bonjourInstance = new Bonjour();
  
  // Publish our node
  bonjourInstance.publish({ name: `Quark-${os.hostname()}`, type: SERVICE_TYPE, port: PORT });

  // Discover other nodes
  const browser = bonjourInstance.find({ type: SERVICE_TYPE });
  browser.on('up', (service) => {
    if (service.port === PORT) {
      const address = service.addresses.find(a => a.includes('.')) || service.addresses[0];
      if (address && !peers.has(address)) {
        connectToPeer(address);
      }
    }
  });
  
  console.log(`🌐 P2P Mesh Network initialized on port ${PORT}`);
}

function connectToPeer(ip) {
  // Prevent connecting to self
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.address === ip) return;
    }
  }

  const ws = new WebSocket(`ws://${ip}:${PORT}`);
  ws.on('open', () => {
    peers.set(ip, ws);
    console.log(`🔗 Connected to peer: ${ip}`);
  });
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'CLIPBOARD_SYNC' && data.nodeId !== NODE_ID) {
        if (onRemoteClipboardReceived) onRemoteClipboardReceived(data.payload);
      }
    } catch (e) {}
  });
  ws.on('close', () => peers.delete(ip));
  ws.on('error', () => peers.delete(ip));
}

function broadcast(text, html = null) {
  const payload = JSON.stringify({
    type: 'CLIPBOARD_SYNC',
    nodeId: NODE_ID,
    payload: { text, html }
  });
  
  peers.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  });
}

module.exports = { init, broadcast };
