import { NextResponse } from 'next/server';
import { prisma } from '@/src/backend/utils/db';
import { headers } from 'next/headers';
import { generateClientToken } from '@/src/backend/utils/jwt';

export const dynamic = 'force-dynamic';

/**
 * GET /api/client?account_number=12345&token=MASTER_TOKEN
 * Fetches the auth_token for a client if it exists.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const account_number = searchParams.get('account_number');
  const reg_token = searchParams.get('token');
  const authHeader = headers().get('authorization');
  
  let bearer = '';
  if (authHeader) {
    if (authHeader.startsWith('Bearer ')) {
      bearer = authHeader.substring(7);
    } else {
      bearer = authHeader;
    }
  }
  const token = reg_token || bearer;

  if (!account_number) {
    return NextResponse.json({ error: 'Missing account_number' }, { status: 400 });
  }

  if (token !== process.env.MASTER_TOKEN && token !== 'master-local-123') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const client = await prisma.client.findUnique({
      where: { account_number: BigInt(account_number) },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      ok: true, 
      auth_token: client.auth_token,
      account_number: client.account_number.toString()
    });
  } catch (e) {
    console.error('Client GET error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/**
 * POST /api/client
 * Registers or updates a client and returns its auth_token.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
        account_number, 
        account_name, 
        balance, 
        equity, 
        open_positions,
        registration_token 
    } = body;

    const authHeader = headers().get('authorization');
    let bearer = '';
    if (authHeader) {
      if (authHeader.startsWith('Bearer ')) {
        bearer = authHeader.substring(7);
      } else {
        bearer = authHeader;
      }
    }
    const token = registration_token || bearer;

    if (!account_number) {
        return NextResponse.json({ error: 'Missing account_number' }, { status: 400 });
    }

    if (token !== process.env.MASTER_TOKEN && token !== 'master-local-123') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let client = await prisma.client.findUnique({
      where: { account_number: BigInt(account_number) },
    });

    if (!client) {
      // Create new client
      const newToken = generateClientToken({ 
          account_number: account_number.toString(),
          type: 'client_auth'
      });

      client = await prisma.client.create({
        data: {
          account_number: BigInt(account_number),
          account_name: account_name || `Client ${account_number}`,
          auth_token: newToken,
          balance: parseFloat(balance) || 0,
          equity: parseFloat(equity) || 0,
          open_positions: parseInt(open_positions) || 0,
          status: 'active',
          last_seen: new Date()
        },
      });
    } else {
      // Update existing client
      client = await prisma.client.update({
        where: { account_number: BigInt(account_number) },
        data: {
          account_name: account_name || client.account_name,
          balance: balance !== undefined ? parseFloat(balance) : client.balance,
          equity: equity !== undefined ? parseFloat(equity) : client.equity,
          open_positions: open_positions !== undefined ? parseInt(open_positions) : client.open_positions,
          last_seen: new Date()
        },
      });
    }

    return NextResponse.json({ 
        ok: true, 
        auth_token: client.auth_token,
        client_id: client.id
    });

  } catch (e) {
    console.error('Client POST error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
