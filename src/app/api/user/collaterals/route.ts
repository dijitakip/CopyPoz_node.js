import { NextResponse } from 'next/server';
import { prisma } from '@/src/backend/utils/db';
import { getCurrentUser } from '@/src/backend/utils/auth';
import { TokenService } from '@/src/backend/services/TokenService';
import { CommissionService } from '@/src/backend/services/CommissionService';
import { Decimal } from '@prisma/client/runtime/library';

export async function GET() {
  const user = getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userResults = await prisma.$queryRaw`
      SELECT id, username, token_balance 
      FROM users 
      WHERE id = ${user.id}
    ` as any[];

    if (!userResults || userResults.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const userData = userResults[0];
    userData.token_balance = Number(userData.token_balance);

    const clientResults = await prisma.$queryRaw`
      SELECT id, account_number, account_name, token_balance, balance, status, min_collateral_rate, account_type
      FROM clients 
      WHERE owner_id = ${user.id}
    ` as any[];

    const formattedClients = await Promise.all(clientResults.map(async (c) => {
      const tokenBalance = new Decimal(c.token_balance || 0);
      const balance = new Decimal(c.balance || 0);
      const standardizedBalance = c.account_type === 'cent' ? balance.div(100) : balance;
      const minRate = new Decimal(c.min_collateral_rate || 20);
      
      const requiredCollateral = standardizedBalance.mul(minRate).div(100);
      const estimatedCommission = await CommissionService.estimateCurrentMonthCommission(c.id);
      const freeBalance = tokenBalance.minus(requiredCollateral).minus(estimatedCommission);

      return {
        id: c.id,
        account_number: c.account_number ? c.account_number.toString() : '0',
        account_name: c.account_name,
        token_balance: Number(tokenBalance),
        required_collateral: Number(requiredCollateral),
        estimated_commission: Number(estimatedCommission),
        free_token_balance: Number(freeBalance),
        balance: Number(balance),
        status: c.status
      };
    }));

    return NextResponse.json({ 
      ok: true, 
      data: { user: userData, clients: formattedClients } 
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { clientId, amount, type = 'deposit' } = await req.json();

    if (!clientId || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Geçersiz parametreler' }, { status: 400 });
    }

    if (type === 'deposit') {
      // Check user balance
      const userResults = await prisma.$queryRaw`
        SELECT token_balance FROM users WHERE id = ${user.id}
      ` as any[];

      if (!userResults || userResults.length === 0 || Number(userResults[0].token_balance) < amount) {
        return NextResponse.json({ error: 'Yetersiz bakiye' }, { status: 400 });
      }

      // Perform transfer
      await TokenService.transferToClient(user.id, clientId, amount);
      return NextResponse.json({ ok: true, message: 'Yükleme başarılı' });
    } else if (type === 'withdraw') {
      // Perform withdrawal with business logic inside service
      await TokenService.withdrawFromClient(user.id, clientId, amount);
      return NextResponse.json({ ok: true, message: 'Geri çekme başarılı' });
    } else {
      return NextResponse.json({ error: 'Geçersiz işlem tipi' }, { status: 400 });
    }
  } catch (e) {
    console.error('Collaterals API POST Error:', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'İşlem sırasında hata oluştu' }, { status: 500 });
  }
}
