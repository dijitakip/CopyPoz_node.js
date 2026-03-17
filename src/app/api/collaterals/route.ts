import { NextResponse } from 'next/server';
import { prisma } from '@/src/backend/utils/db';
import { getCurrentUser } from '@/src/backend/utils/auth';
import { CommissionService } from '@/src/backend/services/CommissionService';
import { Decimal } from '@prisma/client/runtime/library';

export async function GET() {
  try {
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = currentUser.role === 'admin';

    // Fetch users: Admin sees all, others see only themselves
    const users = await (isAdmin 
      ? prisma.$queryRaw`
          SELECT id, username, email, token_balance, role 
          FROM users 
          WHERE deleted_at IS NULL 
          ORDER BY token_balance DESC
        `
      : prisma.$queryRaw`
          SELECT id, username, email, token_balance, role 
          FROM users 
          WHERE id = ${currentUser.id} AND deleted_at IS NULL
        `
    ) as any[];

    // Fetch clients: Admin sees all, others see only their own
    const clients = await (isAdmin
      ? prisma.$queryRaw`
          SELECT c.id, c.account_number, c.account_name, c.token_balance, c.status, u.username as owner_username, 
                 c.balance, c.min_collateral_rate, c.account_type
          FROM clients c
          LEFT JOIN users u ON c.owner_id = u.id
          ORDER BY c.token_balance DESC
        `
      : prisma.$queryRaw`
          SELECT c.id, c.account_number, c.account_name, c.token_balance, c.status, u.username as owner_username,
                 c.balance, c.min_collateral_rate, c.account_type
          FROM clients c
          LEFT JOIN users u ON c.owner_id = u.id
          WHERE c.owner_id = ${currentUser.id}
          ORDER BY c.token_balance DESC
        `
    ) as any[];

    // BigInt conversion for clients and Decimal conversion
    const formattedClients = await Promise.all(clients.map(async (c) => {
        try {
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
                status: c.status,
                owner: { username: c.owner_username }
            };
        } catch (err) {
            console.error('Error formatting client:', c.id, err);
            return { 
              ...c, 
              account_number: c.account_number?.toString() || '0', 
              token_balance: Number(c.token_balance || 0),
              required_collateral: 0,
              estimated_commission: 0,
              free_token_balance: 0,
              owner: { username: c.owner_username }
            };
        }
    }));
    
    const formattedUsers = users.map(u => {
        try {
            return {
                ...u,
                token_balance: u.token_balance !== null ? Number(u.token_balance) : 0
            };
        } catch (err) {
            return { ...u, token_balance: 0 };
        }
    });

    return NextResponse.json({ 
      ok: true, 
      data: { 
        users: formattedUsers, 
        clients: formattedClients,
        isAdmin: isAdmin,
        currentUser: { id: currentUser.id, username: currentUser.username, role: currentUser.role }
      } 
    });
  } catch (e) {
    console.error('Collaterals API Error:', e);
    return NextResponse.json({ error: 'Server error: ' + (e instanceof Error ? e.message : String(e)) }, { status: 500 });
  }
}
