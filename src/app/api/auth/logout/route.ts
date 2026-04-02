import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/** Eski /api/auth/login ile atılan JWT çerezi; NextAuth oturumu client'ta signOut ile silinir. */
const LEGACY_SESSION_COOKIE = 'session_token';

export const dynamic = 'force-dynamic';

export async function POST() {
  const store = cookies();
  store.delete(LEGACY_SESSION_COOKIE);
  store.delete('session_user');
  return NextResponse.json({ success: true });
}
