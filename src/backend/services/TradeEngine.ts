import { prisma } from '../utils/db';
import { Decimal } from '@prisma/client/runtime/library';

export class TradeEngine {
  /**
   * Dinamik Lot Hesaplama (Volume Converter)
   * Master işlem hacmini, Master Bakiye / Client Bakiye oranına göre ölçeklendirir.
   * Ayrıca Master ve Client hesap türlerine (Cent / Standart) göre düzeltme yapar.
   */
  static calculateDynamicVolume(
    masterVolume: number,
    masterBalance: number,
    masterAccountType: 'standard' | 'cent',
    clientBalance: number,
    clientAccountType: 'standard' | 'cent',
    clientMultiplier: number = 1.0
  ): number {
    // 1. Hesap türlerine göre bakiyeleri aynı birime (Standart USD) çevir
    // Cent hesapta bakiye cent cinsinden geldiği için 100'e böleriz.
    const normalizedMasterBalance = masterAccountType === 'cent' ? masterBalance / 100 : masterBalance;
    const normalizedClientBalance = clientAccountType === 'cent' ? clientBalance / 100 : clientBalance;

    // Eğer Master bakiyesi 0 veya negatifse güvenli işlem için sabit bir oran kullan veya işlemi reddet.
    if (normalizedMasterBalance <= 0) return 0;

    // 2. Bakiye Oranını Bul (Client Balance / Master Balance)
    const balanceRatio = normalizedClientBalance / normalizedMasterBalance;

    // 3. Baz Hacmi Hesapla (Master Hacmi * Bakiye Oranı)
    // Örnek: Master 1000$ bakiye ile 1 lot açtı. Client 500$ bakiye. Oran = 0.5. Baz Hacim = 0.5 lot.
    let baseClientVolume = masterVolume * balanceRatio;

    // 4. Hesap türlerine göre hacmi dönüştür
    // Standart'tan Cent'e geçiş: 1 Standart Lot = 100 Cent Lot
    if (masterAccountType === 'standard' && clientAccountType === 'cent') {
      baseClientVolume *= 100;
    }
    // Cent'ten Standart'a geçiş: 100 Cent Lot = 1 Standart Lot
    else if (masterAccountType === 'cent' && clientAccountType === 'standard') {
      baseClientVolume /= 100;
    }

    // 5. Kullanıcı Özel Çarpanını Uygula
    let finalVolume = baseClientVolume * clientMultiplier;

    // 6. Minimum ve Maksimum Lot Kısıtlamaları (MetaTrader Standartları)
    // Forex için min lot genellikle 0.01'dir.
    if (finalVolume < 0.01) {
      finalVolume = 0.01;
    }

    // Yuvarlama: Hacmi en yakın 0.01 birimine yuvarla
    finalVolume = Math.round(finalVolume * 100) / 100;

    return finalVolume;
  }
}
