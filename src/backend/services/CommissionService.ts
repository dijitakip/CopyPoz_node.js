import { prisma } from '../utils/db';
import { Decimal } from '@prisma/client/runtime/library';

import { TokenService } from './TokenService';

export class CommissionService {
  /**
   * Calculate monthly commission for a client and deduct from Token Balance
   */
  static async generateMonthlyReport(clientId: number, month: string) {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        master_assignments: {
          include: {
            group: true
          }
        }
      }
    });

    if (!client || client.master_assignments.length === 0) return null;

    const group = client.master_assignments[0].group;
    
    // Profit Calculation Logic (Sum of closed trades)
    // close_time is a DateTime field in Prisma (mapped to Timestamp in DB)
    const startOfMonth = new Date(`${month}-01T00:00:00Z`);
    const endOfMonth = new Date(new Date(`${month}-01T00:00:00Z`).setMonth(startOfMonth.getMonth() + 1));

    const trades = await prisma.position.findMany({
      where: {
        client_id: clientId,
        is_closed: true,
        close_time: {
          gte: startOfMonth,
          lt: endOfMonth
        }
      }
    });

    const totalProfit = trades.reduce((acc, trade) => acc.add(trade.profit || 0), new Decimal(0));
    
    // Skip if no profit. But if profit is 0 or negative, we might still want to record it so user knows they made no profit and thus owe $0.
    // However, keeping logic simple: If no profit, record as $0 commission to mark the month as "handled".
    // If we return null, the UI says "0 reports generated". By saving $0, it says "1 report generated" and they can "Close Period" for $0.
    if (totalProfit.lte(0)) {
      return prisma.commissionReport.upsert({
        where: {
          client_id_month: {
            client_id: clientId,
            month: month
          }
        },
        update: {
          total_profit: totalProfit,
          commission_amount: 0,
          owner_amount: 0,
          system_amount: 0
        },
        create: {
          client_id: clientId,
          group_id: group.id,
          month: month,
          total_profit: totalProfit,
          commission_amount: 0,
          owner_amount: 0,
          system_amount: 0,
          payment_status: 'unpaid'
        }
      });
    }
    
    const totalCommissionRate = group.total_commission_rate; // e.g. 40% (Toplam kesilecek oran)
    // Yeni kural: Admin payı grupta belirlenen admin_commission_rate olacak (default %50)
    const adminShareRate = group.admin_commission_rate || new Decimal(50);
    const ownerShareRate = group.owner_share_rate; 
    
    // Toplam komisyon miktarı (Örn: Karın %20'si - Master grubunda belirlenen total_commission_rate kullanılır)
    const commissionAmount = totalProfit.mul(totalCommissionRate).div(100);
    // Sisteme kalacak olan (Admin payı) (Örn: Toplam komisyonun %50'si)
    const systemAmount = commissionAmount.mul(adminShareRate).div(100);
    // Kalan Master'a gidecek olan
    const ownerAmount = commissionAmount.sub(systemAmount);

    return prisma.commissionReport.upsert({
      where: {
        client_id_month: {
          client_id: clientId,
          month: month
        }
      },
      update: {
        total_profit: totalProfit,
        commission_amount: commissionAmount,
        owner_amount: ownerAmount,
        system_amount: systemAmount
      },
      create: {
        client_id: clientId,
        group_id: group.id,
        month: month,
        total_profit: totalProfit,
        commission_amount: commissionAmount,
        owner_amount: ownerAmount,
        system_amount: systemAmount,
        payment_status: 'unpaid'
      }
    });
  }

  /**
   * Approve a commission payment and extend subscription
   */
  static async approvePayment(reportId: number, adminId: number) {
    const report = await prisma.commissionReport.findUnique({
      where: { id: reportId }
    });

    if (!report) throw new Error('Report not found');

    return prisma.$transaction([
      prisma.commissionReport.update({
        where: { id: reportId },
        data: {
          payment_status: 'approved',
          approved_by_id: adminId,
          approved_at: new Date()
        }
      }),
      prisma.client.update({
        where: { id: report.client_id },
        data: {
          subscription_status: 'active'
        }
      })
    ]);
  }

  /**
   * Estimate current month's commission based on performance logs
   */
  static async estimateCurrentMonthCommission(clientId: number) {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const clientResults = await prisma.$queryRaw`
      SELECT c.id, g.total_commission_rate
      FROM clients c
      JOIN master_group_assignments mga ON c.id = mga.client_id
      JOIN master_groups g ON mga.group_id = g.id
      WHERE c.id = ${clientId}
      LIMIT 1
    ` as any[];

    if (!clientResults || clientResults.length === 0) return new Decimal(0);
    const commissionRate = new Decimal(clientResults[0].total_commission_rate || 40);

    // Get profit from performance logs for current month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const logs = await prisma.$queryRaw`
      SELECT SUM(profit_loss) as total_profit
      FROM performance_logs
      WHERE client_id = ${clientId} AND date >= ${startOfMonth}
    ` as any[];

    const totalProfit = new Decimal(logs[0]?.total_profit || 0);
    if (totalProfit.lte(0)) return new Decimal(0);

    return totalProfit.mul(commissionRate).div(100);
  }
}
