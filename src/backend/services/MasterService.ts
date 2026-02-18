import { prisma } from '../utils/db';
import { CommandStatus } from '@prisma/client';

export class MasterService {
  /**
   * Get master state (positions)
   */
  static async getMasterState() {
    return prisma.masterState.findFirst({
      where: { id: 1 },
      select: {
        total_positions: true,
        positions_json: true,
        updated_at: true,
      },
    });
  }

  /**
   * Update master state from EA
   */
  static async updateMasterState(data: {
    total_positions: number;
    positions_json: string;
  }) {
    return prisma.masterState.upsert({
      where: { id: 1 },
      update: {
        total_positions: data.total_positions,
        positions_json: data.positions_json,
        updated_at: new Date(),
      },
      create: {
        id: 1,
        total_positions: data.total_positions,
        positions_json: data.positions_json,
      },
    });
  }

  /**
   * Get pending command for master (client_id=0)
   */
  static async getPendingCommand() {
    const command = await prisma.commandQueue.findFirst({
      where: {
        client_id: 0,
        status: 'pending',
      },
      orderBy: { created_at: 'asc' },
    });

    if (command) {
      // Mark as executed immediately
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

  /**
   * Queue command for Master
   */
  static async queueCommand(command: string, params?: string) {
    return prisma.commandQueue.create({
      data: {
        client_id: 0,
        command,
        params,
        status: 'pending',
      },
    });
  }
}
