import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';



export const dynamic = 'force-dynamic';

export async function GET() {
  const authHeader = headers().get('authorization');
  const token = authHeader?.split(' ')[1];
  if (token !== process.env.MASTER_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const command = await prisma.commandQueue.findFirst({
      where: { status: 'pending' },
      orderBy: { created_at: 'asc' },
    });
    return NextResponse.json({ command: command ?? null });
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

