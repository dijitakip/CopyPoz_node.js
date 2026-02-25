# CopyPoz V5 - MetaTrader Testing Guide

## Testing Ortamı Kurulumu

### 1. Gereksinimler

- MetaTrader 5 (MT5)
- Windows 10/11
- CopyPoz V5 Web Application (localhost:3000)
- MySQL Database (Docker veya Local)

### 2. Web Application Hazırlığı

Web application'ın çalışıp çalışmadığını kontrol edin:

```bash
# Terminal 1: Dev server çalışıyor mu?
npm run dev

# Terminal 2: Health check
curl http://localhost:3000/api/health
```

Beklenen response:
```json
{
  "status": "ok",
  "timestamp": "2026-02-25T..."
}
```

### 3. MetaTrader 5 Kurulumu

#### Step 1: MT5 Açın
- MetaTrader 5'i açın
- Demo veya Real account seçin

#### Step 2: Expert Advisor'ı Yükleyin
1. File → Open Data Folder
2. MQL5 → Experts klasörüne gidin
3. `CopyPoz_Client_V5.mq5` dosyasını kopyalayın
4. MetaTrader'ı restart edin

#### Step 3: EA Parametrelerini Ayarlayın

MetaTrader'da:
1. Navigator → Expert Advisors
2. CopyPoz_Client_V5 üzerine çift tıklayın
3. Inputs sekmesine gidin

**Önemli Parametreler:**

| Parameter | Value | Açıklama |
|-----------|-------|----------|
| Language | TR | Türkçe mesajlar |
| MasterAddress | 127.0.0.1:2000 | Local master (opsiyonel) |
| ReconnectInterval | 5000 | Yeniden bağlanma aralığı (ms) |
| ReceiveTimeout | 10000 | Timeout süresi (ms) |
| LogDetailed | true | Detaylı loglar |
| LogVerbose | false | Debug logları |

#### Step 4: EA'yı Aktif Edin

1. Chart'ı seçin (örn: EURUSD, H1)
2. Navigator → Expert Advisors → CopyPoz_Client_V5
3. Sürükle-bırak ile chart'a ekle
4. "Allow live trading" checkbox'ını işaretle
5. OK'ye tıkla

### 4. Testing Senaryoları

#### Test 1: Web API Bağlantısı

**Amaç**: Client EA'nın web API'ye bağlanabildiğini test et

**Adımlar**:
1. EA'yı chart'a ekle
2. Expert tab'ında logları izle
3. "Web API'ye gönderiliyor" mesajını bekle

**Beklenen Sonuç**:
```
[INFO] Web API'ye gönderiliyor
[INFO] Web API Başarılı
[INFO] Client ID: 1
[INFO] Auth Token: abc123...
```

**Başarısızlık Durumunda**:
- `.env` dosyasında DATABASE_URL kontrol et
- MySQL'in çalışıp çalışmadığını kontrol et
- Firewall ayarlarını kontrol et

#### Test 2: Heartbeat Gönderimi

**Amaç**: Client EA'nın düzenli heartbeat gönderdiğini test et

**Adımlar**:
1. EA'yı 5 dakika çalıştır
2. Web dashboard'a git: http://localhost:3000/dashboard
3. "Connected Clients" tablosunu kontrol et

**Beklenen Sonuç**:
- Client account'u tabloda görünür
- Balance ve Equity güncellenmiş
- Last Seen zamanı güncel

#### Test 3: Command Gönderimi

**Amaç**: Web dashboard'dan EA'ya command gönderilebildiğini test et

**Adımlar**:
1. Dashboard'da Admin → Commands'a git
2. Client'ı seç
3. Command gönder (örn: "PAUSE")
4. EA'nın loglarını izle

**Beklenen Sonuç**:
```
[INFO] Command alındı: PAUSE
[INFO] Senkronizasyon DURDURULDU
```

#### Test 4: Position Senkronizasyonu

**Amaç**: Açık pozisyonların senkronize edildiğini test et

**Adımlar**:
1. MT5'te manuel olarak bir pozisyon aç
2. EA'nın loglarını izle
3. Dashboard'da Master Positions'ı kontrol et

**Beklenen Sonuç**:
- Position dashboard'da görünür
- Position details doğru
- Real-time update çalışıyor

#### Test 5: Error Handling

**Amaç**: Hata durumlarında EA'nın düzgün davrandığını test et

**Adımlar**:
1. MySQL'i durdur
2. EA'nın loglarını izle
3. MySQL'i yeniden başlat

**Beklenen Sonuç**:
```
[ERROR] Database bağlantı hatası
[INFO] Yeniden bağlanmaya çalışılıyor...
[INFO] Bağlantı başarılı
```

### 5. Performance Testing

#### Test 6: Load Test

**Amaç**: Sistemin yüksek load altında performansını test et

**Adımlar**:
1. Birden fazla MT5 instance açın
2. Her birine CopyPoz EA'sını ekle
3. Dashboard'da tüm client'ları izle

**Beklenen Sonuç**:
- Tüm client'lar bağlı
- Response time < 500ms
- Database connection pool çalışıyor

#### Test 7: Network Latency

**Amaç**: Ağ gecikmesinin etkisini test et

**Adımlar**:
1. Network throttling aktif et (Chrome DevTools)
2. Slow 3G seç
3. EA'nın davranışını izle

**Beklenen Sonuç**:
- EA timeout'a girmez
- Reconnect mekanizması çalışıyor
- Data loss yok

### 6. Logging ve Debugging

#### EA Loglarını Görüntüle

MetaTrader'da:
1. View → Toolbox
2. Expert tab'ını seç
3. Logları izle

#### Web Application Loglarını Görüntüle

Terminal'de:
```bash
# Dev server logları
npm run dev

# Database logları
docker logs copypoz_mysql
```

#### Database Queries'i Kontrol Et

```bash
# Prisma Studio açın
npx prisma studio

# Clients tablosunu kontrol et
# CommandQueue tablosunu kontrol et
# SystemLogs tablosunu kontrol et
```

### 7. Test Checklist

- [ ] Web API bağlantısı çalışıyor
- [ ] Heartbeat düzenli gönderiliyor
- [ ] Commands alınıp işleniyor
- [ ] Positions senkronize ediliyor
- [ ] Error handling çalışıyor
- [ ] Performance acceptable
- [ ] Logging detaylı
- [ ] Database queries optimize
- [ ] Memory leak yok
- [ ] CPU usage normal

### 8. Sorun Giderme

#### EA Bağlanmıyor

```
[ERROR] Web API'ye bağlanılamadı
```

**Çözüm**:
1. Web server çalışıyor mu? `npm run dev`
2. DATABASE_URL doğru mu? `.env` kontrol et
3. MySQL çalışıyor mu? `docker ps`
4. Firewall engel mi? Port 3000 açık mı?

#### Heartbeat Gönderilmiyor

```
[ERROR] Heartbeat gönderimi başarısız
```

**Çözüm**:
1. Network bağlantısı var mı?
2. API endpoint çalışıyor mu? `curl http://localhost:3000/api/client/heartbeat`
3. EA parametreleri doğru mu?

#### Position Senkronize Edilmiyor

```
[ERROR] Position senkronizasyonu başarısız
```

**Çözüm**:
1. Açık pozisyon var mı?
2. Database'de CommandQueue tablosu var mı?
3. Prisma migrations çalıştırıldı mı?

### 9. Production Testing Checklist

Hostinger'a deploy etmeden önce:

- [ ] Tüm test senaryoları başarılı
- [ ] Performance acceptable
- [ ] Error handling robust
- [ ] Logging detaylı
- [ ] Database backup çalışıyor
- [ ] SSL/TLS hazır
- [ ] Environment variables güvenli
- [ ] Rate limiting yapılandırıldı
- [ ] Monitoring kuruldu
- [ ] Disaster recovery plan hazır

### 10. Deployment Sonrası Testing

Hostinger'a deploy ettikten sonra:

1. Health check: `curl https://yourdomain.com/api/health`
2. Login test: Web dashboard'a giriş yap
3. EA bağlantısı: MT5'te EA'yı ekle ve logları izle
4. Performance: Dashboard'da response time kontrol et
5. Monitoring: Error logs kontrol et

---

## Useful Commands

```bash
# Web server başlat
npm run dev

# Database browser aç
npx prisma studio

# Database logs
docker logs copypoz_mysql

# Database bağlantısını test et
mysql -u root -prootpass123 -h 127.0.0.1 -e "SELECT 1"

# API health check
curl http://localhost:3000/api/health

# Client heartbeat test
curl -X POST http://localhost:3000/api/client/heartbeat \
  -H "Content-Type: application/json" \
  -d '{
    "account_number": 12345,
    "account_name": "Test Account",
    "balance": 10000,
    "equity": 10000,
    "open_positions": 0
  }'
```

---

**Version**: 1.0
**Last Updated**: 2026-02-25
**Status**: Ready for Testing
