'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Stats {
  totalClients: number;
  activeClients: number;
  totalBalance: number;
  openPositions: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalClients: 0,
    activeClients: 0,
    totalBalance: 0,
    openPositions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('master_token') || 'master-local-123';
        const res = await fetch('/api/clients', {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          const clients = data.clients || [];
          const totalBalance = clients.reduce((sum: number, c: any) => sum + Number(c.balance), 0);

          setStats({
            totalClients: clients.length,
            activeClients: clients.filter((c: any) => c.status === 'active').length,
            totalBalance,
            openPositions: clients.reduce((sum: number, c: any) => sum + c.open_positions, 0),
          });
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const StatCard = ({ icon, label, value, color }: any) => (
    <div className={`bg-white rounded-lg shadow p-6 border-l-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{value}</p>
        </div>
        <span className="text-4xl">{icon}</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600 mt-1">Hoş geldiniz! Sistem durumunuzu buradan takip edebilirsiniz.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon="💻"
          label="Toplam Clientler"
          value={stats.totalClients}
          color="border-blue-500"
        />
        <StatCard
          icon="✅"
          label="Aktif Clientler"
          value={stats.activeClients}
          color="border-green-500"
        />
        <StatCard
          icon="💰"
          label="Toplam Bakiye"
          value={`$${stats.totalBalance.toLocaleString()}`}
          color="border-purple-500"
        />
        <StatCard
          icon="📈"
          label="Açık Pozisyonlar"
          value={stats.openPositions}
          color="border-orange-500"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Hızlı İşlemler</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/admin/users"
            className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-center"
          >
            <span className="text-3xl block mb-2">👥</span>
            <p className="font-medium text-gray-800">Kullanıcılar</p>
            <p className="text-xs text-gray-500 mt-1">Yönet</p>
          </Link>

          <Link
            href="/admin/clients"
            className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-center"
          >
            <span className="text-3xl block mb-2">💻</span>
            <p className="font-medium text-gray-800">Clientler</p>
            <p className="text-xs text-gray-500 mt-1">Yönet</p>
          </Link>

          <Link
            href="/admin/commands"
            className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-center"
          >
            <span className="text-3xl block mb-2">📝</span>
            <p className="font-medium text-gray-800">Komutlar</p>
            <p className="text-xs text-gray-500 mt-1">Gönder</p>
          </Link>

          <Link
            href="/admin/master-groups"
            className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-center"
          >
            <span className="text-3xl block mb-2">👑</span>
            <p className="font-medium text-gray-800">Master Grupları</p>
            <p className="text-xs text-gray-500 mt-1">Yönet</p>
          </Link>
        </div>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Sistem Durumu</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
              <span className="text-sm font-medium text-gray-700">Web API</span>
              <span className="inline-flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-sm text-green-700">Çalışıyor</span>
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
              <span className="text-sm font-medium text-gray-700">Database</span>
              <span className="inline-flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-sm text-green-700">Bağlı</span>
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <span className="text-sm font-medium text-gray-700">Master EA</span>
              <span className="inline-flex items-center gap-2">
                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                <span className="text-sm text-yellow-700">Bekleniyor</span>
              </span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Son Aktiviteler</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-lg">📝</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">Sistem başlatıldı</p>
                <p className="text-xs text-gray-500">Bugün 20:50</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-lg">✅</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">Database bağlantısı kuruldu</p>
                <p className="text-xs text-gray-500">Bugün 20:50</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-lg">🔐</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">Admin giriş yaptı</p>
                <p className="text-xs text-gray-500">Bugün 20:51</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
