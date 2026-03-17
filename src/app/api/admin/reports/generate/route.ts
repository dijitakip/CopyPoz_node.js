import { NextResponse } from 'next/server';
import { prisma } from '@/src/backend/utils/db';
import { CommissionService } from '@/src/backend/services/CommissionService';
import { getCurrentUser, isAdmin } from '@/src/backend/utils/auth';

export async function POST(request: Request) {
  const user = getCurrentUser();
  if (!isAdmin(user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { month } = await request.json(); // format: YYYY-MM
    
    if (!month) {
      return NextResponse.json({ error: 'Month is required' }, { status: 400 });
    }

    const clients = await prisma.client.findMany({
      where: {
        status: 'active',
        is_master: false // Only generate for followers
      }
    });

    const results = [];
    for (const client of clients) {
      const report = await CommissionService.generateMonthlyReport(client.id, month);
      if (report) results.push(report);
    }

    return NextResponse.json({ ok: true, generated: results.length });
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
