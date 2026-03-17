import { NextResponse } from 'next/server';
import { prisma } from '@/src/backend/utils/db';
import { logAction } from '@/src/backend/utils/logger';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Geçersiz doğrulama anahtarı' }, { status: 400 });
  }

  try {
    // 1. Token ile kullanıcıyı bul
    const user = await prisma.user.findFirst({
      where: {
        verification_token: token,
        status: 'inactive'
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı veya e-posta zaten doğrulandı' }, { status: 400 });
    }

    // 2. Kullanıcıyı doğrula ve aktif hale getir
    await prisma.user.update({
      where: { id: user.id },
      data: {
        status: 'active',
        email_verified_at: new Date(),
        verification_token: null // Tokenı bir kez kullandır
      }
    });

    // 3. Loglama
    await logAction('EMAIL_VERIFIED', { username: user.username }, user.id, 'INFO');

    return NextResponse.json({
      success: true,
      message: 'E-posta adresiniz başarıyla doğrulandı. Artık giriş yapabilirsiniz.'
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json({ error: 'E-posta doğrulaması sırasında bir hata oluştu' }, { status: 500 });
  }
}
