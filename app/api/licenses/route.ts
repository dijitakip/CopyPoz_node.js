import { NextResponse } from 'next/server';
import { prisma } from '@repo/backend-core/utils/db';
import { headers } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const authHeader = headers().get('authorization');
  const token = authHeader?.split(' ')[1];
  
  if (token !== process.env.MASTER_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const licenses = await prisma.license.findMany({
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({ ok: true, licenses });
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authHeader = headers().get('authorization');
  const token = authHeader?.split(' ')[1];
  
  if (token !== process.env.MASTER_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { license_key, type, max_clients, expiry_days } = body;

    if (!license_key || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const expiryDate = new Date(Date.now() + (expiry_days || 30) * 24 * 60 * 60 * 1000);

    const license = await prisma.license.create({
      data: {
        license_key,
        type,
        status: 'active',
        max_clients: max_clients || 1,
        expiry_date: expiryDate,
      },
    });

    return NextResponse.json({ ok: true, license });
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
