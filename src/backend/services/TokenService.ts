import { prisma } from '../utils/db';
import { Decimal } from '@prisma/client/runtime/library';

export class TokenService {
  /**
   * Check if a client has enough token balance (min %20 collateral of their trading balance)
   */
  static async checkCollateral(clientId: number) {
    const results = await prisma.$queryRaw`
      SELECT id, is_master, balance, token_balance, min_collateral_rate, account_type 
      FROM clients 
      WHERE id = ${clientId}
    ` as any[];

    if (!results || results.length === 0) return { allowed: false, reason: 'Client not found' };
    const client = results[0];

    // Master accounts don't need collateral
    if (client.is_master) return { allowed: true };

    let balance = new Decimal(client.balance); // Trading balance (e.g., $100 or 10000 cents)
    
    // Cent account conversion: Balance is in cents, convert to dollars for token comparison
    if (client.account_type === 'cent') {
      balance = balance.div(100);
    }

    const tokenBalance = new Decimal(client.token_balance); // Jeton balance (e.g., $20)
    const minRate = new Decimal(client.min_collateral_rate); // e.g., 20%

    const requiredTokens = balance.mul(minRate).div(100);

    if (tokenBalance.lt(requiredTokens)) {
      return { 
        allowed: false, 
        reason: `Yetersiz Jeton. Gerekli teminat: ${requiredTokens.toFixed(2)}, Mevcut: ${tokenBalance.toFixed(2)}`,
        required: requiredTokens,
        current: tokenBalance
      };
    }

    return { allowed: true };
  }

  /**
   * Deduct commission from token balance
   */
  static async deductCommission(clientId: number, amount: Decimal) {
    return prisma.$executeRaw`
      UPDATE clients 
      SET token_balance = token_balance - ${amount} 
      WHERE id = ${clientId}
    `;
  }

  /**
   * Add tokens to client
   */
  static async addTokens(clientId: number, amount: number) {
    return prisma.$executeRaw`
      UPDATE clients 
      SET token_balance = token_balance + ${amount} 
      WHERE id = ${clientId}
    `;
  }

  /**
   * Add tokens to user
   */
  static async addUserTokens(userId: number, amount: number) {
    return prisma.$executeRaw`
      UPDATE users 
      SET token_balance = token_balance + ${amount} 
      WHERE id = ${userId}
    `;
  }

  /**
   * Transfer tokens from User to Client
   */
  static async transferToClient(userId: number, clientId: number, amount: number) {
    return prisma.$transaction(async (tx) => {
      // Deduct from user
      await tx.$executeRaw`
        UPDATE users 
        SET token_balance = token_balance - ${amount} 
        WHERE id = ${userId}
      `;

      // Add to client
      await tx.$executeRaw`
        UPDATE clients 
        SET token_balance = token_balance + ${amount} 
        WHERE id = ${clientId}
      `;
    });
  }

  /**
   * Withdraw tokens from Client to User
   * Ensures 20% collateral remains if account is active
   */
  static async withdrawFromClient(userId: number, clientId: number, amount: number) {
    return prisma.$transaction(async (tx) => {
      // 1. Get client data
      const clients = await tx.$queryRaw`
        SELECT id, balance, token_balance, min_collateral_rate, status, account_type 
        FROM clients 
        WHERE id = ${clientId} AND owner_id = ${userId}
      ` as any[];

      if (!clients || clients.length === 0) throw new Error('Client not found or not owned by user');
      const client = clients[0];

      let balance = new Decimal(client.balance);
      
      // Cent account conversion
      if (client.account_type === 'cent') {
        balance = balance.div(100);
      }

      const currentTokenBalance = new Decimal(client.token_balance);
      const minRate = new Decimal(client.min_collateral_rate || 20);
      const withdrawAmount = new Decimal(amount);

      // 2. Check if active and enforce 20% limit
      if (client.status === 'active') {
        const requiredCollateral = balance.mul(minRate).div(100);
        const maxWithdrawable = currentTokenBalance.minus(requiredCollateral);

        if (withdrawAmount.gt(maxWithdrawable)) {
          throw new Error(`Yetersiz serbest teminat. En az ${requiredCollateral.toFixed(2)} jeton hesapta kalmalıdır. Çekilebilir maksimum: ${maxWithdrawable.gt(0) ? maxWithdrawable.toFixed(2) : '0.00'}`);
        }
      } else {
        // If not active, can withdraw up to full balance
        if (withdrawAmount.gt(currentTokenBalance)) {
          throw new Error('Yetersiz bakiye.');
        }
      }

      // 3. Perform updates
      await tx.$executeRaw`
        UPDATE clients 
        SET token_balance = token_balance - ${amount} 
        WHERE id = ${clientId}
      `;

      await tx.$executeRaw`
        UPDATE users 
        SET token_balance = token_balance + ${amount} 
        WHERE id = ${userId}
      `;
    });
  }
}
