# 🔐 CopyPoz V5 - Access Information

**Status**: ✅ Live and Running  
**Last Updated**: February 26, 2026

---

## 🌐 Web Application Access

### URL
```
http://localhost:3000
```

### Login Credentials
```
Username: admin
Password: admin123
```

### Browser Access
1. Open your web browser
2. Go to: http://localhost:3000
3. You will be redirected to login page
4. Enter credentials above
5. Click "Giriş Yap" (Login)

---

## 📡 API Access

### Base URL
```
http://localhost:3000/api
```

### Authentication
All API requests require Bearer token authentication:
```
Authorization: Bearer master-local-123
```

### Example API Calls

#### Health Check (No Auth Required)
```bash
curl http://localhost:3000/api/health
```

#### Get Users
```bash
curl -H "Authorization: Bearer master-local-123" \
  http://localhost:3000/api/users
```

#### Get Clients
```bash
curl -H "Authorization: Bearer master-local-123" \
  http://localhost:3000/api/clients
```

#### Get Commands
```bash
curl -H "Authorization: Bearer master-local-123" \
  http://localhost:3000/api/commands
```

#### Get Master Groups
```bash
curl -H "Authorization: Bearer master-local-123" \
  http://localhost:3000/api/master-groups
```

---

## 🗄️ Database Access

### Connection Details
```
Host: localhost
Port: 3306
Database: copypoz
Username: root
Password: rootpass123
```

### Connection String
```
mysql://root:rootpass123@localhost:3306/copypoz
```

### MySQL Command Line
```bash
mysql -h localhost -u root -p
# Enter password: rootpass123
# Then: USE copypoz;
```

### Prisma Studio (Visual Database Browser)
```bash
npx prisma studio
```
This opens a visual interface at http://localhost:5555

---

## 🖥️ Server Information

### Development Server
```
Framework: Next.js 14.2.5
Runtime: Node.js v24.12.0
Port: 3000
Status: Running
Command: npm run dev
```

### Docker Container
```
Container: copypoz-mysql
Image: mysql:8.0
Port: 3306
Status: Running
```

---

## 📊 Dashboard Features

After logging in, you can access:

### Main Menu
```
📊 Dashboard
⚙️ Yönetim (Administration)
  ├─ 👥 Kullanıcılar (Users)
  ├─ 💻 Clientler (Clients)
  ├─ 👑 Master Grupları (Master Groups)
  ├─ 📝 Komutlar (Commands)
  ├─ 🔑 Tokenlar (Tokens)
  ├─ 📜 Lisanslar (Licenses)
  ├─ 📋 Loglar (Logs)
  └─ ⚡ Ayarlar (Settings)
```

### Dashboard Statistics
- Total Clients
- Active Clients
- Total Balance
- Open Positions

### Quick Actions
- Create new user
- Add new client
- Send command
- Create master group

---

## 🔑 API Endpoints Reference

### Users
```
GET    /api/users              - List all users
POST   /api/users              - Create new user
GET    /api/users/[id]         - Get user details
PUT    /api/users/[id]         - Update user
DELETE /api/users/[id]         - Delete user
```

### Clients
```
GET    /api/clients            - List all clients
POST   /api/clients            - Create new client
GET    /api/clients/[id]       - Get client details
PUT    /api/clients/[id]       - Update client
DELETE /api/clients/[id]       - Delete client
```

### Commands
```
GET    /api/commands           - List all commands
POST   /api/commands           - Create new command
GET    /api/commands/[id]      - Get command details
PUT    /api/commands/[id]      - Update command
DELETE /api/commands/[id]      - Delete command
```

### Master Groups
```
GET    /api/master-groups      - List all master groups
POST   /api/master-groups      - Create new master group
GET    /api/master-groups/[id] - Get master group details
PUT    /api/master-groups/[id] - Update master group
DELETE /api/master-groups/[id] - Delete master group
GET    /api/master-groups/[id]/clients - Get group clients
```

### Tokens
```
GET    /api/tokens             - List all tokens
POST   /api/tokens             - Create new token
GET    /api/tokens/[id]        - Get token details
PUT    /api/tokens/[id]        - Update token
DELETE /api/tokens/[id]        - Delete token
```

### Licenses
```
GET    /api/licenses           - List all licenses
POST   /api/licenses           - Create new license
GET    /api/licenses/[id]      - Get license details
PUT    /api/licenses/[id]      - Update license
DELETE /api/licenses/[id]      - Delete license
```

### Logs
```
GET    /api/logs               - List system logs
```

### Master EA
```
GET    /api/master/positions   - Get master positions
GET    /api/master/state       - Get master state
POST   /api/master/command     - Send command to master
```

### Client
```
POST   /api/client/heartbeat   - Client heartbeat
POST   /api/client/command     - Get command for client
```

### Health
```
GET    /api/health             - Health check
```

---

## 🧪 Testing with Postman

### Import Collection
1. Open Postman
2. Create new collection "CopyPoz V5"
3. Add requests for each endpoint

### Example Request
```
Method: GET
URL: http://localhost:3000/api/users
Headers:
  Authorization: Bearer master-local-123
  Content-Type: application/json
```

---

## 🔄 Real-Time Updates

### Auto-Refresh Intervals
- Dashboard: Every 10 seconds
- Clients: Every 10 seconds
- Master EA: Every 5 seconds
- Commands: Every 10 seconds

### Manual Refresh
- Press F5 to refresh page
- Click refresh button in browser
- Data updates automatically

---

## 📱 Mobile Access

The application is fully responsive and works on:
- 📱 Mobile phones (320px+)
- 📱 Tablets (768px+)
- 💻 Desktops (1920px+)

### Mobile Features
- Hamburger menu (☰)
- Touch-friendly buttons
- Optimized layout
- Full functionality

---

## 🛑 Stopping the Application

### Stop Development Server
```bash
# Press Ctrl+C in the terminal running npm run dev
```

### Stop MySQL Container
```bash
docker-compose down
```

### Stop All Services
```bash
docker-compose down
```

---

## 🔄 Restarting the Application

### Start Development Server
```bash
npm run dev
```

### Start MySQL Container
```bash
docker-compose up -d
```

### Start All Services
```bash
docker-compose up -d
npm run dev
```

---

## 🆘 Quick Troubleshooting

### Can't access http://localhost:3000
- Check if server is running: `npm run dev`
- Check if port 3000 is in use
- Try http://127.0.0.1:3000 instead

### Login fails
- Verify credentials: admin / admin123
- Check browser console for errors
- Clear browser cache and cookies

### API returns 500 error
- Check server logs in terminal
- Verify database is running
- Check .env file for correct credentials

### Database connection error
- Verify MySQL container is running: `docker ps`
- Check .env file: `DATABASE_URL`
- Restart dev server after fixing .env

---

## 📞 Support Resources

### Documentation Files
- `QUICK_START.md` - Quick start guide
- `SETUP_GUIDE.md` - Detailed setup
- `PROJECT_STATUS.md` - Project status
- `METATRADER_TESTING.md` - MetaTrader guide
- `HOSTINGER_DEPLOYMENT.md` - Deployment guide

### Configuration Files
- `.env` - Environment variables
- `package.json` - Dependencies
- `docker-compose.yml` - Docker config

### Log Files
- Terminal output from `npm run dev`
- Browser console (F12)
- Network tab in DevTools

---

## ✅ Verification Checklist

Before proceeding with testing:
- [ ] Web application accessible at http://localhost:3000
- [ ] Login works with admin/admin123
- [ ] Dashboard loads and shows statistics
- [ ] All menu items are clickable
- [ ] API health check returns 200 OK
- [ ] Database connection is working
- [ ] Real-time updates are functioning

---

## 🎯 Next Steps

1. **Access the Dashboard**
   - Open http://localhost:3000
   - Login with admin/admin123
   - Explore all features

2. **Test API Endpoints**
   - Use curl or Postman
   - Test each endpoint
   - Verify responses

3. **Prepare MetaTrader**
   - Compile CopyPoz_Client_V5.mq5
   - Configure EA settings
   - Connect to http://localhost:3000

4. **Run Tests**
   - Follow METATRADER_TESTING.md
   - Execute test scenarios
   - Monitor results

5. **Deploy to Production**
   - After successful testing
   - Follow HOSTINGER_DEPLOYMENT.md
   - Configure production environment

---

**Status**: ✅ Ready to Use  
**Last Updated**: February 26, 2026  
**Version**: 0.1.0

🚀 **You're all set! Start exploring!**
