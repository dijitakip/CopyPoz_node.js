# CopyPoz V5 - Kurulum Rehberi

## ⚡ Kurulum Çok Basit!

### Master EA Kurulumu

1. **Dosyayı kopyala**:
   - `CopyPoz_V5/Master/CopyPoz_Master_V5.mq5`
   - MetaTrader 5 → Experts klasörüne kopyala

2. **EA'yı yükle**:
   - MetaTrader 5'i yeniden başlat
   - Herhangi bir chart'a EA'yı ekle

3. **Parametreleri ayarla**:
   - `Language`: TR (Türkçe) veya EN (İngilizce)
   - `LicenseKey`: DEMO (test) veya lisans anahtarı
   - `TcpAddress`: 0.0.0.0:2000 (varsayılan)
   - `EnableWebMonitor`: true (Web API aktif)

4. **Bitti!** ✅

### Client EA Kurulumu

1. **Dosyayı kopyala**:
   - `CopyPoz_V5/Client/CopyPoz_Client_V5.mq5`
   - MetaTrader 5 → Experts klasörüne kopyala

2. **EA'yı yükle**:
   - MetaTrader 5'i yeniden başlat
   - Herhangi bir chart'a EA'yı ekle

3. **Parametreleri ayarla**:
   - `Language`: TR veya EN
   - `MasterAddress`: Master EA'nın IP:Port
     - Aynı bilgisayar: `127.0.0.1:2000`
     - Farklı bilgisayar: `192.168.1.100:2000` (örnek)
   - `RegistrationToken`: Kayıt tokenı
   - `EnableWebMonitor`: true (Web API aktif)

4. **Bitti!** ✅

---

## 🎯 Parametreler

### Master EA

| Parametre | Varsayılan | Açıklama |
|-----------|-----------|----------|
| Language | TR | Dil (TR/EN) |
| LicenseKey | DEMO | Lisans anahtarı |
| TcpAddress | 0.0.0.0:2000 | TCP server adresi |
| BroadcastInterval | 500 | Yayın aralığı (ms) |
| LogDetailed | true | Detaylı log |
| EnableWebMonitor | true | Web API aktif |
| WebMonitorUrl | https://fx.haziroglu.com/api/signal.php | Web API URL |
| MasterToken | MASTER_SECRET_TOKEN_123 | API tokenı |
| ConnectionTimeout | 60000 | Bağlantı timeout (ms) |

### Client EA

| Parametre | Varsayılan | Açıklama |
|-----------|-----------|----------|
| Language | TR | Dil (TR/EN) |
| RegistrationToken | CLIENT_REG_TOKEN | Kayıt tokenı |
| MasterAddress | 127.0.0.1:2000 | Master adresi |
| ReconnectInterval | 5000 | Yeniden bağlanma (ms) |
| ReceiveTimeout | 10000 | Veri alma timeout (ms) |
| LogDetailed | true | Detaylı log |
| EnableWebMonitor | true | Web API aktif |
| WebMonitorUrl | https://fx.haziroglu.com/api/client.php | Web API URL |
| ClientToken | CLIENT_SECRET_TOKEN_123 | API tokenı |
| SyncInterval | 500 | Senkronizasyon (ms) |

---

## 🔧 Sorun Giderme

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
2. Master IP adresini kontrol et
3. Port 2000'in açık olduğundan emin ol
4. Firewall ayarlarını kontrol et

### Pozisyonlar senkronize olmuyor

**Sorun**: Pozisyonlar açılmıyor

**Çözüm**:
1. Client EA'nın Master'a bağlı olduğundan emin ol
2. Magic number'ı kontrol et
3. Log dosyasını kontrol et

---

## 📋 Lisans Türleri

| Tür | Süre | Max Clients | Kullanım |
|-----|------|-------------|----------|
| DEMO | Sınırsız | 5 | Test |
| TRIAL | 30 gün | 5 | Deneme |
| PRO | 1 yıl | 50 | Profesyonel |
| ENTERPRISE | Sınırsız | 1000 | Kurumsal |

**Lisans Anahtarı Formatı**: `COPYPOZ-TYPE-YEAR-HASH`

Örnek:
- `COPYPOZ-TRIAL-2026-A1B2C3D4E5F6`
- `COPYPOZ-PRO-2026-X9Y8Z7W6V5U4`
- `COPYPOZ-ENTERPRISE-2026-M1N2O3P4Q5R6`

---

## ✅ Kontrol Listesi

- [ ] Master EA dosyasını kopyaladım
- [ ] Client EA dosyasını kopyaladım
- [ ] MetaTrader 5'i yeniden başlattım
- [ ] Master EA'yı bir chart'a ekledim
- [ ] Client EA'yı bir chart'a ekledim
- [ ] Parametreleri ayarladım
- [ ] Log dosyasında hata yok
- [ ] Master ve Client bağlı

---

## 🚀 Sonraki Adımlar

1. Test pozisyonları aç
2. Client EA'nın pozisyonları senkronize ettiğini kontrol et
3. Dashboard'dan komutları test et
4. Web API entegrasyonunu kontrol et

---

## 📞 Destek

Herhangi bir soru veya sorun için lütfen bildirin.

