# CopyPoz V5 - Integration Testing

**Tarih**: 12 Şubat 2026  
**Durum**: Test Senaryoları Hazır

---

## 🧪 Test Senaryoları

### Test 1: Master EA Başlatma
**Amaç**: Master EA'nın hatasız başlaması

**Adımlar**:
1. Master EA dosyasını MetaTrader 5'e kopyala
2. Herhangi bir chart'a ekle
3. Parametreleri ayarla (Language: TR, LicenseKey: DEMO)
4. EA'yı yükle

**Beklenen Sonuç**:
- ✅ EA hatasız başlasın
- ✅ Log'da "Master EA V5 Başarıyla Başlatıldı" mesajı
- ✅ TCP Server 0.0.0.0:2000'de dinliyor
- ✅ Lisans geçerli mesajı

**Başarı Kriteri**: Tüm mesajlar log'da görülsün

---

### Test 2: Client EA Başlatma
**Amaç**: Client EA'nın hatasız başlaması

**Adımlar**:
1. Client EA dosyasını MetaTrader 5'e kopyala
2. Farklı bir chart'a ekle
3. Parametreleri ayarla (Language: TR, MasterAddress: 127.0.0.1:2000)
4. EA'yı yükle

**Beklenen Sonuç**:
- ✅ EA hatasız başlasın
- ✅ Log'da "Client EA V5 Başarıyla Başlatıldı" mesajı
- ✅ Master'a bağlanmaya çalışsın
- ✅ Magic number oluşturulsun

**Başarı Kriteri**: Tüm mesajlar log'da görülsün

---

### Test 3: Master-Client TCP Bağlantısı
**Amaç**: Master ve Client arasında TCP bağlantısı kurulması

**Adımlar**:
1. Master EA çalışıyor
2. Client EA çalışıyor
3. 5 saniye bekle

**Beklenen Sonuç**:
- ✅ Client log'da "Master'a bağlandı" mesajı
- ✅ Master log'da "Yeni client bağlandı" mesajı
- ✅ Master log'da "Toplam client: 1" mesajı

**Başarı Kriteri**: Bağlantı kurulmuş olsun

---

### Test 4: Pozisyon Yayını
**Amaç**: Master'dan Client'a pozisyon yayını

**Adımlar**:
1. Master EA'da test pozisyonu aç (EURUSD BUY 1.0)
2. 1 saniye bekle
3. Client log'unu kontrol et

**Beklenen Sonuç**:
- ✅ Master log'da "Pozisyon yayını: 1 clients"
- ✅ Client log'da "Master'dan veri alındı: X bytes"
- ✅ Client log'da "Parsed 1 positions from Master"

**Başarı Kriteri**: Pozisyon verisi alınmış olsun

---

### Test 5: Pozisyon Senkronizasyonu
**Amaç**: Client'ın Master pozisyonlarını senkronize etmesi

**Adımlar**:
1. Master'da pozisyon açık
2. Client EA çalışıyor
3. 2 saniye bekle

**Beklenen Sonuç**:
- ✅ Client'da yeni pozisyon açılsın
- ✅ Client log'da "Position opened: EURUSD 1.0"
- ✅ Pozisyon comment'inde "CPv5_MT:" olsun

**Başarı Kriteri**: Pozisyon senkronize olmuş olsun

---

### Test 6: Pozisyon Güncelleme
**Amaç**: Master'da SL/TP değiştiğinde Client'da güncellenmesi

**Adımlar**:
1. Master'da açık pozisyon var
2. Client'da senkronize pozisyon var
3. Master'da SL/TP değiştir
4. 1 saniye bekle

**Beklenen Sonuç**:
- ✅ Client'da pozisyon SL/TP güncellenmesi
- ✅ Client log'da "Position modified"

**Başarı Kriteri**: SL/TP güncellenmiş olsun

---

### Test 7: Pozisyon Kapatma
**Amaç**: Master'da pozisyon kapatıldığında Client'da kapatılması

**Adımlar**:
1. Master'da açık pozisyon var
2. Client'da senkronize pozisyon var
3. Master'da pozisyonu kapat
4. 1 saniye bekle

**Beklenen Sonuç**:
- ✅ Client'da pozisyon kapatılsın
- ✅ Client log'da "Position closed"

**Başarı Kriteri**: Pozisyon kapatılmış olsun

---

### Test 8: Web API Heartbeat
**Amaç**: Client'ın Web API'ye heartbeat göndermesi

**Adımlar**:
1. Client EA çalışıyor
2. EnableWebMonitor: true
3. 6 saniye bekle
4. Dashboard'u kontrol et

**Beklenen Sonuç**:
- ✅ Client log'da "Web API'ye gönderiliyor"
- ✅ Client log'da "Auth token alındı"
- ✅ Dashboard'da client görülsün

**Başarı Kriteri**: Heartbeat gönderilmiş olsun

---

### Test 9: Master Komut - PAUSE
**Amaç**: Master'a PAUSE komutu gönderilmesi

**Adımlar**:
1. Master EA çalışıyor
2. Dashboard'dan PAUSE butonuna tıkla
3. 6 saniye bekle

**Beklenen Sonuç**:
- ✅ Master log'da "Komut alındı: PAUSE"
- ✅ Master log'da "Pozisyon yayını DURDURULDU"
- ✅ Pozisyon yayını durmuş olsun

**Başarı Kriteri**: Komut çalışmış olsun

---

### Test 10: Master Komut - RESUME
**Amaç**: Master'a RESUME komutu gönderilmesi

**Adımlar**:
1. Master PAUSE durumunda
2. Dashboard'dan RESUME butonuna tıkla
3. 6 saniye bekle

**Beklenen Sonuç**:
- ✅ Master log'da "Komut alındı: RESUME"
- ✅ Master log'da "Pozisyon yayını DEVAM ETTİRİLDİ"
- ✅ Pozisyon yayını devam etmiş olsun

**Başarı Kriteri**: Komut çalışmış olsun

---

### Test 11: Client Komut - PAUSE
**Amaç**: Client'a PAUSE komutu gönderilmesi

**Adımlar**:
1. Client EA çalışıyor
2. Dashboard'dan Client PAUSE butonuna tıkla
3. 6 saniye bekle

**Beklenen Sonuç**:
- ✅ Client log'da "Komut alındı: PAUSE"
- ✅ Client log'da "Senkronizasyon DURDURULDU"
- ✅ Senkronizasyon durmuş olsun

**Başarı Kriteri**: Komut çalışmış olsun

---

### Test 12: Client Komut - CLOSE_ALL
**Amaç**: Client'a CLOSE_ALL komutu gönderilmesi

**Adımlar**:
1. Client EA'da açık pozisyonlar var
2. Dashboard'dan Client CLOSE_ALL butonuna tıkla
3. 2 saniye bekle

**Beklenen Sonuç**:
- ✅ Client log'da "Komut alındı: CLOSE_ALL"
- ✅ Client log'da "Position closed" mesajları
- ✅ Tüm pozisyonlar kapatılmış olsun

**Başarı Kriteri**: Komut çalışmış olsun

---

### Test 13: Lisans Kontrolü
**Amaç**: Lisans sisteminin çalışması

**Adımlar**:
1. Master EA'da LicenseKey: DEMO
2. EA başlasın
3. Log'u kontrol et

**Beklenen Sonuç**:
- ✅ Log'da "Lisans geçerli"
- ✅ Log'da "License Type: TRIAL"
- ✅ Log'da "Days Left: 30"

**Başarı Kriteri**: Lisans doğrulanmış olsun

---

### Test 14: Dil Sistemi - Türkçe
**Amaç**: Türkçe dil desteğinin çalışması

**Adımlar**:
1. Master EA'da Language: TR
2. EA başlasın
3. Log'u kontrol et

**Beklenen Sonuç**:
- ✅ Log'da Türkçe mesajlar
- ✅ "Master EA V5 Başarıyla Başlatıldı"
- ✅ "Lisans geçerli"

**Başarı Kriteri**: Türkçe mesajlar görülsün

---

### Test 15: Dil Sistemi - İngilizce
**Amaç**: İngilizce dil desteğinin çalışması

**Adımlar**:
1. Master EA'da Language: EN
2. EA başlasın
3. Log'u kontrol et

**Beklenen Sonuç**:
- ✅ Log'da İngilizce mesajlar
- ✅ "Master EA V5 Started Successfully"
- ✅ "License valid"

**Başarı Kriteri**: İngilizce mesajlar görülsün

---

## 📊 Performance Testing

### Test 16: Pozisyon Yayını Hızı
**Amaç**: Pozisyon yayınının 500ms'de tamamlanması

**Adımlar**:
1. Master'da 10 pozisyon aç
2. Yayın zamanını ölç
3. 10 kez tekrarla

**Beklenen Sonuç**:
- ✅ Ortalama yayın süresi < 100ms
- ✅ Tüm pozisyonlar alınsın

**Başarı Kriteri**: Yayın hızı < 100ms

---

### Test 17: Web API Yanıt Süresi
**Amaç**: Web API'nin 1 saniyede yanıt vermesi

**Adımlar**:
1. Client heartbeat gönder
2. Yanıt zamanını ölç
3. 10 kez tekrarla

**Beklenen Sonuç**:
- ✅ Ortalama yanıt süresi < 500ms
- ✅ Hiç timeout yok

**Başarı Kriteri**: Yanıt süresi < 500ms

---

### Test 18: Concurrent Clients
**Amaç**: 5 concurrent client'ın çalışması

**Adımlar**:
1. Master EA çalışıyor
2. 5 Client EA başlat
3. 30 saniye çalıştır

**Beklenen Sonuç**:
- ✅ Tüm client'lar bağlı
- ✅ Hiç hata yok
- ✅ Pozisyonlar senkronize

**Başarı Kriteri**: 5 client başarıyla çalışsın

---

## 🔒 Security Testing

### Test 19: Token Validation
**Amaç**: Geçersiz token'ın reddedilmesi

**Adımlar**:
1. Geçersiz token ile API çağrısı yap
2. Yanıtı kontrol et

**Beklenen Sonuç**:
- ✅ 401 Unauthorized yanıtı
- ✅ Hata mesajı

**Başarı Kriteri**: Geçersiz token reddedilsin

---

### Test 20: Access Control
**Amaç**: Yetkisiz kullanıcının işlem yapamaması

**Adımlar**:
1. Trader'ın admin işlemi yapmasını dene
2. Yanıtı kontrol et

**Beklenen Sonuç**:
- ✅ 403 Forbidden yanıtı
- ✅ Hata mesajı

**Başarı Kriteri**: Yetkisiz işlem reddedilsin

---

## ✅ Test Sonuçları

| Test | Durum | Notlar |
|------|-------|--------|
| 1 | ⏳ | Master EA başlatma |
| 2 | ⏳ | Client EA başlatma |
| 3 | ⏳ | TCP bağlantısı |
| 4 | ⏳ | Pozisyon yayını |
| 5 | ⏳ | Pozisyon senkronizasyonu |
| 6 | ⏳ | Pozisyon güncelleme |
| 7 | ⏳ | Pozisyon kapatma |
| 8 | ⏳ | Web API heartbeat |
| 9 | ⏳ | Master PAUSE komutu |
| 10 | ⏳ | Master RESUME komutu |
| 11 | ⏳ | Client PAUSE komutu |
| 12 | ⏳ | Client CLOSE_ALL komutu |
| 13 | ⏳ | Lisans kontrolü |
| 14 | ⏳ | Türkçe dil |
| 15 | ⏳ | İngilizce dil |
| 16 | ⏳ | Pozisyon yayını hızı |
| 17 | ⏳ | Web API yanıt süresi |
| 18 | ⏳ | Concurrent clients |
| 19 | ⏳ | Token validation |
| 20 | ⏳ | Access control |

---

## 📝 Notlar

- Tüm testler manuel olarak yapılmalıdır
- Her test başarılı olmalıdır
- Hata durumunda log'lar kontrol edilmeli
- Performance testleri birden fazla kez yapılmalı

---

## 📞 İletişim

Herhangi bir soru veya sorun için lütfen bildirin.

