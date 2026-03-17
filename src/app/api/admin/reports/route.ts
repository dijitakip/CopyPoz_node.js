import { NextResponse } from 'next/server';
import { prisma } from '@/src/backend/utils/db';
import { getCurrentUser, isMasterOwner } from '@/src/backend/utils/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = getCurrentUser();
  if (!isMasterOwner(user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Get groups owned by this user
    const groups = await prisma.masterGroup.findMany({
      where: user.role === 'admin' ? {} : { created_by: user.id },
      select: { id: true }
    });

    const groupIds = groups.map(g => g.id);

    // 2. Get reports for these groups
    const reports = await prisma.commission_report.findMany({
      where: {
        group_id: { in: groupIds }
      },
      include: {
        client: true,
        group: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return NextResponse.json({ ok: true, reports });
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
