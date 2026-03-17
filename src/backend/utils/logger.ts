import { prisma } from './db';
import { LogLevel } from '@prisma/client';
import { getCurrentUser } from './auth';

export async function logAction(
  action: string, 
  details: string | object | null = null, 
  userId: number | null = null, 
  level: LogLevel = 'INFO',
  ipAddress: string | null = null
) {
  try {
    // If userId is not provided, try to get it from current session
    let effectiveUserId = userId;
    if (!effectiveUserId) {
      try {
        const currentUser = getCurrentUser();
        if (currentUser) {
          effectiveUserId = currentUser.id;
        }
      } catch (e) {
        // next/headers might not be available outside of request context
      }
    }

    const detailStr = details 
      ? (typeof details === 'string' ? details : JSON.stringify(details)) 
      : null;

    await prisma.systemLog.create({
      data: {
        action,
        details: detailStr,
        user_id: effectiveUserId,
        level,
        ip_address: ipAddress
      }
    });
  } catch (error) {
    console.error('Logging failed:', error);
  }
}
