import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import { NextRequest } from 'next/server';



export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const accountStr = url.searchParams.get('account_number');
    const authHeader = headers().get('authorization');
    const bearer = authHeader?.split(' ')[1];
    const token = url.searchParams.get('token') || bearer || '';

    if (!accountStr || !token) {
      return NextResponse.json({ error: 'Missing account_number or token' }, { status: 400 });
    }
    const account_number = Number(accountStr);
    if (Number.isNaN(account_number)) {
      return NextResponse.json({ error: 'Invalid account_number' }, { status: 400 });
    }

    const client = await prisma.client.findUnique({
      where: { account_number },
    });
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    if (client.auth_token !== token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const command = await prisma.commandQueue.findFirst({
      where: { client_id: client.id, status: 'pending' },
      orderBy: { created_at: 'asc' },
    });
    return NextResponse.json({ command: command ?? null });
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

