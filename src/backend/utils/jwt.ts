import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';

export function generateClientToken(payload: object, expiresIn: string | number = '365d'): string {
  // Token expires in 1 year by default for clients as they need long-lived connections
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyClientToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}
