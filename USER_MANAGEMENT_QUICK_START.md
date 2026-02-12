# CopyPoz V5 - Kullanıcı Yönetim Sistemi Hızlı Başlangıç

**Tarih**: 12 Şubat 2026  
**Versiyon**: 1.0

---

## ⚡ 10 Dakikalık Kurulum

### Adım 1: Database Tabloları Oluştur (2 dakika)

```sql
-- phpMyAdmin'de çalıştır
-- Dosya: Dashboard/database_user_management.sql

-- Users tablosu güncelle
ALTER TABLE users ADD COLUMN role ENUM('admin', 'master_owner', 'trader', 'viewer') DEFAULT 'viewer';
ALTER TABLE users ADD COLUMN status ENUM('active', 'inactive') DEFAULT 'active';

-- Master Groups tablosu
CREATE TABLE master_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_name VARCHAR(100) NOT NULL,
    owner_id INT NOT NULL,
    description TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    max_clients INT DEFAULT 50,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Masters tablosu güncelle
ALTER TABLE masters ADD COLUMN group_id INT NULL;
ALTER TABLE masters ADD COLUMN owner_id INT NULL;
ALTER TABLE masters ADD FOREIGN KEY (group_id) REFERENCES master_groups(id) ON DELETE SET NULL;
ALTER TABLE masters ADD FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL;

-- Clients tablosu güncelle
ALTER TABLE clients ADD COLUMN owner_id INT NULL;
ALTER TABLE clients ADD COLUMN assigned_to_user_id INT NULL;
ALTER TABLE clients ADD FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE clients ADD FOREIGN KEY (assigned_to_user_id) REFERENCES users(id) ON DELETE SET NULL;

-- User Permissions tablosu
CREATE TABLE user_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    master_group_id INT NULL,
    client_id INT NULL,
    permission_type ENUM('view', 'edit', 'manage', 'admin') DEFAULT 'view',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (master_group_id) REFERENCES master_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- User Client Assignments tablosu
CREATE TABLE user_client_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    client_id INT NOT NULL,
    assigned_by INT NOT NULL,
    assignment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('active', 'inactive') DEFAULT 'active',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE RESTRICT,
    UNIQUE KEY unique_user_client (user_id, client_id)
);

-- User Tokens tablosu
CREATE TABLE user_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    client_id INT NOT NULL,
    token_value VARCHAR(64) NOT NULL UNIQUE,
    token_type ENUM('CLIENT_TOKEN', 'TRADER_TOKEN') DEFAULT 'CLIENT_TOKEN',
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    last_used TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- Master Group Members tablosu
CREATE TABLE master_group_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL,
    user_id INT NOT NULL,
    role ENUM('owner', 'manager', 'trader', 'viewer') DEFAULT 'viewer',
    added_by INT NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES master_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE RESTRICT,
    UNIQUE KEY unique_group_member (group_id, user_id)
);

-- Audit Log tablosu
CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INT,
    old_value TEXT,
    new_value TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
```

### Adım 2: Dosyaları Yükle (2 dakika)

FTP'ye yükle:
```
Dashboard/user-management.php
Dashboard/admin/master-groups.php
Dashboard/admin/client-management.php
```

### Adım 3: Master Grubu Oluştur (2 dakika)

1. Tarayıcıda aç: `https://fx.haziroglu.com/Dashboard/user-management.php`
2. **Master Grupları** Tab'ına git
3. Formu doldur:
   ```
   Grup Adı: Grup-1
   Açıklama: Birinci Master Grubu
   Max Client: 50
   ```
4. **Grup Oluştur** butonuna tıkla

### Adım 4: Client Terminal Oluştur (2 dakika)

1. **Client Terminalleri** Tab'ına git
2. Formu doldur:
   ```
   Hesap Numarası: 987654321
   Hesap Adı: Client Account
   Master Grubu: Grup-1
   Token Tipi: CLIENT_TOKEN
   ```
3. **Terminal Oluştur** butonuna tıkla
4. Token'ı kopyala

### Adım 5: Kullanıcıya Client Ata (2 dakika)

1. **Kullanıcı Atamaları** Tab'ına git
2. Formu doldur:
   ```
   Client Terminal: 987654321
   Kullanıcı: trader1
   ```
3. **Kullanıcı Ata** butonuna tıkla

---

## 🎯 Temel Akış

```
1. Master Grubu Oluştur
   ↓
2. Client Terminal Oluştur
   ↓
3. Kullanıcıya Client Ata
   ↓
4. Kullanıcıya Token Ata
   ↓
5. EA'da Token Kullan
```

---

## 📊 Örnek Senaryo

### Senaryo: 3 Trader, 5 Client Terminal

**Adım 1: Master Grubu Oluştur**
```
Grup Adı: Trading-Group-1
Sahibi: admin
Max Client: 50
```

**Adım 2: 5 Client Terminal Oluştur**
```
Client 1: Account 111111 (trader1)
Client 2: Account 222222 (trader2)
Client 3: Account 333333 (trader3)
Client 4: Account 444444 (trader1, trader2)
Client 5: Account 555555 (trader2, trader3)
```

**Adım 3: Kullanıcılara Client Ata**
```
trader1 → Client 1, Client 4
trader2 → Client 2, Client 4, Client 5
trader3 → Client 3, Client 5
```

**Adım 4: Kullanıcılara Token Ata**
```
trader1 → Client 1 Token, Client 4 Token
trader2 → Client 2 Token, Client 4 Token, Client 5 Token
trader3 → Client 3 Token, Client 5 Token
```

**Sonuç**:
- trader1: 2 Client'a erişim
- trader2: 3 Client'a erişim
- trader3: 2 Client'a erişim

---

## 🔐 Güvenlik Özellikleri

✅ Rol tabanlı erişim kontrolü  
✅ Kullanıcı bazlı token yönetimi  
✅ Token süresi dolma  
✅ Token iptal etme  
✅ İşlem günlüğü  
✅ Yetki kontrolü  

---

## 📝 Parametreler

### Master Grubu

```
Grup Adı: Grup-1
Açıklama: Birinci Master Grubu
Max Client: 50
Durum: active
```

### Client Terminal

```
Hesap Numarası: 987654321
Hesap Adı: Client Account
Master Grubu: Grup-1
Token Tipi: CLIENT_TOKEN
Durum: active
```

### Kullanıcı Ataması

```
Client Terminal: 987654321
Kullanıcı: trader1
Durum: active
```

### Kullanıcı Token

```
Client Terminal: 987654321
Kullanıcı: trader1
Token Tipi: CLIENT_TOKEN
Süresi Dol: 2026-12-31
Durum: active
```

---

## ✅ Kontrol Listesi

- [ ] Database tabloları oluşturuldu
- [ ] Dosyalar FTP'ye yüklendi
- [ ] Master Grubu oluşturuldu
- [ ] Client Terminal oluşturuldu
- [ ] Kullanıcıya Client atandı
- [ ] Kullanıcıya Token atandı
- [ ] EA'da Token kullanıldı

---

## 🆘 Sorun Giderme

### "Yetkiniz yok" hatası

**Çözüm**:
1. Admin olarak giriş yap
2. Kullanıcının doğru role sahip olduğundan emin ol
3. Yetki kontrolünü kontrol et

### Kullanıcı Client'a Erişemiyor

**Çözüm**:
1. Kullanıcının Client'a atandığından emin ol
2. Atama durumunun "active" olduğundan emin ol
3. Token'ın aktif olduğundan emin ol

### Token Süresi Dolmuş

**Çözüm**:
1. Yeni token ata
2. Eski token'ı iptal et
3. EA'da yeni token'ı kullan

---

## 📞 Destek

Detaylı bilgi için `USER_MANAGEMENT_SYSTEM.md` dosyasını oku.

---

**Başarılar!** 🎉
