# CopyPoz V5 - Quick Start Guide

## Hızlı Başlangıç

### 1. Bağımlılıkları Yükleyin

```bash
npm install
```

### 2. Environment Variables Ayarlayın

```bash
cp .env.example .env
```

### 3. Database Başlatın

#### Docker ile (Önerilen)

```bash
# Network oluşturun
docker network create copypoz_network

# MySQL başlatın
docker run -d \
  --name copypoz_mysql \
  --network copypoz_network \
  -e MYSQL_ROOT_PASSWORD=rootpass123 \
  -e MYSQL_DATABASE=copypoz \
  -p 3306:3306 \
  mysql:8.0
```

#### Local MySQL ile

```bash
# MySQL'i başlatın ve database oluşturun
mysql -u root -p
CREATE DATABASE copypoz;
```

### 4. Prisma Setup

```bash
npm run prisma:generate
npx prisma migrate deploy
```

### 5. Development Server'ı Başlatın

```bash
npm run dev
```

Tarayıcıda açın: `http://localhost:3000`

---

## Seçenekler

### Docker Compose ile Çalıştırma

```bash
docker-compose up -d
```

### Production Build

```bash
npm run build
npm start
```

### Linting & Type Check

```bash
npm run lint
npm run typecheck
```

---

## Admin Paneline Giriş

- **URL**: http://localhost:3000/login
- **Username**: admin
- **Password**: admin123

---

## API Endpoints

### Health Check
```bash
curl http://localhost:3000/api/health
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### Clients
```bash
curl http://localhost:3000/api/clients \
  -H "Authorization: Bearer master-local-123"
```

---

## Sorun Giderme

| Sorun | Çözüm |
|-------|-------|
| Database bağlantı hatası | MySQL'in çalışıp çalışmadığını kontrol edin |
| Port 3000 kullanımda | `lsof -i :3000` ile process'i bulun ve kill edin |
| Build hatası | `rm -rf .next node_modules && npm install` |
| Prisma hatası | `npx prisma migrate deploy` çalıştırın |

---

## Detaylı Kurulum

Detaylı kurulum talimatları için: [LOCAL_SETUP.md](./LOCAL_SETUP.md)

Production deployment için: [HOSTINGER_DEPLOYMENT.md](./HOSTINGER_DEPLOYMENT.md)

---

**Version**: 1.0
**Last Updated**: 2026-02-25
