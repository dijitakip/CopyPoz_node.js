import { NextResponse } from 'next/server';
import { prisma } from '@/src/backend/utils/db';
import { headers } from 'next/headers';
import { getCurrentUser } from '@/src/backend/utils/auth';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const id = parseInt(params.id);
    
    // Sadece admin veya kullanıcının kendisi görebilir
    if (currentUser.role !== 'admin' && currentUser.id !== id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        status: true,
        created_at: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const id = parseInt(params.id);
    const body = await request.json();
    let { username, email, password, role, status } = body;

    // Admin değilse, rolünü ve statüsünü değiştiremez
    if (currentUser.role !== 'admin') {
      role = undefined;
      status = undefined;

      // Admin değilse, sadece kendi bilgilerini güncelleyebilir
      if (currentUser.id !== id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const data: any = {
      username,
      email,
    };
    
    if (role) data.role = role;
    if (status) {
        data.status = status;
        // Eğer statü 'active' yapılıyorsa ve deleted_at doluysa, silinme tarihini temizle (reactivate)
        if (status === 'active') {
            data.deleted_at = null;
        }
    }

    if (password) {
      // bcryptjs dinamik import
      const bcrypt = await import('bcryptjs');
      data.password_hash = await bcrypt.hash(password, 10);
    }
    
    // Temizleme (undefined alanları sil)
    // TypeScript: Object.keys returns string[], so we need to type cast or iterate safely
    Object.keys(data).forEach(key => {
        if (data[key] === undefined) delete data[key];
    });

    const user = await prisma.user.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, user });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const id = parseInt(params.id);
    
    // Soft Delete: Veriyi silmek yerine deleted_at alanını dolduruyoruz
    await prisma.user.update({
      where: { id },
      data: { 
        deleted_at: new Date(),
        status: 'inactive' // Opsiyonel: Statüsünü de pasife çekebiliriz
      }
    });

    return NextResponse.json({ ok: true, message: 'User soft-deleted successfully' });
  } catch (e) {
    console.error('Soft delete error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
