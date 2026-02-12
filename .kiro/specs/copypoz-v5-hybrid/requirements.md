# CopyPoz V5 - Hybrid Architecture Requirements

## Project Overview
CopyPoz V5 is a hybrid system for copying trading positions from a Master MetaTrader terminal to multiple Client terminals with real-time monitoring and management via web dashboard and mobile app.

**Key Principle**: Two separate communication systems working in parallel
1. **Terminal System** (Master ↔ Client): Fast, reliable position synchronization via Native TCP
2. **Dashboard System** (Web/Mobile): Monitoring, reporting, and command management via HTTPS API

---

## System Architecture

### Communication Layers

#### Layer 1: Terminal Communication (Native TCP)
- **Purpose**: Real-time position synchronization between Master and Clients
- **Protocol**: Native MQL5 TCP Socket (no DLL dependencies)
- **Speed**: Sub-second latency
- **Reliability**: Critical - position data integrity
- **Scalability**: 10-50 concurrent clients per Master
- **Security**: Token-based authentication

#### Layer 2: Dashboard Communication (Web API)
- **Purpose**: Monitoring, reporting, command management
- **Protocol**: HTTPS REST API
- **Speed**: 1-5 second latency acceptable
- **Reliability**: Important but not critical
- **Scalability**: Unlimited clients (server dependent)
- **Security**: Token-based authentication + role-based access

---

## Functional Requirements

### FR1: Master EA V5 - Terminal Communication

#### FR1.1: TCP Server Implementation
- **Requirement**: Master EA must act as TCP server on port 2000
- **Details**:
  - Bind to `0.0.0.0:2000` (all network interfaces)
  - Accept multiple concurrent client connections
  - Handle connection/disconnection gracefully
  - Timeout inactive connections after 60 seconds
- **Acceptance Criteria**:
  - [ ] Server starts without errors
  - [ ] Multiple clients can connect simultaneously
  - [ ] Server logs connection events
  - [ ] Inactive connections are closed

#### FR1.2: Position Broadcasting
- **Requirement**: Master must broadcast current positions to all connected clients
- **Details**:
  - Broadcast every 500ms (configurable)
  - Send JSON format with all position details
  - Include: ticket, symbol, type, volume, price, SL, TP, magic, comment, profit
  - Handle empty position list gracefully
- **Acceptance Criteria**:
  - [ ] Positions broadcast at correct interval
  - [ ] JSON format is valid and complete
  - [ ] All clients receive same data
  - [ ] No data corruption during transmission

#### FR1.3: Position Update Triggers
- **Requirement**: Broadcast positions on trade events, not just timer
- **Details**:
  - Trigger on position open
  - Trigger on position close
  - Trigger on position modify (SL/TP change)
  - Trigger on trade transaction
- **Acceptance Criteria**:
  - [ ] Positions update immediately on trade events
  - [ ] No delay between trade and broadcast
  - [ ] All trade types trigger broadcast

#### FR1.4: Web API Integration (Monitoring)
- **Requirement**: Master must send position updates to Web API
- **Details**:
  - POST to `/api/signal.php` every 2 seconds
  - Include Bearer token authentication
  - Send same position data as TCP broadcast
  - Handle API errors gracefully
- **Acceptance Criteria**:
  - [ ] API calls succeed with 200 response
  - [ ] Data stored in `master_state` table
  - [ ] Errors logged but don't affect TCP broadcast
  - [ ] API calls don't block position broadcasting

#### FR1.5: Master Command Processing
- **Requirement**: Master must receive and execute commands from Web API
- **Details**:
  - Check `/api/command.php` every 5 seconds
  - Commands: PAUSE, RESUME, CLOSE_ALL_BUY, CLOSE_ALL_SELL, CLOSE_ALL
  - PAUSE: Stop broadcasting positions
  - RESUME: Resume broadcasting positions
  - CLOSE_ALL_*: Close specified positions
- **Acceptance Criteria**:
  - [ ] Commands retrieved from API
  - [ ] Commands executed correctly
  - [ ] Command status updated in database
  - [ ] Pause/Resume affects position broadcasting

---

### FR2: Client EA V5 - Terminal Communication

#### FR2.1: TCP Client Implementation
- **Requirement**: Client EA must connect to Master TCP server
- **Details**:
  - Connect to `[master-ip]:2000`
  - Reconnect on connection loss (exponential backoff)
  - Timeout after 30 seconds of no data
  - Handle connection errors gracefully
- **Acceptance Criteria**:
  - [ ] Client connects to Master successfully
  - [ ] Reconnection works after disconnection
  - [ ] Timeout handled correctly
  - [ ] Connection status logged

#### FR2.2: Position Reception
- **Requirement**: Client must receive and parse position data from Master
- **Details**:
  - Receive JSON position data
  - Parse all position fields
  - Handle empty position list
  - Validate data integrity
- **Acceptance Criteria**:
  - [ ] Positions received correctly
  - [ ] JSON parsing works for all data types
  - [ ] Invalid data handled gracefully
  - [ ] No data loss during reception

#### FR2.3: Position Synchronization
- **Requirement**: Client must synchronize positions with Master
- **Details**:
  - Open new positions from Master
  - Update existing positions (SL/TP)
  - Close positions not in Master list
  - Use magic number to identify own positions
  - Store Master ticket in comment field
- **Acceptance Criteria**:
  - [ ] New positions open correctly
  - [ ] Position updates apply correctly
  - [ ] Orphan positions close correctly
  - [ ] No duplicate positions
  - [ ] All positions have correct magic number

#### FR2.4: Web API Integration (Heartbeat)
- **Requirement**: Client must send heartbeat to Web API
- **Details**:
  - POST to `/api/client.php` every 5 seconds
  - Include: account_number, balance, equity, open_positions
  - First request: send registration_token
  - Subsequent requests: send auth_token
  - Receive auth_token on first registration
- **Acceptance Criteria**:
  - [ ] Heartbeat sent at correct interval
  - [ ] Registration token validated
  - [ ] Auth token stored and reused
  - [ ] Account metrics updated in database

#### FR2.5: Client Command Processing
- **Requirement**: Client must receive and execute commands from Web API
- **Details**:
  - Check `/api/client-command.php` every 5 seconds
  - Commands: PAUSE, RESUME, CLOSE_ALL_BUY, CLOSE_ALL_SELL, CLOSE_ALL
  - PAUSE: Stop position synchronization
  - RESUME: Resume position synchronization
  - CLOSE_ALL_*: Close specified positions
- **Acceptance Criteria**:
  - [ ] Commands retrieved from API
  - [ ] Commands executed correctly
  - [ ] Command status updated in database
  - [ ] Pause/Resume affects synchronization

---

### FR3: Web API Endpoints

#### FR3.1: Position Endpoints
- **Endpoint**: `GET /api/positions.php`
- **Purpose**: Retrieve Master positions for dashboard
- **Auth**: Bearer token (Master token)
- **Response**: JSON array of positions
- **Acceptance Criteria**:
  - [ ] Returns current positions
  - [ ] Token validation works
  - [ ] Response format is valid JSON
  - [ ] Includes all position details

#### FR3.2: Signal Endpoint (Updated)
- **Endpoint**: `POST /api/signal.php`
- **Purpose**: Master sends position updates
- **Auth**: Bearer token (Master token)
- **Request**: JSON with positions array
- **Response**: Success/error JSON
- **Acceptance Criteria**:
  - [ ] Stores positions in `master_state` table
  - [ ] Updates `updated_at` timestamp
  - [ ] Returns 200 on success
  - [ ] Logs all requests

#### FR3.3: Master Command Endpoints
- **Endpoint**: `GET /api/command.php`
- **Purpose**: Master retrieves pending commands
- **Auth**: Bearer token (Master token)
- **Response**: JSON with pending command
- **Details**:
  - Return one pending command
  - Mark as executed after retrieval
  - Return empty if no pending commands
- **Acceptance Criteria**:
  - [ ] Returns pending commands
  - [ ] Marks commands as executed
  - [ ] Returns empty when no commands
  - [ ] Token validation works

- **Endpoint**: `POST /api/master-command.php`
- **Purpose**: Admin sends command to Master
- **Auth**: Admin token
- **Request**: JSON with command type
- **Response**: Success/error JSON
- **Details**:
  - Create command in `command_queue` table
  - Set client_id = 0 for Master commands
  - Set status = 'pending'
- **Acceptance Criteria**:
  - [ ] Command stored in database
  - [ ] Only admin can send
  - [ ] Returns 200 on success
  - [ ] Command retrieved by Master

#### FR3.4: Client Endpoint (Updated)
- **Endpoint**: `POST /api/client.php`
- **Purpose**: Client sends heartbeat
- **Auth**: Registration token (first) or auth token (subsequent)
- **Request**: JSON with account metrics
- **Response**: JSON with auth_token and pending command
- **Details**:
  - Validate registration_token on first request
  - Generate auth_token on first registration
  - Update client metrics (balance, equity, positions)
  - Return pending command if exists
- **Acceptance Criteria**:
  - [ ] Registration token validated
  - [ ] Auth token generated and returned
  - [ ] Client metrics updated
  - [ ] Pending command returned
  - [ ] Subsequent requests use auth_token

- **Endpoint**: `GET /api/client-command.php`
- **Purpose**: Client retrieves pending commands
- **Auth**: Auth token
- **Response**: JSON with pending command
- **Details**:
  - Return one pending command for this client
  - Mark as executed after retrieval
  - Return empty if no pending commands
- **Acceptance Criteria**:
  - [ ] Returns pending commands
  - [ ] Marks commands as executed
  - [ ] Returns empty when no commands
  - [ ] Token validation works

- **Endpoint**: `POST /api/client-command-send.php`
- **Purpose**: Trader sends command to their client
- **Auth**: Trader token
- **Request**: JSON with client_id and command
- **Response**: Success/error JSON
- **Details**:
  - Verify trader has access to client
  - Create command in `command_queue` table
  - Set status = 'pending'
- **Acceptance Criteria**:
  - [ ] Command stored in database
  - [ ] Access control verified
  - [ ] Returns 200 on success
  - [ ] Command retrieved by Client

---

### FR4: Dashboard Web Interface

#### FR4.1: Master Monitoring
- **Requirement**: Display Master positions in real-time
- **Details**:
  - Show all open positions
  - Show position details (symbol, type, volume, price, SL, TP, profit)
  - Update every 2 seconds via AJAX
  - Show last update timestamp
- **Acceptance Criteria**:
  - [ ] Positions display correctly
  - [ ] Updates happen automatically
  - [ ] No page refresh needed
  - [ ] Responsive design

#### FR4.2: Client Monitoring
- **Requirement**: Display all clients status
- **Details**:
  - Show client list with status (active, paused, disconnected)
  - Show account metrics (balance, equity, open positions)
  - Show last seen timestamp
  - Update every 5 seconds via AJAX
- **Acceptance Criteria**:
  - [ ] Client list displays correctly
  - [ ] Status updates automatically
  - [ ] Metrics are current
  - [ ] Responsive design

#### FR4.3: Master Command Interface
- **Requirement**: Admin can send commands to Master
- **Details**:
  - Buttons: PAUSE, RESUME, CLOSE_ALL_BUY, CLOSE_ALL_SELL, CLOSE_ALL
  - Confirmation dialog before execution
  - Show command status
  - Log all commands
- **Acceptance Criteria**:
  - [ ] Commands send successfully
  - [ ] Confirmation works
  - [ ] Status updates in real-time
  - [ ] Commands logged

#### FR4.4: Client Command Interface
- **Requirement**: Trader can send commands to their clients
- **Details**:
  - Select client from dropdown
  - Buttons: PAUSE, RESUME, CLOSE_ALL_BUY, CLOSE_ALL_SELL, CLOSE_ALL
  - Confirmation dialog before execution
  - Show command status
  - Log all commands
- **Acceptance Criteria**:
  - [ ] Commands send successfully
  - [ ] Only assigned clients shown
  - [ ] Confirmation works
  - [ ] Status updates in real-time
  - [ ] Commands logged

#### FR4.5: Mobile Responsive
- **Requirement**: Dashboard works on mobile devices
- **Details**:
  - Responsive layout
  - Touch-friendly buttons
  - Optimized for small screens
  - Fast loading
- **Acceptance Criteria**:
  - [ ] Works on mobile browsers
  - [ ] Layout adapts to screen size
  - [ ] Buttons are touch-friendly
  - [ ] Performance acceptable

---

### FR5: Database Schema Updates

#### FR5.1: Master State Table
- **Table**: `master_state`
- **Purpose**: Store latest Master position data
- **Columns**:
  - `id` (INT, PRIMARY KEY) - Always 1
  - `updated_at` (TIMESTAMP) - Last update time
  - `total_positions` (INT) - Number of positions
  - `positions_json` (LONGTEXT) - Full position data
- **Acceptance Criteria**:
  - [ ] Table exists
  - [ ] Data updates correctly
  - [ ] Timestamps accurate

#### FR5.2: Command Queue Table
- **Table**: `command_queue`
- **Purpose**: Store commands for Master and Clients
- **Columns**:
  - `id` (INT, PRIMARY KEY)
  - `client_id` (INT, FOREIGN KEY) - 0 for Master, >0 for Client
  - `command` (ENUM) - PAUSE, RESUME, CLOSE_ALL_BUY, CLOSE_ALL_SELL, CLOSE_ALL
  - `status` (ENUM) - pending, executed, failed
  - `created_at` (TIMESTAMP)
  - `executed_at` (TIMESTAMP)
- **Acceptance Criteria**:
  - [ ] Table exists
  - [ ] Commands stored correctly
  - [ ] Status updates work
  - [ ] Indexes exist

#### FR5.3: Clients Table (Updated)
- **Table**: `clients`
- **Purpose**: Store client information
- **New Columns**:
  - `status` (ENUM) - active, paused, disconnected
  - `last_seen` (TIMESTAMP) - Last heartbeat
  - `balance` (DOUBLE) - Account balance
  - `equity` (DOUBLE) - Account equity
  - `open_positions` (INT) - Number of open positions
- **Acceptance Criteria**:
  - [ ] Table exists
  - [ ] All columns present
  - [ ] Data updates correctly

---

## Non-Functional Requirements

### NFR1: Performance
- **Master Position Broadcast**: < 100ms latency
- **Client Position Sync**: < 500ms latency
- **Web API Response**: < 1 second
- **Dashboard Update**: < 2 seconds
- **Database Query**: < 100ms

### NFR2: Reliability
- **Master Uptime**: 99.5%
- **Client Reconnection**: Automatic within 30 seconds
- **Data Integrity**: No position data loss
- **Command Execution**: 100% success rate

### NFR3: Security
- **Authentication**: Token-based (Bearer token)
- **Authorization**: Role-based access control
- **Encryption**: HTTPS for all web communication
- **Data Validation**: All inputs validated
- **Logging**: All actions logged

### NFR4: Scalability
- **Concurrent Clients**: 10-50 per Master
- **Concurrent Dashboard Users**: Unlimited
- **Database Connections**: Connection pooling
- **API Rate Limiting**: 100 requests/minute per client

### NFR5: Maintainability
- **Code Documentation**: All functions documented
- **Error Handling**: Comprehensive error handling
- **Logging**: Detailed logging for debugging
- **Testing**: Unit tests for critical functions

---

## Development Phases

### Phase 1: Master EA V5 (Native TCP Server)
- [ ] TCP server implementation
- [ ] Position broadcasting
- [ ] Web API integration
- [ ] Command processing
- [ ] Testing and debugging

### Phase 2: Client EA V5 (Native TCP Client)
- [ ] TCP client implementation
- [ ] Position reception and parsing
- [ ] Position synchronization
- [ ] Web API integration
- [ ] Command processing
- [ ] Testing and debugging

### Phase 3: Web API Endpoints
- [ ] New endpoints implementation
- [ ] Database updates
- [ ] Authentication and authorization
- [ ] Error handling
- [ ] Testing and debugging

### Phase 4: Dashboard Updates
- [ ] Master monitoring interface
- [ ] Client monitoring interface
- [ ] Command interfaces
- [ ] Real-time updates (AJAX)
- [ ] Mobile responsive design
- [ ] Testing and debugging

### Phase 5: Integration Testing
- [ ] End-to-end testing
- [ ] Performance testing
- [ ] Security testing
- [ ] Load testing
- [ ] Documentation

---

## Success Criteria

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

---

## Risks and Mitigation

### Risk 1: TCP Connection Stability
- **Risk**: Network interruptions cause connection loss
- **Mitigation**: Implement automatic reconnection with exponential backoff
- **Fallback**: Web API as backup communication channel

### Risk 2: Position Data Corruption
- **Risk**: Data corruption during transmission
- **Mitigation**: Validate all received data, use checksums
- **Fallback**: Request data retransmission

### Risk 3: Scalability Issues
- **Risk**: Performance degrades with many clients
- **Mitigation**: Load testing, optimize code, use connection pooling
- **Fallback**: Implement client grouping or sharding

### Risk 4: Security Vulnerabilities
- **Risk**: Unauthorized access or data breach
- **Mitigation**: Strong authentication, encryption, input validation
- **Fallback**: Regular security audits

---

## Timeline Estimate

- **Phase 1**: 2-3 days
- **Phase 2**: 2-3 days
- **Phase 3**: 1-2 days
- **Phase 4**: 2-3 days
- **Phase 5**: 1-2 days
- **Total**: 8-13 days

