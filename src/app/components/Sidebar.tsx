'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { cn } from '@/src/lib/utils';
import { 
  LayoutDashboard, 
  Wallet, 
  Monitor, 
  Share2, 
  Settings, 
  Users, 
  Crown, 
  Terminal, 
  Key, 
  FileText, 
  Scroll, 
  Zap,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  TrendingUp
} from 'lucide-react';

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
      icon: LayoutDashboard,
      href: '/dashboard',
    },
    {
      label: 'Teminatlarım',
      icon: Wallet,
      href: '/dashboard/collaterals',
    },
    {
      label: 'Clientlarım',
      icon: Monitor,
      href: '/dashboard/clients',
    },
    {
      label: 'Referanslarım',
      icon: Share2,
      href: '/dashboard/referrals',
    },
  ];

  if (userRole === 'admin' || userRole === 'master_owner' || userRole === 'trader') {
    const submenu = [];
    
    // Sadece Admin kullanıcılar kullanıcıları görebilir
    if (userRole === 'admin') {
      submenu.push({ label: 'Kullanıcılar', href: '/admin/users', icon: Users });
    }

    submenu.push({ label: 'Clientler', href: '/admin/clients', icon: Monitor });
    submenu.push({ label: 'Master Grupları', href: '/admin/master-groups', icon: Crown });
    submenu.push({ label: 'Komutlar', href: '/admin/commands', icon: Terminal });
    submenu.push({ label: 'Tokenlar', href: '/admin/tokens', icon: Key });
    submenu.push({ label: 'Teminatlar', href: '/admin/collaterals', icon: Wallet });
    submenu.push({ label: 'Loglar', href: '/admin/logs', icon: FileText });

    if (userRole === 'admin' || userRole === 'master_owner') {
      submenu.push({ label: 'Lisanslar', href: '/admin/licenses', icon: Scroll });
      submenu.push({ label: 'Ayarlar', href: '/admin/settings', icon: Zap });
    }

    menuItems.push({
      label: 'Yönetim',
      icon: Settings,
      submenu,
    });
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-40 backdrop-blur-sm"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 bg-slate-900 text-slate-100 transition-all duration-300 flex flex-col overflow-hidden shadow-xl lg:shadow-none border-r border-slate-800",
          isOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0 lg:w-20"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
          {isOpen ? (
            <div className="flex items-center gap-2 text-primary-foreground">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 shadow-md">
                <TrendingUp className="h-5 w-5" />
              </div>
              <span className="font-bold text-lg tracking-tight">CopyPoz</span>
            </div>
          ) : (
            <div className="flex w-full justify-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 shadow-md">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
          )}
          
          {isOpen && (
            <button
              onClick={onToggle}
              className="p-1.5 hover:bg-slate-800 rounded-md transition text-slate-400 hover:text-white lg:hidden"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Toggle Button (Desktop Only - Outside/Attached) */}
        {/* This is tricky to place exactly like the old one without messing layout, keeping it simple inside or handled by parent layout */}
        {/* For now, relying on Header toggle or simple internal toggle if needed */}

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {menuItems.map((item) => (
            <div key={item.label}>
              {item.submenu ? (
                <div className="space-y-1">
                  <button
                    onClick={() =>
                      setExpandedMenu(
                        expandedMenu === item.label ? null : item.label
                      )
                    }
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 group",
                      isActiveParent(item.submenu.map(s => s.href))
                        ? "bg-slate-800 text-blue-400 font-medium"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    )}
                  >
                    <item.icon className={cn("h-5 w-5 shrink-0", isOpen ? "" : "mx-auto")} />
                    {isOpen && (
                      <>
                        <span className="flex-1 text-left text-sm">{item.label}</span>
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform duration-200",
                            expandedMenu === item.label ? "rotate-180" : ""
                          )}
                        />
                      </>
                    )}
                  </button>

                  {/* Submenu */}
                  {isOpen && expandedMenu === item.label && (
                    <div className="pl-4 space-y-1 mt-1 animate-accordion-down overflow-hidden">
                      {item.submenu.map((subitem) => (
                        <Link
                          key={subitem.href}
                          href={subitem.href}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors duration-200",
                            isActive(subitem.href)
                              ? "bg-blue-600/10 text-blue-400 font-medium"
                              : "text-slate-500 hover:text-slate-200 hover:bg-slate-800/50"
                          )}
                        >
                          <subitem.icon className="h-4 w-4" />
                          <span>{subitem.label}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 group",
                    isActive(item.href)
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <item.icon className={cn("h-5 w-5 shrink-0", isOpen ? "" : "mx-auto")} />
                  {isOpen && <span className="text-sm font-medium">{item.label}</span>}
                </Link>
              )}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800">
          {isOpen ? (
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>v5.0.0</span>
              <span>© CopyPoz</span>
            </div>
          ) : (
            <div className="text-center text-xs text-slate-500">v5</div>
          )}
        </div>
      </div>
    </>
  );
}
