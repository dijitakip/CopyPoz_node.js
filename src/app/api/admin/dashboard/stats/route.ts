import { NextResponse } from 'next/server';
import { prisma } from '@/src/backend/utils/db';
import { getCurrentUser } from '@/src/backend/utils/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [totalClients, activeClients, balanceSum, totalPositions, recentClients] = await Promise.all([
      prisma.client.count(),
      prisma.client.count({ where: { status: 'active' } }),
      prisma.client.aggregate({
        _sum: {
          balance: true
        }
      }),
      prisma.client.aggregate({
        _sum: {
          open_positions: true
        }
      }),
      prisma.client.findMany({
        orderBy: { last_seen: 'desc' },
        take: 5,
        select: {
          id: true,
          account_number: true,
          account_name: true,
          status: true,
          balance: true,
          last_seen: true
        }
      })
    ]);

    // BigInt conversion for JSON
    const serializedClients = recentClients.map(c => ({
      ...c,
      account_number: c.account_number.toString(),
      balance: Number(c.balance)
    }));

    // Son 7 günün performans özeti
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const performanceLogs = await prisma.performanceLog.groupBy({
      by: ['date'],
      where: {
        date: {
          gte: sevenDaysAgo
        }
      },
      _sum: {
        profit_loss: true
      },
      _count: {
        client_id: true
      },
      orderBy: {
        date: 'desc'
      }
    });

    const weeklyPerformance = performanceLogs.map(log => ({
      date: log.date.toISOString(),
      totalProfit: Number(log._sum.profit_loss || 0),
      clientCount: log._count.client_id
    }));

    return NextResponse.json({
      ok: true,
      stats: {
        totalClients,
        activeClients,
        totalBalance: Number(balanceSum._sum.balance || 0),
        totalPositions: Number(totalPositions._sum.open_positions || 0),
        recentClients: serializedClients,
        weeklyPerformance
      }
    });
  } catch (e) {
    console.error('Dashboard stats error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
