import { prisma } from '../utils/db';
import { ClientStatus, CommandStatus } from '@prisma/client';

export class ClientService {
  /**
   * List all clients with basic stats
   */
  static async listClients() {
    return prisma.client.findMany({
      orderBy: { last_seen: 'desc' },
      select: {
        id: true,
        account_number: true,
        account_name: true,
        status: true,
        balance: true,
        equity: true,
        open_positions: true,
        last_seen: true,
      }
    });
  }

  /**
   * Find client by account number
   */
  static async findByAccountNumber(accountNumber: number) {
    return prisma.client.findFirst({
      where: { account_number: accountNumber },
    });
  }

  /**
   * Find client by ID
   */
  static async findById(id: number) {
    return prisma.client.findUnique({
      where: { id },
    });
  }

  /**
   * Register or update client from EA
   */
  static async registerOrUpdate(data: {
    account_number: number;
    account_name: string;
    balance: number;
    equity: number;
    open_positions: number;
    auth_token?: string;
    registration_token?: string;
  }) {
    // Check if client exists
    const existingClient = await this.findByAccountNumber(data.account_number);

    if (existingClient) {
      // Existing client - Validate token
      if (existingClient.auth_token !== data.auth_token) {
        throw new Error('Unauthorized - Invalid token');
      }

      // Update stats
      await prisma.client.update({
        where: { id: existingClient.id },
        data: {
          last_seen: new Date(),
          balance: data.balance,
          equity: data.equity,
          open_positions: data.open_positions,
          account_name: data.account_name,
        },
      });

      return { 
        client: existingClient, 
        token: existingClient.auth_token,
        isNew: false
      };
    } else {
      // New client - Validate registration token (MASTER_TOKEN)
      if (data.registration_token !== process.env.MASTER_TOKEN) {
        throw new Error('Unauthorized - Invalid registration token');
      }

      // Create new token
      const newToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      const newClient = await prisma.client.create({
        data: {
          account_number: data.account_number,
          account_name: data.account_name,
          auth_token: newToken,
          balance: data.balance,
          equity: data.equity,
          open_positions: data.open_positions,
          last_seen: new Date(),
          status: 'active',
        },
      });

      return { 
        client: newClient, 
        token: newToken,
        isNew: true
      };
    }
  }

  /**
   * Get pending command for client
   */
  static async getPendingCommand(clientId: number) {
    const command = await prisma.commandQueue.findFirst({
      where: {
        client_id: clientId,
        status: 'pending',
      },
      orderBy: { created_at: 'asc' },
    });

    if (command) {
      // Mark as executed immediately (as per legacy logic)
      await prisma.commandQueue.update({
        where: { id: command.id },
        data: {
          status: 'executed',
          executed_at: new Date(),
        },
      });
    }

    return command;
  }
}
