import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

// DELETE command
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
    const id = parseInt(params.id);
    
    await prisma.commandQueue.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PATCH update command status
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authHeader = headers().get('authorization');
  const token = authHeader?.split(' ')[1];
  
  if (token !== process.env.MASTER_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const id = parseInt(params.id);
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: 'Missing status' }, { status: 400 });
    }

    const cmd = await prisma.commandQueue.update({
      where: { id },
      data: {
        status,
        executed_at: status === 'executed' ? new Date() : undefined,
      },
    });

    return NextResponse.json({ ok: true, command: cmd });
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
