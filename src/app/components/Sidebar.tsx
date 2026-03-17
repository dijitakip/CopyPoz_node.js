'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('viewer');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserRole(user.role?.toLowerCase() || 'viewer');
      } catch (e) {
        console.error('Failed to parse user');
      }
    }
  }, []);

  const isActive = (path: string) => pathname === path;
  const isActiveParent = (paths: string[]) => paths.some(p => pathname.startsWith(p));

  const menuItems = [
    {
      label: 'Dashboard',
      icon: '📊',
      href: '/dashboard',
    },
    {
      label: 'Teminatlarım',
      icon: '💰',
      href: '/dashboard/collaterals',
    },
    {
      label: 'Clientlarım',
      icon: '💻',
      href: '/dashboard/clients',
    },
    {
      label: 'Referanslarım',
      icon: '🤝',
      href: '/dashboard/referrals',
    },
  ];

  if (userRole === 'admin' || userRole === 'master_owner' || userRole === 'trader') {
    const submenu = [];
    
    // Sadece Admin kullanıcılar kullanıcıları görebilir
    if (userRole === 'admin') {
      submenu.push({ label: 'Kullanıcılar', href: '/admin/users', icon: '👥' });
    }

    submenu.push({ label: 'Clientler', href: '/admin/clients', icon: '💻' });
    submenu.push({ label: 'Master Grupları', href: '/admin/master-groups', icon: '👑' });
    submenu.push({ label: 'Komutlar', href: '/admin/commands', icon: '📝' });
    submenu.push({ label: 'Tokenlar', href: '/admin/tokens', icon: '🔑' });
    submenu.push({ label: 'Teminatlar', href: '/admin/collaterals', icon: '💰' });
    submenu.push({ label: 'Loglar', href: '/admin/logs', icon: '📋' });

    if (userRole === 'admin' || userRole === 'master_owner') {
      submenu.push({ label: 'Lisanslar', href: '/admin/licenses', icon: '📜' });
      submenu.push({ label: 'Ayarlar', href: '/admin/settings', icon: '⚡' });
    }

    menuItems.push({
      label: 'Yönetim',
      icon: '⚙️',
      submenu,
    });
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-40"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={`${
          isOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0 lg:w-20'
        } fixed lg:static inset-y-0 left-0 z-50 bg-gray-900 text-white transition-all duration-300 flex flex-col overflow-hidden shadow-xl lg:shadow-none`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          {isOpen && (
            <div className="flex items-center gap-2">
              <span className="text-2xl">📈</span>
              <span className="font-bold text-lg">CopyPoz</span>
            </div>
          )}
          <button
            onClick={onToggle}
            className="p-1 hover:bg-gray-800 rounded transition"
            title={isOpen ? 'Kapat' : 'Aç'}
          >
            {isOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto py-4">
          {menuItems.map((item) => (
            <div key={item.label}>
              {item.submenu ? (
                <>
                  <button
                    onClick={() =>
                      setExpandedMenu(
                        expandedMenu === item.label ? null : item.label
                      )
                    }
                    className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-800 transition ${
                      isActiveParent(item.submenu.map(s => s.href))
                        ? 'bg-gray-800 border-l-4 border-blue-500'
                        : ''
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    {isOpen && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        <span
                          className={`transition-transform ${
                            expandedMenu === item.label ? 'rotate-180' : ''
                          }`}
                        >
                          ▼
                        </span>
                      </>
                    )}
                  </button>

                  {/* Submenu */}
                  {isOpen && expandedMenu === item.label && (
                    <div className="bg-gray-800">
                      {item.submenu.map((subitem) => (
                        <Link
                          key={subitem.href}
                          href={subitem.href}
                          className={`block px-4 py-2 pl-12 text-sm hover:bg-gray-700 transition ${
                            isActive(subitem.href)
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-300'
                          }`}
                        >
                          <span className="mr-2">{subitem.icon}</span>
                          {subitem.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={item.href}
                  className={`block px-4 py-3 flex items-center gap-3 hover:bg-gray-800 transition ${
                    isActive(item.href)
                      ? 'bg-gray-800 border-l-4 border-blue-500'
                      : ''
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  {isOpen && <span>{item.label}</span>}
                </Link>
              )}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 text-xs text-gray-400">
          {isOpen && <p>v1.0.0</p>}
        </div>
      </div>

      {/* Mobile Overlay (Removed old one since it is now at the top) */}
    </>
  );
}
