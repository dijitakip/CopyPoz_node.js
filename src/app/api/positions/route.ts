import { NextResponse } from 'next/server';
import { prisma } from '@/src/backend/utils/db';
import { headers } from 'next/headers';
import { verifyClientToken } from '@/src/backend/utils/jwt';



export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const authHeader = headers().get('authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 401 });
  }

  // Auth check - Support Master Token or Client Token
  let isAuthorized = false;
  if (token === process.env.MASTER_TOKEN || token === 'master-local-123') {
    isAuthorized = true;
  } else {
    const decoded = verifyClientToken(token);
    if (decoded) {
      isAuthorized = true;
    } else {
      // Check for simple token in database
      const client = await prisma.client.findFirst({
        where: { auth_token: token }
      });
      if (client) isAuthorized = true;
    }
  }

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const masterState = await prisma.masterState.findUnique({
      where: { id: 1 },
    });

    if (!masterState) {
        return NextResponse.json({ 
            ok: false,
            positions: [],
            total_positions: 0,
            updated_at: 0
        });
    }

    return NextResponse.json({ 
      ok: true,
      total_positions: masterState.total_positions,
      positions: masterState.positions_json ? JSON.parse(masterState.positions_json) : [],
      updated_at: Math.floor(masterState.updated_at.getTime() / 1000) // MT5 expects seconds
    });
  } catch (error) {
    console.error('Positions API error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

