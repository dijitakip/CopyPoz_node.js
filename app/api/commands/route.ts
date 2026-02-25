import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

// GET all pending commands
export async function GET(request: Request) {
  const authHeader = headers().get('authorization');
  const token = authHeader?.split(' ')[1];
  
  if (token !== process.env.MASTER_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const clientId = url.searchParams.get('client_id');
    
    let where: any = { status: 'pending' };
    if (clientId) {
      where.client_id = parseInt(clientId);
    }

    const commands = await prisma.commandQueue.findMany({
      where,
      orderBy: { created_at: 'asc' },
      include: { client: true },
    });

    return NextResponse.json({ ok: true, commands });
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST create command
export async function POST(request: Request) {
  const authHeader = headers().get('authorization');
  const token = authHeader?.split(' ')[1];
  
  if (token !== process.env.MASTER_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { client_id, command, params } = body;

    if (!client_id || !command) {
      return NextResponse.json({ error: 'Missing client_id or command' }, { status: 400 });
    }

    const cmd = await prisma.commandQueue.create({
      data: {
        client_id: parseInt(client_id),
        command,
        params: params ? JSON.stringify(params) : null,
        status: 'pending',
      },
    });

    return NextResponse.json({ ok: true, command: cmd });
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

