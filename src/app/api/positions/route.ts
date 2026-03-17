import { NextResponse } from 'next/server';
import { prisma } from '@/src/backend/utils/db';
import { headers } from 'next/headers';
import { verifyClientToken } from '@/src/backend/utils/jwt';
import { RiskEngine } from '@/src/backend/services/RiskEngine';

import { TradeEngine } from '@/src/backend/services/TradeEngine';

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
  let clientData: any = null;

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
        clientData = client;
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

    // SLIPPAGE CHECK & FILTERING & VOLUME CONVERSION
    let positionsToReturn = masterState.positions_json ? JSON.parse(masterState.positions_json) : [];
    
    // Eğer istek bir Client'tan geliyorsa (EA), Master hacimlerini Client'a göre ölçeklendir
    if (clientId && clientData && positionsToReturn.length > 0) {
      // Not: Master bakiyesini anlık alamıyorsak varsayılan veya master account verisinden çekmeliyiz.
      // Şimdilik basitleştirmek adına Master balance'ı 1000, account_type'ı 'standard' varsayıyoruz.
      // İdeal senaryoda Master hesap da veritabanında "is_master=true" olan bir client olarak tutulmalıdır.
      
      const masterClient = await prisma.client.findFirst({
        where: { is_master: true }
      });

      if (masterClient) {
        const masterBalance = Number(masterClient.balance) > 0 ? Number(masterClient.balance) : 1000;
        const masterType = masterClient.account_type || 'standard';

        positionsToReturn = positionsToReturn.map((pos: any) => {
          const scaledVolume = TradeEngine.calculateDynamicVolume(
            Number(pos.volume),
            masterBalance,
            masterType as 'standard' | 'cent',
            Number(clientData.balance),
            clientData.account_type as 'standard' | 'cent',
            Number(clientData.multiplier || 1.0)
          );

          return {
            ...pos,
            volume: scaledVolume
          };
        });
      }
    }

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

