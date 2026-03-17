import { NextResponse } from 'next/server';
import { prisma } from '@/src/backend/utils/db';
import { getCurrentUser } from '@/src/backend/utils/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const logs = await prisma.systemLog.findMany({
      orderBy: { created_at: 'desc' },
      take: 100,
      include: {
        user: {
          select: {
            username: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({ 
        ok: true, 
        logs 
    });
  } catch (e) {
    console.error('Error fetching system logs:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
