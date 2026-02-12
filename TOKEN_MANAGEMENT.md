# CopyPoz V5 - Token Yönetim Sistemi

**Tarih**: 12 Şubat 2026  
**Versiyon**: 1.0

---

## 📋 Genel Bakış

Token yönetim sistemi, Master ve Client EA'ların Dashboard üzerinden güvenli bir şekilde token almasını sağlar. Her Master ve Client için benzersiz token oluşturulur ve yönetilir.

---

## 🔐 Token Türleri

### 1. Master Token
- **Kullanım**: Master EA'nın Web API'ye erişimi
- **Format**: 64 karakter hex string
- **Örnek**: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2`
- **Oluşturan**: Admin (Dashboard)
- **Saklayan**: Master EA parametresi veya Dashboard

### 2. Client Token
- **Kullanım**: Client EA'nın Web API'ye erişimi
- **Format**: 64 karakter hex string
- **Örnek**: `f2e1d0c9b8a7z6y5x4w3v2u1t0s9r8q7p6o5n4m3l2k1j0i9h8g7f6e5d4c3b2a1`
- **Oluşturan**: Admin (Dashboard)
- **Saklayan**: Client EA parametresi veya Dashboard

### 3. Admin Token
- **Kullanım**: Dashboard admin işlemleri
- **Format**: 64 karakter hex string
- **Oluşturan**: Admin (Dashboard)

### 4. Trader Token
- **Kullanım**: Trader işlemleri (sınırlı erişim)
- **Format**: 64 karakter hex string
- **Oluşturan**: Admin (Dashboard)

---

## 🛠️ Token Oluşturma

### Dashboard'da Token Oluşturma

**URL**: `https://fx.haziroglu.com/Dashboard/tokens-management.php`

#### Master Token Oluştur

1. **Token Yönetimi** sayfasına git
2. **Master Token** bölümüne git
3. Formu doldur:
   - **Master Adı**: Master-1
   - **Hesap Numarası**: 123456789
   - **Hesap Adı**: Live Account
   - **Token Tipi**: MASTER_TOKEN
4. **Token Oluştur** butonuna tıkla
5. Token gösterilecek (kopyala ve kaydet)

#### Client Token Oluştur

1. **Token Yönetimi** sayfasına git
2. **Client Token** bölümüne git
3. Formu doldur:
   - **Hesap Numarası**: 987654321
   - **Hesap Adı**: Client Account
   - **Master Seç**: Master-1
   - **Token Tipi**: CLIENT_TOKEN
4. **Token Oluştur** butonuna tıkla
5. Token gösterilecek (kopyala ve kaydet)

---

## 📝 Token Kullanımı

### Master EA'da Token Kullanımı

#### Seçenek 1: Otomatik Token Alma (Önerilen)

```
AutoFetchToken: true
DashboardUrl: https://fx.haziroglu.com
MasterToken: MASTER_SECRET_TOKEN_123 (varsayılan)
```

**Nasıl çalışır**:
1. Master EA başlatılır
2. `AutoFetchToken: true` ise, Dashboard'dan token alır
3. Dashboard'dan alınan token kullanılır
4. Başarısız olursa, `MasterToken` parametresi kullanılır

#### Seçenek 2: Manuel Token Girişi

```
AutoFetchToken: false
MasterToken: [Dashboard'dan alınan token]
```

**Nasıl çalışır**:
1. Master EA başlatılır
2. `MasterToken` parametresinde verilen token kullanılır
3. Dashboard'dan token alınmaz

### Client EA'da Token Kullanımı

#### Seçenek 1: Otomatik Token Alma (Önerilen)

```
AutoFetchToken: true
DashboardUrl: https://fx.haziroglu.com
ClientToken: CLIENT_SECRET_TOKEN_123 (varsayılan)
```

**Nasıl çalışır**:
1. Client EA başlatılır
2. `AutoFetchToken: true` ise, Dashboard'dan token alır
3. Dashboard'dan alınan token kullanılır
4. Başarısız olursa, `ClientToken` parametresi kullanılır

#### Seçenek 2: Manuel Token Girişi

```
AutoFetchToken: false
ClientToken: [Dashboard'dan alınan token]
```

**Nasıl çalışır**:
1. Client EA başlatılır
2. `ClientToken` parametresinde verilen token kullanılır
3. Dashboard'dan token alınmaz

---

## 🔄 Token Yenileme

### Dashboard'da Token Yenile

1. **Token Yönetimi** sayfasına git
2. Yenilemek istediğin token'ı bul
3. **Yenile** butonuna tıkla
4. Yeni token gösterilecek
5. EA'larda parametreyi güncelle

**Eski token artık çalışmaz!**

---

## 🗄️ Database Yapısı

### Masters Tablosu

```sql
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
```

### Clients Tablosu (Güncellenmiş)

```sql
ALTER TABLE clients ADD COLUMN token_type ENUM('CLIENT_TOKEN', 'TRADER_TOKEN') DEFAULT 'CLIENT_TOKEN';
ALTER TABLE clients ADD COLUMN master_id INT NULL;
ALTER TABLE clients ADD FOREIGN KEY (master_id) REFERENCES masters(id) ON DELETE SET NULL;
```

### Token Logs Tablosu

```sql
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

---

## 🔌 API Endpoints

### Token Yönetim API

**Dosya**: `Dashboard/admin/tokens.php`

#### Master Token Listesi

```
GET /admin/tokens.php?action=list&type=master
```

**Yanıt**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "master_name": "Master-1",
      "account_number": 123456789,
      "token": "a1b2c3d4...",
      "token_type": "MASTER_TOKEN",
      "status": "active",
      "last_seen": "2026-02-12 10:30:00"
    }
  ],
  "count": 1
}
```

#### Master Token Oluştur

```
POST /admin/tokens.php?action=create&type=master
```

**Parametreler**:
```
master_name: "Master-1"
account_number: 123456789
account_name: "Live Account"
token_type: "MASTER_TOKEN"
```

**Yanıt**:
```json
{
  "success": true,
  "message": "Master token oluşturuldu",
  "token": "a1b2c3d4...",
  "master_id": 1
}
```

#### Master Token Yenile

```
POST /admin/tokens.php?action=regenerate&type=master
```

**Parametreler**:
```
id: 1
```

**Yanıt**:
```json
{
  "success": true,
  "message": "Token yenilendi",
  "token": "z9y8x7w6..."
}
```

#### Client Token Listesi

```
GET /admin/tokens.php?action=list&type=client
```

**Yanıt**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "account_number": 987654321,
      "account_name": "Client Account",
      "auth_token": "f2e1d0c9...",
      "token_type": "CLIENT_TOKEN",
      "master_id": 1,
      "master_name": "Master-1",
      "status": "active"
    }
  ],
  "count": 1
}
```

#### Client Token Oluştur

```
POST /admin/tokens.php?action=create&type=client
```

**Parametreler**:
```
account_number: 987654321
account_name: "Client Account"
master_id: 1
token_type: "CLIENT_TOKEN"
```

**Yanıt**:
```json
{
  "success": true,
  "message": "Client token oluşturuldu",
  "token": "f2e1d0c9...",
  "client_id": 1
}
```

---

## 🔒 Güvenlik

### Token Güvenliği

1. **Benzersizlik**: Her token benzersiz ve 64 karakter uzunluğunda
2. **Şifreleme**: Tokenlar database'de düz metin olarak saklanır (HTTPS üzerinden iletilir)
3. **Yenileme**: Eski tokenlar silinebilir ve yenileri oluşturulabilir
4. **Logging**: Tüm token işlemleri kaydedilir

### Best Practices

1. **Token Paylaşma**: Tokenları kimseyle paylaşma
2. **Token Yenileme**: Düzenli olarak tokenları yenile
3. **HTTPS**: Her zaman HTTPS kullan
4. **Backup**: Tokenları güvenli bir yerde sakla
5. **Monitoring**: Token kullanımını düzenli olarak kontrol et

---

## 🧪 Test Adımları

### Test 1: Master Token Oluştur

1. Dashboard'a giriş yap
2. Token Yönetimi sayfasına git
3. Master Token oluştur
4. Token'ı kopyala
5. Master EA'nın `MasterToken` parametresine yapıştır
6. Master EA'yı başlat
7. Log'da başarı mesajı görülsün

### Test 2: Client Token Oluştur

1. Dashboard'a giriş yap
2. Token Yönetimi sayfasına git
3. Client Token oluştur
4. Token'ı kopyala
5. Client EA'nın `ClientToken` parametresine yapıştır
6. Client EA'yı başlat
7. Log'da başarı mesajı görülsün

### Test 3: Token Yenile

1. Dashboard'a giriş yap
2. Token Yönetimi sayfasına git
3. Mevcut token'ı yenile
4. Yeni token'ı kopyala
5. EA'nın parametresini güncelle
6. EA'yı yeniden başlat
7. Eski token artık çalışmaz

### Test 4: Otomatik Token Alma

1. Master EA'nın `AutoFetchToken: true` olduğundan emin ol
2. Master EA'yı başlat
3. Log'da "Master token fetched from Dashboard" mesajı görülsün
4. Client EA'nın `AutoFetchToken: true` olduğundan emin ol
5. Client EA'yı başlat
6. Log'da "Client token fetched from Dashboard" mesajı görülsün

---

## 🆘 Sorun Giderme

### Token Oluşturulamıyor

**Sorun**: "Token oluşturulamadı" hatası

**Çözüm**:
1. Database bağlantısını kontrol et
2. Masters tablosunun oluşturulduğundan emin ol
3. Hesap numarasının benzersiz olduğundan emin ol

### Token Alınamıyor

**Sorun**: "Failed to fetch token from Dashboard" hatası

**Çözüm**:
1. DashboardUrl'nin doğru olduğundan emin ol
2. Dashboard'a erişim sağlandığından emin ol
3. HTTPS sertifikasını kontrol et

### Token Çalışmıyor

**Sorun**: "Unauthorized" hatası

**Çözüm**:
1. Token'ın doğru olduğundan emin ol
2. Token'ın aktif olduğundan emin ol
3. Token'ın süresi dolmadığından emin ol

---

## 📞 Destek

Herhangi bir soru veya sorun için lütfen bildirin.

---

## 📄 Lisans

Copyright 2026, CopyPoz V5
