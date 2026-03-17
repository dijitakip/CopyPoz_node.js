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

    return NextResponse.json({
      ok: true,
      stats: {
        totalClients,
        activeClients,
        totalBalance: Number(balanceSum._sum.balance || 0),
        totalPositions: Number(totalPositions._sum.open_positions || 0),
        recentClients: serializedClients
      }
    });
  } catch (e) {
    console.error('Dashboard stats error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
