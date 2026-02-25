import { NextResponse } from 'next/server';
import { prisma } from '@repo/backend-core/utils/db';
import { headers } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const authHeader = headers().get('authorization');
  const token = authHeader?.split(' ')[1];
  
  if (token !== process.env.MASTER_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const level = url.searchParams.get('level');
    const action = url.searchParams.get('action');

    let where: any = {};
    if (level) where.level = level;
    if (action) where.action = { contains: action };

    const logs = await prisma.systemLog.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: 1000,
    });

    return NextResponse.json({ ok: true, logs });
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, details, level, user_id } = body;

    const log = await prisma.systemLog.create({
      data: {
        action,
        details: details || null,
        level: level || 'INFO',
        user_id: user_id || null,
      },
    });

    return NextResponse.json({ ok: true, log });
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
