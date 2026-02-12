# CopyPoz V4 - Testing & Troubleshooting Guide

## Overview
This guide covers testing the complete CopyPoz system with Master EA, Client EA, Web API, and ZeroMQ communication.

---

## System Architecture

### Components
1. **Master EA** (`CopyPoz_Master_V4.mq5`) - Runs on Master account, broadcasts positions
2. **Client EA** (`CopyPoz_Client_V4.mq5`) - Runs on Client accounts, copies positions
3. **Web API** - Dashboard for monitoring and management
4. **ZeroMQ** - Local fast communication between Master and Clients
5. **Database** - Stores client info, commands, and position history

### Communication Flow
```
Master EA
  ├─ ZeroMQ (tcp://*:2001) → Client EAs (fast, local)
  └─ Web API (https://fx.haziroglu.com/api/signal.php) → Dashboard (monitoring)

Client EA
  ├─ ZeroMQ (tcp://localhost:2001) ← Master EA (receive positions)
  └─ Web API (https://fx.haziroglu.com/api/client.php) → Dashboard (heartbeat)
```

---

## Pre-Testing Checklist

### 1. ZeroMQ Library Setup
- [ ] Copy `Libraries\libzmq.dll` and `Libraries\libsodium.dll` to:
  ```
  C:\Users\[USERNAME]\AppData\Roaming\MetaQuotes\Terminal\[TERMINAL_ID]\MQL5\Libraries\
  ```
  *(Both files are required)*
- [ ] Copy `Zmq` folder to MetaTrader's Include directory:
  ```
  C:\Users\[USERNAME]\AppData\Roaming\MetaQuotes\Terminal\[TERMINAL_ID]\MQL5\Include\Zmq\
  ```
- [ ] Verify files exist:
  - `Zmq.mqh`
  - `Context.mqh`
  - `Socket.mqh`
  - `ZmqMsg.mqh`
  - Other supporting files

### 2. Port Availability
- [ ] Check if port 2001 is available (Master EA uses this)
  ```cmd
  netstat -ano | findstr :2001
  ```
- [ ] If port is in use, change `ZmqAddress` in both EAs to different port (e.g., 2002)

### 3. Database Setup
- [ ] Database `fx_sql_db_fx` exists
- [ ] All tables created (run `Dashboard/database.sql`)
- [ ] Connection credentials correct in `Dashboard/config/db.php`

### 4. Web Server Setup
- [ ] Domain `https://fx.haziroglu.com` is accessible
- [ ] SSL certificate is valid
- [ ] PHP files are in root directory (not in Dashboard subfolder)
- [ ] `.htaccess` file is configured correctly

### 5. MetaTrader Settings
- [ ] WebRequest is enabled in EA settings
- [ ] Allow DLL imports is enabled (for ZeroMQ)
- [ ] Allow external URLs is enabled

---

## Testing Steps

### Phase 1: Master EA Compilation & Startup

#### Step 1.1: Compile Master EA
1. Open `CopyPoz_Master_V4.mq5` in MetaEditor
2. Press F5 to compile
3. Expected: No compilation errors
4. If errors occur:
   - Check ZeroMQ library files are in Include folder
   - Verify `#include <Zmq\Zmq.mqh>` path is correct

#### Step 1.2: Load Master EA on Chart
1. Open any chart (e.g., EURUSD, H1)
2. Drag `CopyPoz_Master_V4` onto the chart
3. In EA settings:
   - `ZmqAddress`: `tcp://*:2001` (or different port if 2001 is in use)
   - `BroadcastInterval`: 500 (milliseconds)
   - `EnableWebMonitor`: true
   - `WebMonitorUrl`: `https://fx.haziroglu.com/api/signal.php`
   - `MasterToken`: `MASTER_SECRET_TOKEN_123`
   - `LogDetailed`: true (for testing)
4. Click OK

#### Step 1.3: Verify Master EA Started
Check Expert tab for messages:
```
--- Master EA V4 Başlatılıyor ---
Master EA V4 Başarıyla Başlatıldı. Yayın Adresi: tcp://*:2001
```

If you see error `-1` (compilation error):
- Verify ZeroMQ files are in Include folder
- Recompile the EA

If you see error `-12` (ZeroMQ bind error):
- Port 2001 is in use
- Change `ZmqAddress` to different port (e.g., `tcp://*:2002`)
- Update Client EA to match

---

### Phase 2: Client EA Setup & Connection

#### Step 2.1: Create Client in Dashboard
1. Go to `https://fx.haziroglu.com/admin/clients.php`
2. Login as admin
3. Fill in "Yeni Client Oluştur" form:
   - **Hesap Numarası**: Your client account number (e.g., 123456)
   - **Client Adı**: Descriptive name (e.g., "Demo Account 1")
4. Click "Oluştur"
5. Copy the generated token (displayed in green box)
   - Example: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

#### Step 2.2: Compile Client EA
1. Open `CopyPoz_Client_V4.mq5` in MetaEditor
2. Press F5 to compile
3. Expected: No compilation errors

#### Step 2.3: Load Client EA on Chart
1. Open chart on client account (different from Master)
2. Drag `CopyPoz_Client_V4` onto the chart
3. In EA settings:
   - `ZmqAddress`: `tcp://localhost:2001` (must match Master's port)
   - `RegistrationToken`: `MASTER_SECRET_TOKEN_123` (same as Master)
   - `WebMonitorUrl`: `https://fx.haziroglu.com/api/client.php`
   - `MagicNumber`: 123456 (unique for this client)
   - `LogDetailed`: true (for testing)
4. Click OK

#### Step 2.4: Verify Client EA Started
Check Expert tab for messages:
```
--- Client EA V4 Başlatılıyor ---
Client EA V4 Başarıyla Başlatıldı. Master Adresi: tcp://localhost:2001
```

---

### Phase 3: Test ZeroMQ Communication

#### Step 3.1: Open Position on Master
1. On Master account, manually open a position (e.g., BUY 1 lot EURUSD)
2. Check Master EA logs - should see broadcast message:
   ```
   Web API'ye gönderiliyor: https://fx.haziroglu.com/api/signal.php
   JSON: {"positions":[...]}
   Web API Yanıt Kodu: 200
   Web API Başarılı!
   ```

#### Step 3.2: Verify Client Receives Position
1. Check Client EA logs - should see:
   ```
   AÇILDI: EURUSD BUY MasterTicket:123456
   ```
2. Check Client account - should have matching position

#### Step 3.3: Modify Position on Master
1. On Master, modify SL/TP of the position
2. Check Client EA logs - should see:
   ```
   GÜNCELLENDİ: Ticket:789 SL:1.0800 TP:1.1000
   ```
3. Verify Client position SL/TP updated

#### Step 3.4: Close Position on Master
1. Close the position on Master
2. Check Client EA logs - should see:
   ```
   KAPATILDI: Master'da bulunamadı. Ticket:789 MasterTicket:123456
   ```
3. Verify Client position closed

---

### Phase 4: Test Web API Communication

#### Step 4.1: Check Master API Calls
1. In Master EA logs, look for Web API calls every 2 seconds:
   ```
   Web API'ye gönderiliyor: https://fx.haziroglu.com/api/signal.php
   Web API Yanıt Kodu: 200
   ```

#### Step 4.2: Check Client Heartbeat
1. In Client EA logs, look for heartbeat calls every 5 seconds:
   ```
   Web API Yanıt Kodu: 200
   ```

#### Step 4.3: Verify Database Updates
1. Check `master_state` table:
   ```sql
   SELECT * FROM master_state WHERE id = 1;
   ```
   Should show current positions JSON

2. Check `clients` table:
   ```sql
   SELECT * FROM clients WHERE account_number = 123456;
   ```
   Should show:
   - `last_seen`: Recent timestamp
   - `balance`: Current balance
   - `equity`: Current equity
   - `open_positions`: Number of open positions

---

### Phase 5: Test Web Dashboard

#### Step 5.1: View Master Positions
1. Go to `https://fx.haziroglu.com/dashboard.php`
2. Should see Master positions displayed
3. Data should update every 2 seconds

#### Step 5.2: View Client Status
1. Go to `https://fx.haziroglu.com/admin/clients.php`
2. Should see client listed with:
   - Account number
   - Account name
   - Last seen time (recent)
   - Balance and equity

#### Step 5.3: Send Command to Client
1. In dashboard, send command to client (e.g., PAUSE)
2. Check Client EA logs - should see:
   ```
   Web'den Komut Alındı: PAUSE
   Kopyalama DURDURULDU.
   ```
3. Verify Client button shows "KOPYALAMA: DURDU" in red

---

## Troubleshooting

### Master EA Issues

#### Error: "HATA: ZeroMQ başlatılamadı!"
**Cause**: ZeroMQ library files not found
**Solution**:
1. Copy `Zmq` folder to MetaTrader Include directory
2. Recompile EA
3. Restart MetaTrader

#### Error: "HATA: ZeroMQ Bind Başarısız! Adres: tcp://*:2001"
**Cause**: Port 2001 is already in use
**Solution**:
1. Find what's using port 2001: `netstat -ano | findstr :2001`
2. Change `ZmqAddress` to different port (e.g., `tcp://*:2002`)
3. Update Client EA to match
4. Recompile and reload

#### Web API returns "Method not allowed"
**Cause**: Signal API expects POST request
**Solution**:
- Verify `WebRequest` is using POST method (it is in code)
- Check `signal.php` is accessible at `https://fx.haziroglu.com/api/signal.php`
- Verify SSL certificate is valid

#### Web API returns "Unauthorized"
**Cause**: Token mismatch
**Solution**:
- Verify `MasterToken` in Master EA matches `MASTER_TOKEN` in `Dashboard/config/db.php`
- Both should be: `MASTER_SECRET_TOKEN_123`

---

### Client EA Issues

#### Error: "HATA: Master'a bağlanılamadı! Adres: tcp://localhost:2001"
**Cause**: Master EA not running or port mismatch
**Solution**:
1. Verify Master EA is running on same machine
2. Verify `ZmqAddress` matches Master's address
3. If Master uses different port, update Client EA

#### Client positions not opening
**Cause**: Symbol mismatch or insufficient balance
**Solution**:
1. Check `SymbolMapList` parameter if symbols differ
2. Verify client account has sufficient balance
3. Check `LotMultiplier` is appropriate
4. Verify `MagicNumber` is unique for this client

#### Client not receiving heartbeat response
**Cause**: Web API unreachable or token issue
**Solution**:
1. Verify `WebMonitorUrl` is correct
2. Check SSL certificate is valid
3. Verify `RegistrationToken` matches Master token
4. Check firewall allows outbound HTTPS

---

### Database Issues

#### Clients table empty
**Cause**: Client API not receiving heartbeats
**Solution**:
1. Verify Client EA is running
2. Check Client EA logs for Web API errors
3. Verify database connection in `Dashboard/config/db.php`
4. Check `clients` table exists

#### Master_state table empty
**Cause**: Master API not sending data
**Solution**:
1. Verify Master EA is running
2. Check Master EA logs for Web API errors
3. Verify `signal.php` is accessible
4. Check `master_state` table exists

---

## Performance Tuning

### Reduce Network Load
- Increase `BroadcastInterval` in Master EA (default: 500ms)
- Increase heartbeat interval in Client EA (currently: 5000ms)
- Reduce `LogDetailed` to false after testing

### Optimize ZeroMQ
- Use `tcp://127.0.0.1:2001` instead of `tcp://localhost:2001` for faster resolution
- Ensure Master and Client are on same machine for best performance

### Database Optimization
- Add indexes (already done in schema)
- Archive old command_queue records periodically
- Monitor database size

---

## Security Checklist

- [ ] `MASTER_TOKEN` is strong and unique
- [ ] Database credentials are secure
- [ ] SSL certificate is valid
- [ ] WebRequest is only to trusted domains
- [ ] Client registration requires valid token
- [ ] Auth tokens are randomly generated (32 bytes)
- [ ] Logs don't contain sensitive data
- [ ] Database backups are regular

---

## Monitoring

### Key Metrics to Monitor
1. **Master EA**: Positions broadcast frequency
2. **Client EA**: Position sync success rate
3. **Web API**: Response times and error rates
4. **Database**: Query performance and size
5. **Network**: ZeroMQ message throughput

### Log Files
- Master EA logs: MetaTrader Expert tab
- Client EA logs: MetaTrader Expert tab
- Web API logs: `Dashboard/logs/php_errors.log`
- Database logs: MySQL error log

---

## Next Steps

1. Complete all pre-testing checklist items
2. Follow testing steps in order
3. Document any issues encountered
4. Adjust parameters based on performance
5. Set up monitoring and alerts
6. Create backup procedures
7. Document custom configurations

