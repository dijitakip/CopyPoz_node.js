# CopyPoz V5 - Hybrid Architecture Specification Summary

## Quick Overview

CopyPoz V5 is a complete redesign using a **Hybrid Architecture** that separates concerns into two independent systems:

### System 1: Terminal Communication (Master ↔ Client)
- **Technology**: Native MQL5 TCP Sockets (no DLL dependencies)
- **Purpose**: Real-time position synchronization
- **Speed**: Sub-second latency
- **Scalability**: 10-50 concurrent clients per Master
- **Reliability**: Critical - position data integrity

### System 2: Dashboard Communication (Web/Mobile)
- **Technology**: HTTPS REST API
- **Purpose**: Monitoring, reporting, command management
- **Speed**: 1-5 second latency acceptable
- **Scalability**: Unlimited clients (server dependent)
- **Reliability**: Important but not critical

---

## Key Improvements Over V4

| Aspect | V4 (ZeroMQ) | V5 (Hybrid) |
|--------|------------|-----------|
| **DLL Dependencies** | Yes (libzmq.dll) | No (Native MQL5) |
| **Security** | Medium | High (Token-based) |
| **Scalability** | Unlimited | 10-50 clients |
| **Latency** | <100ms | <100ms |
| **Complexity** | Medium | Medium |
| **Stability** | Issues with DLL | Stable (Native) |
| **Firewall Friendly** | No | Yes (HTTPS) |
| **Monitoring** | Limited | Full Dashboard |
| **Mobile Support** | No | Yes |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ MASTER TERMINAL                                             │
├─────────────────────────────────────────────────────────────┤
│ Master EA V5                                                │
│  ├─ TCP Server (0.0.0.0:2000)                              │
│  │  └─ Broadcast positions to Clients (500ms)              │
│  │     - Fast, reliable, real-time                         │
│  │                                                          │
│  └─ Web API (HTTPS)                                         │
│     ├─ POST /api/signal.php (2s) - Send positions          │
│     └─ GET /api/command.php (5s) - Receive commands        │
│        - Monitoring, reporting, commands                   │
└─────────────────────────────────────────────────────────────┘
         ↓ TCP (fast)              ↓ HTTPS (monitoring)
         ↓                          ↓
┌─────────────────────────────────────────────────────────────┐
│ CLIENT TERMINAL (1, 2, 3...)                                │
├─────────────────────────────────────────────────────────────┤
│ Client EA V5                                                │
│  ├─ TCP Client (master-ip:2000)                            │
│  │  └─ Receive positions from Master (500ms)               │
│  │     - Fast, reliable, real-time                         │
│  │                                                          │
│  └─ Web API (HTTPS)                                         │
│     ├─ POST /api/client.php (5s) - Send heartbeat          │
│     └─ GET /api/client-command.php (5s) - Receive commands │
│        - Monitoring, reporting, commands                   │
└─────────────────────────────────────────────────────────────┘
         ↓ TCP (fast)              ↓ HTTPS (monitoring)
         ↓                          ↓
┌─────────────────────────────────────────────────────────────┐
│ WEB DASHBOARD + MOBILE APP                                  │
├─────────────────────────────────────────────────────────────┤
│ Admin Panel                                                 │
│  ├─ Master positions (real-time)                           │
│  ├─ All clients status                                     │
│  ├─ Send commands to Master                                │
│  └─ Send commands to Clients                               │
│                                                             │
│ Trader Panel                                                │
│  ├─ Own client status                                      │
│  ├─ Send commands to own client                            │
│  └─ Account management                                     │
│                                                             │
│ Mobile App                                                  │
│  ├─ Real-time notifications                                │
│  ├─ Position monitoring                                    │
│  └─ Command execution                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Development Phases

### Phase 1: Master EA V5 (2-3 days)
- TCP Server implementation
- Position broadcasting
- Web API integration
- Command processing

### Phase 2: Client EA V5 (2-3 days)
- TCP Client implementation
- Position reception and parsing
- Position synchronization
- Web API integration
- Command processing

### Phase 3: Web API Endpoints (1-2 days)
- New endpoints implementation
- Database updates
- Authentication and authorization

### Phase 4: Dashboard Updates (2-3 days)
- Master monitoring interface
- Client monitoring interface
- Command interfaces
- Mobile responsive design

### Phase 5: Integration Testing (1-2 days)
- End-to-end testing
- Performance testing
- Security testing
- Load testing

**Total Duration**: 8-13 days

---

## Key Features

### Master EA V5
✅ Native TCP Server (no DLL)
✅ Position broadcasting (500ms)
✅ Web API integration (2s)
✅ Command processing (5s)
✅ Multiple client support (10-50)
✅ Error handling and logging
✅ Pause/Resume functionality
✅ Position closing commands

### Client EA V5
✅ Native TCP Client (no DLL)
✅ Position reception (500ms)
✅ Position synchronization
✅ Web API heartbeat (5s)
✅ Command processing (5s)
✅ Automatic reconnection
✅ Error handling and logging
✅ Pause/Resume functionality

### Web API
✅ Position endpoints
✅ Command endpoints
✅ Token-based authentication
✅ Role-based access control
✅ Error handling
✅ Logging and monitoring

### Dashboard
✅ Master position monitoring
✅ Client status monitoring
✅ Real-time updates (AJAX)
✅ Command interfaces
✅ Mobile responsive
✅ Admin and Trader panels
✅ Push notifications (mobile)

---

## Technical Specifications

### Communication Protocols

#### TCP (Master ↔ Client)
- **Port**: 2000 (configurable)
- **Format**: JSON
- **Frequency**: 500ms (configurable)
- **Timeout**: 60 seconds
- **Reconnection**: Exponential backoff

#### HTTPS (Web API)
- **Protocol**: REST API
- **Authentication**: Bearer token
- **Frequency**: 2-5 seconds
- **Timeout**: 30 seconds
- **Rate Limiting**: 100 req/min per client

### Data Structures

#### Position Data (JSON)
```json
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
```

#### Command Data (JSON)
```json
{
  "command": "PAUSE",
  "status": "pending",
  "created_at": "2026-02-12 12:00:00"
}
```

### Database Schema

#### master_state
- `id` (INT) - Always 1
- `updated_at` (TIMESTAMP) - Last update
- `total_positions` (INT) - Position count
- `positions_json` (LONGTEXT) - Position data

#### command_queue
- `id` (INT) - Command ID
- `client_id` (INT) - 0 for Master, >0 for Client
- `command` (ENUM) - PAUSE, RESUME, CLOSE_ALL_BUY, CLOSE_ALL_SELL, CLOSE_ALL
- `status` (ENUM) - pending, executed, failed
- `created_at` (TIMESTAMP)
- `executed_at` (TIMESTAMP)

#### clients
- `id` (INT) - Client ID
- `account_number` (BIGINT) - Account number
- `account_name` (VARCHAR) - Account name
- `auth_token` (VARCHAR) - Authentication token
- `status` (ENUM) - active, paused, disconnected
- `last_seen` (TIMESTAMP) - Last heartbeat
- `balance` (DOUBLE) - Account balance
- `equity` (DOUBLE) - Account equity
- `open_positions` (INT) - Position count

---

## Security Features

### Authentication
- **Master**: Bearer token in Authorization header
- **Client**: Registration token (first), then auth token
- **Dashboard**: User authentication + role-based access

### Authorization
- **Admin**: Full access to all features
- **Trader**: Access to assigned clients only
- **Viewer**: Read-only access

### Data Protection
- **HTTPS**: All web communication encrypted
- **Token Validation**: All requests validated
- **Input Validation**: All inputs sanitized
- **SQL Injection Prevention**: Prepared statements
- **XSS Prevention**: HTML escaping

---

## Performance Targets

| Metric | Target | Actual |
|--------|--------|--------|
| Master broadcast latency | <100ms | TBD |
| Client sync latency | <500ms | TBD |
| Web API response | <1s | TBD |
| Dashboard update | <2s | TBD |
| Database query | <100ms | TBD |
| Concurrent clients | 10-50 | TBD |

---

## Testing Strategy

### Unit Testing
- Individual function testing
- Error handling verification
- Data validation testing

### Integration Testing
- Master ↔ Client communication
- Web API integration
- Dashboard functionality

### Performance Testing
- Latency measurement
- Throughput testing
- Load testing (10-50 clients)

### Security Testing
- Token validation
- Access control
- Data encryption
- Input validation

### End-to-End Testing
- Complete workflow testing
- Error recovery testing
- Failover testing

---

## Deployment Checklist

### Pre-Deployment
- [ ] All code reviewed
- [ ] All tests passed
- [ ] Documentation complete
- [ ] Security audit passed
- [ ] Performance targets met

### Deployment
- [ ] Database schema updated
- [ ] API endpoints deployed
- [ ] Dashboard updated
- [ ] Master EA compiled and tested
- [ ] Client EA compiled and tested

### Post-Deployment
- [ ] Monitor system performance
- [ ] Monitor error logs
- [ ] Verify all features working
- [ ] Collect user feedback
- [ ] Plan improvements

---

## Risk Mitigation

### Risk 1: TCP Connection Stability
- **Mitigation**: Automatic reconnection with exponential backoff
- **Fallback**: Web API as backup communication

### Risk 2: Position Data Corruption
- **Mitigation**: Data validation, checksums
- **Fallback**: Request data retransmission

### Risk 3: Scalability Issues
- **Mitigation**: Load testing, code optimization
- **Fallback**: Client grouping or sharding

### Risk 4: Security Vulnerabilities
- **Mitigation**: Security audit, input validation
- **Fallback**: Regular security updates

---

## Success Criteria

✅ Master EA V5 compiles without errors
✅ Client EA V5 compiles without errors
✅ Master and Client connect via TCP successfully
✅ Positions sync correctly between Master and Client
✅ Web API endpoints work correctly
✅ Dashboard displays real-time data
✅ Commands execute successfully
✅ All tests pass
✅ Documentation complete
✅ System handles 10+ concurrent clients
✅ No data loss during operation
✅ Performance meets targets

---

## Next Steps

1. **Review Requirements** - Confirm all requirements are clear
2. **Review Development Plan** - Confirm development approach
3. **Start Phase 1** - Begin Master EA V5 development
4. **Iterate through phases** - Follow development plan
5. **Testing and deployment** - Complete testing and deploy

---

## Documents

- **requirements.md** - Detailed functional and non-functional requirements
- **development-plan.md** - Step-by-step development plan with code structure
- **SPEC_SUMMARY.md** - This document (quick reference)

---

## Questions & Clarifications

Before starting development, confirm:

1. ✅ Hybrid architecture approach approved?
2. ✅ Native TCP (no DLL) acceptable?
3. ✅ 10-50 concurrent clients sufficient?
4. ✅ 500ms broadcast interval acceptable?
5. ✅ Dashboard features complete?
6. ✅ Timeline (8-13 days) acceptable?
7. ✅ Development phases in correct order?

**Ready to start Phase 1?**

