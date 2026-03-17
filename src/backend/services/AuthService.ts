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
        deleted_at: null,
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
   * Login logic with brute-force protection
   */
  static async login(identifier: string, passwordInput: string) {
    const user = await this.findUser(identifier);
    if (!user) return null;

    // 1. Check for Account Lockout
    if (user.lockout_until && new Date(user.lockout_until) > new Date()) {
      const remainingMinutes = Math.ceil((new Date(user.lockout_until).getTime() - Date.now()) / (1000 * 60));
      throw new Error(`Hesabınız çok fazla hatalı giriş denemesi nedeniyle ${remainingMinutes} dakika süreyle kilitlenmiştir.`);
    }

    // 2. Check for Active Status
    if (user.status !== 'active') {
      if (user.email_verified_at === null) {
        throw new Error('Lütfen e-posta adresinizi doğrulayın.');
      }
      return null;
    }

    const isValid = await this.verifyPassword(user, passwordInput);
    
    if (!isValid) {
      // 3. Handle Failed Attempt
      const newAttempts = user.login_attempts + 1;
      let lockoutUntil: Date | null = null;
      
      if (newAttempts >= 5) {
        // Lock for 30 minutes after 5 attempts
        lockoutUntil = new Date(Date.now() + 30 * 60 * 1000);
      }
      
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          login_attempts: newAttempts,
          lockout_until: lockoutUntil
        }
      });
      
      return null;
    }

    // 4. Handle Successful Login
    // Reset login attempts on success
    const token = createHash('sha256').update(Math.random().toString()).digest('hex');
    
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        auth_token: token,
        auth_token_expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        login_attempts: 0,
        lockout_until: null
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
