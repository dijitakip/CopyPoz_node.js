import { NextResponse } from 'next/server';
import { prisma } from '@/src/backend/utils/db';
import * as bcrypt from 'bcryptjs';
import { logAction } from '@/src/backend/utils/logger';
import { sendVerificationEmail } from '@/src/backend/utils/email';
import { headers } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { username, email, password, referral_code } = await request.json();
    const ip = headers().get('x-forwarded-for') || '127.0.0.1';

    // 1. Girdi Kontrolü (Gereksiz üyeliklerin önüne geçme)
    if (!username || !email || !password) {
      return NextResponse.json({ error: 'Eksik bilgiler var' }, { status: 400 });
    }

    if (username.length < 3 || password.length < 6) {
      return NextResponse.json({ error: 'Geçersiz kullanıcı adı veya şifre uzunluğu' }, { status: 400 });
    }

    if (!email.includes('@')) {
      return NextResponse.json({ error: 'Geçersiz e-posta formatı' }, { status: 400 });
    }

    // Check referral code
    let referred_by_id = null;
    if (referral_code) {
      const referrer = await prisma.user.findUnique({
        where: { referral_code: referral_code.toUpperCase() }
      });
      if (!referrer) {
        return NextResponse.json({ error: 'Geçersiz referans kodu' }, { status: 400 });
      }
      referred_by_id = referrer.id;
    }

    // 2. Mevcut Kullanıcı Kontrolü
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Kullanıcı adı veya e-posta zaten kullanımda' }, { status: 400 });
    }

    // 3. Şifreleme ve Token Oluşturma
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const new_referral_code = Math.random().toString(36).substring(2, 8).toUpperCase();

    // 4. Kullanıcı Oluşturma (Pasif modda)
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password_hash: hashedPassword,
        status: 'inactive', // Email doğrulanana kadar pasif
        role: 'viewer', // Varsayılan rol
        verification_token: verificationToken,
        registration_ip: typeof ip === 'string' ? ip : ip[0],
        referral_code: new_referral_code,
        referred_by_id: referred_by_id,
      }
    });

    // 5. Loglama ve Email Gönderimi
    await logAction('USER_REGISTERED', { username, email, ip }, user.id, 'INFO', typeof ip === 'string' ? ip : ip[0]);
    await sendVerificationEmail(email, verificationToken);

    return NextResponse.json({
      success: true,
      message: 'Kayıt başarılı. Lütfen e-posta adresinizi doğrulayın.'
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Kayıt sırasında bir hata oluştu' }, { status: 500 });
  }
}
