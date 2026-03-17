import { cookies, headers } from 'next/headers';
import { verifyClientToken, generateClientToken } from './jwt';

export interface SessionUser {
  id: number;
  username: string;
  role: string;
}

const SESSION_COOKIE_NAME = 'session_token';

export function getCurrentUser(): SessionUser | null {
  // 1. Try to get from Authorization header (API / JWT) - CHECK THIS FIRST for Master Token
  const authHeader = headers().get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    // Master token check (highest priority)
    const masterToken = process.env.MASTER_TOKEN || 'master-local-123';
    if (token === masterToken) {
      return {
        id: 1, // Default admin id
        username: 'admin',
        role: 'admin'
      };
    }

    const decoded = verifyClientToken(token);
    if (decoded && decoded.user_id) {
      return {
        id: decoded.user_id,
        username: decoded.username || 'api_user',
        role: decoded.role || 'user'
      };
    }
  }

  // 2. Try to get from session cookie (Web UI)
  const sessionToken = cookies().get(SESSION_COOKIE_NAME);
  if (sessionToken?.value) {
    try {
      const decoded = verifyClientToken(sessionToken.value);
      if (decoded && decoded.id) {
        return {
          id: decoded.id,
          username: decoded.username,
          role: decoded.role || 'user'
        };
      }
    } catch (e) {
      console.error('Failed to verify session token');
    }
  }

  return null;
}

export function createSession(user: SessionUser) {
  const token = generateClientToken({
    id: user.id,
    username: user.username,
    role: user.role
  }, '7d');

  cookies().set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7 // 1 week
  });
}

export function clearSession() {
  cookies().delete(SESSION_COOKIE_NAME);
}

export function hasRole(user: SessionUser | null, roles: string[]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}

export function isAdmin(user: SessionUser | null): boolean {
  return hasRole(user, ['admin']);
}

export function isMasterOwner(user: SessionUser | null): boolean {
  return hasRole(user, ['admin', 'master_owner', 'trader']);
}

export function isTrader(user: SessionUser | null): boolean {
  return hasRole(user, ['admin', 'master_owner', 'trader']);
}

export function isViewer(user: SessionUser | null): boolean {
  return hasRole(user, ['admin', 'master_owner', 'trader', 'viewer']);
}

import { TokenService } from '../services/TokenService';

export async function isSubscriptionActive(clientId: number): Promise<boolean> {
  const client = await prisma.client.findUnique({
    where: { id: clientId }
  });

  if (!client) return false;
  
  // 1. Check for manual status (paused/suspended)
  // EA tarafında pause olması subscription'ı tamamen kapatmamalı, sadece sync durmalı. 
  // Ama heartbeat'in reddedilmesi EA tarafında 403 hatasına neden oluyor.
  // Bu nedenle status='paused' durumunu heartbeat'i bloke edecek bir şey olarak görmemeliyiz.
  // Heartbeat çalışmaya devam etmeli ama 'sync_enabled: false' dönmeli ki EA kopyalama yapmasın.
  if (client.status === 'suspended') return false;

  // 2. Check for Jeton Collateral (Minimum %20)
  const collateral = await TokenService.checkCollateral(clientId);
  if (!collateral.allowed) {
    // If not master account and not enough tokens, suspend syncing
    if (!client.is_master) return false;
  }
  
  // 3. Subscription Status
  if (client.subscription_status === 'active') return true;
  
  // Varsayılan olarak eğer jeton teminatı yeterliyse aktif kabul et.
  return true;
}
