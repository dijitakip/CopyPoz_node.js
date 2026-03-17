import { NextResponse } from 'next/server';
import { prisma } from '@/src/backend/utils/db';
import { headers } from 'next/headers';



export const dynamic = 'force-dynamic';

export async function GET() {
  const authHeader = headers().get('authorization');
  let bearer = '';
  if (authHeader) {
    if (authHeader.startsWith('Bearer ')) {
      bearer = authHeader.substring(7);
    } else {
      bearer = authHeader;
    }
  }
  const token = bearer;

  if (token !== process.env.MASTER_TOKEN && token !== 'master-local-123') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const command = await prisma.commandQueue.findFirst({
      where: { client_id: 0, status: 'pending' },
      orderBy: { created_at: 'asc' },
    });
    
    if (command) {
        // Mark as processing or executed to prevent loop
        await prisma.commandQueue.update({
            where: { id: command.id },
            data: { 
                status: 'executed',
                executed_at: new Date()
            }
        });
        
        return NextResponse.json({ 
            command: command.command,
            params: command.params,
            id: Number(command.id)
        });
    }
    
    return NextResponse.json(null);
  } catch (e) {
    console.error('Master command error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

