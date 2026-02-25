import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';



export const dynamic = 'force-dynamic';

export async function GET() {
  const authHeader = headers().get('authorization');
  const token = authHeader?.split(' ')[1];
  
  if (token !== process.env.MASTER_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const state = await prisma.masterState.findUnique({
      where: { id: 1 },
    });
    const positions = state?.positions_json ? JSON.parse(state.positions_json) : [];
    
    return NextResponse.json({
      ok: true,
      total_positions: state?.total_positions || 0,
      positions,
      updated_at: state?.updated_at,
    });
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

