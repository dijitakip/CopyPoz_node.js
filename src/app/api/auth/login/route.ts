import { NextResponse } from 'next/server';
import { AuthService } from '@/src/backend/services/AuthService';
import { createSession } from '@/src/backend/utils/auth';
import { logAction } from '@/src/backend/utils/logger';

export const dynamic = 'force-dynamic';

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

    let authUser;
    try {
      authUser = await AuthService.login(username, password);
    } catch (err) {
      if (err instanceof Error && err.message === 'ACCOUNT_INACTIVE') {
        return NextResponse.json(
          {
            error: 'Hesabınız henüz aktif değil. Lütfen e-postanızdaki doğrulama bağlantısını kullanın.',
            code: 'EMAIL_NOT_VERIFIED',
          },
          { status: 403 }
        );
      }
      throw err;
    }

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

