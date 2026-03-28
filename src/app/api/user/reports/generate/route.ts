import { NextResponse } from 'next/server';
import { prisma } from '@/src/backend/utils/db';
import { CommissionService } from '@/src/backend/services/CommissionService';
import { auth } from '@/src/auth';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { month } = await request.json(); // format: YYYY-MM
    
    if (!month) {
      return NextResponse.json({ error: 'Month is required' }, { status: 400 });
    }

    const userId = Number(session.user.id);

    // Only generate for clients owned by the user
    const clients = await prisma.client.findMany({
      where: {
        owner_id: userId,
        status: 'active',
        is_master: false
      }
    });

    const results = [];
    for (const client of clients) {
      const report = await CommissionService.generateMonthlyReport(client.id, month);
      if (report) results.push(report);
    }

    return NextResponse.json({ ok: true, generated: results.length });
  } catch (e) {
    console.error('Error generating user reports:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
