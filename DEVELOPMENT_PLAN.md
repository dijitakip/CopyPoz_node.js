# CopyPoz Geliştirme ve Entegrasyon Planı (Phases)

Bu belge, `AI Prompt` dosyasındaki Forex Copy Trading mimarisinin mevcut `CopyPoz` projesine entegre edilmesi için hazırlanan stratejik yol haritasını içerir.

---

## 🔐 Üyelik Sistemi Değerlendirmesi ve Öneri

Mevcut üyelik sisteminiz (Custom JWT + Cookies + Bcrypt) temel işlemler için yeterli olsa da, bir finans/trading platformu için daha yüksek güvenlik standartlarına ihtiyaç duyulacaktır.

**Öneri: NextAuth.js (Auth.js) Entegrasyonu**

*   **Neden?**: Next.js ile tam uyumludur. Oturum yönetimi (session management), CSRF koruması, güvenli cookie yönetimi ve OAuth (Google, MetaTrader login vb.) desteği hazır gelir.
*   **Avantajı**: Mevcut Prisma modellerinizle (User, Client) direkt çalışabilir. Şifre sıfırlama, 2FA (İki Faktörlü Doğrulama) gibi kritik özellikleri eklemek çok daha kolaydır.
*   **Karar**: Mevcut sistemi tamamen çöpe atmak yerine, NextAuth.js'e "Migrate" ederek profesyonel bir üyelik altyapısına geçilmelidir.

---

## 🚀 Faz 1: Güvenlik ve Risk Motoru (Temel Sağlamlaştırma)

Bu fazda sistemin "para kaybetmesini" önleyecek güvenlik katmanları eklenir.

1.  **Gelişmiş Risk Motoru (Risk Engine v2)**:
    *   `RiskEngine.ts`'e "Equity Protection" eklenmesi.
    *   Kullanıcı bazlı `Max Drawdown` (Maksimum Zarar) limiti kontrolü (Örn: %30 kayıpta işlemleri durdur).
2.  **Otomatik Panik Butonu**:
    *   Kritik durumlarda tüm Client işlemlerini tek tuşla veya otomatik kapatma (Close All Positions) mekanizması.
3.  **Slippage (Kayma) Kontrolü**:
    *   Master ve Client arasındaki fiyat farkını (latency) ölçen ve belirli bir pips değerini aşarsa işlemi reddeden yapı.

---

## 📈 Faz 2: Trading Engine ve Ölçeklendirme (Kopyalama Mantığı)

Bu fazda "Master -> Client" kopyalama akışı profesyonelleştirilir.

1.  **Dinamik Lot Scaling**:
    *   Client bakiyesine göre orantılı (proportional) lot hesaplama algoritmasının geliştirilmesi.
    *   Cent hesaplar için 100 kat çarpan kontrolünün Trade Engine'e gömülmesi.
2.  **Master Listener & WebSocket**:
    *   EA (Expert Advisor) üzerinden gelen verileri anlık yakalayan yüksek performanslı bir Listener servisi.
3.  **Multi-Server Desteği**:
    *   Farklı brokerlardaki hesapların (Exness, IC Markets vb.) aynı anda yönetilebilmesi.

---

## 💰 Faz 3: Gelir Yönetimi ve Kar Paylaşımı (Revenue Management)

Bu fazda sistemin "para kazanma" ve "tahsilat" süreçleri otomatize edilir.

1.  **Dinamik Kar Hesaplama (Profit Flow)**:
    *   Dönem sonu (aylık) otomatik kar/zarar raporlarının kesinleşmesi.
2.  **Fee Tahsilat Sistemi**:
    *   Kardan %50 (veya parametrik oran) sistem ücretinin Jeton (Token) bakiyesinden otomatik düşülmesi.
3.  **Teminat Güncelleme (Collateral Sync)**:
    *   Bakiye arttıkça %20 teminat miktarının otomatik güncellenmesi ve eksik teminat durumunda kopyalamanın durdurulması.

---

## 🖥️ Faz 4: Admin ve İzleme (Control Center)

Sistemin yönetilebilirliği ve şeffaflığı artırılır.

1.  **Master Trader Leaderboard**:
    *   Master hesapların performans skorları (Win Rate, Profit Factor, Drawdown) bazlı sıralanması.
2.  **Kullanıcı Dashboard Yenileme**:
    *   "Serbest Bakiye", "Gerekli Teminat" ve "Beklenen Ücret" grafiklerinin zenginleştirilmesi.
3.  **Log & Audit**:
    *   Her kopyalanan işlemin milisaniye bazlı loglanması (Hangi fiyattan açıldı, neden kapandı?).

---

## 🛠️ Takip ve Uygulama
Her faz tamamlandığında bir "Checkpoint" oluşturulacak ve testler (Unit & Integration) yapılacaktır. İlk adım olarak **Faz 1 (Risk Engine)** geliştirmelerine başlanması önerilir.
