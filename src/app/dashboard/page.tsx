'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    totalClients: 0,
    activeClients: 0,
    totalBalance: 0,
    totalPositions: 0,
    recentClients: [] as any[]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse user from localStorage');
      }
    }

    const fetchStats = async () => {
      try {
        const res = await fetch('/api/admin/dashboard/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 10000); // 10 saniyede bir güncelle
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600 mt-1">Hoş geldiniz!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <p className="text-gray-600 text-sm font-medium">Toplam Clientler</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">
            {loading ? '...' : stats.totalClients}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <p className="text-gray-600 text-sm font-medium">Aktif Clientler</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">
            {loading ? '...' : stats.activeClients}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <p className="text-gray-600 text-sm font-medium">Toplam Bakiye</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">
            {loading ? '...' : `$${stats.totalBalance.toLocaleString()}`}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
          <p className="text-gray-600 text-sm font-medium">Açık Pozisyonlar</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">
            {loading ? '...' : stats.totalPositions}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">Son Aktif Clientler</h2>
            <Link href="/admin/clients" className="text-blue-600 hover:underline text-sm font-medium">Tümünü Gör</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-bold">
                <tr>
                  <th className="px-6 py-3">Hesap</th>
                  <th className="px-6 py-3">Bakiye</th>
                  <th className="px-6 py-3">Durum</th>
                  <th className="px-6 py-3">Son Görülme</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">Yükleniyor...</td></tr>
                ) : stats.recentClients.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">Kayıt bulunamadı.</td></tr>
                ) : (
                  stats.recentClients.map((client) => (
                    <tr key={client.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-800">{client.account_name}</div>
                        <div className="text-xs text-gray-500">#{client.account_number}</div>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-700">
                        ${Number(client.balance).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                          client.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {client.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {client.last_seen ? new Date(client.last_seen).toLocaleString('tr-TR') : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Hızlı İşlemler</h2>
          <div className="grid grid-cols-2 gap-4">
            {(user?.role === 'admin') && (
              <Link href="/admin/users" className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-center">
                <span className="text-2xl block mb-1">👥</span>
                <p className="text-sm font-medium text-gray-800">Kullanıcılar</p>
              </Link>
            )}
            {(user?.role === 'admin' || user?.role === 'master_owner' || user?.role === 'trader') && (
              <Link href="/admin/clients" className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-center">
                <span className="text-2xl block mb-1">💻</span>
                <p className="text-sm font-medium text-gray-800">Clientler</p>
              </Link>
            )}
            {(user?.role === 'admin' || user?.role === 'master_owner') && (
              <Link href="/admin/commands" className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-center">
                <span className="text-2xl block mb-1">📝</span>
                <p className="text-sm font-medium text-gray-800">Komutlar</p>
              </Link>
            )}
            {(user?.role === 'admin' || user?.role === 'master_owner' || user?.role === 'trader') && (
              <Link href="/admin/master-groups" className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-center">
                <span className="text-2xl block mb-1">👑</span>
                <p className="text-sm font-medium text-gray-800">Gruplar</p>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
