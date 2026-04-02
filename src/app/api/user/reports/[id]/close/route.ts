import { NextResponse } from 'next/server';
import { prisma } from '@/src/backend/utils/db';
import { auth } from '@/src/auth';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const reportId = parseInt(params.id);
    const userId = Number(session.user.id);

    // Get the report and verify ownership
    const report = await prisma.commissionReport.findUnique({
      where: { id: reportId },
      include: { client: true }
    });

    if (!report || report.client.owner_id !== userId) {
      return NextResponse.json({ error: 'Report not found or unauthorized' }, { status: 404 });
    }

    if (report.payment_status !== 'unpaid') {
      return NextResponse.json({ error: 'Report is already closed or approved' }, { status: 400 });
    }

    // "Dönemi Kapat" demek, bakiyenin teminattan düşülmesi
    // ve şimdi admin onayına sunulduğunu ifade eder.
    
    // 1. Teminattan düşüş yap (TokenService kullanarak)
    const { TokenService } = await import('@/src/backend/services/TokenService');
    await TokenService.deductCommission(report.client_id, report.commission_amount);

    // Client'ın kopyalamasını durdur (Admin onaylayana kadar veya bakiye yetene kadar)
    await prisma.$transaction([
      prisma.commissionReport.update({
        where: { id: reportId },
        data: {
          payment_status: 'pending_approval' // Admin onayını bekle
        }
      }),
      prisma.client.update({
        where: { id: report.client_id },
        data: {
          status: 'paused', // Admin onaylayana kadar kopyalama durdurulur
        }
      })
    ]);

    return NextResponse.json({ ok: true });
  } catch (e) {
    const error = e as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
