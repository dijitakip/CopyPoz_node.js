import { NextResponse } from 'next/server';
import { prisma } from '@/src/backend/utils/db';
import { headers } from 'next/headers';
import { generateClientToken } from '@/src/backend/utils/jwt';
import { getCurrentUser, isMasterOwner } from '@/src/backend/utils/auth';
import { logAction } from '@/src/backend/utils/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = getCurrentUser();
  
  if (!isMasterOwner(user)) {
    return NextResponse.json({ error: 'Unauthorized. Master Owner or Admin role required.' }, { status: 401 });
  }

  try {
    const tokens = await prisma.userToken.findMany({
      include: {
        user: { select: { username: true } },
        client: { select: { account_name: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({ ok: true, tokens });
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = getCurrentUser();
  
  if (!isMasterOwner(user)) {
    return NextResponse.json({ error: 'Unauthorized. Master Owner or Admin role required.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { user_id, client_id, token_type, expires_days, manual_token } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
    }

    const parsedUserId = parseInt(user_id.toString());

    // 1. ESKİ TOKENLARI PASİFE ÇEK (User'ın tüm aktif tokenlarını kapat)
    // Sadece bu user'a ait olanları kapatıyoruz.
    await prisma.userToken.updateMany({
        where: {
            user_id: parsedUserId,
            status: 'active'
        },
        data: {
            status: 'inactive',
            expires_at: new Date() // Hemen geçerliliğini yitirsin
        }
    });

    // 2. YENİ TOKEN OLUŞTUR
    let tokenValue = manual_token;
    
    if (!tokenValue) {
        tokenValue = generateClientToken(
          {
            user_id: parsedUserId,
            client_id: client_id ? parseInt(client_id.toString()) : undefined,
            type: token_type || 'CLIENT_TOKEN'
          },
          expires_days ? `${expires_days}d` : '365d'
        );
    }
    
    const expiresAt = expires_days ? new Date(Date.now() + Number(expires_days) * 24 * 60 * 60 * 1000) : null;

    const creatorId = user?.id || 1; 

    const newToken = await prisma.userToken.create({
      data: {
        user_id: parsedUserId,
        client_id: client_id ? parseInt(client_id.toString()) : null,
        token_value: tokenValue,
        token_type: token_type || 'CLIENT_TOKEN',
        status: 'active',
        created_by: creatorId,
        expires_at: expiresAt,
      },
    });

    await logAction('TOKEN_CREATED', { token_id: newToken.id, for_user_id: parsedUserId }, creatorId);

    return NextResponse.json({ ok: true, token: newToken });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

