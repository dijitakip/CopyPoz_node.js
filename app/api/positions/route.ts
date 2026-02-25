import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';



export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const authHeader = headers().get('authorization');
  const token = authHeader?.split(' ')[1];

  if (token !== process.env.MASTER_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const masterState = await prisma.masterState.findUnique({
      where: { id: 1 },
    });
    return NextResponse.json({ 
      positions: masterState?.positions_json ? JSON.parse(masterState.positions_json) : [] 
    });
  } catch (error) {
    console.error('Positions API error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

