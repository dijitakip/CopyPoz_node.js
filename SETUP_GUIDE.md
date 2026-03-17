# CopyPoz V5 - Detaylı Kurulum Rehberi

## 📋 İçindekiler
1. [Sistem Gereksinimleri](#sistem-gereksinimleri)
2. [Docker ile Kurulum](#docker-ile-kurulum)
3. [Local Node.js ile Kurulum](#local-nodejs-ile-kurulum)
4. [Sorun Giderme](#sorun-giderme)
5. [Kullanım](#kullanım)

---

## Sistem Gereksinimleri

### Docker ile Çalıştırmak İçin
- **Docker Desktop** (Windows 10/11)
- **4GB RAM** (minimum)
- **2GB Disk Space**
- **İnternet Bağlantısı**

### Local Node.js ile Çalıştırmak İçin
- **Node.js v22+** (https://nodejs.org)
- **npm 11+** (Node.js ile birlikte gelir)
- **MySQL 8.0+** (https://dev.mysql.com/downloads/mysql/)
- **4GB RAM** (minimum)
- **2GB Disk Space**

---

## Docker ile Kurulum

### Adım 1: Docker Desktop'ı İndirin ve Kurun

1. https://www.docker.com/products/docker-desktop adresine gidin
2. "Download for Windows" butonuna tıklayın
3. İndirilen dosyayı çalıştırın
4. Kurulum tamamlanana kadar bekleyin
5. Bilgisayarı yeniden başlatın

### Adım 2: Docker Desktop'ı Başlatın

1. Windows Start menüsünde "Docker Desktop" arayın
2. Uygulamayı açın
3. Başlaması için 1-2 dakika bekleyin
4. Sistem trayında Docker simgesi görünecek

### Adım 3: Proje Klasörüne Gidin

**PowerShell'i açın ve şu komutu çalıştırın:**

```powershell
cd C:\Users\diji.dev\source\repos\FX\CopyPoz
```

### Adım 4: Docker Compose ile Başlatın

```powershell
docker-compose up -d
```

**Çıktı şöyle görünmelidir:**
```
Creating copypoz_app ... done
```

### Adım 5: Kontrol Edin

```powershell
docker ps
```

**Çıktıda şu container'ları görmelisiniz:**
- copypoz_app
- copypoz_mysql

### Adım 6: Tarayıcıda Açın

```
http://localhost:3000
```

### Adım 7: Giriş Yapın

- **Kullanıcı Adı**: admin
- **Şifre**: admin123

---

## Local Node.js ile Kurulum

### Adım 1: Node.js'i İndirin ve Kurun

1. https://nodejs.org adresine gidin
2. "LTS" (Long Term Support) sürümünü indirin
3. İndirilen dosyayı çalıştırın
4. Kurulum tamamlanana kadar "Next" butonuna tıklayın
5. Bilgisayarı yeniden başlatın

### Adım 2: Versiyonları Kontrol Edin

**PowerShell'i açın ve şu komutları çalıştırın:**

```powershell
node --version
npm --version
```

**Çıktı şöyle görünmelidir:**
```
v22.x.x
11.x.x
```

### Adım 3: MySQL'i Başlatın

#### Seçenek A: Docker ile (Önerilen)

```powershell
docker run -d `
  --name copypoz_mysql `
  -e MYSQL_ROOT_PASSWORD=root `
  -e MYSQL_DATABASE=copypoz_v5 `
  -p 3306:3306 `
  mysql:8.0
```

#### Seçenek B: Local MySQL ile

1. MySQL'i indirin: https://dev.mysql.com/downloads/mysql/
2. Kurun ve başlatın
3. MySQL Command Line Client'ı açın
4. Şu komutları çalıştırın:

```sql
CREATE DATABASE copypoz_v5;
EXIT;
```

### Adım 4: Proje Klasörüne Gidin

```powershell
cd C:\Users\diji.dev\source\repos\FX\CopyPoz
```

### Adım 5: Bağımlılıkları Yükleyin

```powershell
npm install
```

**Bu 2-3 dakika sürebilir. Tamamlanana kadar bekleyin.**

### Adım 6: Prisma Setup

```powershell
npm run prisma:generate
npx prisma db push
```

### Adım 7: Development Server'ı Başlatın

```powershell
npm run dev
```

**Çıktı şöyle görünmelidir:**
```
▲ Next.js 14.2.5
  - Local:        http://localhost:3000
  ✓ Ready in 1.8s
```

### Adım 8: Tarayıcıda Açın

```
http://localhost:3000
```

### Adım 9: Giriş Yapın

- **Kullanıcı Adı**: admin
- **Şifre**: admin123

---

## Sorun Giderme

### Docker Sorunları

#### "Docker daemon is not running"
```powershell
# Docker Desktop'ı açın
# Sistem trayında Docker simgesine tıklayın
```

#### "Port 3000 already in use"
```powershell
# Port 3000'ı kullanan process'i bulun
Get-NetTCPConnection -LocalPort 3000

# Process'i kapatın
Stop-Process -Id <PID> -Force
```

#### "Cannot connect to database"
```powershell
# MySQL container'ın çalışıp çalışmadığını kontrol edin
docker ps | Select-String mysql

# Eğer çalışmıyorsa başlatın
docker start copypoz_mysql
```

### Node.js Sorunları

#### "npm: command not found"
```powershell
# Node.js'i yeniden kurun
# Bilgisayarı yeniden başlatın
```

#### "Cannot find module"
```powershell
# node_modules'ı silin ve yeniden yükleyin
rm -r node_modules package-lock.json
npm install
```

#### "Database tables not found"
```powershell
# Prisma migrations'ı çalıştırın
npx prisma db push
```

### Bağlantı Sorunları

#### "Cannot reach http://localhost:3000"
```powershell
# Server çalışıyor mu kontrol edin
# PowerShell'de npm run dev çalışıyor mu?

# Eğer çalışmıyorsa:
npm run dev
```

#### "Unauthorized" hatası
```
# Login bilgilerini kontrol edin
Kullanıcı Adı: admin
Şifre: admin123
```

---

## Kullanım

### Dashboard'a Giriş

1. Tarayıcıda `http://localhost:3000` açın
2. Login sayfasında admin bilgilerini girin
3. "Giriş Yap" butonuna tıklayın

### Menüleri Kullanma

**Sidebar'da şu menüler vardır:**

- **📊 Dashboard** - Ana sayfa, istatistikler
- **👥 Kullanıcılar** - Sistem kullanıcılarını yönetin
- **💻 Clientler** - MetaTrader clientlerini yönetin
- **👑 Master Grupları** - Master EA gruplarını yönetin
- **📝 Komutlar** - Clientlere komut gönderin
- **🔑 Tokenlar** - API tokenlarını yönetin
- **📜 Lisanslar** - Sistem lisanslarını yönetin
- **📋 Loglar** - Sistem loglarını görüntüleyin
- **⚡ Ayarlar** - Sistem ayarlarını yapılandırın

### Sidebar'ı Kapatma/Açma

- Sol üst köşedeki **◀** veya **▶** butonuna tıklayın
- Mobil cihazlarda hamburger menüsü (☰) kullanın

### Çıkış Yapma

1. Sağ üst köşedeki kullanıcı avatarına tıklayın
2. "Çıkış Yap" butonuna tıklayın

---

## Komut Referansı

### Docker Komutları

```powershell
# Tüm container'ları başlat
docker-compose up -d

# Tüm container'ları durdur
docker-compose down

# Container'ları yeniden başlat
docker-compose restart

# Logları görüntüle
docker-compose logs -f

# Belirli container'ın loglarını görüntüle
docker logs copypoz_app -f
```

### Node.js Komutları

```powershell
# Development server'ı başlat
npm run dev

# Production build
npm run build

# Production server'ı başlat
npm start

# Linting
npm run lint

# Type checking
npm run typecheck

# Prisma commands
npm run prisma:generate
npx prisma db push
npx prisma studio
```

---

## 🎯 Başarılı Kurulum Kontrol Listesi

- [ ] Docker Desktop açık mı? (Docker ile çalıştırıyorsanız)
- [ ] Node.js v22+ yüklü mü? (Local Node.js ile çalıştırıyorsanız)
- [ ] MySQL çalışıyor mu?
- [ ] `npm install` tamamlandı mı?
- [ ] `npx prisma db push` tamamlandı mı?
- [ ] `npm run dev` çalışıyor mu?
- [ ] http://localhost:3000 açılıyor mu?
- [ ] Login sayfası görünüyor mu?
- [ ] Admin bilgileriyle giriş yapabildiniz mi?
- [ ] Dashboard görünüyor mu?

---

## 📞 Yardım

Sorun yaşıyorsanız:

1. **Logları kontrol edin**
   - PowerShell'de hata mesajlarını okuyun
   - Docker loglarını kontrol edin: `docker logs copypoz_app`

2. **Sorun Giderme bölümüne bakın**
   - Benzer sorunlar için çözümleri bulabilirsiniz

3. **Dosyaları kontrol edin**
   - `.env` dosyasının doğru olduğundan emin olun
   - `package.json` dosyasının bozulmadığından emin olun

---

**Kurulum tamamlandı! Şimdi MetaTrader EA'sını test etmeye başlayabilirsiniz. 🚀**
