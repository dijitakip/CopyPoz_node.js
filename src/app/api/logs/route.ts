import { NextResponse } from 'next/server';
import { prisma } from '@/src/backend/utils/db';
import { getCurrentUser } from '@/src/backend/utils/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const user = getCurrentUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const level = url.searchParams.get('level');
    const action = url.searchParams.get('action');

    let where: any = {};
    if (level) where.level = level;
    if (action) where.action = { contains: action };

    // Admin değilse sadece kendi loglarını görsün
    if (user.role !== 'admin') {
      where.user_id = user.id;
    } else {
      const queryUserId = url.searchParams.get('user_id');
      if (queryUserId) where.user_id = Number(queryUserId);
    }

    const logs = await prisma.systemLog.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: 1000,
      include: {
        user: {
          select: {
            username: true,
            email: true
          }
        }
      }
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

