import { NextResponse } from 'next/server';
import { prisma } from '@/src/backend/utils/db';
import { getCurrentUser } from '@/src/backend/utils/auth';

export async function GET() {
  const user = getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userResults = await prisma.$queryRaw`
      SELECT id, referral_code, commission_rate 
      FROM users 
      WHERE id = ${user.id}
    ` as any[];

    if (!userResults || userResults.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    let userData = userResults[0];

    // If user has no referral code (old user), generate one
    if (!userData.referral_code) {
      const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      try {
        await prisma.$executeRaw`
          UPDATE users 
          SET referral_code = ${newCode} 
          WHERE id = ${user.id}
        `;
        userData.referral_code = newCode;
      } catch (e) {
        console.error('Failed to generate referral code', e);
      }
    }

    const referredUsersRaw = await prisma.$queryRaw`
      SELECT id, username, email, created_at
      FROM users
      WHERE referred_by_id = ${user.id}
    ` as any[];

    // For each referred user, get their clients
    const summary = await Promise.all(referredUsersRaw.map(async (u) => {
      const clients = await prisma.$queryRaw`
        SELECT id, account_number, account_name, balance, equity, status, open_positions
        FROM clients
        WHERE owner_id = ${u.id}
      ` as any[];

      const totalBalance = clients.reduce((sum, c) => sum + Number(c.balance), 0);
      const totalEquity = clients.reduce((sum, c) => sum + Number(c.equity), 0);
      const totalPositions = clients.reduce((sum, c) => sum + Number(c.open_positions), 0);
      
      return {
        id: u.id,
        username: u.username,
        email: u.email,
        clientCount: clients.length,
        totalBalance,
        totalEquity,
        totalPositions,
        clients: clients.map(c => ({
          ...c,
          account_number: c.account_number ? c.account_number.toString() : '0',
          balance: Number(c.balance),
          equity: Number(c.equity),
          open_positions: Number(c.open_positions)
        }))
      };
    }));

    return NextResponse.json({ 
      ok: true, 
      referral_code: userData.referral_code,
      commission_rate: Number(userData.commission_rate),
      referred_users: summary 
    });
  } catch (e) {
    console.error('Referrals API Error:', e);
    return NextResponse.json({ error: 'Server error: ' + (e instanceof Error ? e.message : String(e)) }, { status: 500 });
  }
}
