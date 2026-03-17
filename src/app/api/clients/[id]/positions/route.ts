import { NextResponse } from 'next/server';
import { prisma } from '@/src/backend/utils/db';
import { headers } from 'next/headers';
import { isSubscriptionActive, getCurrentUser } from '@/src/backend/utils/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = parseInt(params.id);
    if (isNaN(clientId)) {
      return NextResponse.json({ error: 'Invalid Client ID' }, { status: 400 });
    }

    // 1. Check subscription
    const active = await isSubscriptionActive(clientId);
    if (!active) {
      return NextResponse.json({ 
        error: 'Subscription expired or pending payment approval. Please pay your commission to continue copying.',
        status: 'suspended'
      }, { status: 403 });
    }

    // Auth check
    const authHeader = headers().get('authorization');
    const token = authHeader?.split(' ')[1];
    const user = getCurrentUser();
    
    // Master token or User session check
    const isMasterToken = token === process.env.MASTER_TOKEN || token === 'master-local-123';
    
    if (!isMasterToken && !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { last_seen: true, status: true, sync_buy: true, sync_sell: true, owner_id: true, assigned_to_user_id: true }
    });

    const isOwner = user ? (client?.owner_id === user.id || client?.assigned_to_user_id === user.id) : false;

    // Eğer admin değilse ve master token değilse, sahiplik kontrolü yap
    if (!isMasterToken && user?.role !== 'admin' && user?.role !== 'master_owner' && !isOwner && user?.role !== 'trader') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const positions = await prisma.position.findMany({
      where: { client_id: clientId },
      orderBy: { open_time: 'desc' }
    });

    // BigInt serialization fix
    const serializedPositions = positions.map(pos => ({
        ...pos,
        ticket: pos.ticket.toString(),
        volume: Number(pos.volume),
        open_price: Number(pos.open_price),
        sl: pos.sl ? Number(pos.sl) : null,
        tp: pos.tp ? Number(pos.tp) : null,
        current_price: pos.current_price ? Number(pos.current_price) : null,
        profit: pos.profit ? Number(pos.profit) : null,
        swap: pos.swap ? Number(pos.swap) : 0,
        commission: pos.commission ? Number(pos.commission) : 0,
    }));

    return NextResponse.json({ 
        ok: true, 
        positions: serializedPositions,
        last_seen: client?.last_seen,
        status: client?.status,
        sync_buy: client?.sync_buy,
        sync_sell: client?.sync_sell,
        is_owner: isOwner
    });
  } catch (e) {
    console.error('Error fetching client positions:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
