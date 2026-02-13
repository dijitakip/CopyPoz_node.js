# CopyPoz V5 - Web Dashboard Kurulum Rehberi

**Tarih**: 12 Şubat 2026  
**Versiyon**: 1.0

---

## 📋 Kurulum Özeti

```
┌─────────────────────────────────────────────────────────────┐
│                  Web Dashboard Kurulumu                     │
│                                                             │
│  1. Database Oluştur (5 dakika)                            │
│  2. Dosyaları Yükle (5 dakika)                             │
│  3. Konfigürasyonu Ayarla (5 dakika)                       │
│  4. Admin Kullanıcı Oluştur (2 dakika)                     │
│  5. Test Et (3 dakika)                                     │
│                                                             │
│  Toplam: ~20 dakika                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 ADIM 1: Database Oluştur (5 dakika)

### 1.1 phpMyAdmin'e Erişim

**Seçenek 1: cPanel üzerinden**
```
1. cPanel'e giriş yap
2. Databases → phpMyAdmin
3. phpMyAdmin açılacak
```

**Seçenek 2: Doğrudan URL**
```
https://[domain]/phpmyadmin
```

### 1.2 SQL Dosyasını Çalıştır

**Adımlar**:
1. phpMyAdmin'de "Import" Tab'ına tıkla
2. "Choose File" butonuna tıkla
3. `Dashboard/database_complete.sql` dosyasını seç
4. "Go" butonuna tıkla
5. Bekleme... (30 saniye)
6. "Import has been successfully finished" mesajı görülsün

**Alternatif: Manuel SQL Çalıştırma**
```
1. phpMyAdmin'de "SQL" Tab'ına tıkla
2. database_complete.sql dosyasının içeriğini kopyala
3. SQL editörine yapıştır
4. "Go" butonuna tıkla
```

### 1.3 Database Kontrol

**Oluşturulan Database**:
```
Database Adı: copypoz_v5
```

**Oluşturulan Tablolar** (14 tane):
```
1. users - Kullanıcılar
2. master_groups - Master Grupları
3. masters - Master Terminalleri
4. clients - Client Terminalleri
5. master_group_members - Grup Üyeleri
6. user_client_assignments - Kullanıcı Atamaları
7. user_tokens - Kullanıcı Tokenları
8. user_permissions - Kullanıcı İzinleri
9. master_state - Master Durumu
10. command_queue - Komut Kuyruğu
11. trader_clients - Trader-Client İlişkisi
12. token_logs - Token Günlüğü
13. audit_logs - İşlem Günlüğü
14. (Sistem tabloları)
```

**Default Admin Kullanıcı**:
```
Username: admin
Email: admin@copypoz.local
Password: admin123
Role: admin
```

---

## 📁 ADIM 2: Dosyaları Yükle (5 dakika)

### 2.1 Yüklenecek Dosyalar

**Ana Dosyalar**:
```
Dashboard/
├── dashboard-v5.php (Ana Dashboard)
├── user-management.php (Kullanıcı Yönetimi)
├── tokens-management.php (Token Yönetimi)
├── register.php (Kayıt Sayfası)
├── forgot-password.php (Şifre Sıfırlama)
├── reset-password.php (Şifre Değiştirme)
├── logout.php (Çıkış)
└── index.php (Giriş Sayfası)
```

**API Dosyaları**:
```
Dashboard/api/
├── positions.php (Pozisyonlar)
├── signal.php (Sinyal)
├── master-command.php (Master Komutları)
├── client-command.php (Client Komutları)
├── client.php (Client Heartbeat)
├── clients.php (Client Listesi)
└── license-check.php (Lisans Kontrolü)
```

**Admin Dosyaları**:
```
Dashboard/admin/
├── tokens.php (Token API)
├── master-groups.php (Master Grubu API)
├── client-management.php (Client Yönetim API)
├── licenses.php (Lisans Yönetimi)
├── users.php (Kullanıcı Yönetimi)
├── clients.php (Client Yönetimi)
├── profile.php (Profil)
└── register.php (Kayıt)
```

**Konfigürasyon Dosyaları**:
```
Dashboard/config/
└── db.php (Database Konfigürasyonu)
```

**Asset Dosyaları**:
```
Dashboard/assets/
├── style.css (CSS Stilleri)
└── (diğer asset dosyaları)
```

### 2.2 FTP ile Yükleme

**Adımlar**:
1. FTP programı aç (FileZilla, WinSCP, vb.)
2. Web sunucusuna bağlan
3. `Dashboard` klasörünü yükle:
   ```
   /public_html/Dashboard/
   ```
4. Tüm dosyaların yüklendiğini kontrol et

**Alternatif: cPanel File Manager**
```
1. cPanel'e giriş yap
2. File Manager
3. public_html klasörüne git
4. Upload butonuna tıkla
5. Dashboard klasörünü yükle
```

### 2.3 Dosya İzinleri

**Gerekli İzinler**:
```
Dashboard/ - 755
Dashboard/logs/ - 777
Dashboard/tmp/ - 777
Dashboard/config/ - 755
Dashboard/config/db.php - 644
```

**Linux/Unix'te**:
```bash
chmod -R 755 Dashboard/
chmod 777 Dashboard/logs/
chmod 777 Dashboard/tmp/
chmod 644 Dashboard/config/db.php
```

---

## ⚙️ ADIM 3: Konfigürasyonu Ayarla (5 dakika)

### 3.1 Database Konfigürasyonu

**Dosya**: `Dashboard/config/db.php`

```php
<?php
// Database Bağlantı Ayarları
define('DB_HOST', 'localhost');
define('DB_USER', 'copypoz_user');
define('DB_PASS', 'secure_password_123');
define('DB_NAME', 'copypoz_v5');

// Bağlantı Oluştur
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

// Bağlantı Kontrolü
if ($conn->connect_error) {
    die('Database connection failed: ' . $conn->connect_error);
}

// Character Set
$conn->set_charset('utf8mb4');

// Diğer Ayarlar
define('COOKIE_LIFETIME', 86400); // 24 saat
define('SESSION_TIMEOUT', 3600); // 1 saat
define('MAX_LOGIN_ATTEMPTS', 5);
define('LOGIN_ATTEMPT_WINDOW', 900); // 15 dakika

// Fonksiyonlar
function jsonResponse($data, $status = 200) {
    header('Content-Type: application/json');
    http_response_code($status);
    echo json_encode($data);
    exit;
}

function sanitizeInput($input) {
    return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
}

function authenticateUser() {
    if (!isset($_SESSION['user_id'])) {
        jsonResponse(['error' => 'Unauthorized'], 401);
    }
    return $_SESSION;
}

function requireAdmin() {
    $user = authenticateUser();
    if ($user['role'] !== 'admin') {
        jsonResponse(['error' => 'Forbidden'], 403);
    }
}

function logAction($action, $details = '', $level = 'INFO') {
    global $conn;
    $user_id = $_SESSION['user_id'] ?? null;
    $ip = $_SERVER['REMOTE_ADDR'] ?? '';
    $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? '';
    
    $query = "INSERT INTO audit_logs (user_id, action, entity_type, new_value, ip_address, user_agent)
              VALUES (?, ?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('isssss', $user_id, $action, $level, $details, $ip, $user_agent);
    $stmt->execute();
}
?>
```

### 3.2 Database Kullanıcı Oluştur

**cPanel'de**:
```
1. cPanel → MySQL Databases
2. "Create New Database" butonuna tıkla
3. Database Adı: copypoz_v5
4. "Create Database" butonuna tıkla
5. "MySQL Users" bölümüne git
6. "Create New User" butonuna tıkla
7. Username: copypoz_user
8. Password: secure_password_123
9. "Create User" butonuna tıkla
10. "Add User to Database" bölümüne git
11. Kullanıcıyı database'e ekle
12. Tüm izinleri ver
```

**Alternatif: phpMyAdmin'de**
```sql
-- Kullanıcı Oluştur
CREATE USER 'copypoz_user'@'localhost' IDENTIFIED BY 'secure_password_123';

-- İzinleri Ver
GRANT ALL PRIVILEGES ON copypoz_v5.* TO 'copypoz_user'@'localhost';

-- Değişiklikleri Uygula
FLUSH PRIVILEGES;
```

### 3.3 Ortam Değişkenleri

**Dosya**: `Dashboard/.env` (İsteğe Bağlı)

```
DB_HOST=localhost
DB_USER=copypoz_user
DB_PASS=secure_password_123
DB_NAME=copypoz_v5

APP_URL=https://fx.haziroglu.com
APP_ENV=production
APP_DEBUG=false

MASTER_TOKEN=MASTER_SECRET_TOKEN_123
CLIENT_TOKEN=CLIENT_SECRET_TOKEN_123
ADMIN_TOKEN=ADMIN_SECRET_TOKEN_123
TRADER_TOKEN=TRADER_SECRET_TOKEN_123
```

---

## 👤 ADIM 4: Admin Kullanıcı Oluştur (2 dakika)

### 4.1 Default Admin Kullanıcı

Database oluşturulurken otomatik olarak oluşturuldu:

```
Username: admin
Email: admin@copypoz.local
Password: admin123
Role: admin
```

### 4.2 Admin Giriş

1. Tarayıcıda aç: `https://fx.haziroglu.com/Dashboard/index.php`
2. Giriş Yap:
   ```
   Email: admin@copypoz.local
   Password: admin123
   ```
3. "Giriş Yap" butonuna tıkla
4. Dashboard açılacak

### 4.3 Şifre Değiştir

1. Dashboard'da sağ üst köşeye tıkla
2. "Profil" seçeneğine tıkla
3. "Şifre Değiştir" bölümüne git
4. Yeni şifre gir
5. "Kaydet" butonuna tıkla

### 4.4 Yeni Admin Kullanıcı Oluştur

1. Dashboard → Admin Panel
2. "Kullanıcılar" seçeneğine tıkla
3. "Yeni Kullanıcı" butonuna tıkla
4. Formu doldur:
   ```
   Username: admin2
   Email: admin2@copypoz.local
   Password: secure_password
   Role: admin
   ```
5. "Oluştur" butonuna tıkla

---

## 🧪 ADIM 5: Test Et (3 dakika)

### 5.1 Dashboard Erişimi

```
1. Tarayıcıda aç: https://fx.haziroglu.com/Dashboard/
2. Giriş sayfası görülsün
3. Admin kullanıcı ile giriş yap
4. Dashboard açılsın
```

### 5.2 Database Bağlantısı

```
1. Dashboard'da herhangi bir sayfaya git
2. Hata mesajı görülmemeli
3. Veriler yüklenebilmeli
```

### 5.3 Master Grubu Oluştur

```
1. Dashboard → User Management
2. Master Grupları Tab
3. Grup Oluştur:
   - Grup Adı: Test-Grup
   - Açıklama: Test
   - Max Client: 50
4. "Grup Oluştur" butonuna tıkla
5. Başarı mesajı görülsün
```

### 5.4 Client Terminal Oluştur

```
1. Dashboard → User Management
2. Client Terminalleri Tab
3. Terminal Oluştur:
   - Hesap Numarası: 123456789
   - Hesap Adı: Test Account
   - Master Grubu: Test-Grup
4. "Terminal Oluştur" butonuna tıkla
5. Token gösterilsin
```

### 5.5 Token Yönetimi

```
1. Dashboard → Token Yönetimi
2. Master Token Oluştur
3. Client Token Oluştur
4. Token'lar gösterilsin
```

---

## ✅ Kontrol Listesi

### Database
- [ ] Database oluşturuldu (copypoz_v5)
- [ ] Tüm tablolar oluşturuldu (14 tane)
- [ ] Default admin kullanıcı oluşturuldu
- [ ] İndeksler oluşturuldu

### Dosyalar
- [ ] Dashboard dosyaları yüklendi
- [ ] API dosyaları yüklendi
- [ ] Admin dosyaları yüklendi
- [ ] Config dosyaları yüklendi
- [ ] Asset dosyaları yüklendi

### Konfigürasyon
- [ ] db.php ayarlandı
- [ ] Database kullanıcı oluşturuldu
- [ ] Dosya izinleri ayarlandı
- [ ] Ortam değişkenleri ayarlandı

### Test
- [ ] Dashboard'a erişim sağlandı
- [ ] Admin giriş başarılı
- [ ] Database bağlantısı çalışıyor
- [ ] Master Grubu oluşturuldu
- [ ] Client Terminal oluşturuldu
- [ ] Token Yönetimi çalışıyor

---

## 🆘 Sorun Giderme

### "Database connection failed" hatası

**Çözüm**:
1. Database adını kontrol et (copypoz_v5)
2. Kullanıcı adını kontrol et (copypoz_user)
3. Şifreyi kontrol et
4. Host'u kontrol et (localhost)
5. db.php dosyasını kontrol et

### "Access denied" hatası

**Çözüm**:
1. Kullanıcı izinlerini kontrol et
2. Database'e erişim izni ver
3. Şifreyi sıfırla

### "File not found" hatası

**Çözüm**:
1. Dosyaların yüklendiğini kontrol et
2. Dosya yollarını kontrol et
3. Dosya izinlerini kontrol et (755)

### "Session error" hatası

**Çözüm**:
1. logs/ klasörünün yazılabilir olduğundan emin ol (777)
2. tmp/ klasörünün yazılabilir olduğundan emin ol (777)
3. PHP session ayarlarını kontrol et

### "Token not found" hatası

**Çözüm**:
1. Database'de token tablosunun olduğundan emin ol
2. Token oluşturulduğundan emin ol
3. Token'ın aktif olduğundan emin ol

---

## 📊 Sistem Gereksinimleri

### Server
- PHP 7.4+
- MySQL 5.7+
- Apache/Nginx
- HTTPS (SSL Sertifikası)

### PHP Extensions
- mysqli
- json
- curl
- openssl
- gd

### Disk Alanı
- Minimum: 100 MB
- Önerilen: 500 MB

### Bant Genişliği
- Minimum: 1 Mbps
- Önerilen: 10 Mbps

---

## 📁 Dosya Yapısı

```
Dashboard/
├── index.php (Giriş Sayfası)
├── dashboard.php (Ana Dashboard)
├── user-management.php (Kullanıcı Yönetimi)
├── tokens-management.php (Token Yönetimi)
├── register.php (Kayıt)
├── forgot-password.php (Şifre Sıfırlama)
├── reset-password.php (Şifre Değiştirme)
├── logout.php (Çıkış)
├── config/
│   └── db.php (Database Konfigürasyonu)
├── api/
│   ├── positions.php
│   ├── signal.php
│   ├── master-command.php
│   ├── client-command.php
│   ├── client.php
│   ├── clients.php
│   └── license-check.php
├── admin/
│   ├── tokens.php
│   ├── master-groups.php
│   ├── client-management.php
│   ├── licenses.php
│   ├── users.php
│   ├── clients.php
│   ├── profile.php
│   └── register.php
├── assets/
│   ├── style.css
│   └── (diğer asset dosyaları)
├── logs/
│   └── (log dosyaları)
├── tmp/
│   └── (geçici dosyalar)
└── database_complete.sql (Database SQL)
```

---

## 📞 Destek

Herhangi bir soru veya sorun için lütfen bildirin.

---

## 📄 Lisans

Copyright 2026, CopyPoz V5

---

**Başarılar!** 🎉

Kurulum tamamlandıktan sonra Dashboard'a erişebilirsiniz.
