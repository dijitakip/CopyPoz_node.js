import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import { randomBytes } from 'crypto';



export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const authHeader = headers().get('authorization');
    const bearer = authHeader?.split(' ')[1];
    const body = await request.json();
    const {
      account_number,
      account_name,
      balance,
      equity,
      open_positions,
      auth_token,
      registration_token,
    } = body || {};

    if (
      typeof account_number !== 'number' ||
      typeof account_name !== 'string' ||
      typeof balance !== 'number' ||
      typeof equity !== 'number' ||
      typeof open_positions !== 'number'
    ) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    let client = await prisma.client.findUnique({
      where: { account_number },
    });

    const isNew = !client;
    const token = auth_token || randomBytes(32).toString('hex');

    if (isNew) {
      client = await prisma.client.create({
        data: {
          account_number,
          account_name,
          balance,
          equity,
          open_positions,
          auth_token: token,
          status: 'active',
        },
      });
    } else {
      client = await prisma.client.update({
        where: { account_number },
        data: {
          balance,
          equity,
          open_positions,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      client_id: client.id,
      token: client.auth_token,
      isNew,
    });
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

