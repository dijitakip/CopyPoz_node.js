import { NextResponse } from 'next/server';
import { CommissionService } from '@/src/backend/services/CommissionService';
import { getCurrentUser, isMasterOwner } from '@/src/backend/utils/auth';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = getCurrentUser();
  if (!user || !isMasterOwner(user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const reportId = parseInt(params.id);
    const result = await CommissionService.approvePayment(reportId, user.id);
    
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    const error = e as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
