# CopyPoz V5 - Detailed Development Plan

## Overview
This document outlines the step-by-step development plan for CopyPoz V5 Hybrid Architecture.

---

## Phase 1: Master EA V5 (Native TCP Server)

### Step 1.1: TCP Server Socket Implementation
**Objective**: Create TCP server that listens on port 2000

**Tasks**:
1. Create global socket variable
2. Implement socket creation in OnInit()
3. Implement socket binding to 0.0.0.0:2000
4. Implement socket listening
5. Add error handling for socket operations
6. Add logging for socket events

**Code Structure**:
```mql5
// Global variables
int g_serverSocket = INVALID_SOCKET;
int g_clientSockets[]; // Array of connected clients

// OnInit()
- Create socket
- Bind to 0.0.0.0:2000
- Listen for connections
- Set non-blocking mode

// OnTimer()
- Accept new connections
- Receive data from clients
- Send data to clients
- Handle disconnections

// OnDeinit()
- Close all sockets
- Clean up resources
```

**Acceptance Criteria**:
- [ ] Socket created successfully
- [ ] Server binds to port 2000
- [ ] Server listens for connections
- [ ] No compilation errors
- [ ] Logs show server started

---

### Step 1.2: Client Connection Management
**Objective**: Handle multiple client connections

**Tasks**:
1. Accept incoming connections
2. Store client socket handles
3. Track connection state
4. Handle disconnections
5. Implement connection timeout (60 seconds)
6. Add logging for connection events

**Code Structure**:
```mql5
struct ClientConnection {
    int socket;
    ulong lastDataTime;
    bool isConnected;
};

// Accept connections
- Check for new connections
- Create ClientConnection struct
- Add to g_clientSockets array
- Log connection

// Handle disconnections
- Check for closed sockets
- Remove from array
- Log disconnection

// Timeout handling
- Check lastDataTime
- Close inactive connections
- Log timeout
```

**Acceptance Criteria**:
- [ ] Multiple clients can connect
- [ ] Connections tracked correctly
- [ ] Disconnections handled
- [ ] Timeouts work
- [ ] Logs show all events

---

### Step 1.3: Position Data Broadcasting
**Objective**: Broadcast position data to all connected clients

**Tasks**:
1. Collect all open positions
2. Format positions as JSON
3. Send JSON to all connected clients
4. Handle send errors
5. Implement broadcast timer (500ms)
6. Add logging for broadcasts

**Code Structure**:
```mql5
// Collect positions
- Loop through all positions
- Extract position details
- Build JSON array

// Format JSON
{
  "type": "POSITIONS_BROADCAST",
  "timestamp": 1234567890,
  "positions": [
    {
      "ticket": 123,
      "symbol": "EURUSD",
      "type": 0,
      "volume": 1.0,
      "price": 1.0850,
      "sl": 1.0800,
      "tp": 1.0900,
      "magic": 123456,
      "comment": "CPv5_123",
      "profit": 50.00
    }
  ]
}

// Send to all clients
- Loop through g_clientSockets
- Send JSON to each socket
- Handle errors
- Log broadcasts
```

**Acceptance Criteria**:
- [ ] Positions collected correctly
- [ ] JSON format valid
- [ ] All clients receive data
- [ ] Broadcast interval correct
- [ ] Errors handled
- [ ] Logs show broadcasts

---

### Step 1.4: Position Update Triggers
**Objective**: Broadcast positions on trade events

**Tasks**:
1. Implement OnTradeTransaction handler
2. Detect position open events
3. Detect position close events
4. Detect position modify events
5. Trigger immediate broadcast on events
6. Add logging for events

**Code Structure**:
```mql5
void OnTradeTransaction(const MqlTradeTransaction& trans, ...) {
    if (trans.type == TRADE_TRANSACTION_POSITION) {
        // Position opened, closed, or modified
        BroadcastPositions(); // Immediate broadcast
    }
}
```

**Acceptance Criteria**:
- [ ] OnTradeTransaction implemented
- [ ] Position events detected
- [ ] Immediate broadcast triggered
- [ ] No delay between trade and broadcast
- [ ] Logs show events

---

### Step 1.5: Web API Integration (Monitoring)
**Objective**: Send position updates to Web API

**Tasks**:
1. Implement Web API call to /api/signal.php
2. Format position data for API
3. Add Bearer token authentication
4. Implement API call timer (2 seconds)
5. Handle API errors gracefully
6. Add logging for API calls

**Code Structure**:
```mql5
void SendToWebAPI() {
    // Collect positions
    // Format JSON
    // Create HTTP request
    // Add Authorization header
    // Send POST request
    // Handle response
    // Log result
}

// In OnTimer()
if (GetTickCount() - g_lastWebUpdate > 2000) {
    SendToWebAPI();
    g_lastWebUpdate = GetTickCount();
}
```

**Acceptance Criteria**:
- [ ] API calls succeed (200 response)
- [ ] Data stored in master_state table
- [ ] API errors don't block TCP broadcast
- [ ] API call interval correct
- [ ] Logs show API calls

---

### Step 1.6: Master Command Processing
**Objective**: Receive and execute commands from Web API

**Tasks**:
1. Implement Web API call to /api/command.php
2. Parse command response
3. Implement PAUSE command (stop broadcasting)
4. Implement RESUME command (resume broadcasting)
5. Implement CLOSE_ALL_BUY command
6. Implement CLOSE_ALL_SELL command
7. Implement CLOSE_ALL command
8. Add logging for commands

**Code Structure**:
```mql5
void CheckForCommands() {
    // Call /api/command.php
    // Parse response
    // Get command type
    
    if (command == "PAUSE") {
        g_broadcastEnabled = false;
    } else if (command == "RESUME") {
        g_broadcastEnabled = true;
    } else if (command == "CLOSE_ALL_BUY") {
        CloseAllPositions(POSITION_TYPE_BUY);
    } else if (command == "CLOSE_ALL_SELL") {
        CloseAllPositions(POSITION_TYPE_SELL);
    } else if (command == "CLOSE_ALL") {
        CloseAllPositions(POSITION_TYPE_BUY);
        CloseAllPositions(POSITION_TYPE_SELL);
    }
}

// In OnTimer()
if (GetTickCount() - g_lastCommandCheck > 5000) {
    CheckForCommands();
    g_lastCommandCheck = GetTickCount();
}
```

**Acceptance Criteria**:
- [ ] Commands retrieved from API
- [ ] Commands executed correctly
- [ ] PAUSE stops broadcasting
- [ ] RESUME resumes broadcasting
- [ ] CLOSE commands work
- [ ] Logs show commands

---

### Step 1.7: Master EA V5 Testing
**Objective**: Test Master EA functionality

**Tasks**:
1. Compile without errors
2. Load on chart
3. Verify TCP server starts
4. Test position broadcasting
5. Test Web API integration
6. Test command processing
7. Test with multiple clients (simulated)

**Test Cases**:
- [ ] EA loads without errors
- [ ] TCP server binds to port 2000
- [ ] Positions broadcast every 500ms
- [ ] Web API calls succeed
- [ ] Commands execute correctly
- [ ] Logs show all events

---

## Phase 2: Client EA V5 (Native TCP Client)

### Step 2.1: TCP Client Socket Implementation
**Objective**: Create TCP client that connects to Master

**Tasks**:
1. Create global socket variable
2. Implement socket creation in OnInit()
3. Implement socket connection to Master
4. Implement connection retry logic
5. Add error handling for socket operations
6. Add logging for socket events

**Code Structure**:
```mql5
// Global variables
int g_clientSocket = INVALID_SOCKET;
int g_connectionAttempts = 0;
ulong g_lastConnectionAttempt = 0;

// OnInit()
- Create socket
- Connect to Master (tcp://[master-ip]:2000)
- Set non-blocking mode
- Handle connection errors

// OnTimer()
- Check connection status
- Reconnect if disconnected
- Receive data from Master
- Handle disconnections

// OnDeinit()
- Close socket
- Clean up resources
```

**Acceptance Criteria**:
- [ ] Socket created successfully
- [ ] Client connects to Master
- [ ] Connection errors handled
- [ ] No compilation errors
- [ ] Logs show connection status

---

### Step 2.2: Position Reception and Parsing
**Objective**: Receive and parse position data from Master

**Tasks**:
1. Receive JSON data from socket
2. Parse JSON format
3. Extract position fields
4. Validate data integrity
5. Handle incomplete data
6. Add logging for reception

**Code Structure**:
```mql5
struct PositionData {
    ulong ticket;
    string symbol;
    int type;
    double volume;
    double price;
    double sl;
    double tp;
    int magic;
    string comment;
    double profit;
};

void ReceivePositions() {
    // Receive JSON from socket
    // Parse JSON
    // Extract positions array
    // Create PositionData structs
    // Validate data
    // Store in array
}
```

**Acceptance Criteria**:
- [ ] JSON received correctly
- [ ] JSON parsed successfully
- [ ] All fields extracted
- [ ] Data validated
- [ ] Incomplete data handled
- [ ] Logs show reception

---

### Step 2.3: Position Synchronization
**Objective**: Synchronize positions with Master

**Tasks**:
1. Compare Master positions with local positions
2. Open new positions from Master
3. Update existing positions (SL/TP)
4. Close positions not in Master list
5. Use magic number to identify own positions
6. Store Master ticket in comment
7. Add logging for synchronization

**Code Structure**:
```mql5
void SyncPositions(PositionData &masterPositions[]) {
    // 1. Open new positions
    for (int i = 0; i < ArraySize(masterPositions); i++) {
        if (!FindLocalPosition(masterPositions[i].ticket)) {
            OpenPosition(masterPositions[i]);
        }
    }
    
    // 2. Update existing positions
    for (int i = 0; i < PositionsTotal(); i++) {
        // Check if position needs update
        // Update SL/TP if needed
    }
    
    // 3. Close orphan positions
    for (int i = PositionsTotal() - 1; i >= 0; i--) {
        // Check if position in Master list
        // Close if not found
    }
}
```

**Acceptance Criteria**:
- [ ] New positions open correctly
- [ ] Position updates apply correctly
- [ ] Orphan positions close correctly
- [ ] No duplicate positions
- [ ] All positions have correct magic number
- [ ] Master ticket stored in comment
- [ ] Logs show synchronization

---

### Step 2.4: Web API Integration (Heartbeat)
**Objective**: Send heartbeat to Web API

**Tasks**:
1. Implement Web API call to /api/client.php
2. Format heartbeat data
3. First request: send registration_token
4. Subsequent requests: send auth_token
5. Receive auth_token on first registration
6. Store auth_token for reuse
7. Implement heartbeat timer (5 seconds)
8. Add logging for heartbeats

**Code Structure**:
```mql5
void SendHeartbeat() {
    string json;
    
    if (g_authToken == "") {
        // First request - send registration_token
        json = StringFormat(
            "{\"account_number\":%I64d,\"registration_token\":\"%s\"}",
            AccountInfoInteger(ACCOUNT_LOGIN),
            RegistrationToken
        );
    } else {
        // Subsequent requests - send auth_token
        json = StringFormat(
            "{\"account_number\":%I64d,\"auth_token\":\"%s\"}",
            AccountInfoInteger(ACCOUNT_LOGIN),
            g_authToken
        );
    }
    
    // Send POST request
    // Parse response
    // Extract auth_token if present
    // Store auth_token
}

// In OnTimer()
if (GetTickCount() - g_lastHeartbeat > 5000) {
    SendHeartbeat();
    g_lastHeartbeat = GetTickCount();
}
```

**Acceptance Criteria**:
- [ ] Heartbeat sent at correct interval
- [ ] Registration token validated
- [ ] Auth token generated and returned
- [ ] Auth token stored and reused
- [ ] Account metrics updated
- [ ] Logs show heartbeats

---

### Step 2.5: Client Command Processing
**Objective**: Receive and execute commands from Web API

**Tasks**:
1. Implement Web API call to /api/client-command.php
2. Parse command response
3. Implement PAUSE command (stop synchronization)
4. Implement RESUME command (resume synchronization)
5. Implement CLOSE_ALL_BUY command
6. Implement CLOSE_ALL_SELL command
7. Implement CLOSE_ALL command
8. Add logging for commands

**Code Structure**:
```mql5
void CheckForCommands() {
    // Call /api/client-command.php
    // Parse response
    // Get command type
    
    if (command == "PAUSE") {
        g_syncEnabled = false;
    } else if (command == "RESUME") {
        g_syncEnabled = true;
    } else if (command == "CLOSE_ALL_BUY") {
        CloseAllPositions(POSITION_TYPE_BUY);
    } else if (command == "CLOSE_ALL_SELL") {
        CloseAllPositions(POSITION_TYPE_SELL);
    } else if (command == "CLOSE_ALL") {
        CloseAllPositions(POSITION_TYPE_BUY);
        CloseAllPositions(POSITION_TYPE_SELL);
    }
}

// In OnTimer()
if (GetTickCount() - g_lastCommandCheck > 5000) {
    CheckForCommands();
    g_lastCommandCheck = GetTickCount();
}
```

**Acceptance Criteria**:
- [ ] Commands retrieved from API
- [ ] Commands executed correctly
- [ ] PAUSE stops synchronization
- [ ] RESUME resumes synchronization
- [ ] CLOSE commands work
- [ ] Logs show commands

---

### Step 2.6: Client EA V5 Testing
**Objective**: Test Client EA functionality

**Tasks**:
1. Compile without errors
2. Load on chart
3. Verify TCP client connects to Master
4. Test position reception
5. Test position synchronization
6. Test Web API integration
7. Test command processing
8. Test with Master EA

**Test Cases**:
- [ ] EA loads without errors
- [ ] TCP client connects to Master
- [ ] Positions received correctly
- [ ] Positions synchronized correctly
- [ ] Web API calls succeed
- [ ] Commands execute correctly
- [ ] Logs show all events

---

## Phase 3: Web API Endpoints

### Step 3.1: Position Endpoints
**Objective**: Create endpoints for position data

**Tasks**:
1. Create `GET /api/positions.php`
2. Retrieve positions from `master_state` table
3. Add Bearer token authentication
4. Return JSON response
5. Add error handling
6. Add logging

**Code Structure**:
```php
// GET /api/positions.php
- Check Authorization header
- Validate Bearer token
- Query master_state table
- Return positions JSON
- Log request
```

**Acceptance Criteria**:
- [ ] Endpoint returns positions
- [ ] Token validation works
- [ ] Response format valid JSON
- [ ] Includes all position details
- [ ] Errors handled

---

### Step 3.2: Signal Endpoint (Updated)
**Objective**: Update signal endpoint for Master

**Tasks**:
1. Update `POST /api/signal.php`
2. Validate Bearer token
3. Parse positions JSON
4. Store in `master_state` table
5. Update `updated_at` timestamp
6. Return success response
7. Add logging

**Code Structure**:
```php
// POST /api/signal.php
- Check Authorization header
- Validate Bearer token
- Parse JSON body
- Validate positions array
- Update master_state table
- Return success response
- Log request
```

**Acceptance Criteria**:
- [ ] Stores positions correctly
- [ ] Updates timestamp
- [ ] Returns 200 on success
- [ ] Token validation works
- [ ] Errors handled

---

### Step 3.3: Master Command Endpoints
**Objective**: Create endpoints for Master commands

**Tasks**:
1. Create `GET /api/command.php`
2. Retrieve pending command for Master
3. Mark command as executed
4. Return command JSON
5. Add Bearer token authentication
6. Add error handling
7. Add logging

**Code Structure**:
```php
// GET /api/command.php
- Check Authorization header
- Validate Bearer token
- Query command_queue table (client_id = 0)
- Get first pending command
- Mark as executed
- Return command JSON
- Log request

// POST /api/master-command.php
- Check Authorization header
- Validate admin token
- Parse command from request
- Insert into command_queue (client_id = 0)
- Return success response
- Log request
```

**Acceptance Criteria**:
- [ ] Returns pending commands
- [ ] Marks commands as executed
- [ ] Returns empty when no commands
- [ ] Token validation works
- [ ] Admin-only access enforced
- [ ] Errors handled

---

### Step 3.4: Client Endpoints (Updated)
**Objective**: Update client endpoints

**Tasks**:
1. Update `POST /api/client.php`
2. Validate registration_token on first request
3. Generate auth_token on first registration
4. Update client metrics
5. Return auth_token and pending command
6. Add error handling
7. Add logging

**Code Structure**:
```php
// POST /api/client.php
- Parse JSON body
- Check if client exists
- If not exists:
  - Validate registration_token
  - Generate auth_token
  - Create client record
- If exists:
  - Validate auth_token
  - Update metrics
- Get pending command
- Return auth_token and command
- Log request

// GET /api/client-command.php
- Check Authorization header
- Validate auth_token
- Query command_queue table (client_id = this client)
- Get first pending command
- Mark as executed
- Return command JSON
- Log request

// POST /api/client-command-send.php
- Check Authorization header
- Validate trader token
- Verify trader has access to client
- Parse command from request
- Insert into command_queue
- Return success response
- Log request
```

**Acceptance Criteria**:
- [ ] Registration token validated
- [ ] Auth token generated and returned
- [ ] Client metrics updated
- [ ] Pending command returned
- [ ] Token validation works
- [ ] Access control verified
- [ ] Errors handled

---

### Step 3.5: API Testing
**Objective**: Test all API endpoints

**Tasks**:
1. Test all endpoints with valid requests
2. Test all endpoints with invalid tokens
3. Test all endpoints with missing data
4. Test error responses
5. Test database updates
6. Test logging

**Test Cases**:
- [ ] All endpoints return correct responses
- [ ] Token validation works
- [ ] Database updates correctly
- [ ] Errors handled properly
- [ ] Logs show all requests

---

## Phase 4: Dashboard Updates

### Step 4.1: Master Monitoring Interface
**Objective**: Display Master positions in real-time

**Tasks**:
1. Create Master positions display
2. Show position details
3. Implement AJAX refresh (2 seconds)
4. Show last update timestamp
5. Add responsive design
6. Add error handling

**Code Structure**:
```html
<!-- Master Positions Section -->
<div id="master-positions">
    <h2>Master Positions</h2>
    <table id="positions-table">
        <thead>
            <tr>
                <th>Symbol</th>
                <th>Type</th>
                <th>Volume</th>
                <th>Price</th>
                <th>SL</th>
                <th>TP</th>
                <th>Profit</th>
            </tr>
        </thead>
        <tbody id="positions-body">
        </tbody>
    </table>
    <p>Last update: <span id="last-update"></span></p>
</div>

<script>
// AJAX refresh every 2 seconds
setInterval(function() {
    fetch('/api/positions.php')
        .then(response => response.json())
        .then(data => updatePositionsTable(data));
}, 2000);
</script>
```

**Acceptance Criteria**:
- [ ] Positions display correctly
- [ ] Updates happen automatically
- [ ] No page refresh needed
- [ ] Responsive design
- [ ] Errors handled

---

### Step 4.2: Client Monitoring Interface
**Objective**: Display all clients status

**Tasks**:
1. Create client list display
2. Show client status (active, paused, disconnected)
3. Show account metrics
4. Show last seen timestamp
5. Implement AJAX refresh (5 seconds)
6. Add responsive design
7. Add error handling

**Code Structure**:
```html
<!-- Client List Section -->
<div id="client-list">
    <h2>Clients</h2>
    <table id="clients-table">
        <thead>
            <tr>
                <th>Account</th>
                <th>Name</th>
                <th>Status</th>
                <th>Balance</th>
                <th>Equity</th>
                <th>Positions</th>
                <th>Last Seen</th>
            </tr>
        </thead>
        <tbody id="clients-body">
        </tbody>
    </table>
</div>

<script>
// AJAX refresh every 5 seconds
setInterval(function() {
    fetch('/api/clients.php')
        .then(response => response.json())
        .then(data => updateClientsTable(data));
}, 5000);
</script>
```

**Acceptance Criteria**:
- [ ] Client list displays correctly
- [ ] Status updates automatically
- [ ] Metrics are current
- [ ] Responsive design
- [ ] Errors handled

---

### Step 4.3: Master Command Interface
**Objective**: Admin can send commands to Master

**Tasks**:
1. Create command buttons
2. Implement confirmation dialog
3. Send command to API
4. Show command status
5. Log all commands
6. Add responsive design

**Code Structure**:
```html
<!-- Master Commands Section -->
<div id="master-commands">
    <h2>Master Commands</h2>
    <button onclick="sendMasterCommand('PAUSE')">PAUSE</button>
    <button onclick="sendMasterCommand('RESUME')">RESUME</button>
    <button onclick="sendMasterCommand('CLOSE_ALL_BUY')">CLOSE ALL BUY</button>
    <button onclick="sendMasterCommand('CLOSE_ALL_SELL')">CLOSE ALL SELL</button>
    <button onclick="sendMasterCommand('CLOSE_ALL')">CLOSE ALL</button>
</div>

<script>
function sendMasterCommand(command) {
    if (confirm('Send command: ' + command + '?')) {
        fetch('/api/master-command.php', {
            method: 'POST',
            body: JSON.stringify({command: command})
        })
        .then(response => response.json())
        .then(data => alert('Command sent'));
    }
}
</script>
```

**Acceptance Criteria**:
- [ ] Commands send successfully
- [ ] Confirmation works
- [ ] Status updates in real-time
- [ ] Commands logged
- [ ] Errors handled

---

### Step 4.4: Client Command Interface
**Objective**: Trader can send commands to their clients

**Tasks**:
1. Create client selector
2. Create command buttons
3. Implement confirmation dialog
4. Send command to API
5. Show command status
6. Log all commands
7. Add responsive design

**Code Structure**:
```html
<!-- Client Commands Section -->
<div id="client-commands">
    <h2>Client Commands</h2>
    <select id="client-selector">
        <option value="">Select Client</option>
    </select>
    <button onclick="sendClientCommand('PAUSE')">PAUSE</button>
    <button onclick="sendClientCommand('RESUME')">RESUME</button>
    <button onclick="sendClientCommand('CLOSE_ALL_BUY')">CLOSE ALL BUY</button>
    <button onclick="sendClientCommand('CLOSE_ALL_SELL')">CLOSE ALL SELL</button>
    <button onclick="sendClientCommand('CLOSE_ALL')">CLOSE ALL</button>
</div>

<script>
function sendClientCommand(command) {
    const clientId = document.getElementById('client-selector').value;
    if (!clientId) {
        alert('Select a client');
        return;
    }
    if (confirm('Send command: ' + command + '?')) {
        fetch('/api/client-command-send.php', {
            method: 'POST',
            body: JSON.stringify({client_id: clientId, command: command})
        })
        .then(response => response.json())
        .then(data => alert('Command sent'));
    }
}
</script>
```

**Acceptance Criteria**:
- [ ] Commands send successfully
- [ ] Only assigned clients shown
- [ ] Confirmation works
- [ ] Status updates in real-time
- [ ] Commands logged
- [ ] Errors handled

---

### Step 4.5: Mobile Responsive Design
**Objective**: Dashboard works on mobile devices

**Tasks**:
1. Add responsive CSS
2. Add mobile-friendly layout
3. Add touch-friendly buttons
4. Optimize for small screens
5. Test on mobile browsers
6. Add performance optimization

**Code Structure**:
```css
/* Mobile responsive */
@media (max-width: 768px) {
    table {
        font-size: 12px;
    }
    button {
        padding: 10px;
        font-size: 14px;
    }
    #master-positions, #client-list {
        margin: 10px 0;
    }
}
```

**Acceptance Criteria**:
- [ ] Works on mobile browsers
- [ ] Layout adapts to screen size
- [ ] Buttons are touch-friendly
- [ ] Performance acceptable

---

### Step 4.6: Dashboard Testing
**Objective**: Test dashboard functionality

**Tasks**:
1. Test Master monitoring
2. Test Client monitoring
3. Test Master commands
4. Test Client commands
5. Test real-time updates
6. Test mobile responsiveness
7. Test error handling

**Test Cases**:
- [ ] All displays show correct data
- [ ] Real-time updates work
- [ ] Commands execute correctly
- [ ] Mobile responsive
- [ ] Errors handled

---

## Phase 5: Integration Testing

### Step 5.1: End-to-End Testing
**Objective**: Test complete system flow

**Test Scenarios**:
1. Master EA starts and broadcasts positions
2. Client EA connects and receives positions
3. Client opens positions from Master
4. Client updates positions from Master
5. Client closes positions from Master
6. Dashboard shows Master positions
7. Dashboard shows Client status
8. Admin sends command to Master
9. Trader sends command to Client
10. All commands execute correctly

**Acceptance Criteria**:
- [ ] All scenarios work correctly
- [ ] No data loss
- [ ] No errors
- [ ] Logs show all events

---

### Step 5.2: Performance Testing
**Objective**: Verify performance meets requirements

**Test Cases**:
- [ ] Master position broadcast < 100ms latency
- [ ] Client position sync < 500ms latency
- [ ] Web API response < 1 second
- [ ] Dashboard update < 2 seconds
- [ ] Database query < 100ms
- [ ] System handles 10+ concurrent clients

**Acceptance Criteria**:
- [ ] All performance targets met
- [ ] No bottlenecks identified
- [ ] System stable under load

---

### Step 5.3: Security Testing
**Objective**: Verify security measures

**Test Cases**:
- [ ] Token validation works
- [ ] Unauthorized access blocked
- [ ] Data encryption works
- [ ] Input validation works
- [ ] SQL injection prevented
- [ ] XSS prevented

**Acceptance Criteria**:
- [ ] All security tests pass
- [ ] No vulnerabilities found
- [ ] Logs show security events

---

### Step 5.4: Load Testing
**Objective**: Test system under load

**Test Cases**:
- [ ] 10 concurrent clients
- [ ] 20 concurrent clients
- [ ] 50 concurrent clients
- [ ] 100 concurrent dashboard users
- [ ] High-frequency position updates
- [ ] High-frequency commands

**Acceptance Criteria**:
- [ ] System stable under load
- [ ] Performance acceptable
- [ ] No data loss
- [ ] No errors

---

### Step 5.5: Documentation
**Objective**: Complete all documentation

**Documents**:
- [ ] API documentation
- [ ] EA configuration guide
- [ ] Dashboard user guide
- [ ] Troubleshooting guide
- [ ] Architecture documentation
- [ ] Code comments

**Acceptance Criteria**:
- [ ] All documents complete
- [ ] Clear and accurate
- [ ] Easy to understand

---

## Development Timeline

| Phase | Task | Duration | Start | End |
|-------|------|----------|-------|-----|
| 1 | Master EA V5 | 2-3 days | Day 1 | Day 3 |
| 2 | Client EA V5 | 2-3 days | Day 4 | Day 6 |
| 3 | Web API Endpoints | 1-2 days | Day 7 | Day 8 |
| 4 | Dashboard Updates | 2-3 days | Day 9 | Day 11 |
| 5 | Integration Testing | 1-2 days | Day 12 | Day 13 |
| **Total** | | **8-13 days** | | |

---

## Success Criteria Checklist

- [ ] Master EA V5 compiles without errors
- [ ] Client EA V5 compiles without errors
- [ ] Master and Client connect via TCP successfully
- [ ] Positions sync correctly between Master and Client
- [ ] Web API endpoints work correctly
- [ ] Dashboard displays real-time data
- [ ] Commands execute successfully
- [ ] All tests pass
- [ ] Documentation complete
- [ ] System handles 10+ concurrent clients
- [ ] No data loss during operation
- [ ] Performance meets NFR requirements
- [ ] Security measures verified
- [ ] Load testing passed

