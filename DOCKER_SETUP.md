# CopyPoz V5 - Docker Setup

## Gereksinimler

- Docker
- Docker Compose

## Hızlı Başlangıç

### 1. Environment Dosyasını Oluştur

```bash
cp .env.example .env.local
```

Gerekirse `.env.local` dosyasını düzenle:

```env
MASTER_TOKEN=your_secure_master_token_here
SESSION_SECRET=your_session_secret_here
```

### 2. Docker Compose'u Başlat

```bash
docker-compose up -d
```

Bu komut:
- MySQL 8.0 container'ını başlatır
- Database'i otomatik olarak oluşturur
- Next.js app container'ını başlatır
- Tüm bağımlılıkları yükler

### 3. Uygulamaya Erişim

- **Web Arayüzü**: http://localhost:3000
- **Admin Paneli**: http://localhost:3000/admin
- **MySQL**: localhost:3306

### 4. Logs'u Görüntüle

```bash
# Tüm container'ların logs'unu göster
docker-compose logs -f

# Sadece app logs'unu göster
docker-compose logs -f app

# Sadece MySQL logs'unu göster
docker-compose logs -f mysql
```

## Komutlar

### Container'ları Durdur

```bash
docker-compose down
```

### Container'ları Yeniden Başlat

```bash
docker-compose restart
```

### Belirli Bir Container'ı Yeniden Başlat

```bash
docker-compose restart app
docker-compose restart mysql
```

### Container'a Bağlan

```bash
# App container'ına bağlan
docker-compose exec app sh

# MySQL container'ına bağlan
docker-compose exec mysql mysql -u copypoz -p copypoz_v5
```

### Database'i Sıfırla

```bash
# MySQL container'ını sil (data silinir)
docker-compose down -v

# Yeniden başlat
docker-compose up -d
```

### Prisma Studio'yu Aç

```bash
docker-compose exec app npx prisma studio
```

Tarayıcıda `http://localhost:5555` adresinde açılacak.

## Troubleshooting

### Port Zaten Kullanımda

```
Error: bind: address already in use
```

**Çözüm**: Farklı port kullan:

```bash
# docker-compose.yml'de ports'u değiştir
ports:
  - "3001:3000"  # 3001 yerine başka port
```

### MySQL Bağlantı Hatası

```
Error: connect ECONNREFUSED mysql:3306
```

**Çözüm**: MySQL'in başladığından emin ol:

```bash
docker-compose logs mysql
docker-compose restart mysql
```

### Node Modules Sorunu

```bash
# Container'ı sil ve yeniden oluştur
docker-compose down
docker-compose up -d --build
```

### Database Boş

```bash
# Database'i yeniden oluştur
docker-compose down -v
docker-compose up -d
```

## Development Workflow

### Dosya Değişiklikleri

Next.js development server otomatik olarak dosya değişikliklerini algılar ve hot-reload yapar.

### Database Değişiklikleri

Prisma schema'sını değiştirdikten sonra:

```bash
docker-compose exec app npm run prisma:generate
```

### Yeni Bağımlılık Ekleme

```bash
docker-compose exec app npm install package-name
```

## Production Build

### Docker Image'ı Build Et

```bash
docker build -t copypoz:latest .
```

### Production Container'ını Çalıştır

```bash
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL="mysql://user:pass@host:3306/db" \
  -e MASTER_TOKEN="token" \
  -e SESSION_SECRET="secret" \
  -e NODE_ENV="production" \
  copypoz:latest
```

## Docker Compose Yapısı

```yaml
services:
  mysql:
    - MySQL 8.0 database
    - Port: 3306
    - Volume: mysql_data
    - Health check: mysqladmin ping

  app:
    - Next.js application
    - Port: 3000
    - Depends on: mysql
    - Volume: project directory (hot reload)
```

## Environment Değişkenleri

| Değişken | Açıklama | Örnek |
|----------|----------|-------|
| DATABASE_URL | MySQL bağlantı string'i | mysql://user:pass@host:3306/db |
| MASTER_TOKEN | Master EA token'ı | your_secure_token |
| SESSION_SECRET | Session şifresi | your_secret |
| NODE_ENV | Ortam | development/production |
| PORT | Uygulama portu | 3000 |

## Destek

Sorunlar için:
1. Logs'u kontrol et: `docker-compose logs -f`
2. Container'ı yeniden başlat: `docker-compose restart`
3. Tüm container'ları sil ve baştan başla: `docker-compose down -v && docker-compose up -d`
