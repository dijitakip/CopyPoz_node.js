'use client';

import { useEffect, useState } from 'react';

interface Client {
  id: number;
  account_number: string;
  account_name: string;
  account_type: string;
  balance: number;
  equity: number;
  open_positions: number;
  status: string;
  created_at: string;
  owner?: { username: string };
  master_assignments?: { group: { name: string } }[];
}

import Link from 'next/link';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [users, setUsers] = useState<{id: number, username: string}[]>([]);
  
  // Filtering and Sorting States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [newClient, setNewClient] = useState({
    account_number: '',
    account_name: '',
    server: '',
    password: '',
    auth_token: '',
    owner_id: '',
    account_type: 'standard',
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/users');
        if (res.ok) {
          const data = await res.json();
          setUsers(data.users || []);
        }
      } catch (err) {
        console.error('Failed to fetch users:', err);
      }
    };
    fetchUsers();
  }, []);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Token backend tarafından JWT olarak oluşturulacak
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            ...newClient,
            account_number: newClient.account_number, // Send as string, backend handles BigInt
            owner_id: newClient.owner_id ? Number(newClient.owner_id) : null,
        }),
      });

      if (res.ok) {
        setShowForm(false);
        setNewClient({ account_number: '', account_name: '', server: '', password: '', auth_token: '', owner_id: '', account_type: 'standard' });
        // Refresh clients list
        window.location.reload(); 
      } else {
        const err = await res.json();
        alert('Failed to create client: ' + (err.error || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert('Error creating client');
    }
  };

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await fetch('/api/clients');
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

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const filteredClients = clients
    .filter((c) => {
      const search = searchTerm.toLowerCase();
      const groupName = c.master_assignments?.[0]?.group?.name || '';
      return (
        (c.account_name.toLowerCase().includes(search) ||
          c.account_number.toLowerCase().includes(search) ||
          (c.owner?.username || '').toLowerCase().includes(search) ||
          groupName.toLowerCase().includes(search)) &&
        (filterStatus === 'all' || c.status === filterStatus)
      );
    })
    .sort((a, b) => {
      let valA: any = a[sortBy as keyof Client];
      let valB: any = b[sortBy as keyof Client];

      // Custom fields sorting
      if (sortBy === 'owner') valA = a.owner?.username || '';
      if (sortBy === 'owner') valB = b.owner?.username || '';
      if (sortBy === 'group') valA = a.master_assignments?.[0]?.group?.name || '';
      if (sortBy === 'group') valB = b.master_assignments?.[0]?.group?.name || '';

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Client Yönetimi</h1>
          <p className="text-gray-600 mt-1">Bağlı MetaTrader clientlerini yönetin</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
        >
          {showForm ? '✕ İptal' : '+ Yeni Client Ekle'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Yeni Client Ekle</h2>
          <form onSubmit={handleCreateClient} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase px-1">Hesap Numarası</label>
              <input
                type="number"
                placeholder="Hesap Numarası"
                value={newClient.account_number}
                onChange={(e) => setNewClient({ ...newClient, account_number: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase px-1">Hesap Adı</label>
              <input
                type="text"
                placeholder="Hesap Adı (Örn: Demo-1)"
                value={newClient.account_name}
                onChange={(e) => setNewClient({ ...newClient, account_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase px-1">Server</label>
              <input
                type="text"
                placeholder="Broker-Server"
                value={newClient.server}
                onChange={(e) => setNewClient({ ...newClient, server: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase px-1">Şifre</label>
              <input
                type="text"
                placeholder="Hesap Şifresi"
                value={newClient.password}
                onChange={(e) => setNewClient({ ...newClient, password: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase px-1">Auth Token</label>
              <input
                type="text"
                placeholder="Auth Token (Boş bırakılırsa otomatik üretilir)"
                value={newClient.auth_token}
                onChange={(e) => setNewClient({ ...newClient, auth_token: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase px-1">Hesap Türü</label>
              <select
                value={newClient.account_type}
                onChange={(e) => setNewClient({ ...newClient, account_type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition bg-white"
              >
                <option value="standard">Standard Hesap</option>
                <option value="cent">Cent Hesap</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase px-1">Referans (Kullanıcı)</label>
              <select
                value={newClient.owner_id}
                onChange={(e) => setNewClient({ ...newClient, owner_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition bg-white"
              >
                <option value="">Kullanıcı Ata (Referans)</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.username}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="md:col-span-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition font-bold shadow-sm mt-2"
            >
              Client Ekle
            </button>
          </form>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Ara (İsim, No, Ref, Grup)</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Arama..."
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Durum</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">Tümü</option>
            <option value="active">Aktif</option>
            <option value="inactive">Pasif</option>
            <option value="paused">Duraklatıldı</option>
          </select>
        </div>
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
          <>
            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('account_number')}>
                      Hesap No {sortBy === 'account_number' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('account_name')}>
                      Hesap Adı {sortBy === 'account_name' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('account_type')}>
                      Tür {sortBy === 'account_type' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('group')}>
                      Grup {sortBy === 'group' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('owner')}>
                      Referans {sortBy === 'owner' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('balance')}>
                      Bakiye {sortBy === 'balance' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('equity')}>
                      Equity {sortBy === 'equity' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Durum</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredClients.map((client) => (
                    <tr key={client.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm font-medium text-gray-800">{client.account_number}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{client.account_name}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${client.account_type === 'cent' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                          {client.account_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {client.master_assignments?.[0]?.group?.name ? (
                          <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded border border-purple-100 font-medium">
                            {client.master_assignments[0].group.name}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">Grup Yok</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{client.owner?.username || '-'}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-800">
                        ${Number(client.balance).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        ${Number(client.equity).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          client.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : client.status === 'pending'
                            ? 'bg-blue-100 text-blue-800'
                            : client.status === 'paused'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {client.status === 'pending' ? 'Beklemede' : client.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Link href={`/admin/clients/${client.id}`} className="text-blue-600 hover:text-blue-800 font-medium">
                          Detay
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden divide-y divide-gray-200">
              {filteredClients.map((client) => (
                <div key={client.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{client.account_name}</h3>
                      <p className="text-sm text-gray-500">#{client.account_number}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      client.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : client.status === 'paused'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {client.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Bakiye</p>
                      <p className="font-semibold text-gray-800">${Number(client.balance).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Equity</p>
                      <p className="font-semibold text-gray-800">${Number(client.equity).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Grup</p>
                      <p className="font-semibold text-purple-700">
                        {client.master_assignments?.[0]?.group?.name || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Referans</p>
                      <p className="font-semibold text-gray-800">{client.owner?.username || '-'}</p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Link 
                      href={`/admin/clients/${client.id}`}
                      className="block w-full text-center bg-blue-50 text-blue-600 hover:bg-blue-100 py-2 rounded-lg transition font-medium"
                    >
                      Detayları Gör
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
