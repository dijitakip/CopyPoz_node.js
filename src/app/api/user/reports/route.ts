import { NextResponse } from 'next/server';
import { prisma } from '@/src/backend/utils/db';
import { auth } from '@/src/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userId = Number(session.user.id);

    // Get client IDs owned by the user
    const userClients = await prisma.client.findMany({
      where: { owner_id: userId },
      select: { id: true }
    });
    
    const clientIds = userClients.map(c => c.id);

    // Get reports for these clients
    const reports = await prisma.commissionReport.findMany({
      where: {
        client_id: { in: clientIds }
      },
      include: {
        client: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    const serializedReports = reports.map(r => ({
      ...r,
      client: {
        ...r.client,
        account_number: r.client.account_number.toString()
      }
    }));

    return NextResponse.json({ ok: true, reports: serializedReports });
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
