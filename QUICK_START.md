# CopyPoz V5 - Hızlı Başlangıç Rehberi

## 🚀 Projeyi Çalıştırma

### Seçenek 1: Docker ile (Önerilen - En Kolay)

#### Adım 1: Docker Desktop'ı Açın
- Windows'ta Docker Desktop uygulamasını açın
- Başlaması için 1-2 dakika bekleyin

#### Adım 2: Terminal'de Proje Klasörüne Gidin
```bash
cd C:\Users\diji.dev\source\repos\FX\CopyPoz
```

#### Adım 3: Docker Compose ile Başlatın
```bash
docker-compose up -d
```

#### Adım 4: Tarayıcıda Açın
```
http://localhost:3000
```

#### Adım 5: Giriş Yapın
- **Kullanıcı Adı**: admin
- **Şifre**: admin123

---

### Seçenek 2: Local Node.js ile

#### Adım 1: Gerekli Yazılımları Kontrol Edin
```bash
node --version    # v22 veya üzeri olmalı
npm --version     # 11 veya üzeri olmalı
```

#### Adım 2: MySQL'i Başlatın
Docker ile:
```bash
docker run -d \
  --name copypoz_mysql \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=copypoz_v5 \
  -p 3306:3306 \
  mysql:8.0
```

Veya Local MySQL varsa, database oluşturun:
```bash
mysql -u root -p
CREATE DATABASE copypoz_v5;
EXIT;
```

#### Adım 3: Bağımlılıkları Yükleyin
```bash
npm install
```

#### Adım 4: Prisma Setup
```bash
npm run prisma:generate
npx prisma db push
```

#### Adım 5: Development Server'ı Başlatın
```bash
npm run dev
```

#### Adım 6: Tarayıcıda Açın
```
http://localhost:3000
```

---

## 📋 Kontrol Listesi

### Docker ile Çalıştırırken
- [ ] Docker Desktop açık mı?
- [ ] `docker-compose up -d` komutu çalıştırıldı mı?
- [ ] http://localhost:3000 açılıyor mu?
- [ ] Login sayfası görünüyor mu?

### Local Node.js ile Çalıştırırken
- [ ] Node.js v22+ yüklü mü?
- [ ] MySQL çalışıyor mu?
- [ ] `npm install` tamamlandı mı?
- [ ] `npx prisma db push` tamamlandı mı?
- [ ] `npm run dev` çalışıyor mu?
- [ ] http://localhost:3000 açılıyor mu?

---

## 🔐 Login Bilgileri

```
Kullanıcı Adı: admin
Şifre: admin123
```

---

## 📊 Dashboard Özellikleri

Giriş yaptıktan sonra görecekleriniz:

1. **Stat Cards** - Sistem istatistikleri
   - Toplam Clientler
   - Aktif Clientler
   - Toplam Bakiye
   - Açık Pozisyonlar

2. **Hızlı İşlemler** - Kısayollar
   - Kullanıcılar
   - Clientler
   - Komutlar
   - Master Grupları

3. **Sistem Durumu** - Bağlantı durumları
   - Web API
   - Database
   - Master EA

4. **Son Aktiviteler** - Sistem logları

---

## 🗂️ Menü Yapısı

### Sidebar'da Görecekleriniz

```
📊 Dashboard
⚙️ Yönetim
  ├─ 👥 Kullanıcılar
  ├─ 💻 Clientler
  ├─ 👑 Master Grupları
  ├─ 📝 Komutlar
  ├─ 🔑 Tokenlar
  ├─ 📜 Lisanslar
  ├─ 📋 Loglar
  └─ ⚡ Ayarlar
```

---

## 🛠️ Sorun Giderme

### "Connection refused" hatası
**Çözüm**: MySQL'in çalışıp çalışmadığını kontrol edin
```bash
docker ps | grep mysql
```

### "Port 3000 already in use" hatası
**Çözüm**: Port 3000'ı kullanan process'i kapatın
```bash
# Windows PowerShell
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force
```

### "Database tables not found" hatası
**Çözüm**: Prisma migrations'ı çalıştırın
```bash
npx prisma db push
```

### "Cannot find module" hatası
**Çözüm**: Bağımlılıkları yeniden yükleyin
```bash
rm -r node_modules package-lock.json
npm install
```

---

## 📱 Responsive Design

Proje tüm cihazlarda çalışır:
- 💻 Desktop (1920px+)
- 📱 Tablet (768px - 1024px)
- 📱 Mobile (320px - 767px)

---

## 🔄 Veri Güncelleme

Bazı sayfalar otomatik olarak güncellenir:
- **Dashboard**: Her 10 saniyede
- **Clientler**: Her 10 saniyede
- **Master EA**: Her 5 saniyede

---

## 🚪 Çıkış Yapma

1. Sağ üst köşedeki kullanıcı avatarına tıklayın
2. "Çıkış Yap" butonuna tıklayın
3. Login sayfasına yönlendirileceksiniz

---

## 📞 API Endpoints

Tüm API endpoints'leri test etmek için:

```bash
# Health Check
curl http://localhost:3000/api/health

# Clients Listesi
curl -H "Authorization: Bearer master-local-123" \
  http://localhost:3000/api/clients

# Users Listesi
curl -H "Authorization: Bearer master-local-123" \
  http://localhost:3000/api/users
```

---

## 🎯 Sonraki Adımlar

1. ✅ Projeyi çalıştırın
2. ⏳ MetaTrader EA'sını test edin
3. ⏳ Hostinger'a deploy edin

---

## 💡 İpuçları

- **Sidebar'ı Kapatmak**: Sol üst köşedeki ◀ butonuna tıklayın
- **Mobil Menü**: Hamburger menüsü (☰) mobil cihazlarda görünür
- **Tema**: Sistem otomatik olarak light mode kullanır
- **Veri Yenileme**: F5 tuşuna basarak sayfayı yenileyebilirsiniz

---

**Başarıyla çalıştırıldı mı? Tebrikler! 🎉**

Şimdi MetaTrader EA'sını test etmeye başlayabilirsiniz.
