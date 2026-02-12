# CopyPoz V5 - Kayıt Sistemi Hızlı Başlangıç

**Tarih**: 12 Şubat 2026  
**Versiyon**: 1.0

---

## ⚡ 5 Dakikalık Kurulum

### Adım 1: Database Tabloları Oluştur (1 dakika)

```sql
-- phpMyAdmin'de çalıştır
-- Dosya: Dashboard/database_registration.sql

-- Users tablosu güncelle
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN email_verified_at TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN password_strength INT DEFAULT 0;
ALTER TABLE users ADD COLUMN last_login TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN login_attempts INT DEFAULT 0;
ALTER TABLE users ADD COLUMN locked_until TIMESTAMP NULL;

-- Email Verification Tokens
CREATE TABLE email_verification_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(64) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    verified_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- MetaTrader Accounts
CREATE TABLE metatrader_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    account_number BIGINT NOT NULL UNIQUE,
    account_name VARCHAR(100),
    account_type ENUM('demo', 'live') DEFAULT 'live',
    broker VARCHAR(100),
    currency VARCHAR(10),
    leverage INT DEFAULT 100,
    balance DECIMAL(15,2) DEFAULT 0,
    equity DECIMAL(15,2) DEFAULT 0,
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Registration Logs
CREATE TABLE registration_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    email VARCHAR(100),
    action VARCHAR(50),
    status VARCHAR(20),
    ip_address VARCHAR(45),
    user_agent TEXT,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Security Questions
CREATE TABLE security_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_text VARCHAR(255) NOT NULL,
    language VARCHAR(5) DEFAULT 'TR',
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Security Answers
CREATE TABLE user_security_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    question_id INT NOT NULL,
    answer_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES security_questions(id) ON DELETE CASCADE
);

-- Güvenlik Soruları Ekle
INSERT INTO security_questions (question_text, language, status) VALUES
('Doğum yeriniz nedir?', 'TR', 'active'),
('İlk evcil hayvanınızın adı nedir?', 'TR', 'active'),
('Annenizin kızlık soyadı nedir?', 'TR', 'active'),
('En sevdiğiniz kitap nedir?', 'TR', 'active'),
('İlk öğretmeninizin adı nedir?', 'TR', 'active'),
('Lise mezuniyetiniz hangi yıl?', 'TR', 'active'),
('En sevdiğiniz şehir nedir?', 'TR', 'active'),
('İlk arabanızın markası nedir?', 'TR', 'active');
```

### Adım 2: Dosyaları Yükle (1 dakika)

FTP'ye yükle:
```
Dashboard/api/register.php
Dashboard/register.php
Dashboard/registration-success.php
```

### Adım 3: Email Ayarlarını Kontrol Et (1 dakika)

`Dashboard/config/db.php` dosyasında email ayarlarını kontrol et:
```php
define('SMTP_HOST', 'smtp.gmail.com');
define('SMTP_PORT', 587);
define('SMTP_USER', 'your-email@gmail.com');
define('SMTP_PASS', 'your-password');
define('FROM_EMAIL', 'noreply@fx.haziroglu.com');
```

### Adım 4: Kayıt Sayfasını Test Et (1 dakika)

1. Tarayıcıda aç: `https://fx.haziroglu.com/Dashboard/register.php`
2. Formu doldur
3. Güçlü şifre gir
4. "Devam Et" butonuna tıkla
5. Email doğrulama linki gönderilsin

### Adım 5: Email Doğrulamayı Test Et (1 dakika)

1. Email adresini kontrol et
2. Doğrulama linkine tıkla
3. MetaTrader hesap kaydı formuna yönlendir
4. Hesap bilgilerini gir
5. Token oluşturulsun

---

## 🎯 Kayıt Akışı

```
1. Kayıt Sayfası (register.php)
   ├─ Kişisel Bilgiler
   ├─ Güçlü Şifre
   └─ Güvenlik Sorusu
   ↓
2. Email Doğrulama
   ├─ Verification Token Oluştur
   ├─ Email Gönder
   └─ Kullanıcı Linke Tıkla
   ↓
3. MetaTrader Hesap Kaydı
   ├─ Hesap Numarası
   ├─ Hesap Bilgileri
   └─ Client Terminal Oluştur
   ↓
4. Başarı Sayfası (registration-success.php)
   ├─ Token Göster
   ├─ Kopyala Butonu
   └─ EA İndirme Linki
```

---

## 📝 Şifre Gereksinimleri

✅ Minimum 8 karakter  
✅ En az bir büyük harf (A-Z)  
✅ En az bir küçük harf (a-z)  
✅ En az bir rakam (0-9)  
✅ En az bir özel karakter (!@#$%^&* vb.)  

**Örnek Güçlü Şifre**: `SecurePass123!@#`

---

## 📊 Örnek Kayıt

### Adım 1: Kişisel Bilgiler
```
Ad: Ahmet
Soyadı: Yılmaz
Kullanıcı Adı: ahmet.yilmaz
Email: ahmet@example.com
Telefon: +90 5XX XXX XXXX
Ülke: Türkiye
Şifre: SecurePass123!@#
Güvenlik Sorusu: Doğum yeriniz nedir?
Cevap: İstanbul
```

### Adım 2: Email Doğrulama
```
Email: ahmet@example.com
Verification Link: https://fx.haziroglu.com/Dashboard/verify-email.php?token=...
Durum: Doğrulandı
```

### Adım 3: MetaTrader Hesap
```
Hesap Numarası: 123456789
Hesap Adı: Live Account
Hesap Tipi: Live
Broker: XM
Para Birimi: USD
Kaldıraç: 100
```

### Adım 4: Token
```
Token: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
Client Terminal: Oluşturuldu
Durum: Aktif
```

---

## ✅ Kontrol Listesi

- [ ] Database tabloları oluşturuldu
- [ ] Dosyalar FTP'ye yüklendi
- [ ] Email ayarları kontrol edildi
- [ ] Kayıt sayfası test edildi
- [ ] Email doğrulama test edildi
- [ ] MetaTrader hesap kaydı test edildi
- [ ] Token oluşturuldu
- [ ] Başarı sayfası görüntülendi

---

## 🔐 Güvenlik Özellikleri

✅ Güçlü şifre zorunluluğu  
✅ Email doğrulama  
✅ Verification token (24 saat geçerli)  
✅ Güvenlik soruları  
✅ Kayıt günlüğü  
✅ IP adresi kaydı  
✅ Şifre hash'leme (BCRYPT)  

---

## 🆘 Sorun Giderme

### Email Alınmıyor
**Çözüm**:
1. Spam klasörünü kontrol et
2. Email ayarlarını kontrol et
3. SMTP bağlantısını test et

### Şifre Çok Zayıf
**Çözüm**:
1. Büyük harf ekle
2. Rakam ekle
3. Özel karakter ekle

### Hesap Numarası Zaten Kayıtlı
**Çözüm**:
1. Farklı hesap numarası gir
2. Veya admin ile iletişime geç

### Token Oluşturulamadı
**Çözüm**:
1. Email doğrulandığından emin ol
2. Database bağlantısını kontrol et
3. Logs'u kontrol et

---

## 📞 Destek

Detaylı bilgi için `REGISTRATION_SYSTEM.md` dosyasını oku.

---

**Başarılar!** 🎉
