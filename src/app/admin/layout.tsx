'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

function sessionUserToLayoutUser(session: NonNullable<ReturnType<typeof useSession>['data']>) {
  const u = session.user!;
  return {
    id: u.id,
    username: u.name ?? '',
    email: u.email ?? '',
    role: (u as { role?: string }).role ?? 'viewer',
  };
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.replace('/login');
      return;
    }
    if (!session?.user) return;

    const layoutUser = sessionUserToLayoutUser(session);
    const role = layoutUser.role;
    if (role !== 'admin' && role !== 'master_owner' && role !== 'trader') {
      router.replace('/dashboard');
      return;
    }

    setUser(layoutUser);
    try {
      localStorage.setItem('user', JSON.stringify(layoutUser));
    } catch {
      /* ignore */
    }
  }, [session, status, router]);

  if (status === 'loading' || !user) return null;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
