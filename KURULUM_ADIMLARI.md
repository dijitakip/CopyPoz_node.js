# CopyPoz V5 - Kurulum Adımları (Türkçe)

**Tarih**: 12 Şubat 2026  
**Versiyon**: 5.0

---

## 📋 Kurulum Özeti

```
Master Terminal          Client Terminal          Web Server
┌──────────────┐        ┌──────────────┐        ┌──────────────┐
│ 1. Derle     │        │ 1. Derle     │        │ 1. FTP Yükle │
│ 2. Chart'a   │        │ 2. Chart'a   │        │ 2. DB Oluştur│
│    Ekle      │        │    Ekle      │        │ 3. Ayarla    │
└──────────────┘        └──────────────┘        └──────────────┘
       │                       │                       │
       └───────────────────────┴───────────────────────┘
                    Bağlantı Kurulur
```

---

## 🔧 ADIM 1: Master EA Kurulumu

### 1.1 Master EA Dosyasını Hazırla

**Dosya**: `CopyPoz_V5/Master/CopyPoz_Master_V5.mq5`

**Nerede**: Master Terminal'in çalıştığı bilgisayar

### 1.2 Master EA'yı MetaTrader 5'e Kopyala

**Yol**: 
```
C:\Users\[KullanıcıAdı]\AppData\Roaming\MetaQuotes\Terminal\[TerminalID]\MQL5\Experts\
```

**Veya**:
- MetaTrader 5 açık
- File → Open Data Folder
- MQL5 → Experts klasörüne kopyala

### 1.3 MetaTrader 5'i Yeniden Başlat

- MetaTrader 5'i tamamen kapat
- Yeniden aç

### 1.4 Master EA'yı Derle

**Adımlar**:
1. MetaTrader 5 → Tools → MetaEditor (veya F11)
2. File → Open
3. `CopyPoz_Master_V5.mq5` seç
4. Compile (F5 veya Ctrl+F5)
5. Derleme başarılı olmalı (hata yok)

**Beklenen Sonuç**:
```
0 error(s), 0 warning(s)
```

### 1.5 Master EA'yı Chart'a Ekle

**Adımlar**:
1. MetaTrader 5'i aç
2. Herhangi bir chart aç (örn: EURUSD H1)
3. Chart'a sağ tıkla → Expert Advisors → CopyPoz_Master_V5
4. Veya: Insert → Expert Advisor → CopyPoz_Master_V5

### 1.6 Master EA Parametrelerini Ayarla

**Pencere açılacak**, parametreleri ayarla:

```
Language: TR                    (Dil: Türkçe)
LicenseKey: DEMO               (Lisans: Test için DEMO)
TcpAddress: 0.0.0.0:2000       (TCP Adresi: Varsayılan)
BroadcastInterval: 500         (Yayın Aralığı: 500ms)
LogDetailed: true              (Detaylı Log: Açık)
EnableWebMonitor: true         (Web API: Açık)
WebMonitorUrl: https://fx.haziroglu.com/api/signal.php
DashboardUrl: https://fx.haziroglu.com
MasterToken: MASTER_SECRET_TOKEN_123
ConnectionTimeout: 60000       (Timeout: 60 saniye)
AutoFetchToken: true           (Dashboard'dan Token Al: Açık)
```

**Token Alma**:
- `AutoFetchToken: true` ise, EA otomatik olarak Dashboard'dan token alır
- `AutoFetchToken: false` ise, `MasterToken` parametresini elle gir

### 1.7 Master EA'yı Başlat

**Adımlar**:
1. OK butonuna tıkla
2. EA başlayacak
3. Log'da mesajlar görülecek:
   ```
   --- Master EA V5 Başlatılıyor ---
   Lisans geçerli
   License Type: TRIAL
   Days Left: 30
   TCP Server started successfully!
   Master EA V5 Başarıyla Başlatıldı
   TCP Address: 0.0.0.0:2000
   Max Clients: 5
   ```

**Başarı**: Log'da "Master EA V5 Başarıyla Başlatıldı" mesajı görülsün

---

## 🔧 ADIM 2: Client EA Kurulumu

### 2.1 Client EA Dosyasını Hazırla

**Dosya**: `CopyPoz_V5/Client/CopyPoz_Client_V5.mq5`

**Nerede**: Client Terminal'in çalıştığı bilgisayar

### 2.2 Client EA'yı MetaTrader 5'e Kopyala

**Yol**: 
```
C:\Users\[KullanıcıAdı]\AppData\Roaming\MetaQuotes\Terminal\[TerminalID]\MQL5\Experts\
```

**Veya**:
- MetaTrader 5 açık
- File → Open Data Folder
- MQL5 → Experts klasörüne kopyala

### 2.3 MetaTrader 5'i Yeniden Başlat

- MetaTrader 5'i tamamen kapat
- Yeniden aç

### 2.4 Client EA'yı Derle

**Adımlar**:
1. MetaTrader 5 → Tools → MetaEditor (F11)
2. File → Open
3. `CopyPoz_Client_V5.mq5` seç
4. Compile (F5 veya Ctrl+F5)
5. Derleme başarılı olmalı (hata yok)

**Beklenen Sonuç**:
```
0 error(s), 0 warning(s)
```

### 2.5 Client EA'yı Chart'a Ekle

**Adımlar**:
1. MetaTrader 5'i aç
2. Herhangi bir chart aç (örn: EURUSD H1)
3. Chart'a sağ tıkla → Expert Advisors → CopyPoz_Client_V5
4. Veya: Insert → Expert Advisor → CopyPoz_Client_V5

### 2.6 Client EA Parametrelerini Ayarla

**Pencere açılacak**, parametreleri ayarla:

```
Language: TR                    (Dil: Türkçe)
RegistrationToken: CLIENT_REG_TOKEN
MasterAddress: 127.0.0.1:2000  (Master Adresi)
                                (Aynı bilgisayar ise: 127.0.0.1:2000)
                                (Farklı bilgisayar ise: [Master IP]:2000)
ReconnectInterval: 5000        (Yeniden Bağlanma: 5 saniye)
ReceiveTimeout: 10000          (Timeout: 10 saniye)
LogDetailed: true              (Detaylı Log: Açık)
EnableWebMonitor: true         (Web API: Açık)
WebMonitorUrl: https://fx.haziroglu.com/api/client.php
DashboardUrl: https://fx.haziroglu.com
ClientToken: CLIENT_SECRET_TOKEN_123
SyncInterval: 500              (Senkronizasyon: 500ms)
AutoFetchToken: true           (Dashboard'dan Token Al: Açık)
```

**Token Alma**:
- `AutoFetchToken: true` ise, EA otomatik olarak Dashboard'dan token alır
- `AutoFetchToken: false` ise, `ClientToken` parametresini elle gir

**ÖNEMLİ**: MasterAddress'i doğru ayarla!
- **Aynı bilgisayar**: `127.0.0.1:2000`
- **Farklı bilgisayar**: `[Master IP]:2000` (örn: `192.168.1.100:2000`)

### 2.7 Client EA'yı Başlat

**Adımlar**:
1. OK butonuna tıkla
2. EA başlayacak
3. Log'da mesajlar görülecek:
   ```
   --- Client EA V5 Başlatılıyor ---
   Client EA V5 Başarıyla Başlatıldı
   Master Address: 127.0.0.1:2000
   Magic Number: 123456
   ```

**Başarı**: Log'da "Master'a bağlandı" mesajı görülsün

---

## 🌐 ADIM 3: Web Dashboard Kurulumu

### 3.1 Dashboard Dosyalarını Hazırla

**Dosyalar**:
```
Dashboard/
├── api/
│   ├── positions.php
│   ├── signal.php
│   ├── master-command.php
│   ├── client.php
│   ├── client-command.php
│   └── clients.php
├── admin/
│   ├── tokens.php              (YENİ - Token Yönetimi)
│   ├── licenses.php
│   ├── users.php
│   ├── clients.php
│   └── ...
├── config/
│   └── db.php
├── tokens-management.php       (YENİ - Token UI)
└── dashboard-v5.php
```

### 3.2 FTP ile Web Sunucusuna Yükle

**Adımlar**:
1. FTP programı aç (örn: FileZilla)
2. Web sunucusuna bağlan
3. Dashboard klasörünü yükle:
   ```
   /public_html/Dashboard/
   ```

**Veya**:
- cPanel → File Manager
- Dashboard klasörünü yükle

### 3.3 Database Tabloları Oluştur

**Adımlar**:
1. cPanel → phpMyAdmin
2. Yeni database oluştur: `copypoz_v5`
3. SQL dosyasını çalıştır:

```sql
-- Master Terminalleri Tablosu (YENİ)
CREATE TABLE masters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    master_name VARCHAR(100) NOT NULL,
    account_number BIGINT NOT NULL UNIQUE,
    account_name VARCHAR(100),
    token VARCHAR(64) NOT NULL UNIQUE,
    token_type ENUM('MASTER_TOKEN', 'ADMIN_TOKEN') DEFAULT 'MASTER_TOKEN',
    status ENUM('active', 'inactive') DEFAULT 'active',
    last_seen TIMESTAMP NULL,
    total_positions INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Master State Tablosu
CREATE TABLE master_state (
    id INT PRIMARY KEY DEFAULT 1,
    positions JSON,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Clients Tablosu (Güncellenmiş)
CREATE TABLE clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    account_number BIGINT UNIQUE,
    account_name VARCHAR(100),
    auth_token VARCHAR(255),
    token_type ENUM('CLIENT_TOKEN', 'TRADER_TOKEN') DEFAULT 'CLIENT_TOKEN',
    master_id INT NULL,
    status VARCHAR(20) DEFAULT 'active',
    balance DECIMAL(15,2),
    equity DECIMAL(15,2),
    open_positions INT DEFAULT 0,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (master_id) REFERENCES masters(id) ON DELETE SET NULL
);

-- Command Queue Tablosu
CREATE TABLE command_queue (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT DEFAULT 0,
    command VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    executed_at TIMESTAMP NULL
);

-- Users Tablosu
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255),
    role VARCHAR(20) DEFAULT 'trader',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Token Yönetim Günlüğü (YENİ)
CREATE TABLE token_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    token_type VARCHAR(50) NOT NULL,
    token_value VARCHAR(64) NOT NULL,
    action VARCHAR(50) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- İndeksler
CREATE INDEX idx_masters_token ON masters(token);
CREATE INDEX idx_masters_status ON masters(status);
CREATE INDEX idx_clients_token_type ON clients(token_type);
CREATE INDEX idx_token_logs_token ON token_logs(token_value);
```

### 3.4 config/db.php Dosyasını Ayarla

**Dosya**: `Dashboard/config/db.php`

```php
<?php
$host = 'localhost';
$db = 'copypoz_v5';
$user = 'root';
$pass = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die('Database connection failed: ' . $e->getMessage());
}
?>
```

### 3.5 Token Yönetim Sayfasına Erişim

**URL**: 
```
https://fx.haziroglu.com/Dashboard/tokens-management.php
```

**Adımlar**:
1. Dashboard'a admin olarak giriş yap
2. Token Yönetimi sayfasına git
3. Master Token oluştur:
   - Master Adı: Master-1
   - Hesap Numarası: 123456789
   - Token Tipi: MASTER_TOKEN
   - "Token Oluştur" butonuna tıkla
4. Client Token oluştur:
   - Hesap Numarası: 987654321
   - Master Seç: Master-1
   - Token Tipi: CLIENT_TOKEN
   - "Token Oluştur" butonuna tıkla

**Token Kopyala**:
- Oluşturulan tokenları kopyala
- Master EA'nın `MasterToken` parametresine yapıştır
- Client EA'nın `ClientToken` parametresine yapıştır

### 3.6 Environment Variables Ayarla

**Dosya**: `.env` veya `config/db.php`

```
MASTER_TOKEN=MASTER_SECRET_TOKEN_123
CLIENT_TOKEN=CLIENT_SECRET_TOKEN_123
ADMIN_TOKEN=ADMIN_SECRET_TOKEN_123
TRADER_TOKEN=TRADER_SECRET_TOKEN_123
```

### 3.7 Dashboard'a Erişim

**URL**: 
```
https://fx.haziroglu.com/Dashboard/dashboard-v5.php
```

**Login**:
- Email: admin@example.com
- Password: admin123

---

## ✅ Kontrol Listesi

### Master Terminal
- [ ] Master EA dosyası kopyalandı
- [ ] MetaTrader 5 yeniden başlatıldı
- [ ] Master EA derlenmiş (hata yok)
- [ ] Master EA chart'a eklendi
- [ ] Parametreler ayarlandı
- [ ] Master EA başlatıldı
- [ ] Log'da başarı mesajı görüldü

### Client Terminal
- [ ] Client EA dosyası kopyalandı
- [ ] MetaTrader 5 yeniden başlatıldı
- [ ] Client EA derlenmiş (hata yok)
- [ ] Client EA chart'a eklendi
- [ ] Parametreler ayarlandı (MasterAddress doğru)
- [ ] Client EA başlatıldı
- [ ] Log'da "Master'a bağlandı" mesajı görüldü

### Web Dashboard
- [ ] Dashboard dosyaları FTP'ye yüklendi
- [ ] Database tabloları oluşturuldu (masters, clients, token_logs)
- [ ] config/db.php ayarlandı
- [ ] Token Yönetimi sayfasına erişim sağlandı
- [ ] Master Token oluşturuldu
- [ ] Client Token oluşturuldu
- [ ] Tokenlar EA'lara yapıştırıldı
- [ ] Dashboard'a erişim sağlandı
- [ ] Login başarılı

---

## 🧪 Test Adımları

### Test 1: Bağlantı Kontrolü
1. Master Terminal log'unu aç
2. "Yeni client bağlandı" mesajı görülsün
3. "Toplam client: 1" mesajı görülsün

### Test 2: Pozisyon Yayını
1. Master Terminal'de test pozisyonu aç (EURUSD BUY 1.0)
2. Client Terminal log'unu kontrol et
3. "Master'dan veri alındı" mesajı görülsün
4. "Parsed 1 positions from Master" mesajı görülsün

### Test 3: Pozisyon Senkronizasyonu
1. Master'da pozisyon açık
2. Client Terminal'de yeni pozisyon açılmalı
3. Client log'da "Position opened" mesajı görülsün

### Test 4: Dashboard
1. Dashboard'a giriş yap
2. Master Status görülsün
3. Connected Clients listesi görülsün
4. Master Positions tablosu görülsün

---

## 🆘 Sorun Giderme

### Master EA başlamıyor
**Sorun**: "HATA: Socket oluşturulamadı"

**Çözüm**:
1. Port 2000'in açık olduğundan emin ol
2. Firewall ayarlarını kontrol et
3. Lisans anahtarını kontrol et

### Client Master'a bağlanamıyor
**Sorun**: "Master'a bağlanma başarısız"

**Çözüm**:
1. Master EA'nın çalıştığından emin ol
2. MasterAddress'i kontrol et
3. Port 2000'in açık olduğundan emin ol
4. Firewall ayarlarını kontrol et

### Dashboard'a erişim yok
**Sorun**: "Connection refused" veya "404 Not Found"

**Çözüm**:
1. Dosyaların FTP'ye yüklendiğini kontrol et
2. Database bağlantısını kontrol et
3. config/db.php ayarlarını kontrol et
4. Web sunucusu PHP desteğini kontrol et

### Pozisyonlar senkronize olmuyor
**Sorun**: Client'da pozisyon açılmıyor

**Çözüm**:
1. Client EA'nın Master'a bağlı olduğundan emin ol
2. Magic number'ı kontrol et
3. Log dosyasını kontrol et

---

## 📞 Destek

Herhangi bir soru veya sorun için lütfen bildirin.

---

## 📄 Lisans

Copyright 2026, CopyPoz V5

