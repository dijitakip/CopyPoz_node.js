# CopyPoz V4 - Quick Start Guide

## 5-Minute Setup

### Step 1: Install Libraries (Required)
1. Copy `Libraries\libzmq.dll` and `Libraries\libsodium.dll` to:
   `C:\Users\[USERNAME]\AppData\Roaming\MetaQuotes\Terminal\[TERMINAL_ID]\MQL5\Libraries\`
   *(Note: You must copy BOTH files even if you only see an error for libzmq.dll)*

### Step 2: Install Includes
Copy `Zmq` folder to:
`C:\Users\[USERNAME]\AppData\Roaming\MetaQuotes\Terminal\[TERMINAL_ID]\MQL5\Include\`

### Step 3: Create Client in Dashboard (1 min)
1. Go to `https://fx.haziroglu.com/admin/clients.php`
2. Fill form:
   - Hesap Numarası: `123456` (your client account)
   - Client Adı: `Demo Account`
3. Click "Oluştur"
4. **Copy the token** (green box)

### Step 3: Load Master EA (1 min)
1. Open chart on Master account
2. Drag `CopyPoz_Master_V4.mq5` onto chart
3. Settings:
   - `ZmqAddress`: `tcp://*:2001`
   - `MasterToken`: `MASTER_SECRET_TOKEN_123`
   - `EnableWebMonitor`: true
4. Click OK
5. Check Expert tab for: "Master EA V4 Başarıyla Başlatıldı"

### Step 4: Load Client EA (1 min)
1. Open chart on Client account
2. Drag `CopyPoz_Client_V4.mq5` onto chart
3. Settings:
   - `ZmqAddress`: `tcp://localhost:2001`
   - `RegistrationToken`: `MASTER_SECRET_TOKEN_123`
   - `MagicNumber`: `123456` (unique per client)
4. Click OK
5. Check Expert tab for: "Client EA V4 Başarıyla Başlatıldı"

### Step 5: Test (1 min)
1. Open position on Master
2. Check Client - should open same position
3. Modify SL/TP on Master
4. Check Client - should update
5. Close on Master
6. Check Client - should close

---

## Troubleshooting Quick Fixes

### Master EA won't start
```
Error: "HATA: ZeroMQ başlatılamadı!"
→ Copy Zmq folder to Include directory

Error: "HATA: ZeroMQ Bind Başarısız!"
→ Port 2001 in use. Change to tcp://*:2002
→ Update Client EA to tcp://localhost:2002
```

### Client EA won't connect
```
Error: "HATA: Master'a bağlanılamadı!"
→ Master EA not running
→ Port mismatch (check both use same port)
→ Firewall blocking localhost
```

### Positions not syncing
```
→ Check both EAs are running
→ Check Expert tab for errors
→ Verify MagicNumber is unique
→ Check account has sufficient balance
```

### Web API errors
```
Error: "Method not allowed"
→ Check signal.php exists at https://fx.haziroglu.com/api/signal.php

Error: "Unauthorized"
→ Check MasterToken matches in both EA and Dashboard
→ Should be: MASTER_SECRET_TOKEN_123
```

---

## Key Parameters

### Master EA
| Parameter | Default | Purpose |
|-----------|---------|---------|
| ZmqAddress | tcp://*:2001 | ZeroMQ bind address |
| BroadcastInterval | 500 | Position update frequency (ms) |
| MasterToken | MASTER_SECRET_TOKEN_123 | API authentication |
| EnableWebMonitor | true | Send to dashboard |
| LogDetailed | true | Detailed logging |

### Client EA
| Parameter | Default | Purpose |
|-----------|---------|---------|
| ZmqAddress | tcp://localhost:2001 | Master address |
| RegistrationToken | MASTER_SECRET_TOKEN_123 | First registration |
| MagicNumber | 123456 | Unique per client |
| LotMultiplier | 1.0 | Scale positions |
| EnableWebMonitor | true | Send heartbeat |
| LogDetailed | true | Detailed logging |

---

## Dashboard Access

### Admin Panel
- URL: `https://fx.haziroglu.com/admin/clients.php`
- Create clients
- Assign to traders
- View status

### Dashboard
- URL: `https://fx.haziroglu.com/dashboard.php`
- View Master positions
- View Client status
- Send commands

---

## Common Commands

### Check Port Usage
```cmd
netstat -ano | findstr :2001
```

### Kill Process on Port
```cmd
taskkill /PID [PID] /F
```

### Check Database
```sql
-- View clients
SELECT * FROM clients;

-- View master positions
SELECT * FROM master_state;

-- View commands
SELECT * FROM command_queue WHERE status = 'pending';
```

---

## Performance Tips

1. **Reduce Logging**: Set `LogDetailed = false` after testing
2. **Increase Broadcast Interval**: Change to 1000ms if network is slow
3. **Use Local IP**: Change `tcp://localhost:2001` to `tcp://127.0.0.1:2001`
4. **Optimize Lot Size**: Adjust `LotMultiplier` based on account size

---

## Security Checklist

- [ ] Change `MASTER_SECRET_TOKEN_123` to strong random token
- [ ] Update token in both EAs and Dashboard
- [ ] Verify SSL certificate is valid
- [ ] Restrict Dashboard access by IP
- [ ] Regular database backups
- [ ] Monitor logs for errors

---

## Support

### Logs Location
- **Master EA**: MetaTrader → Expert tab
- **Client EA**: MetaTrader → Expert tab
- **Web API**: `Dashboard/logs/php_errors.log`

### Debug Mode
Set `LogDetailed = true` to see:
- ZeroMQ messages
- Web API calls
- Position updates
- Error details

### Full Documentation
See `TESTING_GUIDE.md` for comprehensive testing procedures

