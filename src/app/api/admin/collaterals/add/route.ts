import { NextResponse } from 'next/server';
import { prisma } from '@/src/backend/utils/db';
import { getCurrentUser } from '@/src/backend/utils/auth';
import { TokenService } from '@/src/backend/services/TokenService';

export async function POST(req: Request) {
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { userId, clientId, amount } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Geçersiz miktar' }, { status: 400 });
    }

    if (userId) {
      // Add tokens to user
      await TokenService.addUserTokens(Number(userId), amount);
      
      // Log system action
      await prisma.systemLog.create({
        data: {
          action: 'ADMIN_ADD_TOKENS_USER',
          details: `Admin ${currentUser.username}, User ID ${userId}'ye ${amount} jeton yükledi.`,
          user_id: currentUser.id,
          level: 'INFO'
        }
      });

      return NextResponse.json({ ok: true, message: 'Kullanıcıya jeton başarıyla yüklendi' });
    } else if (clientId) {
      // Add tokens to client
      await TokenService.addTokens(Number(clientId), amount);

      // Log system action
      await prisma.systemLog.create({
        data: {
          action: 'ADMIN_ADD_TOKENS_CLIENT',
          details: `Admin ${currentUser.username}, Client ID ${clientId}'ye ${amount} jeton yükledi.`,
          user_id: currentUser.id,
          level: 'INFO'
        }
      });

      return NextResponse.json({ ok: true, message: 'Client hesabına jeton başarıyla yüklendi' });
    }

    return NextResponse.json({ error: 'Kullanıcı veya Client seçilmelidir' }, { status: 400 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'İşlem sırasında hata oluştu' }, { status: 500 });
  }
}
