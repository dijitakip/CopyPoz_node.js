import { NextResponse } from 'next/server';
import { prisma } from '@/src/backend/utils/db';
import { CommissionService } from '@/src/backend/services/CommissionService';
import { auth } from '@/src/auth';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userRole = (session.user as any).role;
  if (!['admin', 'master_owner'].includes(userRole)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const reportId = parseInt(params.id);
    const result = await CommissionService.approvePayment(reportId, Number(session.user.id));
    
    // Eğer onaylandıysa ve client teminatı yeterliyse kopyalamayı tekrar başlat
    const report = await prisma.commissionReport.findUnique({
      where: { id: reportId },
      include: { client: true }
    });

    if (report) {
      const { TokenService } = await import('@/src/backend/services/TokenService');
      const check = await TokenService.checkCollateral(report.client_id);
      
      if (check.allowed) {
        await prisma.client.update({
          where: { id: report.client_id },
          data: { status: 'active' }
        });
      }
    }
    
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    const error = e as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
