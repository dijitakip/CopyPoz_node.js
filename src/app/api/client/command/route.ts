import { NextResponse } from 'next/server';
import { prisma } from '@/src/backend/utils/db';
import { headers } from 'next/headers';
import { NextRequest } from 'next/server';
import { logAction } from '@/src/backend/utils/logger';
import { getCurrentUser, isTrader } from '@/src/backend/utils/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const authHeader = headers().get('authorization');
    const ip = headers().get('x-forwarded-for') || '127.0.0.1';
    const user = getCurrentUser();
    
    // Authorization Check:
    // 1. Master Token (for EA or System)
    // 2. User Session with Trader role (for Web UI)
    
    let bearer = '';
    if (authHeader) {
      if (authHeader.startsWith('Bearer ')) {
        bearer = authHeader.substring(7);
      } else {
        bearer = authHeader;
      }
    }
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token') || bearer || '';

    const isMasterToken = token === process.env.MASTER_TOKEN || token === 'master-local-123';
    const isAuthorizedTrader = isTrader(user);

    if (!isMasterToken && !isAuthorizedTrader) {
      return NextResponse.json({ error: 'Unauthorized. Trader role required.' }, { status: 401 });
    }

    const body = await req.json();
    const { client_id, command, params } = body;

    if (!client_id || !command) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const cmd = await prisma.commandQueue.create({
        data: {
            client_id: Number(client_id),
            command,
            params: params ? (typeof params === 'string' ? params : JSON.stringify(params)) : null,
            status: 'pending'
        }
    });

    await logAction('COMMAND_QUEUED', { client_id, command, params, command_id: cmd.id }, user?.id || null, 'INFO', typeof ip === 'string' ? ip : ip[0]);

    return NextResponse.json({ ok: true, command: cmd });
  } catch (e) {
    console.error('Command post error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const accountStr = url.searchParams.get('account_number');
    const authHeader = headers().get('authorization');
    let bearer = '';
    if (authHeader) {
      if (authHeader.startsWith('Bearer ')) {
        bearer = authHeader.substring(7);
      } else {
        bearer = authHeader;
      }
    }
    const token = url.searchParams.get('token') || bearer || '';

    if (!accountStr || !token) {
      return NextResponse.json({ error: 'Missing account_number or token' }, { status: 400 });
    }
    
    // BigInt dönüşümü
    const account_number = BigInt(accountStr);
    
    // Client bul
    const client = await prisma.client.findUnique({
      where: { account_number },
    });
    
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    
    // Token kontrolü
    const isMasterToken = token === process.env.MASTER_TOKEN || token === 'master-local-123';
    if (client.auth_token !== token && !isMasterToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Bekleyen komut var mı?
    const command = await prisma.commandQueue.findFirst({
      where: { client_id: client.id, status: 'pending' },
      orderBy: { created_at: 'asc' },
    });
    
    if (command) {
        // Durumu 'processing' yap
        await prisma.commandQueue.update({
            where: { id: command.id },
            data: { 
                status: 'processing',
                executed_at: new Date()
            }
        });

        // JSON Serialization için BigInt alanlarını stringe çevir
        const serializedCommand = {
            ...command,
            id: Number(command.id),
            client_id: Number(command.client_id)
        };
        
        return NextResponse.json({ command: serializedCommand });
    }

    return NextResponse.json({ command: null });
  } catch (e: any) {
    console.error('Command GET Error Details:', e);
    // Hatanın stack trace'ini ve detayını döndür
    return NextResponse.json({ 
        error: 'Server error', 
        message: e.message,
        stack: e.stack 
    }, { status: 500 });
  }
}

// Yeni: Komut Tamamlama (Feedback) Endpoint'i
export async function PUT(req: Request) {
  try {
    const authHeader = headers().get('authorization');
    let bearer = '';
    if (authHeader) {
      if (authHeader.startsWith('Bearer ')) {
        bearer = authHeader.substring(7);
      } else {
        bearer = authHeader;
      }
    }
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token') || bearer || '';

    const body = await req.json();
    const { command_id, status, result_message } = body;

    if (!command_id || !status) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const command = await prisma.commandQueue.findUnique({
        where: { id: Number(command_id) },
        include: { client: true }
    });

    if (!command) {
        return NextResponse.json({ error: 'Command not found' }, { status: 404 });
    }

    const isMasterToken = token === process.env.MASTER_TOKEN || token === 'master-local-123';
    if (command.client.auth_token !== token && !isMasterToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Durumu güncelle
    await prisma.commandQueue.update({
        where: { id: Number(command_id) },
        data: {
            status: status === 'success' ? 'executed' : 'failed',
            result_message: result_message || null,
            executed_at: new Date() // Bitiş zamanı olarak güncelle
        }
    });

    // Eğer komut başarılıysa ve bir ayar değişikliği ise, Client tablosunu da hemen güncelle
    if (status === 'success') {
        const updateData: any = {};
        if (command.command === 'PAUSE') updateData.status = 'paused';
        if (command.command === 'RESUME') updateData.status = 'active';
        if (command.command === 'CLOSE_ALL') updateData.status = 'inactive'; // Panik sonrası pasif kalmalı
        if (command.command === 'PAUSE_BUY') updateData.sync_buy = false;
        if (command.command === 'RESUME_BUY') updateData.sync_buy = true;
        if (command.command === 'PAUSE_SELL') updateData.sync_sell = false;
        if (command.command === 'RESUME_SELL') updateData.sync_sell = true;
        
        // Kısmi Kapanış desteği
        if (command.command === 'CLOSE_PARTIAL') {
          // Normalde burada partial close sonrası asıl pozisyon hacminin güncellenmesi gerekir,
          // Ancak EA zaten heartbeat ile yeni pozisyon listesini (kalan hacimle) gönderecektir.
          // O yüzden DB'de anlık bir pozisyon update'ine gerek yok, heartbeat'i beklemek yeterli.
        }

        if (Object.keys(updateData).length > 0) {
            await prisma.client.update({
                where: { id: command.client_id },
                data: updateData
            });
        }
    }

    await logAction('COMMAND_EXECUTED', { 
        command_id, 
        status, 
        result_message,
        command: command.command,
        client_id: command.client_id
    }, null, status === 'success' ? 'INFO' : 'ERROR');

    return NextResponse.json({ ok: true });

  } catch (e) {
    console.error('Command update error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

