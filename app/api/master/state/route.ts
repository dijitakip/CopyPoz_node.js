import { NextResponse } from 'next/server';
import { MasterService } from '@repo/backend-core';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const authHeader = headers().get('authorization');
  const token = authHeader?.split(' ')[1];
  if (token !== process.env.MASTER_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { total_positions, positions_json } = body || {};
    if (typeof total_positions !== 'number' || typeof positions_json !== 'string') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    await MasterService.updateMasterState({ total_positions, positions_json });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
