import { NextResponse } from 'next/server';
import { prisma } from '@/src/backend/utils/db';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Auth check
  const authHeader = headers().get('authorization');
  const token = authHeader?.split(' ')[1];
  
  // Basit auth kontrolü (Environment variable veya hardcoded local token)
  if (token !== process.env.MASTER_TOKEN && token !== 'master-local-123') {
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

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
  ) {
    const authHeader = headers().get('authorization');
    const token = authHeader?.split(' ')[1];
    
    if (token !== process.env.MASTER_TOKEN && token !== 'master-local-123') {
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
