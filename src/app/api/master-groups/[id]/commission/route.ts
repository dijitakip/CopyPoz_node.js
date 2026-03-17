import { NextResponse } from 'next/server';
import { prisma } from '@/src/backend/utils/db';
import { getCurrentUser, isMasterOwner } from '@/src/backend/utils/auth';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = getCurrentUser();
  if (!isMasterOwner(user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { total_commission_rate, owner_share_rate } = await request.json();
    const groupId = parseInt(params.id);

    const group = await prisma.masterGroup.update({
      where: { id: groupId },
      data: {
        total_commission_rate,
        owner_share_rate
      }
    });

    return NextResponse.json({ ok: true, group });
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
