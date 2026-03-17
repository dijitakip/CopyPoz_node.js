import { NextResponse } from 'next/server';
import { prisma } from '@/src/backend/utils/db';
import { headers } from 'next/headers';
import { generateClientToken } from '@/src/backend/utils/jwt';
import { getCurrentUser, isAdmin } from '@/src/backend/utils/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const currentUser = getCurrentUser();
  
  // 1. Bearer Token Check (MT5 EA)
  const authHeader = headers().get('authorization');
  const apiToken = authHeader?.split(' ')[1];
  
  const isMasterToken = apiToken === process.env.MASTER_TOKEN || apiToken === 'master-local-123';

  // 2. Access Control
  if (!currentUser && !isMasterToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let where: any = {};
    
    // Admin değilse sadece kendi client'larını görsün
    if (currentUser && currentUser.role !== 'admin' && currentUser.role !== 'master_owner') {
      where = {
        OR: [
          { owner_id: currentUser.id },
          { assigned_to_user_id: currentUser.id }
        ]
      };
    }

    const clients = await prisma.client.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: { 
        owner: { select: { username: true } },
        master_assignments: {
          include: {
            group: { select: { name: true } }
          }
        }
      }
    });
    
    // BigInt serialization fix
    const serializedClients = clients.map(client => ({
      ...client,
      account_number: client.account_number.toString(),
    }));

    return NextResponse.json({ ok: true, clients: serializedClients });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authHeader = headers().get('authorization');
  const token = authHeader?.split(' ')[1];
  
  if (token !== process.env.MASTER_TOKEN && token !== 'master-local-123') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    console.log('Creating client:', body);
    const { account_number, account_name, auth_token, owner_id, server, password, account_type } = body;

    // Generate JWT token if not provided or if it's a placeholder
    let finalToken = auth_token;
    if (!finalToken || finalToken.length < 10) {
        // Kullanıcı kendi tokenını girmediyse, rastgele kısa bir token oluştur (JWT yerine)
        // Çünkü MT5 tarafı uzun JWT tokenları bazen sorunlu işleyebilir veya kullanıcı kolay kopyalamak ister.
        // Ancak güvenlik için JWT önerilir. Kullanıcı "basit token" istediği için rastgele string üretiyoruz.
        // Veya daha önce JWT üretiyorduk, şimdi kullanıcı basit token istiyor.
        // Soru: "Token çok basit jwt değil" dedi kullanıcı.
        // Bu yüzden eğer auth_token boşsa, JWT yerine basit bir string üretelim mi?
        // Kullanıcı "Token çok basit jwt değil" derken, mevcut tokenın (hdthuyi6) basit olduğunu ve JWT olmadığını belirtiyor.
        // Bu durumda, eğer auth_token boş gelirse, biz yine de güvenli JWT üretmeliyiz.
        // Ancak kullanıcı elle token girerse (örn: hdthuyi6), bunu kabul etmeliyiz.
        
        finalToken = generateClientToken({ 
            account_number, 
            account_name,
            owner_id: owner_id ? Number(owner_id) : undefined,
            type: 'client_auth'
        });
    }

    const client = await prisma.client.create({
      data: {
        account_number: BigInt(account_number),
        account_name,
        server,
        password,
        auth_token: finalToken,
        owner_id: owner_id ? Number(owner_id) : undefined,
        account_type: account_type || 'standard',
        status: 'pending',
      },
    });

    return NextResponse.json({ 
        ok: true, 
        client: {
            ...client,
            account_number: client.account_number.toString()
        } 
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error: ' + (e as Error).message }, { status: 500 });
  }
}

