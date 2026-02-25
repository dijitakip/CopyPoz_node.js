import { NextResponse } from 'next/server';
import { prisma } from '@repo/backend-core/utils/db';
import { headers } from 'next/server';

export const dynamic = 'force-dynamic';

// GET all master groups
export async function GET() {
  const authHeader = headers().get('authorization');
  const token = authHeader?.split(' ')[1];
  
  if (token !== process.env.MASTER_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const groups = await prisma.masterGroup.findMany({
      include: {
        assignments: {
          include: { client: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({ ok: true, groups });
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST create master group
export async function POST(request: Request) {
  const authHeader = headers().get('authorization');
  const token = authHeader?.split(' ')[1];
  
  if (token !== process.env.MASTER_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description, created_by } = body;

    if (!name || !created_by) {
      return NextResponse.json({ error: 'Missing name or created_by' }, { status: 400 });
    }

    const group = await prisma.masterGroup.create({
      data: {
        name,
        description: description || null,
        created_by: parseInt(created_by),
      },
    });

    return NextResponse.json({ ok: true, group });
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
