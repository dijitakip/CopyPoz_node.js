# CopyPoz V5 - Hybrid Architecture

**Versiyon**: 5.0  
**Tarih**: 12 Şubat 2026  
**Durum**: Phase 1 Tamamlandı, Phase 2 Başladı

---

## 📁 Klasör Yapısı

```
CopyPoz_V5/
├── Master/
│   └── CopyPoz_Master_V5.mq5          # Master EA (TCP Server) - Tek dosya!
├── Client/
│   └── CopyPoz_Client_V5.mq5          # Client EA (TCP Client) - Tek dosya!
└── README.md                          # Bu dosya
```

**Kurulum çok basit**: Sadece 2 dosya kopyala!

---

## 🚀 Hızlı Başlangıç

### Master EA Kurulumu (1 adım)

1. `CopyPoz_V5/Master/CopyPoz_Master_V5.mq5` dosyasını MetaTrader 5'e kopyala
2. EA'yı bir chart'a ekle
3. Parametreleri ayarla:
   - `Language`: TR (Türkçe) veya EN (İngilizce)
   - `LicenseKey`: DEMO (test için) veya lisans anahtarı
   - `TcpAddress`: 0.0.0.0:2000 (varsayılan)

### Client EA Kurulumu (1 adım)

1. `CopyPoz_V5/Client/CopyPoz_Client_V5.mq5` dosyasını MetaTrader 5'e kopyala
2. EA'yı bir chart'a ekle
3. Parametreleri ayarla:
   - `Language`: TR veya EN
   - `MasterAddress`: Master EA'nın IP:Port (örn: 192.168.1.100:2000)
   - `RegistrationToken`: Kayıt tokenı

**Hiç kütüphane dosyası gerekli değil!** Tüm kod EA dosyasının içinde.

---

## 🔧 Teknik Detaylar

### Master EA V5 Özellikleri

- **TCP Server**: 0.0.0.0:2000 adresinde dinliyor
- **Pozisyon Yayını**: 500ms aralığında tüm client'lara gönderiliyor
- **Web API**: 2 saniyede bir pozisyon güncellemesi
- **Komut İşleme**: 5 saniyede bir komut kontrolü
- **Lisans Sistemi**: DEMO, TRIAL, PRO, ENTERPRISE
- **Dil Desteği**: Türkçe, İngilizce

### Client EA V5 Özellikleri

- **TCP Client**: Master'a bağlanıyor
- **Pozisyon Senkronizasyonu**: 500ms aralığında
- **Web API Heartbeat**: 5 saniyede bir
- **Otomatik Yeniden Bağlanma**: 5 saniye aralığında
- **Komut İşleme**: Dashboard'dan komutları alıyor

---

## 📊 Lisans Sistemi

| Tür | Süre | Max Clients | Özellikler |
|-----|------|-------------|-----------|
| DEMO | Sınırsız | 5 | Test için |
| TRIAL | 30 gün | 5 | Temel özellikler |
| PRO | 1 yıl | 50 | Tüm özellikler |
| ENTERPRISE | Sınırsız | 1000 | Tüm özellikler + sınırsız |

**Lisans Anahtarı Formatı**: `COPYPOZ-TYPE-YEAR-HASH`
- Örnek: `COPYPOZ-TRIAL-2026-A1B2C3D4E5F6`
- Örnek: `COPYPOZ-PRO-2026-X9Y8Z7W6V5U4`

---

## 🌐 Web API Endpoints

### Master Endpoints

- `POST /api/signal.php` - Pozisyon güncellemesi
- `GET /api/master-command.php` - Komut alma
- `POST /api/license-check.php` - Lisans kontrolü

### Client Endpoints

- `POST /api/client.php` - Heartbeat ve kayıt
- `GET /api/client-command.php` - Komut alma

---

## 📝 Parametreler

### Master EA Parametreleri

```mql5
input string   Language          = "TR";                  // Dil
input string   LicenseKey        = "DEMO";               // Lisans
input string   TcpAddress        = "0.0.0.0:2000";       // TCP Adresi
input int      BroadcastInterval = 500;                  // Yayın aralığı (ms)
input bool     LogDetailed       = true;                 // Detaylı log
input bool     EnableWebMonitor  = true;                 // Web API aktif
input string   WebMonitorUrl     = "https://fx.haziroglu.com/api/signal.php";
input string   MasterToken       = "MASTER_SECRET_TOKEN_123";
input int      ConnectionTimeout = 60000;                // Timeout (ms)
```

### Client EA Parametreleri

```mql5
input string   Language          = "TR";                 // Dil
input string   RegistrationToken = "CLIENT_REG_TOKEN";   // Kayıt tokenı
input string   MasterAddress     = "127.0.0.1:2000";     // Master adresi
input int      ReconnectInterval = 5000;                 // Yeniden bağlanma (ms)
input bool     LogDetailed       = true;                 // Detaylı log
input bool     EnableWebMonitor  = true;                 // Web API aktif
input string   WebMonitorUrl     = "https://fx.haziroglu.com/api/client.php";
input string   ClientToken       = "CLIENT_SECRET_TOKEN_123";
input int      SyncInterval      = 500;                  // Senkronizasyon (ms)
```

---

## 🔄 Veri Akışı

### Master → Client (TCP)

```json
{
  "type": "POSITIONS_BROADCAST",
  "timestamp": 1234567890,
  "positions": [
    {
      "ticket": 123,
      "symbol": "EURUSD",
      "type": 0,
      "volume": 1.0,
      "price": 1.0850,
      "sl": 1.0800,
      "tp": 1.0900,
      "magic": 123456,
      "comment": "CPv5_123",
      "profit": 50.00
    }
  ]
}
```

### Master → Web API (HTTPS)

```json
{
  "positions": [
    {
      "ticket": 123,
      "symbol": "EURUSD",
      "type": 0,
      "volume": 1.0,
      "price": 1.0850,
      "sl": 1.0800,
      "tp": 1.0900,
      "magic": 123456,
      "comment": "CPv5_123",
      "profit": 50.00
    }
  ]
}
```

---

## 🎯 Komutlar

### Master Komutları

- `PAUSE` - Pozisyon yayınını durdur
- `RESUME` - Pozisyon yayınını devam ettir
- `CLOSE_ALL_BUY` - Tüm BUY pozisyonlarını kapat
- `CLOSE_ALL_SELL` - Tüm SELL pozisyonlarını kapat
- `CLOSE_ALL` - Tüm pozisyonları kapat

### Client Komutları

- `PAUSE` - Senkronizasyonu durdur
- `RESUME` - Senkronizasyonu devam ettir
- `CLOSE_ALL_BUY` - Tüm BUY pozisyonlarını kapat
- `CLOSE_ALL_SELL` - Tüm SELL pozisyonlarını kapat
- `CLOSE_ALL` - Tüm pozisyonları kapat

---

## 📋 Geliştirme Durumu

### Phase 1: Master EA V5 ✅
- [x] TCP Server Socket Implementation
- [x] Client Connection Management
- [x] Position Data Broadcasting
- [x] Position Update Triggers
- [x] Web API Integration
- [x] Master Command Processing
- [ ] Testing (Manuel)

### Phase 2: Client EA V5 🔄
- [x] TCP Client Socket Implementation
- [ ] Position Reception and Parsing
- [ ] Position Synchronization
- [ ] Web API Integration
- [ ] Client Command Processing
- [ ] Testing

### Phase 3: Web API Endpoints ⏳
- [ ] Position Endpoints
- [ ] Signal Endpoint
- [ ] Master Command Endpoints
- [ ] Client Endpoints

### Phase 4: Dashboard Updates ⏳
- [ ] Master Monitoring Interface
- [ ] Client Monitoring Interface
- [ ] Master Command Interface
- [ ] Client Command Interface
- [ ] Mobile Responsive Design

### Phase 5: Integration Testing ⏳
- [ ] End-to-End Testing
- [ ] Performance Testing
- [ ] Security Testing
- [ ] Load Testing

---

## 🐛 Sorun Giderme

### Master EA başlamıyor

1. Lisans anahtarını kontrol et
2. Port 2000'in açık olduğundan emin ol
3. Firewall ayarlarını kontrol et
4. Log dosyasını kontrol et

### Client Master'a bağlanamıyor

1. Master EA'nın çalıştığından emin ol
2. Master IP adresini kontrol et
3. Port 2000'in açık olduğundan emin ol
4. Firewall ayarlarını kontrol et

### Pozisyonlar senkronize olmuyor

1. Client EA'nın Master'a bağlı olduğundan emin ol
2. Magic number'ı kontrol et
3. Log dosyasını kontrol et

---

## 📞 İletişim

Herhangi bir soru veya sorun için lütfen bildirin.

---

## 📄 Lisans

Copyright 2026, CopyPoz V5

