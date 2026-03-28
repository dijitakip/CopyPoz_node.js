import { NextResponse } from 'next/server';
import { prisma } from '@/src/backend/utils/db';
import { auth } from '@/src/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = Number(session.user.id);

    const clients = await prisma.$queryRaw`
      SELECT id, account_number, account_name, server, password, auth_token, balance, equity, status, open_positions, created_at, account_type, multiplier
      FROM clients
      WHERE owner_id = ${userId}
    ` as any[];

    const formattedClients = clients.map(c => ({
      ...c,
      account_number: c.account_number ? c.account_number.toString() : '0',
      balance: Number(c.balance),
      equity: Number(c.equity),
      open_positions: Number(c.open_positions),
      multiplier: Number(c.multiplier || 1)
    }));

    return NextResponse.json({ ok: true, clients: formattedClients });
  } catch (e) {
    console.error('User Clients API GET Error:', e);
    return NextResponse.json({ error: 'Server error: ' + (e instanceof Error ? e.message : String(e)) }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = Number(session.user.id);

    const body = await req.json();
    const { id, account_name, server, password, account_type, multiplier } = body;

    const checkResults = await prisma.$queryRaw`
      SELECT id FROM clients WHERE id = ${Number(id)} AND owner_id = ${userId}
    ` as any[];

    if (!checkResults || checkResults.length === 0) {
      return NextResponse.json({ error: 'Client bulunamadı veya yetkiniz yok' }, { status: 404 });
    }

    let parsedMultiplier = Number(multiplier);
    if (isNaN(parsedMultiplier) || parsedMultiplier < 1) {
      parsedMultiplier = 1;
    }
    // Sadece tam sayıya izin ver
    parsedMultiplier = Math.floor(parsedMultiplier);

    // Cent hesap için max 10x kontrolü
    if (account_type === 'cent' && parsedMultiplier > 10) {
      return NextResponse.json({ error: 'Cent hesaplar için maksimum çarpan 10 olabilir.' }, { status: 400 });
    }

    await prisma.$executeRaw`
      UPDATE clients 
      SET account_name = ${account_name}, server = ${server}, password = ${password}, account_type = ${account_type || 'standard'}, multiplier = ${parsedMultiplier}
      WHERE id = ${Number(id)}
    `;

    return NextResponse.json({ ok: true, message: 'Client başarıyla güncellendi' });
  } catch (e) {
    console.error('User Clients API PUT Error:', e);
    return NextResponse.json({ error: 'Güncelleme sırasında hata oluştu: ' + (e instanceof Error ? e.message : String(e)) }, { status: 500 });
  }
}
