import { NextResponse } from 'next/server';
import { prisma } from '@/src/backend/utils/db';
import { headers } from 'next/headers';
import { getCurrentUser, isMasterOwner } from '@/src/backend/utils/auth';
import { logAction } from '@/src/backend/utils/logger';

export const dynamic = 'force-dynamic';

// GET all master groups
export async function GET() {
  const user = getCurrentUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let where: any = {};
    
    // Admin değilse sadece kendi oluşturduğu grupları görsün
    if (user.role !== 'admin') {
      where = { created_by: user.id };
    }

    const groups = await prisma.masterGroup.findMany({
      where,
      include: {
        assignments: {
          include: { client: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    // BigInt serialization fix
    const serializedGroups = groups.map(group => ({
      ...group,
      assignments: group.assignments.map(as => ({
        ...as,
        client: as.client ? {
          ...as.client,
          account_number: as.client.account_number.toString()
        } : null
      }))
    }));

    return NextResponse.json({ ok: true, groups: serializedGroups });
  } catch (e) {
    console.error('Fetch groups error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST create master group
export async function POST(request: Request) {
  const user = getCurrentUser();
  
  if (!isMasterOwner(user)) {
    return NextResponse.json({ error: 'Unauthorized. Master Owner or Admin role required.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description, created_by, total_commission_rate, owner_share_rate } = body;

    if (!name || !created_by) {
      return NextResponse.json({ error: 'Missing name or created_by' }, { status: 400 });
    }

    const group = await prisma.masterGroup.create({
      data: {
        name,
        description: description || null,
        created_by: parseInt(created_by),
        total_commission_rate: total_commission_rate || 40.00,
        owner_share_rate: owner_share_rate || 10.00,
      },
    });

    await logAction('GROUP_CREATED', { group_id: group.id, name: group.name }, user?.id || null);

    return NextResponse.json({ ok: true, group });
  } catch (e) {
    console.error('Create group error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

