# CopyPoz V5 - Dashboard Hızlı Kurulum (20 dakika)

**Tarih**: 12 Şubat 2026  
**Versiyon**: 1.0

---

## ⚡ 5 Adımda Kurulum

### Adım 1: Database Oluştur (5 dakika)

**phpMyAdmin'de**:
1. cPanel → phpMyAdmin
2. "Import" Tab'ına tıkla
3. `Dashboard/database_complete.sql` dosyasını seç
4. "Go" butonuna tıkla
5. Bekleme... ✓

**Sonuç**:
- Database: `copypoz_v5` oluşturuldu
- 14 tablo oluşturuldu
- Admin kullanıcı oluşturuldu

---

### Adım 2: Dosyaları Yükle (5 dakika)

**FTP ile**:
1. FTP programı aç (FileZilla)
2. Web sunucusuna bağlan
3. `Dashboard` klasörünü yükle:
   ```
   /public_html/Dashboard/
   ```
4. Tüm dosyaların yüklendiğini kontrol et ✓

**Alternatif: cPanel File Manager**:
1. cPanel → File Manager
2. public_html klasörüne git
3. Upload → Dashboard klasörü ✓

---

### Adım 3: Database Konfigürasyonu (5 dakika)

**Dosya**: `Dashboard/config/db.php`

```php
<?php
define('DB_HOST', 'localhost');
define('DB_USER', 'copypoz_user');
define('DB_PASS', 'secure_password_123');
define('DB_NAME', 'copypoz_v5');

$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
if ($conn->connect_error) {
    die('Database connection failed: ' . $conn->connect_error);
}
$conn->set_charset('utf8mb4');
?>
```

**Database Kullanıcı Oluştur** (cPanel'de):
1. MySQL Databases
2. Create New User
3. Username: `copypoz_user`
4. Password: `secure_password_123`
5. Add User to Database
6. Tüm izinleri ver ✓

---

### Adım 4: Admin Giriş (2 dakika)

**Tarayıcıda**:
```
https://fx.haziroglu.com/Dashboard/index.php
```

**Giriş Bilgileri**:
```
Email: admin@copypoz.local
Password: admin123
```

**Giriş Yap** ✓

---

### Adım 5: Test Et (3 dakika)

**Dashboard Kontrol**:
1. Dashboard açılsın ✓
2. Master Grupları Tab → Grup Oluştur ✓
3. Client Terminalleri Tab → Terminal Oluştur ✓
4. Token Yönetimi → Token Oluştur ✓

---

## ✅ Kontrol Listesi

- [ ] Database oluşturuldu
- [ ] Dosyalar yüklendi
- [ ] db.php ayarlandı
- [ ] Database kullanıcı oluşturuldu
- [ ] Admin giriş başarılı
- [ ] Dashboard çalışıyor

---

## 🔑 Giriş Bilgileri

```
URL: https://fx.haziroglu.com/Dashboard/
Email: admin@copypoz.local
Password: admin123
```

---

## 📊 Oluşturulan Tablolar

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
```

---

## 🆘 Sorun Giderme

### "Database connection failed"
- db.php dosyasını kontrol et
- Database adını kontrol et
- Kullanıcı adını kontrol et
- Şifreyi kontrol et

### "Access denied"
- Database kullanıcı izinlerini kontrol et
- Şifreyi sıfırla

### "File not found"
- Dosyaların yüklendiğini kontrol et
- Dosya izinlerini kontrol et (755)

---

## 📞 Destek

Detaylı bilgi için `DASHBOARD_INSTALLATION.md` dosyasını oku.

---

**Başarılar!** 🎉
