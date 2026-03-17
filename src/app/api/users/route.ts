import { NextResponse } from 'next/server';
import { prisma } from '@/src/backend/utils/db';
import { headers } from 'next/headers';
import * as bcrypt from 'bcryptjs';
import { getCurrentUser, isAdmin } from '@/src/backend/utils/auth';
import { logAction } from '@/src/backend/utils/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const user = getCurrentUser();
  
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized. Admin role required.' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const includeDeleted = searchParams.get('includeDeleted') === 'true';

    const where: any = {};
    if (!includeDeleted) {
      where.deleted_at = null;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        status: true,
        created_at: true,
        deleted_at: true,
      },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({ ok: true, users });
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const currentUser = getCurrentUser();
  
  if (!isAdmin(currentUser)) {
    return NextResponse.json({ error: 'Unauthorized. Admin role required.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { username, email, password, role } = body;

    if (!username || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const referral_code = Math.random().toString(36).substring(2, 8).toUpperCase();

    const user = await prisma.user.create({
      data: {
        username,
        email,
        password_hash: hashedPassword,
        role: role || 'viewer',
        status: 'active',
        referral_code,
      },
    });

    await logAction('USER_CREATED', { created_user_id: user.id, username: user.username }, currentUser?.id || null);

    return NextResponse.json({ ok: true, user });
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
