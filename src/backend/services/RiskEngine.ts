import { prisma } from '../utils/db';
import { Decimal } from '@prisma/client/runtime/library';

export class RiskEngine {
  /**
   * Check Real-Time Equity Protection (Panic Button Trigger)
   * Eğer anlık equity, ayarlanan maksimum drawdown (kayıp) limitini aşarsa tüm işlemleri durdur.
   */
  static async checkEquityProtection(clientId: number) {
    const client = await prisma.client.findUnique({
      where: { id: clientId }
    });

    if (!client || client.status !== 'active') return { triggered: false };

    // Eğer equity <= 0 ise hesap patlamıştır.
    if (client.equity.lte(0)) {
      await this.triggerPanic(clientId, 'Equity reached 0 or below (Margin Call).');
      return { triggered: true, reason: 'Margin Call' };
    }

    // Kullanıcının belirlediği bir maksimum DD limiti yoksa %30 varsayalım
    // Şimdilik schema'da max_drawdown (geçmişi tutan) var ama kullanıcı limiti için hardcode %30 kullanabiliriz 
    // veya ileride client tablosuna `equity_protection_percent` eklenebilir.
    const maxAllowedDrawdownPercent = new Decimal(30); 

    // Drawdown Hesaplama: ((Balance - Equity) / Balance) * 100
    if (client.balance.gt(0) && client.balance.gt(client.equity)) {
      const currentDrawdown = client.balance.sub(client.equity).div(client.balance).mul(100);
      
      if (currentDrawdown.gte(maxAllowedDrawdownPercent)) {
        await this.triggerPanic(clientId, `Drawdown limit reached: ${currentDrawdown.toFixed(2)}% (Max allowed: ${maxAllowedDrawdownPercent}%)`);
        return { triggered: true, reason: 'Drawdown Limit Exceeded', currentDrawdown };
      }
    }

    return { triggered: false };
  }

  /**
   * Trigger Panic Button for a Client
   * İşlemleri kopyalamayı durdurur ve acil kapatma emri kuyruğa ekler.
   */
  static async triggerPanic(clientId: number, reason: string) {
    // 1. Client statüsünü pasife çek (Kopyalamayı durdur)
    await prisma.client.update({
      where: { id: clientId },
      data: { status: 'inactive' }
    });

    // 2. Tüm açık pozisyonları kapatmak için kuyruğa acil komut ekle
    await prisma.commandQueue.create({
      data: {
        client_id: clientId,
        command_type: 'CLOSE_ALL',
        parameters: { reason, urgency: 'HIGH' },
        status: 'pending'
      }
    });

    console.warn(`[PANIC TRIGGERED] Client ID: ${clientId} - Reason: ${reason}`);
  }

  /**
   * Calculate risk score and suggest multiplier based on performance history
   */
  static async analyzeClient(clientId: number) {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        performance_logs: {
          orderBy: { date: 'desc' },
          take: 30 // Analyze last 30 days
        }
      }
    });

    if (!client) return null;

    // 1. Calculate Max Drawdown (Last 30 days)
    let maxDrawdown = new Decimal(0);
    let totalProfit = new Decimal(0);
    let daysAnalyzed = 0;

    for (const log of client.performance_logs) {
      if (log.drawdown_percent.gt(maxDrawdown)) {
        maxDrawdown = log.drawdown_percent;
      }
      totalProfit = totalProfit.add(log.profit_loss);
      daysAnalyzed++;
    }

    // 2. Risk Score Calculation (0-100)
    // Formula: (Drawdown * 2) + (Multiplier * 10)
    // Example: 20% DD * 2 = 40 + 5x Multi * 10 = 50 => Total 90 (High Risk)
    let riskScore = maxDrawdown.mul(2).add(client.multiplier.mul(10));
    if (riskScore.gt(100)) riskScore = new Decimal(100);

    // 3. AI Suggestion Logic
    let suggestedMultiplier = client.multiplier;

    if (maxDrawdown.gt(30)) {
      // High Drawdown -> Reduce Risk
      suggestedMultiplier = client.multiplier.mul(0.5); // Cut in half
    } else if (maxDrawdown.lt(10) && totalProfit.gt(0)) {
      // Low Drawdown & Profitable -> Can Increase Risk slightly
      suggestedMultiplier = client.multiplier.mul(1.1); // +10%
    }

    // Round to 2 decimals
    suggestedMultiplier = new Decimal(Math.round(Number(suggestedMultiplier) * 100) / 100);
    if (suggestedMultiplier.lt(0.01)) suggestedMultiplier = new Decimal(0.01);

    // 4. Update Client
    await prisma.client.update({
      where: { id: clientId },
      data: {
        risk_score: riskScore,
        max_drawdown: maxDrawdown,
        suggested_multiplier: suggestedMultiplier,
        monthly_profit_avg: daysAnalyzed > 0 ? totalProfit.div(daysAnalyzed).mul(30) : 0
      }
    });

    return {
      riskScore,
      maxDrawdown,
      suggestedMultiplier
    };
  }

  /**
   * Daily Performance Snapshot (To be called by cron job)
   */
  static async logDailyPerformance(clientId: number) {
    const client = await prisma.client.findUnique({
      where: { id: clientId }
    });

    if (!client) return;

    // In a real scenario, we would calculate start/end balance from transactions
    // Here we snapshot current state as 'end' for today
    
    // Check if log exists for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingLog = await prisma.performanceLog.findFirst({
      where: {
        client_id: clientId,
        date: today
      }
    });

    if (existingLog) {
      // Update existing log (e.g. update max equity reached today)
      let equityMax = existingLog.equity_max;
      let equityMin = existingLog.equity_min;
      
      if (client.equity.gt(equityMax)) equityMax = client.equity;
      if (client.equity.lt(equityMin)) equityMin = client.equity;
      
      // Drawdown for today: (Max - Min) / Max * 100
      let dd = new Decimal(0);
      if (equityMax.gt(0)) {
        dd = equityMax.sub(equityMin).div(equityMax).mul(100);
      }

      await prisma.performanceLog.update({
        where: { id: existingLog.id },
        data: {
          balance_end: client.balance,
          equity_max: equityMax,
          equity_min: equityMin,
          drawdown_percent: dd,
          profit_loss: client.equity.sub(existingLog.balance_start),
          multiplier_used: client.multiplier
        }
      });
    } else {
      // Create new log for today
      await prisma.performanceLog.create({
        data: {
          client_id: clientId,
          date: today,
          balance_start: client.balance, // Assume start = current for first record
          balance_end: client.balance,
          equity_min: client.equity,
          equity_max: client.equity,
          drawdown_percent: 0,
          profit_loss: 0,
          multiplier_used: client.multiplier
        }
      });
    }
  }
}
