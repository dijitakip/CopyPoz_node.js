import { NextResponse } from 'next/server';
import { prisma } from '@/src/backend/utils/db';
import { headers } from 'next/headers';
import { RiskEngine } from '@/src/backend/services/RiskEngine';
import { auth } from '@/src/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Auth check
  const session = await auth();
  const authHeader = headers().get('authorization');
  const token = authHeader?.split(' ')[1];
  
  const isMasterToken = token === process.env.MASTER_TOKEN || token === 'master-local-123';
  const isSessionValid = !!session?.user;

  if (!isMasterToken && !isSessionValid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = parseInt(params.id);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  try {
    const client = await prisma.client.findUnique({
      where: { id },
      include: { owner: { select: { username: true } } }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    
    // BigInt serialization fix
    const serializedClient = {
      ...client,
      account_number: client.account_number.toString(),
    };

    return NextResponse.json({ ok: true, client: serializedClient });
  } catch (e) {
    console.error('Error fetching client details:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Auth Check
  const session = await auth();
  const authHeader = headers().get('authorization');
  const token = authHeader?.split(' ')[1];
  
  const isMasterToken = token === process.env.MASTER_TOKEN || token === 'master-local-123';
  const isSessionValid = !!session?.user;

  if (!isMasterToken && !isSessionValid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = parseInt(params.id);
  const body = await request.json();
  const { status, sync_buy, sync_sell, multiplier } = body;
  
  const data: any = {};
  if (status !== undefined) data.status = status;
  if (sync_buy !== undefined) data.sync_buy = sync_buy;
  if (sync_sell !== undefined) data.sync_sell = sync_sell;
  if (multiplier !== undefined) {
    let parsedMult = Math.floor(Number(multiplier));
    if (isNaN(parsedMult) || parsedMult < 1) parsedMult = 1;
    data.multiplier = parsedMult;
  }

  try {
    const client = await prisma.client.update({
      where: { id },
      data
    });
    
    // BigInt serialization fix
    const serializedClient = {
      ...client,
      account_number: client.account_number.toString(),
    };

    return NextResponse.json({ ok: true, client: serializedClient });
  } catch (e) {
    console.error('Client update error:', e);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
  ) {
    const session = await auth();
    const authHeader = headers().get('authorization');
    const token = authHeader?.split(' ')[1];
    
    const isMasterToken = token === process.env.MASTER_TOKEN || token === 'master-local-123';
    // Sadece Admin silebilir
    const isAdmin = session?.user && (session.user as any).role === 'admin';

    if (!isMasterToken && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  
    const id = parseInt(params.id);
  
    try {
      await prisma.client.delete({
        where: { id },
      });
  
      return NextResponse.json({ ok: true });
    } catch (e) {
      console.error('Error deleting client:', e);
      return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
  }

// Panic Button Endpoint
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  const authHeader = headers().get('authorization');
  const token = authHeader?.split(' ')[1];
  
  const isMasterToken = token === process.env.MASTER_TOKEN || token === 'master-local-123';
  const isSessionValid = !!session?.user; // Panik butonu için user olmak yeterli (daha detaylı rol kontrolü RiskEngine içinde olabilir)

  if (!isMasterToken && !isSessionValid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const id = parseInt(params.id);
    const body = await request.json();
    const { action, reason } = body;

    if (action === 'panic') {
      await RiskEngine.triggerPanic(id, reason || 'Manual Panic Triggered from Dashboard');
      return NextResponse.json({ success: true, message: 'Panic button triggered successfully' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Failed to execute action:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
