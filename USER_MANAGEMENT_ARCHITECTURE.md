# CopyPoz V5 - Kullanıcı Yönetim Sistemi Mimarisi

**Tarih**: 12 Şubat 2026  
**Versiyon**: 1.0

---

## 🏗️ Sistem Mimarisi

```
┌─────────────────────────────────────────────────────────────────┐
│                      Web Dashboard                              │
│                                                                 │
│  user-management.php                                            │
│  ├─ Master Grupları Tab                                         │
│  ├─ Client Terminalleri Tab                                     │
│  └─ Kullanıcı Atamaları Tab                                     │
└────────────────┬────────────────────────────────────────────────┘
                 │
        ┌────────┴────────┬──────────────┐
        │                 │              │
        ▼                 ▼              ▼
   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
   │ master-      │ │ client-      │ │ tokens.php   │
   │ groups.php   │ │ management   │ │              │
   │              │ │ .php         │ │ (Token API)  │
   └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
          │                │                │
          └────────────────┼────────────────┘
                           │
                    ┌──────▼──────┐
                    │  Database   │
                    │             │
                    │ - users     │
                    │ - masters   │
                    │ - clients   │
                    │ - tokens    │
                    │ - audit_log │
                    └─────────────┘
```

---

## 📊 Veri Akışı

### Master Grubu Oluşturma

```
User Input
    ↓
user-management.php (UI)
    ↓
master-groups.php (API)
    ├─ Yetki Kontrolü
    ├─ Validasyon
    └─ Database İşlemi
        ├─ master_groups tablosuna ekle
        ├─ master_group_members tablosuna sahibi ekle
        └─ audit_logs tablosuna kaydet
    ↓
Başarı Mesajı
```

### Client Terminal Oluşturma

```
User Input
    ↓
user-management.php (UI)
    ↓
client-management.php (API)
    ├─ Yetki Kontrolü
    ├─ Validasyon
    ├─ Token Oluştur
    └─ Database İşlemi
        ├─ clients tablosuna ekle
        ├─ user_client_assignments tablosuna ekle
        └─ audit_logs tablosuna kaydet
    ↓
Token Göster
```

### Kullanıcı Token Ataması

```
User Input
    ↓
user-management.php (UI)
    ↓
client-management.php (API)
    ├─ Yetki Kontrolü
    ├─ Validasyon
    ├─ Token Oluştur
    └─ Database İşlemi
        ├─ user_tokens tablosuna ekle
        └─ audit_logs tablosuna kaydet
    ↓
Token Göster
```

---

## 🔐 İzin Kontrol Akışı

```
Request
    ↓
Kullanıcı Kimliği Kontrol
    ├─ Giriş yapılı mı?
    └─ Token geçerli mi?
    ↓
İşlem Türü Kontrol
    ├─ Admin İşlemi mi?
    ├─ Kendi Grubu mu?
    └─ Kendi Client'ı mı?
    ↓
Yetki Kontrol
    ├─ Rol Kontrol
    ├─ İzin Kontrol
    └─ Varlık Sahipliği Kontrol
    ↓
İşlem Yap veya Reddet
```

---

## 📋 Tablo İlişkileri

```
users (1) ──────────────────────────────────────────────────────────┐
  │                                                                  │
  ├─ (1:N) ──→ master_groups (owner_id)                             │
  │              │                                                  │
  │              ├─ (1:N) ──→ master_group_members (group_id)       │
  │              │              │                                   │
  │              │              └─ (N:1) ──→ users (user_id)        │
  │              │                                                  │
  │              └─ (1:N) ──→ masters (group_id)                    │
  │                                                                  │
  ├─ (1:N) ──→ clients (owner_id)                                   │
  │              │                                                  │
  │              ├─ (1:N) ──→ user_client_assignments (user_id)     │
  │              │              │                                   │
  │              │              └─ (N:1) ──→ users (user_id)        │
  │              │                                                  │
  │              └─ (1:N) ──→ user_tokens (client_id)               │
  │                             │                                   │
  │                             └─ (N:1) ──→ users (user_id)        │
  │                                                                  │
  └─ (1:N) ──→ audit_logs (user_id)
```

---

## 🔄 İş Akışları

### İş Akışı 1: Master Grubu Oluştur ve Yönet

```
1. Admin Giriş
   ↓
2. User Management → Master Grupları
   ↓
3. Grup Oluştur
   ├─ Grup Adı Gir
   ├─ Açıklama Gir
   └─ Max Client Sayısı Gir
   ↓
4. Grup Oluşturuldu
   ├─ Sahibi otomatik eklendi
   └─ Üyeler eklenebilir
   ↓
5. Grup Yönet
   ├─ Üye Ekle
   ├─ Üye Çıkar
   └─ Grup Sil
```

### İş Akışı 2: Client Terminal Oluştur ve Ata

```
1. Admin Giriş
   ↓
2. User Management → Client Terminalleri
   ↓
3. Terminal Oluştur
   ├─ Hesap Numarası Gir
   ├─ Hesap Adı Gir
   ├─ Master Grubu Seç
   └─ Token Tipi Seç
   ↓
4. Terminal Oluşturuldu
   ├─ Token Oluşturuldu
   └─ Token Gösterildi
   ↓
5. Kullanıcıya Ata
   ├─ Kullanıcı Seç
   └─ Atama Yap
   ↓
6. Atama Tamamlandı
   ├─ Kullanıcı Client'a erişebilir
   └─ Token Kullanıcıya Verilir
```

### İş Akışı 3: Kullanıcı Token Yönetimi

```
1. Admin Giriş
   ↓
2. User Management → Kullanıcı Atamaları
   ↓
3. Kullanıcı Token Ata
   ├─ Client Terminal Seç
   ├─ Kullanıcı Seç
   ├─ Token Tipi Seç
   └─ Süresi Dol Gir (İsteğe Bağlı)
   ↓
4. Token Oluşturuldu
   ├─ Token Gösterildi
   └─ Kullanıcıya Verildi
   ↓
5. Token Yönet
   ├─ Token Listele
   ├─ Token İptal Et
   └─ Token Yenile
```

---

## 🔐 Güvenlik Katmanları

### Katman 1: Kimlik Doğrulama
```
- Kullanıcı Giriş
- Session Kontrolü
- Token Geçerliliği
```

### Katman 2: Yetkilendirme
```
- Rol Kontrol
- İzin Kontrol
- Varlık Sahipliği Kontrol
```

### Katman 3: Veri Doğrulama
```
- Input Sanitizasyonu
- Tip Kontrolü
- Uzunluk Kontrolü
```

### Katman 4: Denetim
```
- İşlem Günlüğü
- Değişiklik Takibi
- IP Adresi Kaydı
```

---

## 📊 Rol Tabanlı Erişim Kontrolü (RBAC)

### Admin
```
✓ Tüm Master Grupları Yönet
✓ Tüm Client Terminalleri Yönet
✓ Tüm Kullanıcıları Yönet
✓ Tüm Tokenları Yönet
✓ Audit Log Görüntüle
```

### Master Owner
```
✓ Kendi Master Grubu Yönet
✓ Kendi Master Grubu Client'larını Yönet
✓ Kendi Master Grubu Kullanıcılarını Yönet
✓ Kendi Master Grubu Tokenlarını Yönet
✗ Diğer Grupları Yönet
```

### Manager
```
✓ Grup Üyelerini Yönet
✓ Client Terminalleri Yönet
✓ Kullanıcı Atamalarını Yönet
✗ Grup Oluştur/Sil
✗ Diğer Grupları Yönet
```

### Trader
```
✓ Atanan Client'ları Görüntüle
✓ Atanan Client'ların Tokenlarını Kullan
✗ Yeni Client Oluştur
✗ Kullanıcı Ata
```

### Viewer
```
✓ Sadece Görüntüle
✗ Hiçbir Değişiklik Yap
```

---

## 🔄 Token Yaşam Döngüsü

```
1. Token Oluştur
   ├─ Benzersiz 64 karakter token oluştur
   ├─ user_tokens tablosuna ekle
   └─ Kullanıcıya Göster
   ↓
2. Token Kullan
   ├─ EA'da Token Kullan
   ├─ Web API'ye Gönder
   └─ last_used Güncelle
   ↓
3. Token Yönet
   ├─ Token Listele
   ├─ Token Süresi Kontrol
   └─ Token İptal Et
   ↓
4. Token Sona Eriş
   ├─ Süresi Dol mı?
   ├─ Evet → Token İnaktif
   └─ Hayır → Token Aktif
   ↓
5. Token Sil
   ├─ Eski Token'ı Sil
   └─ Yeni Token Oluştur
```

---

## 📈 Ölçeklenebilirlik

### Tek Master Grubu
```
- 1 Master Owner
- 50 Client Terminal
- 10 Trader
- 500 Token
```

### Çoklu Master Grupları
```
- 5 Master Owner
- 250 Client Terminal
- 50 Trader
- 2500 Token
```

### Enterprise
```
- 100 Master Owner
- 5000 Client Terminal
- 1000 Trader
- 50000 Token
```

---

## 🔧 Teknik Detaylar

### Database İndeksleri

```sql
-- Master Groups
CREATE INDEX idx_master_groups_owner ON master_groups(owner_id);
CREATE INDEX idx_master_groups_status ON master_groups(status);

-- Master Group Members
CREATE INDEX idx_master_group_members_group ON master_group_members(group_id);
CREATE INDEX idx_master_group_members_user ON master_group_members(user_id);

-- User Client Assignments
CREATE INDEX idx_user_client_assignments_user ON user_client_assignments(user_id);
CREATE INDEX idx_user_client_assignments_client ON user_client_assignments(client_id);

-- User Tokens
CREATE INDEX idx_user_tokens_user ON user_tokens(user_id);
CREATE INDEX idx_user_tokens_client ON user_tokens(client_id);
CREATE INDEX idx_user_tokens_token ON user_tokens(token_value);
CREATE INDEX idx_user_tokens_status ON user_tokens(status);

-- Audit Logs
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
```

### API Response Format

```json
{
  "success": true,
  "message": "İşlem başarılı",
  "data": {
    "id": 1,
    "name": "Örnek"
  },
  "count": 1,
  "timestamp": "2026-02-12T10:30:00Z"
}
```

### Error Response Format

```json
{
  "success": false,
  "error": "Hata mesajı",
  "code": 400,
  "timestamp": "2026-02-12T10:30:00Z"
}
```

---

## 📞 Destek

Herhangi bir soru veya sorun için lütfen bildirin.

---

## 📄 Lisans

Copyright 2026, CopyPoz V5
