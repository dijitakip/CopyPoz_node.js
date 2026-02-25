# CopyPoz V5 - Local Development Setup

## Gereksinimler

- Node.js 22.x
- MySQL 8.0+
- npm veya yarn

## Kurulum Adımları

### 1. Veritabanı Kurulumu

```bash
# MySQL'de yeni database oluştur
mysql -u root -p
CREATE DATABASE copypoz_v5;
USE copypoz_v5;
```

Veya `Dashboard/database_complete.sql` dosyasını import et:

```bash
mysql -u root -p copypoz_v5 < Dashboard/database_complete.sql
```

### 2. Environment Değişkenleri

`.env.local` dosyası oluştur:

```env
# Database
DATABASE_URL="mysql://root:password@localhost:3306/copypoz_v5"

# Master Token (EA'lar için)
MASTER_TOKEN="your_secure_master_token_here"

# Session Secret
SESSION_SECRET="your_session_secret_here"

# Node Environment
NODE_ENV="development"

# Port
PORT=3000
```

### 3. Bağımlılıkları Yükle

```bash
npm install
```

### 4. Prisma Setup

```bash
# Prisma Client'ı generate et
npm run prisma:generate

# Database'i migrate et (eğer migration gerekirse)
npx prisma migrate dev --name init
```

### 5. Development Server'ı Başlat

```bash
npm run dev
```

Server `http://localhost:3000` adresinde çalışacak.

## API Endpoints

### Master Endpoints

**Master Pozisyonlarını Getir**
```bash
curl -H "Authorization: Bearer YOUR_MASTER_TOKEN" \
  http://localhost:3000/api/master/positions
```

**Master State'i Güncelle**
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_MASTER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "total_positions": 5,
    "positions_json": "[{\"ticket\":1,\"symbol\":\"EURUSD\",\"type\":\"BUY\",\"volume\":1.0,\"price\":1.0850,\"sl\":1.0800,\"tp\":1.0900,\"profit\":50.0}]"
  }' \
  http://localhost:3000/api/master/state
```

### Client Endpoints

**Client Heartbeat (Kayıt/Güncelleme)**
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "account_number": 123456,
    "account_name": "Demo Account",
    "balance": 10000,
    "equity": 10500,
    "open_positions": 2,
    "registration_token": "YOUR_MASTER_TOKEN"
  }' \
  http://localhost:3000/api/client/heartbeat
```

**Client Komut Getir**
```bash
curl "http://localhost:3000/api/client/command?account_number=123456&token=CLIENT_TOKEN"
```

### Command Endpoints

**Komut Gönder**
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_MASTER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": 1,
    "command": "PAUSE",
    "params": null
  }' \
  http://localhost:3000/api/commands
```

**Tüm Komutları Getir**
```bash
curl -H "Authorization: Bearer YOUR_MASTER_TOKEN" \
  http://localhost:3000/api/commands
```

## Web Arayüzü

### Admin Paneli

- **URL**: `http://localhost:3000/admin`
- **Master Pozisyonları**: `/admin/master`
- **Client Yönetimi**: `/admin/clients`
- **Komut Yönetimi**: `/admin/commands`
- **Master Grupları**: `/admin/master-groups`

### Özellikler

#### Master Pozisyonları
- Tüm açık pozisyonları görüntüle
- Pozisyon detaylarını (ticket, symbol, type, volume, price, SL, TP, profit) göster
- Real-time güncelleme (5 saniye aralığı)

#### Client Yönetimi
- Tüm client'ları listele
- Client durumunu görüntüle (active, paused, disconnected)
- Bakiye, öz sermaye, açık pozisyon sayısını göster
- Client'a komut gönder (PAUSE, RESUME, CLOSE_ALL, vb.)

#### Komut Yönetimi
- Tüm komutları görüntüle
- Komut durumunu takip et (pending, executed, failed)
- Yeni komut oluştur
- Komut sil

#### Master Grupları
- Master grupları oluştur
- Gruplara client'ları ekle
- Grup detaylarını görüntüle
- Grup sil

## MQL5 EA'ları Test Etme

### Master EA

MetaTrader 5'te Master EA'yı çalıştır:

```
Input Parameters:
- Language: TR (Türkçe) veya EN (English)
- MasterAddress: 127.0.0.1:2000 (TCP Server adresi)
- WebMonitorUrl: http://localhost:3000/api/master/state
- DashboardUrl: http://localhost:3000
- ClientToken: YOUR_MASTER_TOKEN
- EnableWebMonitor: true
```

### Client EA

MetaTrader 5'te Client EA'yı çalıştır:

```
Input Parameters:
- Language: TR (Türkçe) veya EN (English)
- MasterAddress: 127.0.0.1:2000 (Master EA'nın adresi)
- WebMonitorUrl: http://localhost:3000/api/client/heartbeat
- DashboardUrl: http://localhost:3000
- RegistrationToken: YOUR_MASTER_TOKEN
- EnableWebMonitor: true
```

## Troubleshooting

### Database Bağlantı Hatası

```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**Çözüm**: MySQL'in çalıştığından emin ol:
```bash
# macOS
brew services start mysql

# Linux
sudo systemctl start mysql

# Windows
net start MySQL80
```

### Prisma Client Hatası

```
Error: @prisma/client not found
```

**Çözüm**:
```bash
npm run prisma:generate
```

### Port Zaten Kullanımda

```
Error: listen EADDRINUSE :::3000
```

**Çözüm**: Farklı port kullan:
```bash
PORT=3001 npm run dev
```

## Geliştirme İpuçları

### Hot Reload

Development server otomatik olarak dosya değişikliklerini algılar ve yeniden yükler.

### Database Sorguları

Prisma Studio'yu açmak için:
```bash
npx prisma studio
```

### TypeScript Kontrol

```bash
npm run typecheck
```

### Linting

```bash
npm run lint
```

## Sonraki Adımlar

1. **Authentication**: Login sayfasını test et
2. **Real-time Updates**: WebSocket entegrasyonu ekle
3. **Notifications**: Push notifications ekle
4. **Analytics**: Trading analytics dashboard'u ekle
5. **Deployment**: Hostinger'a deploy et

## Destek

Sorunlar için GitHub Issues'ı kontrol et veya documentation'ı oku.
