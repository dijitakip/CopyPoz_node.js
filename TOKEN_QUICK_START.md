# CopyPoz V5 - Token Yönetim Hızlı Başlangıç

**Tarih**: 12 Şubat 2026  
**Versiyon**: 1.0

---

## ⚡ 5 Dakikalık Kurulum

### Adım 1: Database Tabloları Oluştur (1 dakika)

```sql
-- phpMyAdmin'de çalıştır
-- Dosya: Dashboard/database_tokens.sql

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

ALTER TABLE clients ADD COLUMN token_type ENUM('CLIENT_TOKEN', 'TRADER_TOKEN') DEFAULT 'CLIENT_TOKEN';
ALTER TABLE clients ADD COLUMN master_id INT NULL;
ALTER TABLE clients ADD FOREIGN KEY (master_id) REFERENCES masters(id) ON DELETE SET NULL;

CREATE TABLE token_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    token_type VARCHAR(50) NOT NULL,
    token_value VARCHAR(64) NOT NULL,
    action VARCHAR(50) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Adım 2: Dosyaları Yükle (1 dakika)

FTP'ye yükle:
```
Dashboard/tokens-management.php
Dashboard/admin/tokens.php
```

### Adım 3: Master Token Oluştur (1 dakika)

1. Tarayıcıda aç: `https://fx.haziroglu.com/Dashboard/tokens-management.php`
2. **Master Token** bölümüne git
3. Formu doldur:
   ```
   Master Adı: Master-1
   Hesap Numarası: 123456789
   Hesap Adı: Live Account
   Token Tipi: MASTER_TOKEN
   ```
4. **Token Oluştur** butonuna tıkla
5. Token'ı kopyala (örn: `a1b2c3d4e5f6...`)

### Adım 4: Client Token Oluştur (1 dakika)

1. **Client Token** bölümüne git
2. Formu doldur:
   ```
   Hesap Numarası: 987654321
   Hesap Adı: Client Account
   Master Seç: Master-1
   Token Tipi: CLIENT_TOKEN
   ```
3. **Token Oluştur** butonuna tıkla
4. Token'ı kopyala (örn: `f2e1d0c9b8a7...`)

### Adım 5: EA'lara Token Yapıştır (1 dakika)

**Master EA Parametreleri**:
```
MasterToken: [Adım 3'ten kopyalanan token]
AutoFetchToken: true
DashboardUrl: https://fx.haziroglu.com
```

**Client EA Parametreleri**:
```
ClientToken: [Adım 4'ten kopyalanan token]
AutoFetchToken: true
DashboardUrl: https://fx.haziroglu.com
```

---

## 🚀 Başlat

### Master EA Başlat

1. MetaTrader 5 aç
2. Chart aç (EURUSD H1)
3. Chart'a sağ tıkla → Expert Advisors → CopyPoz_Master_V5
4. Parametreleri ayarla (yukarıdaki gibi)
5. OK butonuna tıkla
6. Log'da mesajlar görülsün:
   ```
   --- Master EA V5 Başlatılıyor ---
   Master token fetched from Dashboard: a1b2c3d4...
   Lisans geçerli
   TCP Server started successfully!
   Master EA V5 Başarıyla Başlatıldı
   ```

### Client EA Başlat

1. MetaTrader 5 aç (farklı terminal)
2. Chart aç (EURUSD H1)
3. Chart'a sağ tıkla → Expert Advisors → CopyPoz_Client_V5
4. Parametreleri ayarla (yukarıdaki gibi)
5. OK butonuna tıkla
6. Log'da mesajlar görülsün:
   ```
   --- Client EA V5 Başlatılıyor ---
   Client token fetched from Dashboard: f2e1d0c9...
   Client EA V5 Başarıyla Başlatıldı
   Master'a bağlandı
   ```

---

## ✅ Kontrol Listesi

- [ ] Database tabloları oluşturuldu
- [ ] Dosyalar FTP'ye yüklendi
- [ ] Master Token oluşturuldu
- [ ] Client Token oluşturuldu
- [ ] Master EA parametreleri ayarlandı
- [ ] Client EA parametreleri ayarlandı
- [ ] Master EA başlatıldı
- [ ] Client EA başlatıldı
- [ ] Log'da başarı mesajları görüldü

---

## 🔄 Token Yenileme

Token'ı yenilemek gerekirse:

1. Dashboard → Token Yönetimi
2. Yenilemek istediğin token'ı bul
3. **Yenile** butonuna tıkla
4. Yeni token'ı kopyala
5. EA'nın parametresini güncelle
6. EA'yı yeniden başlat

---

## 🆘 Sorun Giderme

### "Master token fetched from Dashboard" mesajı görülmüyor

**Çözüm**:
1. `AutoFetchToken: true` olduğundan emin ol
2. `DashboardUrl` doğru olduğundan emin ol
3. Dashboard'a erişim sağlandığından emin ol

### "Unauthorized" hatası

**Çözüm**:
1. Token'ın doğru olduğundan emin ol
2. Token'ın aktif olduğundan emin ol
3. Token'ı yenile

### Master'a bağlanamıyor

**Çözüm**:
1. Master EA'nın çalıştığından emin ol
2. `MasterAddress` doğru olduğundan emin ol
3. Port 2000'in açık olduğundan emin ol

---

## 📞 Destek

Herhangi bir soru için TOKEN_MANAGEMENT.md dosyasını oku.

---

**Başarılar!** 🎉
