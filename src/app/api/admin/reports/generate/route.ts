import { NextResponse } from 'next/server';
import { prisma } from '@/src/backend/utils/db';
import { CommissionService } from '@/src/backend/services/CommissionService';
import { auth } from '@/src/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userRole = (session.user as any).role;
  if (!['admin', 'master_owner'].includes(userRole)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { month } = await request.json(); // format: YYYY-MM
    
    if (!month) {
      return NextResponse.json({ error: 'Month is required' }, { status: 400 });
    }

    // Only generate for clients that belong to groups owned by this user (or all if admin)
    const groups = await prisma.masterGroup.findMany({
      where: userRole === 'admin' ? {} : { created_by: Number(session.user.id) },
      select: { id: true }
    });
    const groupIds = groups.map(g => g.id);

    const assignments = await prisma.masterGroupAssignment.findMany({
      where: { group_id: { in: groupIds } },
      select: { client_id: true }
    });
    const clientIds = assignments.map(a => a.client_id);

    const clients = await prisma.client.findMany({
      where: {
        id: { in: clientIds },
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
    console.error('Error generating reports:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
