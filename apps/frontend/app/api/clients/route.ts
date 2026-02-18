import { NextResponse } from 'next/server';
import { ClientService } from '@repo/backend-core';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Validate Master Token
  const authHeader = headers().get('authorization');
  const token = authHeader?.split(' ')[1];

  if (token !== process.env.MASTER_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const clients = await ClientService.listClients();
    return NextResponse.json({ clients });
  } catch (error) {
    console.error('Clients API error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
