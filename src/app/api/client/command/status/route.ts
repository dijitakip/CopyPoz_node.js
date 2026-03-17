import { NextResponse } from 'next/server';
import { prisma } from '@/src/backend/utils/db';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const authHeader = headers().get('authorization');
    const token = authHeader?.split(' ')[1];

    if (token !== process.env.MASTER_TOKEN && token !== 'master-local-123') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const command = await prisma.commandQueue.findUnique({
        where: { id: Number(id) }
    });

    if (!command) {
        return NextResponse.json({ error: 'Command not found' }, { status: 404 });
    }

    return NextResponse.json({ command });
  } catch (e) {
    console.error('Command status error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}