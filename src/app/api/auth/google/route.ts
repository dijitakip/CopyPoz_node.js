import { NextResponse } from 'next/server';
import { prisma } from '@/src/backend/utils/db';
import { createSession } from '@/src/backend/utils/auth';
import { logAction } from '@/src/backend/utils/logger';
import { headers } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { idToken, email, name, googleId } = await request.json();
    const ip = headers().get('x-forwarded-for') || '127.0.0.1';

    // Özellik kontrolü (İstendiği zaman devreye alma)
    if (!process.env.GOOGLE_CLIENT_ID) {
      return NextResponse.json({ error: 'Google Login şu an aktif değil.' }, { status: 403 });
    }

    if (!email || !googleId) {
      return NextResponse.json({ error: 'Google verileri eksik.' }, { status: 400 });
    }

    // 1. Google ID veya Email ile kullanıcıyı bul
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { google_id: googleId },
          { email: email }
        ]
      }
    });

    if (!user) {
      // 2. Yeni kullanıcı oluştur (Google ile otomatik kayıt)
      const username = email.split('@')[0] + '_' + Math.floor(Math.random() * 1000);
      user = await prisma.user.create({
        data: {
          username,
          email,
          google_id: googleId,
          password_hash: 'GOOGLE_AUTH_EXTERNAL', // Şifresiz giriş
          status: 'active',
          email_verified_at: new Date(), // Google zaten doğrulamış kabul ediyoruz
          registration_ip: typeof ip === 'string' ? ip : ip[0]
        }
      });
      await logAction('GOOGLE_REGISTER', { username, email }, user.id);
    } else {
      // 3. Mevcut kullanıcı ise Google ID'sini güncelle (eğer yoksa)
      if (!user.google_id) {
        await prisma.user.update({
          where: { id: user.id },
          data: { google_id: googleId, email_verified_at: user.email_verified_at || new Date() }
        });
      }
      await logAction('GOOGLE_LOGIN', { username: user.username }, user.id);
    }

    // 4. Oturum Oluştur
    createSession({
      id: user.id,
      username: user.username,
      role: user.role
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    return NextResponse.json({ error: 'Google girişi sırasında bir hata oluştu.' }, { status: 500 });
  }
}
