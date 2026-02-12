# CopyPoz V5 - Hybrid Master-Client Trading System

![Version](https://img.shields.io/badge/version-5.0-blue)
![Status](https://img.shields.io/badge/status-complete-green)
![License](https://img.shields.io/badge/license-proprietary-red)

CopyPoz V5 is a professional **Hybrid Master-Client** system for copying trading positions between MetaTrader 5 terminals using native TCP and HTTPS API.

## 🚀 Features

### Master EA V5
- ✅ Native TCP Server (0.0.0.0:2000)
- ✅ Position Broadcasting (500ms)
- ✅ Web API Integration (2s)
- ✅ Command Processing (5s)
- ✅ License System (DEMO, TRIAL, PRO, ENTERPRISE)
- ✅ Multi-language Support (TR, EN)
- ✅ Error Handling & Logging

### Client EA V5
- ✅ Native TCP Client
- ✅ Position Synchronization (500ms)
- ✅ Web API Heartbeat (5s)
- ✅ Command Processing (5s)
- ✅ Auto-reconnect (5s)
- ✅ Multi-language Support (TR, EN)
- ✅ Error Handling & Logging

### Web API
- ✅ 6 REST Endpoints
- ✅ Bearer Token Authentication
- ✅ Real-time Position Updates
- ✅ Command Queue Management
- ✅ Client Management

### Dashboard
- ✅ Real-time Monitoring
- ✅ Master Status Display
- ✅ Client Management
- ✅ Command Interface
- ✅ Mobile Responsive
- ✅ Auto-refresh (5s)

## 📦 Installation

### Quick Start (2 Files Only!)

#### Master EA
```
1. Copy CopyPoz_V5/Master/CopyPoz_Master_V5.mq5 to MetaTrader 5 Experts folder
2. Restart MetaTrader 5
3. Attach to any chart
4. Set parameters (Language: TR, LicenseKey: DEMO)
5. Done!
```

#### Client EA
```
1. Copy CopyPoz_V5/Client/CopyPoz_Client_V5.mq5 to MetaTrader 5 Experts folder
2. Restart MetaTrader 5
3. Attach to any chart
4. Set parameters (MasterAddress: 127.0.0.1:2000)
5. Done!
```

#### Web API
```
1. Upload Dashboard/api/*.php to your web server
2. Create database tables
3. Configure environment variables
4. Done!
```

## 🎯 Parameters

### Master EA
```
Language: TR (or EN)
LicenseKey: DEMO (or license key)
TcpAddress: 0.0.0.0:2000
BroadcastInterval: 500 (ms)
EnableWebMonitor: true
```

### Client EA
```
Language: TR (or EN)
MasterAddress: 127.0.0.1:2000
ReconnectInterval: 5000 (ms)
EnableWebMonitor: true
```

## 📊 Architecture

```
Master Terminal          Client Terminal
┌──────────────┐        ┌──────────────┐
│ Master EA V5 │◄──TCP──►│ Client EA V5 │
└──────────────┘        └──────────────┘
       │                       │
       │ HTTPS                 │ HTTPS
       ▼                       ▼
┌──────────────────────────────────────┐
│      Web Dashboard (PHP)             │
│  ┌────────────────────────────────┐  │
│  │ API Endpoints                  │  │
│  │ - /api/positions.php           │  │
│  │ - /api/signal.php              │  │
│  │ - /api/master-command.php      │  │
│  │ - /api/client.php              │  │
│  │ - /api/client-command.php      │  │
│  │ - /api/clients.php             │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │ Database                       │  │
│  │ - master_state                 │  │
│  │ - clients                      │  │
│  │ - command_queue                │  │
│  │ - users                        │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

## 🔧 Commands

### Master Commands
- `PAUSE` - Stop position broadcasting
- `RESUME` - Resume position broadcasting
- `CLOSE_ALL_BUY` - Close all BUY positions
- `CLOSE_ALL_SELL` - Close all SELL positions
- `CLOSE_ALL` - Close all positions

### Client Commands
- `PAUSE` - Stop synchronization
- `RESUME` - Resume synchronization
- `CLOSE_ALL_BUY` - Close all BUY positions
- `CLOSE_ALL_SELL` - Close all SELL positions
- `CLOSE_ALL` - Close all positions

## 📋 License Types

| Type | Duration | Max Clients | Usage |
|------|----------|-------------|-------|
| DEMO | Unlimited | 5 | Testing |
| TRIAL | 30 days | 5 | Trial |
| PRO | 1 year | 50 | Professional |
| ENTERPRISE | Unlimited | 1000 | Enterprise |

## 🌐 Language Support

- ✅ Turkish (TR)
- ✅ English (EN)

## 📊 Performance

- **Position Broadcasting**: < 100ms
- **Web API Response**: < 500ms
- **Concurrent Clients**: 10-50
- **Max Clients**: 5-1000 (depends on license)

## 🔒 Security

- ✅ Bearer Token Authentication
- ✅ Access Control (Admin, Trader, Client)
- ✅ Input Validation
- ✅ Error Handling
- ✅ Audit Logging

## 📁 File Structure

```
CopyPoz_V5/
├── Master/
│   └── CopyPoz_Master_V5.mq5
├── Client/
│   └── CopyPoz_Client_V5.mq5
├── README.md
└── INSTALLATION.md

Dashboard/
├── api/
│   ├── positions.php
│   ├── signal.php
│   ├── master-command.php
│   ├── client.php
│   ├── client-command.php
│   └── clients.php
├── admin/
│   ├── licenses.php
│   ├── users.php
│   └── clients.php
└── dashboard-v5.php
```

## 📚 Documentation

- [README.md](CopyPoz_V5/README.md) - Technical details
- [INSTALLATION.md](CopyPoz_V5/INSTALLATION.md) - Installation guide
- [INTEGRATION_TESTS.md](INTEGRATION_TESTS.md) - Test scenarios
- [CopyPoz_V5_FINAL.md](CopyPoz_V5_FINAL.md) - Project summary

## 🧪 Testing

20 integration test scenarios included:
- Functional tests
- Performance tests
- Security tests
- Load tests

See [INTEGRATION_TESTS.md](INTEGRATION_TESTS.md) for details.

## 🚀 Getting Started

1. **Install Master EA**: Copy to MetaTrader 5 Experts folder
2. **Install Client EA**: Copy to MetaTrader 5 Experts folder
3. **Deploy Web API**: Upload to web server
4. **Configure Dashboard**: Set environment variables
5. **Run Tests**: Execute 20 test scenarios
6. **Monitor**: Use dashboard for real-time monitoring

## 📞 Support

For questions or issues, please contact support.

## 📄 License

Copyright 2026, CopyPoz V5. All rights reserved.

---

**Status**: ✅ Complete and Ready for Production

**Version**: 5.0

**Last Updated**: February 12, 2026

