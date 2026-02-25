import { NextResponse } from 'next/server';
import { prisma } from '@repo/backend-core/utils/db';
import { headers } from 'next/server';

export const dynamic = 'force-dynamic';

// POST add client to master group
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authHeader = headers().get('authorization');
  const token = authHeader?.split(' ')[1];
  
  if (token !== process.env.MASTER_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const groupId = parseInt(params.id);
    const body = await request.json();
    const { client_id, master_id } = body;

    if (!client_id || !master_id) {
      return NextResponse.json({ error: 'Missing client_id or master_id' }, { status: 400 });
    }

    const assignment = await prisma.masterGroupAssignment.create({
      data: {
        group_id: groupId,
        client_id: parseInt(client_id),
        master_id: parseInt(master_id),
      },
    });

    return NextResponse.json({ ok: true, assignment });
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE remove client from master group
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authHeader = headers().get('authorization');
  const token = authHeader?.split(' ')[1];
  
  if (token !== process.env.MASTER_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const assignmentId = url.searchParams.get('assignment_id');

    if (!assignmentId) {
      return NextResponse.json({ error: 'Missing assignment_id' }, { status: 400 });
    }

    await prisma.masterGroupAssignment.delete({
      where: { id: parseInt(assignmentId) },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
