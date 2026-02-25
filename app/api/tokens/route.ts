import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import { randomBytes } from 'crypto';



export const dynamic = 'force-dynamic';

export async function GET() {
  const authHeader = headers().get('authorization');
  const token = authHeader?.split(' ')[1];
  
  if (token !== process.env.MASTER_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
  const authHeader = headers().get('authorization');
  const token = authHeader?.split(' ')[1];
  
  if (token !== process.env.MASTER_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { user_id, client_id, token_type, expires_days } = body;

    if (!user_id || !client_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const tokenValue = randomBytes(32).toString('hex');
    const expiresAt = expires_days ? new Date(Date.now() + expires_days * 24 * 60 * 60 * 1000) : null;

    const newToken = await prisma.userToken.create({
      data: {
        user_id: parseInt(user_id),
        client_id: parseInt(client_id),
        token_value: tokenValue,
        token_type: token_type || 'CLIENT_TOKEN',
        status: 'active',
        created_by: 1,
        expires_at: expiresAt,
      },
    });

    return NextResponse.json({ ok: true, token: newToken });
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

