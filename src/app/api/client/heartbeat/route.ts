import { NextResponse } from 'next/server';
import { prisma } from '@/src/backend/utils/db';
import { headers } from 'next/headers';
import { verifyClientToken } from '@/src/backend/utils/jwt';
import { logAction } from '@/src/backend/utils/logger';
import { isSubscriptionActive } from '@/src/backend/utils/auth';
import { RiskEngine } from '@/src/backend/services/RiskEngine';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      account_number,
      account_name,
      balance,
      equity,
      open_positions,
      is_syncing,
      sync_buy,
      sync_sell,
      positions,
      auth_token: bodyToken
    } = body;

    const { searchParams } = new URL(request.url);
    const queryToken = searchParams.get('token');
    const authHeader = headers().get('authorization');
    
    let bearer = '';
    if (authHeader) {
      if (authHeader.startsWith('Bearer ')) {
        bearer = authHeader.substring(7);
      } else {
        bearer = authHeader;
      }
    }
    
    const token = bodyToken || queryToken || bearer;
    
    if (!token) {
        return NextResponse.json({ error: 'Missing token' }, { status: 401 });
    }

    if (!account_number) {
        return NextResponse.json({ error: 'Missing account number' }, { status: 400 });
    }

    // 1. Token Doğrulama
    const decoded = verifyClientToken(token);
    
    if (!decoded) {
        if (token === process.env.MASTER_TOKEN || token === 'master-local-123') {
             // Master token OK
        } else {
             const existingClient = await prisma.client.findFirst({
                 where: { auth_token: token }
             });
             if (!existingClient) {
                 return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
             }
        }
    }

    // 2. Client Bul veya Oluştur
    let ownerId = null;
    if (decoded && decoded.user_id) {
        ownerId = decoded.user_id;
    }

    let client = await prisma.client.findUnique({
      where: { account_number: BigInt(account_number) },
    });

    const isNew = !client;
    
    if (isNew) {
      client = await prisma.client.create({
        data: {
          account_number: BigInt(account_number),
          account_name: account_name || `Client ${account_number}`,
          balance: parseFloat(balance) || 0,
          equity: parseFloat(equity) || 0,
          open_positions: parseInt(open_positions) || 0,
          sync_buy: sync_buy === true || sync_buy === "true",
          sync_sell: sync_sell === true || sync_sell === "true",
          auth_token: token,
          owner_id: ownerId ? Number(ownerId) : undefined,
          status: is_syncing === false ? 'paused' : 'active',
        },
      });
      console.log(`New client registered: ${account_number}`);
      await logAction('CLIENT_REGISTERED', { account_number: account_number.toString(), account_name: client.account_name, client_id: client.id }, ownerId ? Number(ownerId) : null);
    } else {
      const updateData: any = {
          balance: parseFloat(balance) || 0,
          equity: parseFloat(equity) || 0,
          open_positions: parseInt(open_positions) || 0,
          last_seen: new Date(),
      };
      
      if (is_syncing !== undefined) {
          const newStatus = is_syncing ? 'active' : 'paused';
          if (client.status !== newStatus) updateData.status = newStatus;
      }
      if (sync_buy !== undefined) {
          updateData.sync_buy = (sync_buy === true || sync_buy === "true");
      }
      if (sync_sell !== undefined) {
          updateData.sync_sell = (sync_sell === true || sync_sell === "true");
      }
      if (!client.owner_id && ownerId) {
          updateData.owner_id = ownerId;
      }
      if (client.auth_token !== token && token !== process.env.MASTER_TOKEN && token !== 'master-local-123') {
           updateData.auth_token = token;
      }

      client = await prisma.client.update({
        where: { account_number: BigInt(account_number) },
        data: updateData,
      });
    }

    const clientId = client.id;

    // 3. Check Subscription
    const active = await isSubscriptionActive(clientId);
    if (!active) {
        return NextResponse.json({ 
            error: 'Subscription suspended or insufficient collateral.',
            sync_enabled: false 
        }, { status: 403 });
    }

    // 4. Update Positions
    if (positions && Array.isArray(positions)) {
        await prisma.$transaction(async (tx) => {
            await tx.position.deleteMany({
                where: { client_id: clientId }
            });

            if (positions.length > 0) {
                await tx.position.createMany({
                    data: positions.map((pos: any) => ({
                        client_id: clientId,
                        ticket: BigInt(pos.ticket),
                        symbol: pos.symbol,
                        type: parseInt(pos.type),
                        volume: parseFloat(pos.volume),
                        open_price: parseFloat(pos.open_price || pos.price),
                        sl: pos.sl ? parseFloat(pos.sl) : null,
                        tp: pos.tp ? parseFloat(pos.tp) : null,
                        current_price: pos.current_price ? parseFloat(pos.current_price) : null,
                        profit: pos.profit ? parseFloat(pos.profit) : null,
                        swap: pos.swap ? parseFloat(pos.swap) : 0,
                        commission: pos.commission ? parseFloat(pos.commission) : 0,
                        open_time: new Date(pos.open_time * 1000)
                    }))
                });
            }
        });
    }

    // 5. Check Real-Time Equity Protection
    const riskCheck = await RiskEngine.checkEquityProtection(clientId);
    if (riskCheck.triggered) {
        return NextResponse.json({
            ok: false,
            error: `Panic triggered: ${riskCheck.reason}`,
            sync_enabled: false,
            panic_mode: true
        });
    }

    // 6. Update Daily Performance Log (Async)
    RiskEngine.logDailyPerformance(clientId).catch(console.error);

    return NextResponse.json({
      ok: true,
      client_id: clientId,
      auth_token: client.auth_token,
      multiplier: Number(client.multiplier || 1.0),
      account_type: client.account_type,
      isNew,
    });

  } catch (e) {
    console.error('Heartbeat error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
