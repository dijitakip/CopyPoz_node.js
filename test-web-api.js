const http = require('http');

const options = {
  hostname: '127.0.0.1',
  port: 3000,
  path: '/api/master/positions',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer master-local-123'
  }
};

console.log('Checking Master State via Web API...');

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    try {
      const data = JSON.parse(body);
      console.log('Master State:', JSON.stringify(data, null, 2));
    } catch (e) {
      console.log('Raw Response:', body);
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.end();
