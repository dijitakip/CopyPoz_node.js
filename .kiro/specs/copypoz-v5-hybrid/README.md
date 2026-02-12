# CopyPoz V5 - Hybrid Architecture Specification

## 📋 Document Index

This specification contains detailed plans for CopyPoz V5 development. Start here:

### 1. **SPEC_SUMMARY.md** ⭐ START HERE
   - Quick overview of the entire system
   - Architecture diagram
   - Key improvements over V4
   - Success criteria
   - **Read this first (5 minutes)**

### 2. **requirements.md**
   - Detailed functional requirements (FR1-FR5)
   - Non-functional requirements (NFR1-NFR5)
   - Database schema
   - Development phases
   - Success criteria
   - **Read this for complete requirements (30 minutes)**

### 3. **development-plan.md**
   - Step-by-step development plan
   - 5 phases with detailed tasks
   - Code structure for each phase
   - Acceptance criteria for each task
   - Testing strategy
   - **Read this before starting development (45 minutes)**

---

## 🎯 Quick Start

### For Project Managers
1. Read **SPEC_SUMMARY.md** (5 min)
2. Review timeline: **8-13 days**
3. Check success criteria
4. Approve and proceed

### For Developers
1. Read **SPEC_SUMMARY.md** (5 min)
2. Read **requirements.md** (30 min)
3. Read **development-plan.md** (45 min)
4. Start Phase 1 with detailed tasks

### For QA/Testers
1. Read **SPEC_SUMMARY.md** (5 min)
2. Review Phase 5 in **development-plan.md**
3. Prepare test cases
4. Execute testing after Phase 4

---

## 🏗️ System Architecture

### Two Independent Systems

#### System 1: Terminal Communication (Master ↔ Client)
- **Technology**: Native MQL5 TCP Sockets
- **Purpose**: Real-time position synchronization
- **Speed**: Sub-second latency
- **Scalability**: 10-50 concurrent clients
- **Reliability**: Critical

#### System 2: Dashboard Communication (Web/Mobile)
- **Technology**: HTTPS REST API
- **Purpose**: Monitoring, reporting, commands
- **Speed**: 1-5 second latency
- **Scalability**: Unlimited
- **Reliability**: Important

---

## 📊 Development Timeline

| Phase | Component | Duration | Status |
|-------|-----------|----------|--------|
| 1 | Master EA V5 | 2-3 days | Not Started |
| 2 | Client EA V5 | 2-3 days | Not Started |
| 3 | Web API Endpoints | 1-2 days | Not Started |
| 4 | Dashboard Updates | 2-3 days | Not Started |
| 5 | Integration Testing | 1-2 days | Not Started |
| **Total** | | **8-13 days** | |

---

## ✅ Key Features

### Master EA V5
- ✅ Native TCP Server (no DLL dependencies)
- ✅ Position broadcasting (500ms interval)
- ✅ Web API integration (monitoring)
- ✅ Command processing (PAUSE, RESUME, CLOSE)
- ✅ Multiple client support (10-50)
- ✅ Error handling and logging

### Client EA V5
- ✅ Native TCP Client (no DLL dependencies)
- ✅ Position reception and synchronization
- ✅ Web API heartbeat (monitoring)
- ✅ Command processing (PAUSE, RESUME, CLOSE)
- ✅ Automatic reconnection
- ✅ Error handling and logging

### Web API
- ✅ Position endpoints
- ✅ Command endpoints
- ✅ Token-based authentication
- ✅ Role-based access control
- ✅ Error handling and logging

### Dashboard
- ✅ Master position monitoring (real-time)
- ✅ Client status monitoring (real-time)
- ✅ Command interfaces (Admin & Trader)
- ✅ Mobile responsive design
- ✅ Push notifications (mobile)

---

## 🔒 Security Features

- **Authentication**: Bearer token + role-based access
- **Encryption**: HTTPS for all web communication
- **Validation**: All inputs validated and sanitized
- **Logging**: All actions logged for audit trail
- **Access Control**: Admin, Trader, Viewer roles

---

## 📈 Performance Targets

| Metric | Target |
|--------|--------|
| Master broadcast latency | <100ms |
| Client sync latency | <500ms |
| Web API response | <1 second |
| Dashboard update | <2 seconds |
| Database query | <100ms |
| Concurrent clients | 10-50 |

---

## 🚀 Getting Started

### Prerequisites
- MetaTrader 5 (Master and Client terminals)
- Web server with PHP and MySQL
- Network connectivity between terminals and server

### Installation Steps
1. Deploy Master EA V5 on Master terminal
2. Deploy Client EA V5 on Client terminal(s)
3. Deploy Web API endpoints on server
4. Update Dashboard with new features
5. Run integration tests
6. Deploy to production

---

## 📝 Specification Status

| Document | Status | Last Updated |
|----------|--------|--------------|
| SPEC_SUMMARY.md | ✅ Complete | 2026-02-12 |
| requirements.md | ✅ Complete | 2026-02-12 |
| development-plan.md | ✅ Complete | 2026-02-12 |
| README.md | ✅ Complete | 2026-02-12 |

---

## ❓ FAQ

### Q: Why Native TCP instead of ZeroMQ?
**A**: ZeroMQ requires DLL files which caused security warnings and compatibility issues. Native MQL5 TCP sockets are built-in, more stable, and don't require external dependencies.

### Q: How many clients can one Master support?
**A**: 10-50 concurrent clients per Master. This is based on typical system resources. Can be increased with optimization.

### Q: What if network connection is lost?
**A**: Client automatically reconnects with exponential backoff. Web API serves as backup communication channel.

### Q: Is the system secure?
**A**: Yes. Token-based authentication, HTTPS encryption, input validation, and role-based access control are implemented.

### Q: Can I use this on different networks?
**A**: Yes. Master and Client can be on different networks. Just configure the Master's IP address in the Client EA.

### Q: What about mobile support?
**A**: Dashboard is mobile responsive. Mobile app (React Native/Flutter) can be developed in future phases.

---

## 🔗 Related Documents

- **QUICK_START.md** - Quick setup guide (from V4)
- **TESTING_GUIDE.md** - Testing procedures (from V4)
- **CHANGES_SUMMARY.md** - V4 changes summary

---

## 📞 Support

For questions or clarifications:
1. Review the relevant specification document
2. Check the FAQ section
3. Contact the development team

---

## 🎓 Learning Path

### For New Team Members
1. Read SPEC_SUMMARY.md (5 min)
2. Read requirements.md (30 min)
3. Read development-plan.md (45 min)
4. Review code structure in development-plan.md
5. Start with Phase 1 tasks

### For Experienced Developers
1. Skim SPEC_SUMMARY.md (2 min)
2. Review development-plan.md (20 min)
3. Start Phase 1 immediately

---

## ✨ Version History

| Version | Date | Status | Notes |
|---------|------|--------|-------|
| V5.0 | 2026-02-12 | Specification | Initial specification complete |
| V4.0 | 2026-02-10 | Production | ZeroMQ-based (deprecated) |
| V3.x | 2026-01-xx | Legacy | Web API only |

---

## 📋 Checklist Before Starting

- [ ] All team members read SPEC_SUMMARY.md
- [ ] Requirements approved by stakeholders
- [ ] Development timeline approved
- [ ] Resources allocated
- [ ] Development environment ready
- [ ] Database schema prepared
- [ ] API server ready
- [ ] Testing environment ready

---

## 🎯 Success Criteria

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
- [ ] Performance meets targets

---

**Ready to start development? Begin with Phase 1 in development-plan.md**

