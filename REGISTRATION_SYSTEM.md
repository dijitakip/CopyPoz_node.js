# CopyPoz V5 - Kullanıcı Kayıt Sistemi

**Tarih**: 12 Şubat 2026  
**Versiyon**: 1.0

---

## 📋 Genel Bakış

Kullanıcı kayıt sistemi, yeni kullanıcıların Dashboard'a kaydolmasını, email adreslerini doğrulamalarını ve MetaTrader hesaplarını kaydetmelerini sağlar. Sistem güçlü şifre zorunluluğu, email doğrulama ve güvenlik soruları içerir.

---

## 🔄 Kayıt Akışı

```
1. Üyelik Kaydı
   ├─ Kişisel Bilgiler
   ├─ Kullanıcı Adı ve Email
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
4. Token Oluştur
   ├─ Benzersiz Token
   ├─ Kullanıcıya Göster
   └─ EA'da Kullan
```

---

## 🔐 Güvenlik Özellikleri

### Şifre Güvenliği

✅ Minimum 8 karakter  
✅ En az bir büyük harf  
✅ En az bir küçük harf  
✅ En az bir rakam  
✅ En az bir özel karakter  
✅ Güç göstergesi (Zayıf/Orta/Güçlü)  
✅ Gerçek zamanlı feedback  

### Email Doğrulama

✅ Verification token oluştur  
✅ 24 saat geçerlilik  
✅ Email gönder  
✅ Kullanıcı linke tıkla  
✅ Email doğrulandı işaretle  

### Güvenlik Soruları

✅ Kullanıcı seçer  
✅ Cevap hash'lenir  
✅ Şifre sıfırlama için kullan  

### Kayıt Günlüğü

✅ Tüm kayıt işlemleri kaydedilir  
✅ IP adresi kaydedilir  
✅ User Agent kaydedilir  
✅ Başarı/başarısızlık durumu  

---

## 📊 Veri Modeli

### Users Tablosu (Güncellenmiş)

```sql
users
├── id (PK)
├── username (UNIQUE)
├── email (UNIQUE)
├── password_hash
├── role (admin/master_owner/trader/viewer)
├── status (active/inactive)
├── email_verified (BOOLEAN)
├── email_verified_at (TIMESTAMP)
├── password_strength (INT 0-100)
├── last_login (TIMESTAMP)
├── login_attempts (INT)
├── locked_until (TIMESTAMP)
├── created_at
└── updated_at
```

### Email Verification Tokens Tablosu

```sql
email_verification_tokens
├── id (PK)
├── user_id (FK)
├── token (UNIQUE)
├── email
├── created_at
├── expires_at
└── verified_at
```

### MetaTrader Accounts Tablosu

```sql
metatrader_accounts
├── id (PK)
├── user_id (FK)
├── account_number (UNIQUE)
├── account_name
├── account_type (demo/live)
├── broker
├── currency
├── leverage
├── balance
├── equity
├── status (active/inactive/suspended)
├── verified (BOOLEAN)
├── verified_at (TIMESTAMP)
├── created_at
└── updated_at
```

### Registration Logs Tablosu

```sql
registration_logs
├── id (PK)
├── user_id
├── email
├── action (REGISTER/EMAIL_VERIFIED/METATRADER_REGISTERED)
├── status (success/pending_verification/email_exists/etc)
├── ip_address
├── user_agent
├── details
└── created_at
```

### Security Questions Tablosu

```sql
security_questions
├── id (PK)
├── question_text
├── language (TR/EN)
├── status (active/inactive)
└── created_at
```

### User Security Answers Tablosu

```sql
user_security_answers
├── id (PK)
├── user_id (FK)
├── question_id (FK)
├── answer_hash
├── created_at
└── updated_at
```

---

## 🛠️ API Endpoints

### Kayıt

**Endpoint**: `POST /api/register.php?action=register`

**Parametreler**:
```
username: "trader1"
email: "trader@example.com"
password: "SecurePass123!@#"
password_confirm: "SecurePass123!@#"
first_name: "Ahmet"
last_name: "Yılmaz"
phone: "+90 5XX XXX XXXX"
country: "Türkiye"
security_question_id: 1
security_answer: "İstanbul"
```

**Yanıt**:
```json
{
  "success": true,
  "message": "Kayıt başarılı. Email doğrulama linki gönderildi.",
  "user_id": 1,
  "next_step": "verify_email"
}
```

### Email Doğrulama

**Endpoint**: `GET /api/register.php?action=verify_email&token=TOKEN`

**Yanıt**:
```json
{
  "success": true,
  "message": "Email doğrulandı. Şimdi MetaTrader hesabınızı kaydedebilirsiniz.",
  "user_id": 1,
  "next_step": "register_metatrader"
}
```

### MetaTrader Hesap Kaydı

**Endpoint**: `POST /api/register.php?action=register_metatrader`

**Parametreler**:
```
user_id: 1
account_number: 123456789
account_name: "Live Account"
account_type: "live"
broker: "XM"
currency: "USD"
leverage: 100
```

**Yanıt**:
```json
{
  "success": true,
  "message": "MetaTrader hesabı kaydedildi ve Client Terminal oluşturuldu",
  "account_id": 1,
  "client_id": 1,
  "token": "a1b2c3d4e5f6...",
  "next_step": "download_ea"
}
```

### Şifre Güvenliği Kontrol

**Endpoint**: `POST /api/register.php?action=check_password_strength`

**Parametreler**:
```
password: "SecurePass123!@#"
```

**Yanıt**:
```json
{
  "success": true,
  "strength": 85,
  "level": "strong",
  "feedback": []
}
```

### Güvenlik Soruları

**Endpoint**: `GET /api/register.php?action=get_security_questions&language=TR`

**Yanıt**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "question_text": "Doğum yeriniz nedir?"
    },
    {
      "id": 2,
      "question_text": "İlk evcil hayvanınızın adı nedir?"
    }
  ],
  "count": 8
}
```

---

## 📝 UI Sayfaları

### 1. Kayıt Sayfası (`register.php`)

**Adımlar**:
1. Kişisel Bilgiler
   - Ad, Soyadı
   - Kullanıcı Adı, Email
   - Telefon, Ülke
   - Şifre (Güç Göstergesi)
   - Güvenlik Sorusu

2. Email Doğrulama
   - Email linki gönderildi mesajı
   - Tekrar gönder seçeneği

3. MetaTrader Hesap Kaydı
   - Hesap Numarası
   - Hesap Adı
   - Hesap Tipi (Demo/Live)
   - Broker, Para Birimi, Kaldıraç

### 2. Başarı Sayfası (`registration-success.php`)

**İçerik**:
- Başarı mesajı
- Token göster
- Kopyala butonu
- Sonraki adımlar
- EA indirme linki

---

## 🔄 Şifre Güvenliği Seviyeleri

### Zayıf (< 60 puan)
- ❌ Minimum 8 karakter
- ❌ Büyük harf
- ❌ Küçük harf
- ❌ Rakam
- ❌ Özel karakter

### Orta (60-79 puan)
- ✓ Minimum 8 karakter
- ✓ Büyük harf
- ✓ Küçük harf
- ✓ Rakam
- ❌ Özel karakter

### Güçlü (80+ puan)
- ✓ Minimum 8 karakter
- ✓ Büyük harf
- ✓ Küçük harf
- ✓ Rakam
- ✓ Özel karakter

---

## 📊 Örnek Senaryo

### Senaryo: Yeni Kullanıcı Kaydı

**Adım 1: Kayıt Formu**
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

**Adım 2: Email Doğrulama**
```
Email gönderildi: ahmet@example.com
Verification Link: https://fx.haziroglu.com/Dashboard/verify-email.php?token=...
Kullanıcı linke tıkla
Email doğrulandı
```

**Adım 3: MetaTrader Hesap Kaydı**
```
Hesap Numarası: 123456789
Hesap Adı: Live Account
Hesap Tipi: Live
Broker: XM
Para Birimi: USD
Kaldıraç: 100
```

**Adım 4: Token Oluştur**
```
Token: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
Client Terminal: Oluşturuldu
Kullanıcı Ataması: Yapıldı
```

---

## 🧪 Test Senaryoları

### Test 1: Başarılı Kayıt
1. Tüm alanları doldur
2. Güçlü şifre gir
3. "Devam Et" butonuna tıkla
4. Kayıt başarılı mesajı görülsün

### Test 2: Zayıf Şifre
1. Zayıf şifre gir (örn: "123456")
2. Feedback gösterilsin
3. "Devam Et" butonu devre dışı olsun

### Test 3: Email Doğrulama
1. Email adresine doğrulama linki gönderilsin
2. Linke tıkla
3. Email doğrulandı mesajı görülsün

### Test 4: MetaTrader Hesap Kaydı
1. Hesap bilgilerini gir
2. "Hesabı Kaydet" butonuna tıkla
3. Token oluşturulsun
4. Başarı sayfasına yönlendir

---

## 🆘 Sorun Giderme

### Email Alınmıyor
**Çözüm**:
1. Spam klasörünü kontrol et
2. Email adresini kontrol et
3. "Tekrar Gönder" butonuna tıkla

### Şifre Çok Zayıf
**Çözüm**:
1. Büyük harf ekle
2. Rakam ekle
3. Özel karakter ekle

### Hesap Numarası Zaten Kayıtlı
**Çözüm**:
1. Farklı hesap numarası gir
2. Veya admin ile iletişime geç

---

## 📁 Dosya Listesi

| Dosya | Açıklama |
|-------|----------|
| `Dashboard/database_registration.sql` | Database şeması |
| `Dashboard/api/register.php` | Kayıt API |
| `Dashboard/register.php` | Kayıt UI |
| `Dashboard/registration-success.php` | Başarı sayfası |

---

## 🔗 İlişkili Sistemler

- **Kullanıcı Yönetim Sistemi** - Kullanıcı ve izin yönetimi
- **Token Yönetim Sistemi** - Token yönetimi
- **Master/Client EA** - EA'lar

---

## 📞 Destek

Herhangi bir soru veya sorun için lütfen bildirin.

---

## 📄 Lisans

Copyright 2026, CopyPoz V5
