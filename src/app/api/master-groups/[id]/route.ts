import { NextResponse } from 'next/server';
import { prisma } from '@/src/backend/utils/db';
import { auth } from '@/src/auth';

export const dynamic = 'force-dynamic';

// GET master group by id
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const id = parseInt(params.id);
    
    const group = await prisma.masterGroup.findUnique({
      where: { id },
      include: {
        assignments: {
          include: { client: true },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // BigInt serialization fix
    const serializedGroup = {
      ...group,
      assignments: group.assignments.map(as => ({
        ...as,
        client: as.client ? {
          ...as.client,
          account_number: as.client.account_number.toString()
        } : null
      }))
    };

    return NextResponse.json({ ok: true, group: serializedGroup });
  } catch (e) {
    console.error('Fetch group detail error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE master group
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = session.user as any;
  if (user.role !== 'admin' && user.role !== 'master_owner') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const id = parseInt(params.id);
    
    await prisma.masterGroup.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Delete group error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PATCH update master group
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = session.user as any;
  if (user.role !== 'admin' && user.role !== 'master_owner') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const id = parseInt(params.id);
    const body = await request.json();
    const { name, description } = body;

    const group = await prisma.masterGroup.update({
      where: { id },
      data: {
        name: name || undefined,
        description: description !== undefined ? description : undefined,
      },
    });

    return NextResponse.json({ ok: true, group });
  } catch (e) {
    console.error('Update group error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
