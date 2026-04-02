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

export default function DashboardLayout({
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
    if (session?.user) {
      const layoutUser = sessionUserToLayoutUser(session);
      setUser(layoutUser);
      try {
        localStorage.setItem('user', JSON.stringify(layoutUser));
      } catch {
        /* ignore */
      }
    }
  }, [session, status, router]);

  if (status === 'loading' || !user) return null;

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out">
        <Header user={user} onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
