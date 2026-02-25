'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface HeaderProps {
  user: any;
  onMenuClick: () => void;
}

export default function Header({ user, onMenuClick }: HeaderProps) {
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('master_token');
    router.push('/login');
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      {/* Left */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 hover:bg-gray-100 rounded-lg transition lg:hidden"
        >
          ☰
        </button>
        <h1 className="text-xl font-semibold text-gray-800">CopyPoz V5</h1>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="p-2 hover:bg-gray-100 rounded-lg transition relative">
          🔔
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
              {user?.username?.[0]?.toUpperCase() || 'A'}
            </div>
            <span className="text-sm font-medium text-gray-700 hidden sm:inline">
              {user?.username || 'Admin'}
            </span>
            <span className="text-gray-400">▼</span>
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              <div className="p-4 border-b border-gray-200">
                <p className="text-sm font-medium text-gray-800">{user?.username}</p>
                <p className="text-xs text-gray-500">{user?.role}</p>
              </div>

              <div className="p-2">
                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition flex items-center gap-2">
                  👤 Profil
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition flex items-center gap-2">
                  ⚙️ Ayarlar
                </button>
              </div>

              <div className="p-2 border-t border-gray-200">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded transition flex items-center gap-2"
                >
                  🚪 Çıkış Yap
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
