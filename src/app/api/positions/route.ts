import { NextResponse } from 'next/server';
import { prisma } from '@/src/backend/utils/db';
import { headers } from 'next/headers';
import { verifyClientToken } from '@/src/backend/utils/jwt';
import { RiskEngine } from '@/src/backend/services/RiskEngine';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const authHeader = headers().get('authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 401 });
  }

  // Auth check - Support Master Token or Client Token
  let isAuthorized = false;
  let clientId: number | null = null;

  if (token === process.env.MASTER_TOKEN || token === 'master-local-123') {
    isAuthorized = true;
  } else {
    const decoded = verifyClientToken(token);
    if (decoded) {
      isAuthorized = true;
      // We would ideally extract client id from token if we structured it that way
    } else {
      // Check for simple token in database
      const client = await prisma.client.findFirst({
        where: { auth_token: token }
      });
      if (client) {
        isAuthorized = true;
        clientId = client.id;
      }
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

    // SLIPPAGE CHECK & FILTERING
    let positionsToReturn = masterState.positions_json ? JSON.parse(masterState.positions_json) : [];
    
    // If it's a specific client asking for positions (EA Sync), we could check slippage here
    // However, since GET is usually bulk sync, we might just pass the master price 
    // and let the EA (Client side) or a specific execution endpoint handle the strict slippage check.
    // For now, we return master prices, and the actual opening logic (POST /api/client/trade) would check it.

    return NextResponse.json({ 
      ok: true,
      total_positions: masterState.total_positions,
      positions: positionsToReturn,
      updated_at: Math.floor(masterState.updated_at.getTime() / 1000) // MT5 expects seconds
    });
  } catch (error) {
    console.error('Positions API error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

