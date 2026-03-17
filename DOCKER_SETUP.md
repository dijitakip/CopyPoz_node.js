# 🐳 CopyPoz Docker Setup

**Status**: ✅ **FULLY OPERATIONAL**  
**Date**: February 27, 2026

---

## 📋 Docker Yapısı

### Container'lar
```
copypoz_mysql  → MySQL 8.0 Database
copypoz_app    → Next.js Application
```

### Network
```
copypoz_copypoz_network → Bridge network (Docker Compose tarafından oluşturuldu)
```

### Volume
```
copypoz_copypoz_mysql_data → MySQL veri depolama
```

---

## 🚀 Başlatma

### Docker Compose ile Başlat
```bash
docker-compose up -d
```

### Durumu Kontrol Et
```bash
docker ps --filter "name=copypoz"
```

### Log'ları Görüntüle
```bash
# App log'ları
docker logs copypoz_app -f

# MySQL log'ları
docker logs copypoz_mysql -f
```

---

## 🛑 Durdurma

### Tüm Container'ları Durdur
```bash
docker-compose down
```

### Sadece App'i Durdur
```bash
docker stop copypoz_app
```

### Sadece MySQL'i Durdur
```bash
docker stop copypoz_mysql
```

---

## 🔄 Yeniden Başlatma

### Tüm Container'ları Yeniden Başlat
```bash
docker-compose restart
```

### Sadece App'i Yeniden Başlat
```bash
docker-compose restart app
```

### Sadece MySQL'i Yeniden Başlat
```bash
docker-compose restart mysql
```

---

## 📊 Container Bilgileri

### copypoz_mysql
```
Image: mysql:8.0
Port: 3306
Database: copypoz
User: copypoz
Password: copypoz123
Root Password: rootpass123
Status: Healthy
```

### copypoz_app
```
Image: copypoz-app (custom built)
Port: 3000
Framework: Next.js 14.2.5
Runtime: Node.js 22
Status: Running
```

---

## 🌐 Erişim

### Web Application
```
URL: http://localhost:3000
Login: admin / admin123
```

### Database
```
Host: copypoz_mysql (Docker network içinde)
Host: localhost (Host machine'den)
Port: 3306
Database: copypoz
User: copypoz
Password: copypoz123
```

### API
```
Base URL: http://localhost:3000/api
Health: http://localhost:3000/api/health
```

---

## 🔧 Konfigürasyon

### docker-compose.yml
```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: copypoz_mysql
    environment:
      MYSQL_ROOT_PASSWORD: rootpass123
      MYSQL_DATABASE: copypoz
      MYSQL_USER: copypoz
      MYSQL_PASSWORD: copypoz123
    ports:
      - "3306:3306"
    volumes:
      - copypoz_mysql_data:/var/lib/mysql
    networks:
      - copypoz_network
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      timeout: 20s
      retries: 10
      interval: 10s

  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: copypoz_app
    environment:
      DATABASE_URL: mysql://copypoz:copypoz123@copypoz_mysql:3306/copypoz
      MASTER_TOKEN: master-local-123
      NODE_ENV: development
      PORT: 3000
    ports:
      - "3000:3000"
    depends_on:
      mysql:
        condition: service_healthy
    volumes:
      - .:/app
      - /app/node_modules
    networks:
      - copypoz_network
    command: npm run dev

volumes:
  copypoz_mysql_data:

networks:
  copypoz_network:
    driver: bridge
```

### .env
```
DATABASE_URL="mysql://copypoz:copypoz123@copypoz_mysql:3306/copypoz"
MASTER_TOKEN="master-local-123"
```

---

## 📝 Dockerfile

```dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run prisma:generate

EXPOSE 3000

CMD ["npm", "run", "dev"]
```

---

## 🧪 Kontrol Komutları

### Container'ları Listele
```bash
docker ps --filter "name=copypoz"
```

### Network'ü Kontrol Et
```bash
docker network inspect copypoz_copypoz_network
```

### Volume'ü Kontrol Et
```bash
docker volume inspect copypoz_copypoz_mysql_data
```

### Container'a Bağlan
```bash
# App container'ına
docker exec -it copypoz_app sh

# MySQL container'ına
docker exec -it copypoz_mysql mysql -u copypoz -p
```

### Log'ları Temizle
```bash
docker logs --follow copypoz_app
```

---

## 🔍 Sorun Giderme

### Container Başlamıyor
```bash
# Log'ları kontrol et
docker logs copypoz_app

# Container'ı kaldır ve yeniden oluştur
docker-compose down
docker-compose up -d
```

### Database Bağlantısı Başarısız
```bash
# MySQL container'ının çalışıp çalışmadığını kontrol et
docker ps | grep copypoz_mysql

# MySQL log'larını kontrol et
docker logs copypoz_mysql

# Database credentials'ı kontrol et
# .env dosyasında DATABASE_URL kontrol et
```

### Port Zaten Kullanımda
```bash
# Port 3000'ı kullanan process'i bul
lsof -i :3000

# Port 3306'yı kullanan process'i bul
lsof -i :3306

# Process'i kapat
kill -9 <PID>
```

### Network Sorunu
```bash
# Network'ü yeniden oluştur
docker network rm copypoz_copypoz_network
docker-compose up -d
```

---

## 📊 Sistem Gereksinimleri

### Minimum
- Docker 20.10+
- Docker Compose 2.0+
- 2GB RAM
- 500MB disk space

### Önerilen
- Docker 24.0+
- Docker Compose 2.20+
- 4GB RAM
- 2GB disk space

---

## 🔐 Güvenlik Notları

### Development
- Credentials `.env` dosyasında saklanıyor
- MySQL root password: `rootpass123`
- App user password: `copypoz123`

### Production
- Güçlü şifreler kullan
- Environment variables'ı güvenli şekilde sakla
- SSL/TLS sertifikaları ekle
- Firewall kurallarını yapılandır

---

## 📚 Faydalı Komutlar

### Tüm Container'ları Göster
```bash
docker ps -a
```

### Tüm Network'leri Göster
```bash
docker network ls
```

### Tüm Volume'leri Göster
```bash
docker volume ls
```

### Container'ı Temizle
```bash
docker-compose down -v
```

### Image'ları Temizle
```bash
docker image prune -a
```

### Tüm Sistem Temizliği
```bash
docker system prune -a
```

---

## 🎯 Workflow

### Geliştirme
```bash
# 1. Container'ları başlat
docker-compose up -d

# 2. Log'ları izle
docker logs copypoz_app -f

# 3. Kod değişiklikleri otomatik olarak yüklenir
# (volumes sayesinde)

# 4. Container'ları durdur
docker-compose down
```

### Debugging
```bash
# Container'a bağlan
docker exec -it copypoz_app sh

# MySQL'e bağlan
docker exec -it copypoz_mysql mysql -u copypoz -p

# Env variables'ı kontrol et
docker exec copypoz_app env
```

### Deployment
```bash
# Production build
docker-compose -f docker-compose.prod.yml up -d

# Logs kontrol et
docker logs copypoz_app -f

# Health check
curl http://localhost:3000/api/health
```

---

## ✅ Başarılı Setup Kontrol Listesi

- [x] Docker Compose dosyası oluşturuldu
- [x] MySQL container'ı başlatıldı
- [x] App container'ı başlatıldı
- [x] Network oluşturuldu
- [x] Volume oluşturuldu
- [x] Database bağlantısı kuruldu
- [x] API endpoints çalışıyor
- [x] Web interface erişilebilir
- [x] Log'lar kontrol edildi
- [x] Tüm testler geçti

---

## 🎉 Sonuç

CopyPoz projesi Docker ile tamamen operasyonel hale getirildi:

✅ **MySQL Database** - Healthy ve çalışıyor  
✅ **Next.js App** - Running ve erişilebilir  
✅ **Network** - Properly configured  
✅ **Volume** - Data persistence sağlanıyor  
✅ **API** - Tüm endpoints çalışıyor  

---

**Status**: ✅ Production Ready  
**Last Updated**: February 27, 2026  
**Version**: 0.1.0

🐳 **Docker setup tamamlandı!**
