const net = require('net');

const HOST = '127.0.0.1';
const PORT = 2000;

console.log(`Connecting to Master EA at ${HOST}:${PORT}...`);

const client = new net.Socket();

client.connect(PORT, HOST, () => {
    console.log('Connected to Master EA!');
    console.log('Waiting for position data...');
});

let buffer = '';

client.on('data', (data) => {
    console.log(`Received raw data (${data.length} bytes): [${data.toString()}]`);
    const chunk = data.toString();
    buffer += chunk;

    // Check for envelope tags
    while (true) {
        const startTag = '<POSITIONS_DATA>';
        const endTag = '</POSITIONS_DATA>';
        
        const startIdx = buffer.indexOf(startTag);
        if (startIdx === -1) break;

        const endIdx = buffer.indexOf(endTag, startIdx);
        if (endIdx === -1) break;

        const content = buffer.substring(startIdx + startTag.length, endIdx);
        console.log('--- VALID POSITION PACKET RECEIVED ---');
        try {
            const parsed = JSON.parse(content);
            console.log(JSON.stringify(parsed, null, 2));
        } catch (e) {
            console.log('Error parsing JSON content:', e.message);
            console.log('Raw Content:', content);
        }
        console.log('--------------------------------------');

        buffer = buffer.substring(endIdx + endTag.length);
    }
});

client.on('close', () => {
    console.log('Connection closed by Master EA');
    process.exit(0);
});

client.on('error', (err) => {
    console.error('Socket Error:', err.message);
    if (err.code === 'ECONNREFUSED') {
        console.error('Is the Master EA running in MetaTrader and is the TCP server active on port 2000?');
    }
    process.exit(1);
});

// Timeout after 30 seconds if no data
setTimeout(() => {
    console.log('Listener timeout after 30s. Closing...');
    client.destroy();
    process.exit(0);
}, 30000);
