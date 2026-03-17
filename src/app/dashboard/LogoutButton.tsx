'use client';

import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();
  const onLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch {}
  };
  return (
    <button onClick={onLogout} className="text-white opacity-80 hover:opacity-100 flex items-center">
      <span className="mr-1">🚪</span> Logout
    </button>
  );
}
