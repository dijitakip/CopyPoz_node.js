'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  const isActive = (path: string) => pathname === path;
  const isActiveParent = (paths: string[]) => paths.some(p => pathname.startsWith(p));

  const menuItems = [
    {
      label: 'Dashboard',
      icon: '📊',
      href: '/dashboard',
    },
    {
      label: 'Yönetim',
      icon: '⚙️',
      submenu: [
        { label: 'Kullanıcılar', href: '/admin/users', icon: '👥' },
        { label: 'Clientler', href: '/admin/clients', icon: '💻' },
        { label: 'Master Grupları', href: '/admin/master-groups', icon: '👑' },
        { label: 'Komutlar', href: '/admin/commands', icon: '📝' },
        { label: 'Tokenlar', href: '/admin/tokens', icon: '🔑' },
        { label: 'Lisanslar', href: '/admin/licenses', icon: '📜' },
        { label: 'Loglar', href: '/admin/logs', icon: '📋' },
        { label: 'Ayarlar', href: '/admin/settings', icon: '⚡' },
      ],
    },
  ];

  return (
    <>
      {/* Sidebar */}
      <div
        className={`${
          isOpen ? 'w-64' : 'w-20'
        } bg-gray-900 text-white transition-all duration-300 flex flex-col overflow-hidden`}
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

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 lg:hidden"
          onClick={onToggle}
        />
      )}
    </>
  );
}
