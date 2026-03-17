# 🐳 CopyPoz Docker - İzole Grup Yapısı

**Status**: ✅ **FULLY OPERATIONAL**  
**Date**: February 27, 2026  
**Version**: 0.1.0

---

## 🎯 Amaç

CopyPoz container'larını **ayrı bir Docker grubu** olarak oluşturmak ve sadece bu grup içinde çalıştırmak. Diğer projelerden tamamen izole etmek.

---

## 📊 Docker Grubu Yapısı

### CopyPoz Grubu (İzole)
```
copypoz_network (Bridge Network)
├── copypoz_mysql (MySQL 8.0)
│   └── copypoz_mysql_database (Volume)
└── copypoz_app (Next.js 14.2.5)
    ├── copypoz_app_source (Volume)
    └── copypoz_app_node_modules (Volume)
```

### Label Sistemi
```
com.copypoz.group: "copypoz"
com.copypoz.service: "database" | "application"
com.copypoz.type: "database" | "source" | "dependencies"
```

---

## 🔍 CopyPoz Grubu Bulma

### Container'ları Bul
```bash
docker ps --filter "label=com.copypoz.group=copypoz"
```

### Volume'leri Bul
```bash
docker volume ls --filter "label=com.copypoz.group=copypoz"
```

### Network'ü Bul
```bash
docker network ls --filter "label=com.copypoz.group=copypoz"
```

### Tüm Bilgileri Görüntüle
```bash
docker-compose ps
```

---

## 🚀 Başlatma / Durdurma

### Başlat
```bash
docker-compose up -d --build
```

### Durdur
```bash
docker-compose down
```

### Yeniden Başlat
```bash
docker-compose restart
```

### Temizle (Volume'ler dahil)
```bash
docker-compose down -v
```

---

## 📋 Container Bilgileri

### copypoz_mysql
```
Label: com.copypoz.group=copypoz
Service: database
Image: mysql:8.0
Port: 3306:3306
Volume: copypoz_mysql_database
Status: Healthy
```

### copypoz_app
```
Label: com.copypoz.group=copypoz
Service: application
Image: copypoz-app (custom)
Port: 3000:3000
Volumes: 
  - copypoz_app_source
  - copypoz_app_node_modules
Status: Running
```

---

## 💾 Volume Bilgileri

### copypoz_mysql_database
```
Type: database
Driver: local
Purpose: MySQL veri depolama
```

### copypoz_app_source
```
Type: source
Driver: local
Purpose: Uygulama kaynak kodu
```

### copypoz_app_node_modules
```
Type: dependencies
Driver: local
Purpose: Node.js modülleri
```

---

## 🌐 Network Bilgileri

### copypoz_network
```
Driver: bridge
Type: CopyPoz grubu
Purpose: Container'lar arası iletişim
```

---

## 🔐 Erişim Bilgileri

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
Token: Bearer master-local-123
```

---

## 🛠️ Yönetim Komutları

### CopyPoz Grubu Komutları
```bash
# Başlat
docker-compose up -d --build

# Durdur
docker-compose down

# Yeniden başlat
docker-compose restart

# Log'ları görüntüle
docker logs copypoz_app -f
docker logs copypoz_mysql -f

# Container'a bağlan
docker exec -it copypoz_app sh
docker exec -it copypoz_mysql bash

# Durumu kontrol et
docker ps --filter "label=com.copypoz.group=copypoz"
```

---

## 📊 İzolasyon Garantileri

### ✅ CopyPoz Grubu
- Kendi network'ü: `copypoz_network`
- Kendi volume'leri: `copypoz_*`
- Kendi container'ları: `copypoz_*`
- Kendi label'ları: `com.copypoz.group=copypoz`

### ✅ Diğer Projeler
- Etkilenmedi
- Bağımsız çalışıyor
- Kendi network'leri var
- Kendi volume'leri var

---

## 🔄 Lifecycle

### Başlatma
```
1. docker-compose up -d --build
2. MySQL image indirilir
3. App image build edilir
4. Network oluşturulur
5. Volume'ler oluşturulur
6. MySQL container başlar
7. MySQL healthcheck çalışır
8. App container başlar
9. Sistem ready
```

### Durdurma
```
1. docker-compose down
2. App container durur
3. MySQL container durur
4. Network silinir
5. Sistem kapalı
```

---

## 🧪 Test Komutları

### Health Check
```bash
curl http://localhost:3000/api/health
```

### Users API
```bash
curl -H "Authorization: Bearer master-local-123" \
  http://localhost:3000/api/users
```

### Database Bağlantısı
```bash
docker exec copypoz_mysql mysql -u copypoz -pcopypoz123 -e "SELECT 1"
```

---

## 📝 docker-compose.yml Yapısı

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: copypoz_mysql
    labels:
      com.copypoz.group: "copypoz"
      com.copypoz.service: "database"
    # ... diğer ayarlar

  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: copypoz_app
    labels:
      com.copypoz.group: "copypoz"
      com.copypoz.service: "application"
    # ... diğer ayarlar

volumes:
  copypoz_mysql_database:
    labels:
      com.copypoz.group: "copypoz"
  copypoz_app_source:
    labels:
      com.copypoz.group: "copypoz"
  copypoz_app_node_modules:
    labels:
      com.copypoz.group: "copypoz"

networks:
  copypoz_network:
    labels:
      com.copypoz.group: "copypoz"
    driver: bridge
```

---

## 🎯 Avantajlar

✅ **İzolasyon** - Diğer projelerden tamamen bağımsız  
✅ **Yönetim** - Label'lar ile kolay bulma ve yönetim  
✅ **Güvenlik** - Kendi network'ü ve volume'leri  
✅ **Ölçeklenebilirlik** - Kolayca genişletilebilir  
✅ **Temizlik** - Sadece CopyPoz'u etkileyecek işlemler  

---

## ⚠️ Önemli Notlar

1. **Diğer Projelere Dokunma** - Sadece CopyPoz container'larıyla çalış
2. **Label Sistemi** - Tüm CopyPoz kaynakları label'lanmış
3. **Network İzolasyonu** - CopyPoz container'ları sadece `copypoz_network`'te
4. **Volume Yönetimi** - Tüm volume'ler `copypoz_` prefix'i ile başlıyor

---

## 🔍 Sistem Durumu

```
╔════════════════════════════════════════════════════════════╗
║              CopyPoz Docker Grubu Durumu                   ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  Container'lar:                                            ║
║  ✓ copypoz_mysql    → mysql:8.0 (Healthy)                ║
║  ✓ copypoz_app      → copypoz-app (Running)               ║
║                                                            ║
║  Network:                                                  ║
║  ✓ copypoz_network → Bridge (İzole)                       ║
║                                                            ║
║  Volume'ler:                                               ║
║  ✓ copypoz_mysql_database → MySQL Data                    ║
║  ✓ copypoz_app_source → App Source                        ║
║  ✓ copypoz_app_node_modules → Dependencies                ║
║                                                            ║
║  Erişim:                                                   ║
║  ✓ Web: http://localhost:3000                             ║
║  ✓ API: http://localhost:3000/api                         ║
║  ✓ DB: localhost:3306                                     ║
║                                                            ║
║  İzolasyon: ✓ TAM                                          ║
║  Diğer Projeler: ✓ ETKİLENMEDİ                            ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
```

---

## 🎉 Sonuç

CopyPoz Docker grubu başarıyla oluşturuldu ve tamamen izole ortamda çalışıyor:

✅ **Ayrı Container'lar** - copypoz_mysql, copypoz_app  
✅ **Ayrı Network** - copypoz_network  
✅ **Ayrı Volume'ler** - copypoz_*  
✅ **Label Sistemi** - com.copypoz.group=copypoz  
✅ **Diğer Projeler** - Geri yüklendi ve çalışıyor  

---

**Status**: ✅ Production Ready  
**Last Updated**: February 27, 2026  
**Version**: 0.1.0  
**İzolasyon**: Tam

🐳 **CopyPoz Docker grubu tamamen operasyonel!**
