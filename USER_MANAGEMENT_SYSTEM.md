# CopyPoz V5 - Kullanıcı Yönetim Sistemi

**Tarih**: 12 Şubat 2026  
**Versiyon**: 1.0

---

## 📋 Genel Bakış

Kullanıcı yönetim sistemi, Master Grupları, Client Terminalleri ve Kullanıcı Atamalarını merkezi olarak yönetir. Her kullanıcı birden çok Client Terminal'e erişebilir ve her Client Terminal'e kullanıcı bazlı token atanabilir.

---

## 🏗️ Sistem Mimarisi

```
┌─────────────────────────────────────────────────────────────┐
│                    Admin Kullanıcı                          │
│                                                             │
│  User Management Dashboard (user-management.php)           │
│  ├─ Master Grupları Yönetimi                               │
│  ├─ Client Terminalleri Yönetimi                           │
│  └─ Kullanıcı Atamaları Yönetimi                           │
└────────────────┬────────────────────────────────────────────┘
                 │
        ┌────────┴────────┬──────────────┐
        │                 │              │
        ▼                 ▼              ▼
   ┌─────────┐      ┌──────────┐   ┌──────────┐
   │ Master  │      │ Client   │   │ User     │
   │ Groups  │      │ Terminals│   │ Tokens   │
   └─────────┘      └──────────┘   └──────────┘
        │                 │              │
        └────────────────┬┴──────────────┘
                         │
                    Database
```

---

## 📊 Veri Modeli

### Master Groups (Master Grupları)

```
master_groups
├── id (PK)
├── group_name (Grup Adı)
├── owner_id (FK → users)
├── description (Açıklama)
├── status (active/inactive)
├── max_clients (Max Client Sayısı)
├── created_at
└── updated_at
```

**Örnek**:
```
ID: 1
Grup Adı: Grup-1
Sahibi: admin
Açıklama: Birinci Master Grubu
Max Client: 50
Durum: active
```

### Client Terminals (Client Terminalleri)

```
clients
├── id (PK)
├── account_number (Hesap Numarası)
├── account_name (Hesap Adı)
├── auth_token (Token)
├── token_type (CLIENT_TOKEN/TRADER_TOKEN)
├── master_id (FK → masters)
├── owner_id (FK → users)
├── assigned_to_user_id (FK → users)
├── status (active/paused/disconnected)
├── balance
├── equity
├── open_positions
├── created_at
└── updated_at
```

**Örnek**:
```
ID: 1
Hesap Numarası: 987654321
Hesap Adı: Client Account
Sahibi: trader1
Atanan Kullanıcı: trader2
Durum: active
```

### User Client Assignments (Kullanıcı Atamaları)

```
user_client_assignments
├── id (PK)
├── user_id (FK → users)
├── client_id (FK → clients)
├── assigned_by (FK → users)
├── assignment_date
└── status (active/inactive)
```

**Örnek**:
```
Kullanıcı: trader2
Client: 987654321
Atayan: admin
Durum: active
```

### User Tokens (Kullanıcı Tokenları)

```
user_tokens
├── id (PK)
├── user_id (FK → users)
├── client_id (FK → clients)
├── token_value (Token)
├── token_type (CLIENT_TOKEN/TRADER_TOKEN)
├── status (active/inactive)
├── created_by (FK → users)
├── created_at
├── expires_at
└── last_used
```

**Örnek**:
```
Kullanıcı: trader2
Client: 987654321
Token: a1b2c3d4e5f6...
Tipi: CLIENT_TOKEN
Durum: active
Süresi Dol: 2026-12-31
```

### Master Group Members (Master Grubu Üyeleri)

```
master_group_members
├── id (PK)
├── group_id (FK → master_groups)
├── user_id (FK → users)
├── role (owner/manager/trader/viewer)
├── added_by (FK → users)
└── added_at
```

---

## 🔐 İzin Sistemi

### Roller

| Rol | Master Grubu | Client Terminal | Token |
|-----|--------------|-----------------|-------|
| Admin | Tümü Yönet | Tümü Yönet | Tümü Yönet |
| Master Owner | Kendi Grubu | Kendi Grubu | Kendi Grubu |
| Manager | Grup Üyeleri | Grup Üyeleri | Grup Üyeleri |
| Trader | Atanan Terminal | Atanan Terminal | Atanan Terminal |
| Viewer | Sadece Görüntüle | Sadece Görüntüle | Sadece Görüntüle |

### İzin Kontrolleri

1. **Master Grubu Oluştur**: Admin veya Master Owner
2. **Master Grubu Güncelle**: Grup Sahibi
3. **Master Grubu Sil**: Grup Sahibi
4. **Grup Üyesi Ekle**: Grup Sahibi
5. **Client Terminal Oluştur**: Admin veya Master Owner
6. **Client Terminal'e Kullanıcı Ata**: Client Sahibi
7. **Kullanıcı Token Ata**: Client Sahibi

---

## 🛠️ Kullanım Senaryoları

### Senaryo 1: Master Owner Grubu Oluştur

```
1. Admin → User Management
2. Master Grupları Tab
3. Grup Adı: "Grup-1"
4. Açıklama: "Birinci Master Grubu"
5. Max Client: 50
6. "Grup Oluştur" butonuna tıkla
7. Grup oluşturuldu, sahibi otomatik olarak eklendi
```

### Senaryo 2: Client Terminal Oluştur

```
1. Admin → User Management
2. Client Terminalleri Tab
3. Hesap Numarası: 987654321
4. Hesap Adı: "Client Account"
5. Master Grubu: "Grup-1"
6. Token Tipi: CLIENT_TOKEN
7. "Terminal Oluştur" butonuna tıkla
8. Terminal oluşturuldu, token gösterildi
```

### Senaryo 3: Kullanıcıya Client Terminal Ata

```
1. Admin → User Management
2. Kullanıcı Atamaları Tab
3. Client Terminal: "987654321"
4. Kullanıcı: "trader2"
5. "Kullanıcı Ata" butonuna tıkla
6. trader2 artık bu client'a erişebilir
```

### Senaryo 4: Kullanıcıya Token Ata

```
1. Admin → User Management
2. Kullanıcı Atamaları Tab
3. Client Terminal: "987654321"
4. Kullanıcı: "trader2"
5. Token Tipi: CLIENT_TOKEN
6. Süresi Dol: 2026-12-31
7. "Token Ata" butonuna tıkla
8. Token oluşturuldu ve gösterildi
```

---

## 📝 API Endpoints

### Master Groups API

**Dosya**: `Dashboard/admin/master-groups.php`

#### Master Grupları Listele

```
GET /admin/master-groups.php?action=list&role=all
```

**Parametreler**:
- `role`: all, owner, member

**Yanıt**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "group_name": "Grup-1",
      "owner_id": 1,
      "description": "Birinci Master Grubu",
      "status": "active",
      "max_clients": 50
    }
  ],
  "count": 1
}
```

#### Master Grubu Oluştur

```
POST /admin/master-groups.php?action=create
```

**Parametreler**:
```
group_name: "Grup-1"
description: "Birinci Master Grubu"
max_clients: 50
```

#### Master Grubu Güncelle

```
POST /admin/master-groups.php?action=update
```

**Parametreler**:
```
id: 1
group_name: "Grup-1 Güncellenmiş"
description: "Güncellenmiş açıklama"
max_clients: 100
```

#### Master Grubu Sil

```
POST /admin/master-groups.php?action=delete
```

**Parametreler**:
```
id: 1
```

#### Grup Üyesi Ekle

```
POST /admin/master-groups.php?action=add_member
```

**Parametreler**:
```
group_id: 1
user_id: 2
role: trader
```

#### Grup Üyesi Çıkar

```
POST /admin/master-groups.php?action=remove_member
```

**Parametreler**:
```
group_id: 1
user_id: 2
```

### Client Management API

**Dosya**: `Dashboard/admin/client-management.php`

#### Client Terminalleri Listele

```
GET /admin/client-management.php?action=list&filter=all
```

**Parametreler**:
- `filter`: all, assigned, unassigned

#### Client Terminal Oluştur

```
POST /admin/client-management.php?action=create
```

**Parametreler**:
```
account_number: 987654321
account_name: "Client Account"
master_id: 1
token_type: CLIENT_TOKEN
```

#### Client Terminal'e Kullanıcı Ata

```
POST /admin/client-management.php?action=assign_user
```

**Parametreler**:
```
client_id: 1
user_id: 2
```

#### Kullanıcı Token Ata

```
POST /admin/client-management.php?action=assign_token
```

**Parametreler**:
```
client_id: 1
user_id: 2
token_type: CLIENT_TOKEN
expires_at: 2026-12-31 23:59:59
```

**Yanıt**:
```json
{
  "success": true,
  "message": "Kullanıcı token atandı",
  "token": "a1b2c3d4e5f6...",
  "token_id": 1
}
```

#### Kullanıcı Tokenlarını Listele

```
GET /admin/client-management.php?action=user_tokens&user_id=2
```

#### Kullanıcı Token'i İptal Et

```
POST /admin/client-management.php?action=revoke_token
```

**Parametreler**:
```
token_id: 1
```

---

## 🔒 Güvenlik Özellikleri

✅ Rol tabanlı erişim kontrolü (RBAC)  
✅ Kullanıcı bazlı token yönetimi  
✅ Token süresi dolma  
✅ Token iptal etme  
✅ İşlem günlüğü  
✅ Yetki kontrolü  
✅ Benzersiz token  

---

## 📊 Audit Log

Tüm işlemler `audit_logs` tablosuna kaydedilir:

```
audit_logs
├── id (PK)
├── user_id (İşlemi yapan kullanıcı)
├── action (İşlem türü)
├── entity_type (Varlık türü)
├── entity_id (Varlık ID)
├── old_value (Eski değer)
├── new_value (Yeni değer)
├── ip_address (IP Adresi)
├── user_agent (User Agent)
└── created_at (İşlem zamanı)
```

**Örnek**:
```
Kullanıcı: admin
İşlem: CLIENT_ASSIGN_USER
Varlık: Client ID 1
Yeni Değer: User ID 2 atandı
IP: 192.168.1.100
Zaman: 2026-02-12 10:30:00
```

---

## 🧪 Test Senaryoları

### Test 1: Master Grubu Oluştur

1. Admin olarak giriş yap
2. User Management → Master Grupları
3. Grup Adı: "Test-Grup"
4. "Grup Oluştur" butonuna tıkla
5. Grup oluşturuldu mesajı görülsün

### Test 2: Client Terminal Oluştur

1. User Management → Client Terminalleri
2. Hesap Numarası: 123456789
3. Master Grubu: "Test-Grup"
4. "Terminal Oluştur" butonuna tıkla
5. Terminal oluşturuldu ve token gösterildi

### Test 3: Kullanıcıya Client Ata

1. User Management → Kullanıcı Atamaları
2. Client Terminal: "123456789"
3. Kullanıcı: "trader1"
4. "Kullanıcı Ata" butonuna tıkla
5. Kullanıcı atandı mesajı görülsün

### Test 4: Kullanıcıya Token Ata

1. User Management → Kullanıcı Atamaları
2. Client Terminal: "123456789"
3. Kullanıcı: "trader1"
4. Token Tipi: CLIENT_TOKEN
5. "Token Ata" butonuna tıkla
6. Token oluşturuldu ve gösterildi

---

## 🆘 Sorun Giderme

### Kullanıcı Client'a Erişemiyor

**Sorun**: "Yetkiniz yok" hatası

**Çözüm**:
1. Kullanıcının Client'a atandığından emin ol
2. Atama durumunun "active" olduğundan emin ol
3. Token'ın aktif olduğundan emin ol

### Token Süresi Dolmuş

**Sorun**: "Token expired" hatası

**Çözüm**:
1. Yeni token ata
2. Eski token'ı iptal et
3. EA'da yeni token'ı kullan

### Grup Üyesi Eklenemedi

**Sorun**: "Üye eklenemedi" hatası

**Çözüm**:
1. Kullanıcının var olduğundan emin ol
2. Kullanıcının zaten grup üyesi olmadığından emin ol
3. Yetkinizin olduğundan emin ol

---

## 📞 Destek

Herhangi bir soru veya sorun için lütfen bildirin.

---

## 📄 Lisans

Copyright 2026, CopyPoz V5
