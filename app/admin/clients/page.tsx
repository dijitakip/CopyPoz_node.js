'use client';

import { useEffect, useState } from 'react';

interface Client {
  id: number;
  account_number: number;
  account_name: string;
  balance: number;
  equity: number;
  open_positions: number;
  status: string;
  created_at: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const token = localStorage.getItem('master_token') || 'master-local-123';
        const res = await fetch('/api/clients', {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setClients(data.clients || []);
        }
      } catch (err) {
        console.error('Failed to fetch clients:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
    const interval = setInterval(fetchClients, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Client Yönetimi</h1>
        <p className="text-gray-600 mt-1">Bağlı MetaTrader clientlerini yönetin</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <p className="text-gray-600 text-sm font-medium">Toplam Clientler</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{clients.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <p className="text-gray-600 text-sm font-medium">Aktif Clientler</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">
            {clients.filter(c => c.status === 'active').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <p className="text-gray-600 text-sm font-medium">Toplam Bakiye</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">
            ${clients.reduce((sum, c) => sum + Number(c.balance), 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Yükleniyor...</div>
        ) : clients.length === 0 ? (
          <div className="p-6 text-center text-gray-500">Client bulunamadı</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Hesap No</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Hesap Adı</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Bakiye</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Equity</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Açık Pozisyon</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Durum</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">{client.account_number}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{client.account_name}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">
                      ${Number(client.balance).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      ${Number(client.equity).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{client.open_positions}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        client.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {client.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button className="text-blue-600 hover:text-blue-800 font-medium">Detay</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
