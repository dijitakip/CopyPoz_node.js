# CopyPoz V4 - Changes Summary

## Latest Updates (Session 2)

### 1. Master EA (`CopyPoz_Master_V4.mq5`)

#### Fixed Web API Data Format
- **Issue**: Web API was receiving incorrect JSON structure
- **Fix**: Separated ZeroMQ JSON (with type and timestamp) from Web API JSON (positions only)
- **Impact**: Signal API now correctly receives and stores position data

**Before**:
```mql5
string json = "{\"type\":\"POSITIONS_BROADCAST\",\"timestamp\":...,\"positions\":[...]}";
SendToWeb(json);  // Wrong format for signal.php
```

**After**:
```mql5
string zmqJson = "{\"type\":\"POSITIONS_BROADCAST\",\"timestamp\":...,\"positions\":[...]}";
string webJson = "{\"positions\":[...]}";
SendToWeb(webJson);  // Correct format for signal.php
```

#### Improved Web API Error Handling
- Added proper result buffer handling in WebRequest
- Fixed logging to use `LogDetailed` flag
- Better error messages for debugging

**Changes**:
- Line 158: Fixed `WebRequest` result parameter (was passing `data` twice)
- Line 165-170: Added conditional logging based on `LogDetailed` flag
- Line 172-177: Improved error reporting

---

### 2. Client EA (`CopyPoz_Client_V4.mq5`)

#### Updated ZeroMQ Port
- **Issue**: Default port 2000 might be in use
- **Fix**: Changed default to port 2001 to match Master EA
- **Impact**: Ensures Master and Client connect on same port

**Change**:
```mql5
// Before
input string ZmqAddress = "tcp://localhost:2000";

// After
input string ZmqAddress = "tcp://localhost:2001";
```

---

## Previous Session Changes (Session 1)

### 1. Domain Migration
- Changed from `https://fxdash.haziroglu.com/Dashboard/` to `https://fx.haziroglu.com/`
- Updated `.htaccess` for root-level access
- Updated all API endpoints in both EAs

### 2. Security Implementation
- Implemented two-tier token system:
  - **Registration Token**: `MASTER_SECRET_TOKEN_123` (for first registration)
  - **Auth Token**: Generated per client (for subsequent requests)
- Updated Client API to validate registration token on first request
- Updated Client EA to send registration token on first heartbeat

### 3. Client Management
- Added client creation form in Dashboard
- Automatic token generation for new clients
- Admin interface for managing client-trader relationships

### 4. ZeroMQ Integration
- Copied ZeroMQ library files to MetaTrader Include folder
- Implemented PUB/SUB pattern for Master-Client communication
- Added error handling for ZeroMQ initialization

---

## System Architecture

### Communication Layers

#### Layer 1: ZeroMQ (Local, Fast)
- **Master**: Publishes positions via `tcp://*:2001`
- **Client**: Subscribes to positions via `tcp://localhost:2001`
- **Purpose**: Real-time position synchronization
- **Frequency**: Every 500ms (configurable)

#### Layer 2: Web API (Remote, Monitored)
- **Master → Signal API**: Sends position updates for monitoring
  - Endpoint: `https://fx.haziroglu.com/api/signal.php`
  - Auth: Bearer token in Authorization header
  - Frequency: Every 2 seconds (configurable)

- **Client → Client API**: Sends heartbeat and receives commands
  - Endpoint: `https://fx.haziroglu.com/api/client.php`
  - Auth: Registration token (first request), then auth token
  - Frequency: Every 5 seconds (configurable)

---

## Database Schema

### Key Tables

#### `clients`
- Stores client account information
- `auth_token`: Unique token for each client
- `last_seen`: Last heartbeat timestamp
- `balance`, `equity`, `open_positions`: Account metrics

#### `master_state`
- Stores latest Master position data
- `positions_json`: Full position details
- `updated_at`: Last update timestamp

#### `command_queue`
- Stores commands from Dashboard to Client
- Status: pending → executed
- Commands: PAUSE, RESUME, CLOSE_ALL_BUY, CLOSE_ALL_SELL, CLOSE_ALL

#### `trader_clients`
- Maps traders to clients they manage
- Enables role-based access control

---

## Security Features

### Token System
1. **Master Token** (`MASTER_SECRET_TOKEN_123`)
   - Used for Master API authentication
   - Used for Client registration validation
   - Shared between Master EA and Dashboard

2. **Client Auth Token**
   - Generated on first registration
   - 32 bytes (256 bits) random
   - Unique per client
   - Used for subsequent heartbeats

### Validation Flow
```
Client First Request:
  1. Client sends: account_number + registration_token
  2. Server validates: registration_token == MASTER_TOKEN
  3. Server generates: auth_token (random 32 bytes)
  4. Server returns: auth_token
  5. Client stores: auth_token

Client Subsequent Requests:
  1. Client sends: account_number + auth_token
  2. Server validates: auth_token matches stored token
  3. Server processes: heartbeat and returns commands
```

---

## Configuration Parameters

### Master EA
```mql5
ZmqAddress = "tcp://*:2001"           // ZeroMQ bind address
BroadcastInterval = 500               // Position broadcast interval (ms)
EnableWebMonitor = true               // Enable Web API calls
WebMonitorUrl = "https://fx.haziroglu.com/api/signal.php"
MasterToken = "MASTER_SECRET_TOKEN_123"
LogDetailed = true                    // Detailed logging for debugging
```

### Client EA
```mql5
ZmqAddress = "tcp://localhost:2001"   // Master address
RegistrationToken = "MASTER_SECRET_TOKEN_123"
WebMonitorUrl = "https://fx.haziroglu.com/api/client.php"
MagicNumber = 123456                  // Unique per client
LotMultiplier = 1.0                   // Scale positions
LogDetailed = true                    // Detailed logging for debugging
```

---

## Testing Recommendations

### Phase 1: Compilation
- [ ] Master EA compiles without errors
- [ ] Client EA compiles without errors
- [ ] ZeroMQ library files are in Include folder

### Phase 2: Startup
- [ ] Master EA loads on chart without errors
- [ ] Client EA loads on chart without errors
- [ ] Both EAs show successful initialization messages

### Phase 3: ZeroMQ Communication
- [ ] Master broadcasts positions via ZeroMQ
- [ ] Client receives positions via ZeroMQ
- [ ] Positions sync correctly between Master and Client

### Phase 4: Web API
- [ ] Master sends position updates to signal.php
- [ ] Client sends heartbeats to client.php
- [ ] Database updates with position and client data

### Phase 5: Dashboard
- [ ] Master positions visible in dashboard
- [ ] Client status visible in dashboard
- [ ] Commands execute correctly on client

---

## Known Limitations

1. **JSON Parser**: Simple string-based parser in Client EA
   - Works for Master EA's JSON format
   - May fail with complex nested structures

2. **Symbol Mapping**: Basic suffix-based mapping
   - Supports custom mapping via `SymbolMapList`
   - Doesn't support complex transformations

3. **Error Recovery**: Limited automatic recovery
   - Manual restart required for some errors
   - Consider implementing auto-reconnect in future

4. **Scalability**: Single Master to multiple Clients
   - Tested with 1 Master and 1 Client
   - Performance with many clients not tested

---

## Future Improvements

1. **Enhanced JSON Parser**: Use proper JSON library
2. **Auto-Reconnect**: Automatic recovery from connection loss
3. **Position History**: Store historical position data
4. **Advanced Filtering**: Filter positions by symbol, type, etc.
5. **Performance Metrics**: Track sync latency and success rates
6. **Backup Master**: Failover support for high availability
7. **Mobile App**: Mobile dashboard for monitoring
8. **Alerts**: Email/SMS alerts for important events

---

## Support & Debugging

### Enable Detailed Logging
Set `LogDetailed = true` in both EAs to see:
- ZeroMQ initialization
- Position broadcasts
- Web API calls
- Error details

### Check Logs
- **Master EA**: MetaTrader Expert tab
- **Client EA**: MetaTrader Expert tab
- **Web API**: `Dashboard/logs/php_errors.log`

### Common Issues & Solutions
See `TESTING_GUIDE.md` for detailed troubleshooting

---

## Version History

- **V4.0** (Current)
  - ZeroMQ integration for fast local communication
  - Web API for monitoring and commands
  - Two-tier token authentication
  - Client management dashboard

- **V3.x** (Previous)
  - Web API only communication
  - Basic authentication

- **V2.x** (Legacy)
  - Manual position copying

- **V1.x** (Initial)
  - Proof of concept

