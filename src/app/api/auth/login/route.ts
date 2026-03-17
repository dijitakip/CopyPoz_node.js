import { NextResponse } from 'next/server';
import { AuthService } from '@/src/backend/services/AuthService';
import { createSession } from '@/src/backend/utils/auth';
import { logAction } from '@/src/backend/utils/logger';

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: 'Database not configured', code: 'DB_CONFIG_MISSING' },
        { status: 500 }
      );
    }

    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }

    const authUser = await AuthService.login(username, password);

    if (!authUser) {
      await logAction('LOGIN_FAILED', { username }, null, 'WARNING', typeof ip === 'string' ? ip : ip[0]);
      return NextResponse.json({ error: 'Geçersiz kullanıcı adı veya şifre' }, { status: 401 });
    }

    // Set signed session token cookie
    createSession({
      id: authUser.id,
      username: authUser.username,
      role: authUser.role
    });

    await logAction('LOGIN_SUCCESS', { username: authUser.username }, authUser.id, 'INFO', typeof ip === 'string' ? ip : ip[0]);

    return NextResponse.json({
      success: true,
      user: {
        id: authUser.id,
        username: authUser.username,
        role: authUser.role,
        status: authUser.status,
        email: authUser.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    const safeMessage =
      process.env.NODE_ENV === 'production' ? 'Internal Server Error' : message;
    return NextResponse.json({ error: safeMessage }, { status: 500 });
  }
}

