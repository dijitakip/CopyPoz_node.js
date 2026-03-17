const http = require('http');

// Configuration
const CONFIG = {
  SERVER_HOST: 'localhost',
  SERVER_PORT: 3000,
  // Bu token'ı admin panelinden oluşturduğunuz client'ın token'ı ile değiştirin
  AUTH_TOKEN: process.argv[2] || 'YOUR_CLIENT_TOKEN_HERE', 
  ACCOUNT_NUMBER: process.argv[3] || 123456,
  POLL_INTERVAL: 2000 // 2 seconds
};

console.log('--- CopyPoz Client Simulator ---');
console.log(`Target: http://${CONFIG.SERVER_HOST}:${CONFIG.SERVER_PORT}`);
console.log(`Auth Token: ${CONFIG.AUTH_TOKEN}`);
console.log(`Account: ${CONFIG.ACCOUNT_NUMBER}`);
console.log('--------------------------------');

function sendHeartbeat() {
  const data = JSON.stringify({
    account_number: parseInt(CONFIG.ACCOUNT_NUMBER),
    balance: 10000 + Math.random() * 100, // Simulate changing balance
    equity: 10050 + Math.random() * 100,
    margin: 100,
    free_margin: 9900,
    margin_level: 5000,
    open_positions: Math.floor(Math.random() * 5),
    auth_token: CONFIG.AUTH_TOKEN
  });

  const options = {
    hostname: CONFIG.SERVER_HOST,
    port: CONFIG.SERVER_PORT,
    path: '/api/clients/heartbeat', // Assuming this endpoint exists or similar
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
      'Authorization': `Bearer ${CONFIG.AUTH_TOKEN}`
    }
  };

  const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (d) => body += d);
    res.on('end', () => {
      const time = new Date().toLocaleTimeString();
      if (res.statusCode === 200) {
        console.log(`[${time}] Heartbeat sent. Server response: ${body}`);
      } else {
        console.log(`[${time}] Error: ${res.statusCode} - ${body}`);
      }
    });
  });

  req.on('error', (error) => {
    console.error(`Connection Error: ${error.message}`);
  });

  req.write(data);
  req.end();
}

// Start polling
setInterval(sendHeartbeat, CONFIG.POLL_INTERVAL);
sendHeartbeat();
