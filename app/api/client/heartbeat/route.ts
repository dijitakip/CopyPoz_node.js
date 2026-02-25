import { NextResponse } from 'next/server';
import { ClientService } from '@repo/backend-core';
import { headers } from 'next/headers';

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

    const payload = {
      account_number,
      account_name,
      balance,
      equity,
      open_positions,
      auth_token: auth_token as string | undefined,
      registration_token:
        registration_token ??
        (bearer === process.env.MASTER_TOKEN ? process.env.MASTER_TOKEN : undefined),
    };

    const result = await ClientService.registerOrUpdate(payload as any);
    return NextResponse.json({
      ok: true,
      client_id: result.client.id,
      token: result.token,
      isNew: result.isNew,
    });
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
