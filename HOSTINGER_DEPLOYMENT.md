# CopyPoz V5 - Hostinger Deployment Guide

## Teknoloji Stack (Hostinger Uyumlu)

- **Frontend**: Next.js 14 + React 18 + TypeScript
- **Backend**: Next.js API Routes + Express (opsiyonel)
- **Database**: MySQL 8.0
- **Runtime**: Node.js 18+ (Hostinger destekliyor)
- **Package Manager**: npm

## Hostinger Deployment Adımları

### 1. Hostinger Hesap Hazırlığı

1. Hostinger'da Node.js hosting planı seçin
2. Node.js 18+ sürümünü seçin
3. MySQL 8.0 veritabanı oluşturun

### 2. Yerel Hazırlık

```bash
# Node.js versiyonunu kontrol edin (18+ gerekli)
node --version

# Bağımlılıkları yükleyin
npm install

# Prisma client'ı generate edin
npm run prisma:generate

# Build yapın
npm run build
```

### 3. Environment Variables

Hostinger'da `.env` dosyası oluşturun:

```env
DATABASE_URL="mysql://username:password@hostname:3306/database_name"
MASTER_TOKEN="your_secure_master_token_here"
SESSION_SECRET="your_session_secret_here"
NODE_ENV="production"
```

### 4. Hostinger'a Deploy

#### Seçenek A: Git Integration (Önerilen)

1. GitHub'a push yapın
2. Hostinger'da Git integration aktif edin
3. Repository'yi bağlayın
4. Deployment branch'ini seçin (main/production)

#### Seçenek B: FTP Upload

1. Yerel olarak build yapın: `npm run build`
2. `.next`, `node_modules`, `public` klasörlerini upload edin
3. `package.json`, `package-lock.json`, `.env` dosyalarını upload edin

### 5. Hostinger Ayarları

**Node.js Uygulaması Yapılandırması:**

- **Start Command**: `npm start`
- **Port**: 3000 (Hostinger otomatik yönlendirir)
- **Node Version**: 18 veya üzeri
- **Environment**: Production

### 6. Database Setup

```bash
# Hostinger'da SSH erişimi ile:
npx prisma migrate deploy
```

### 7. Verification

Deployment sonrası kontrol edin:

```bash
# Health check
curl https://yourdomain.com/api/health

# Login test
curl -X POST https://yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'
```

## Hostinger Sınırlamaları ve Çözümleri

| Sınırlama | Çözüm |
|-----------|-------|
| Dosya sistemi geçici | Veritabanında depolayın |
| WebSocket sınırı | Long polling kullanın |
| Memory sınırı | Caching optimize edin |
| Concurrent connections | Connection pooling yapın |

## Production Checklist

- [ ] Environment variables ayarlandı
- [ ] Database backup yapılandırıldı
- [ ] SSL sertifikası aktif
- [ ] CORS ayarları kontrol edildi
- [ ] Rate limiting yapılandırıldı
- [ ] Logging aktif
- [ ] Monitoring kuruldu
- [ ] Backup stratejisi belirlendi

## Troubleshooting

### Build Hatası
```bash
npm run build
npm run typecheck
```

### Database Bağlantı Hatası
```bash
# .env dosyasını kontrol edin
# DATABASE_URL formatı: mysql://user:pass@host:port/db
```

### Port Hatası
Hostinger otomatik port yönlendirmesi yapar. 3000 portunu değiştirmeyin.

## Hostinger Support

- Hostinger Node.js Docs: https://support.hostinger.com/en/articles/4195650
- Hostinger MySQL Docs: https://support.hostinger.com/en/articles/4195635
