'use client';

import { signOut } from 'next-auth/react';

export default function LogoutButton() {
  const onLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    await signOut({ callbackUrl: '/login' });
  };
  return (
    <button onClick={onLogout} className="text-white opacity-80 hover:opacity-100 flex items-center">
      <span className="mr-1">🚪</span> Logout
    </button>
  );
}
