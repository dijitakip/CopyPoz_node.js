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
    const trades = await prisma.position.findMany({
      where: {
        client_id: clientId,
        status: 'closed', // Assuming we track closed status
        open_time: { // Rough month filter
          gte: new Date(month + '-01'),
          lt: new Date(new Date(month + '-01').setMonth(new Date(month + '-01').getMonth() + 1))
        }
      }
    });

    const totalProfit = trades.reduce((acc, trade) => acc.add(trade.profit || 0), new Decimal(0));
    
    // Skip if no profit
    if (totalProfit.lte(0)) return null;
    
    const totalCommissionRate = group.total_commission_rate; // e.g. 40%
    const ownerShareRate = group.owner_share_rate; // e.g. 10% 
    
    const commissionAmount = totalProfit.mul(totalCommissionRate).div(100);
    const ownerAmount = totalProfit.mul(ownerShareRate).div(100);
    const systemAmount = commissionAmount.sub(ownerAmount);

    // DEDUCT from Client's Token Balance
    await TokenService.deductCommission(clientId, commissionAmount);

    return (prisma as any).commission_report.upsert({
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
    const report = await prisma.commission_report.findUnique({
      where: { id: reportId }
    });

    if (!report) throw new Error('Report not found');

    return prisma.$transaction([
      prisma.commission_report.update({
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
          subscription_status: 'active',
          // Extend next billing date by 1 month
          next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
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
