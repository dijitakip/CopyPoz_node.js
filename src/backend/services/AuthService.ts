import { prisma } from '../utils/db';
import { UserRole } from '@prisma/client';
import { createHash } from 'crypto';
import * as bcrypt from 'bcryptjs';

export class AuthService {
  /**
   * Find user by username or email
   */
  static async findUser(identifier: string) {
    return prisma.user.findFirst({
      where: {
        OR: [
          { username: identifier },
          { email: identifier },
        ],
      },
    });
  }

  /**
   * Verify password with legacy support (SHA-256) and rehash to Bcrypt
   */
  static async verifyPassword(user: any, passwordInput: string): Promise<boolean> {
    // 1. Check if password matches using bcrypt (modern hash)
    const isBcryptMatch = await bcrypt.compare(passwordInput, user.password_hash);
    if (isBcryptMatch) return true;

    // 2. Check if password matches using SHA-256 (legacy hash from PHP)
    // PHP: hash('sha256', $password)
    const sha256Hash = createHash('sha256').update(passwordInput).digest('hex');
    
    if (user.password_hash === sha256Hash) {
      // 3. If legacy match, rehash to bcrypt and update user
      const newHash = await bcrypt.hash(passwordInput, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { password_hash: newHash },
      });
      return true;
    }

    return false;
  }

  /**
   * Login logic
   */
  static async login(identifier: string, passwordInput: string) {
    const user = await this.findUser(identifier);
    if (!user) return null;
    if (user.status !== 'active') return null;

    const isValid = await this.verifyPassword(user, passwordInput);
    if (!isValid) return null;

    // Update auth token (legacy behavior, but good for tracking)
    // In Next.js we use HttpOnly cookies, but we can still maintain this field
    // or just use it for EA access if needed.
    const token = createHash('sha256').update(Math.random().toString()).digest('hex');
    
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        auth_token: token,
        auth_token_expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      }
    });

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      token: token // Optional usage
    };
  }
}
