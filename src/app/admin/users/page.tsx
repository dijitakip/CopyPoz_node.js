'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  token?: string; // Token bilgisi için
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleted, setShowDeleted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [tokenUser, setTokenUser] = useState<User | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [clients, setClients] = useState<{id: number, account_name: string}[]>([]);
  
  // Filtering and Sorting States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [tokenData, setTokenData] = useState({
    client_id: '',
    expires_days: '30',
    manual_token: '', // Manuel token girişi için
    extend_existing: false, // Mevcut süreyi uzatma seçeneği
  });
  const [createdToken, setCreatedToken] = useState('');

  const formDataInit = {
    username: '',
    email: '',
    password: '',
    role: 'viewer',
  };
  const [formData, setFormData] = useState(formDataInit);

  // Admin Kontrolü
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.role !== 'admin') {
          router.push('/dashboard');
        }
      } catch (e) {
        router.push('/login');
      }
    } else {
      router.push('/login');
    }
  }, [router]);

  // Fetch clients for token modal
  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients');
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTokenCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: tokenUser?.id,
          client_id: tokenData.client_id || undefined,
          expires_days: Number(tokenData.expires_days),
          manual_token: tokenData.manual_token || undefined,
          extend_existing: tokenData.extend_existing,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCreatedToken(data.token.token_value);
      } else {
        alert('Token oluşturulamadı');
      }
    } catch (err) {
      console.error(err);
      alert('Hata oluştu');
    }
  };

  const openTokenModal = (user: User) => {
    setTokenUser(user);
    setCreatedToken('');
    setTokenData({ 
        client_id: '', 
        expires_days: '30', 
        manual_token: '', 
        extend_existing: !!user.token // Kullanıcının zaten tokenı varsa uzatma seçeneğini aktif et
    });
    setShowTokenModal(true);
    if (clients.length === 0) fetchClients();
  };

  const handleEdit = (user: User) => {
    setEditUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '', // Password is not filled for security
      role: user.role,
    });
    setShowForm(true);
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`/api/users?includeDeleted=${showDeleted}`);

      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [showDeleted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editUser ? `/api/users/${editUser.id}` : '/api/users';
      const method = editUser ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setFormData({ username: '', email: '', password: '', role: 'viewer' });
        setEditUser(null);
        setShowForm(false);
        fetchUsers();
        alert(`Kullanıcı başarıyla ${editUser ? 'güncellendi' : 'oluşturuldu'}`);
      }
    } catch (err) {
      alert('Hata: ' + (err instanceof Error ? err.message : 'Bilinmeyen hata'));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bu kullanıcıyı silmek istediğinize emin misiniz? (Soft Delete)')) return;
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchUsers();
        alert('Kullanıcı silindi (inaktif yapıldı)');
      }
    } catch (err) {
      alert('Hata oluştu');
    }
  };

  const handleReactivate = async (id: number) => {
    if (!confirm('Bu kullanıcıyı tekrar aktif yapmak istiyor musunuz?')) return;
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'active' }),
      });
      if (res.ok) {
        fetchUsers();
        alert('Kullanıcı tekrar aktif edildi');
      }
    } catch (err) {
      alert('Hata oluştu');
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const filteredUsers = users
    .filter((u) => {
      const search = searchTerm.toLowerCase();
      return (
        (u.username.toLowerCase().includes(search) ||
          u.email.toLowerCase().includes(search)) &&
        (filterRole === 'all' || u.role === filterRole)
      );
    })
    .sort((a, b) => {
      const valA = a[sortBy as keyof User] || '';
      const valB = b[sortBy as keyof User] || '';

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Kullanıcı Yönetimi</h1>
          <p className="text-gray-600 mt-1">Sistem kullanıcılarını yönetin</p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer bg-gray-100 px-3 py-2 rounded-lg hover:bg-gray-200 transition">
            <input
              type="checkbox"
              checked={showDeleted}
              onChange={(e) => setShowDeleted(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm font-medium text-gray-700">Silinenleri Göster</span>
          </label>
          <button
            onClick={() => {
              setEditUser(null);
              setFormData({ username: '', email: '', password: '', role: 'viewer' });
              setShowForm(!showForm);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
          >
            {showForm ? '✕ İptal' : '+ Yeni Kullanıcı'}
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">{editUser ? 'Kullanıcıyı Düzenle' : 'Yeni Kullanıcı Oluştur'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Kullanıcı Adı"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
            <input
              type="password"
              placeholder={editUser ? "Şifre (Boş bırakılırsa değişmez)" : "Şifre"}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required={!editUser}
            />
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="viewer">Viewer</option>
              <option value="trader">Trader</option>
              <option value="master_owner">Master Owner</option>
              <option value="admin">Admin</option>
            </select>
            <button
              type="submit"
              className="md:col-span-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
            >
              {editUser ? 'Güncelle' : 'Oluştur'}
            </button>
          </form>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Kullanıcı Ara</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Kullanıcı adı veya e-posta..."
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Rol</label>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">Tümü</option>
            <option value="admin">Admin</option>
            <option value="master_owner">Master Owner</option>
            <option value="trader">Trader</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>
      </div>

      {/* Token Modal */}
      {showTokenModal && tokenUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Token Oluştur: {tokenUser.username}</h2>
              <button onClick={() => setShowTokenModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>

            {!createdToken ? (
              <form onSubmit={handleTokenCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client Seç (Opsiyonel)</label>
                  <select
                    value={tokenData.client_id}
                    onChange={(e) => setTokenData({ ...tokenData, client_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Genel Token (Client Bağımsız)</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.account_name} (#{client.id})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Geçerlilik (Gün)</label>
                  <input
                    type="number"
                    value={tokenData.expires_days}
                    onChange={(e) => setTokenData({ ...tokenData, expires_days: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    min="1"
                  />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Manuel Token (Opsiyonel)</label>
                    <input
                        type="text"
                        placeholder="Özel bir token değeri girmek için..."
                        value={tokenData.manual_token}
                        onChange={(e) => setTokenData({ ...tokenData, manual_token: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>

                {tokenUser.token && (
                    <div className="flex items-center gap-2 bg-blue-50 p-3 rounded-lg border border-blue-100">
                        <input
                            type="checkbox"
                            id="extend_existing"
                            checked={tokenData.extend_existing}
                            onChange={(e) => setTokenData({ ...tokenData, extend_existing: e.target.checked })}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="extend_existing" className="text-sm text-gray-700 cursor-pointer">
                            Mevcut token süresini uzat
                            <span className="block text-xs text-gray-500 mt-0.5">
                                İşaretlenirse yeni token üretilmez, eskisinin süresi artırılır.
                            </span>
                        </label>
                    </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition"
                >
                  Token Oluştur
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                  <p className="text-green-800 font-medium mb-2">Token Oluşturuldu!</p>
                  <code className="block bg-white p-2 rounded border border-green-100 text-sm break-all select-all">
                    {createdToken}
                  </code>
                </div>
                <button
                  onClick={() => setShowTokenModal(false)}
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition"
                >
                  Kapat
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Yükleniyor...</div>
        ) : users.length === 0 ? (
          <div className="p-6 text-center text-gray-500">Kullanıcı bulunamadı</div>
        ) : (
          <>
            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('username')}>
                      Kullanıcı Adı {sortBy === 'username' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('email')}>
                      Email {sortBy === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('role')}>
                      Rol {sortBy === 'role' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('status')}>
                      Durum {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Token</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('created_at')}>
                      Oluşturulma {sortBy === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm font-medium text-gray-800">{user.username}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          user.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {user.token ? (
                            <div className="relative group">
                                <span className="block truncate max-w-[150px] font-mono bg-gray-50 p-1 rounded border border-gray-200 text-xs">
                                    {user.token}
                                </span>
                                <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg break-all">
                                    {user.token}
                                </div>
                            </div>
                        ) : (
                            <span className="text-gray-400 italic text-xs">Token yok</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(user.created_at).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-6 py-4 text-sm flex gap-2">
                        <Link
                            href={`/admin/users/${user.id}`}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                            Detay
                        </Link>
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-gray-600 hover:text-gray-800 font-medium"
                        >
                          Düzenle
                        </button>
                        <button
                          onClick={() => openTokenModal(user)}
                          className="text-purple-600 hover:text-purple-800 font-medium"
                        >
                          Token
                        </button>
                        <Link
                          href="/admin/collaterals"
                          className="text-orange-600 hover:text-orange-800 font-medium"
                        >
                          Jeton
                        </Link>
                        {(user as any).deleted_at ? (
                          <button
                            onClick={() => handleReactivate(user.id)}
                            className="text-green-600 hover:text-green-800 font-medium"
                          >
                            Aktif Et
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="text-red-600 hover:text-red-800 font-medium"
                          >
                            Sil
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <div key={user.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{user.username}</h3>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      user.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.status}
                    </span>
                  </div>
                  
                  {user.token && (
                      <div className="bg-gray-50 p-2 rounded border border-gray-200">
                          <p className="text-xs text-gray-500 font-medium mb-1">Mevcut Token:</p>
                          <code className="text-xs break-all text-gray-700 font-mono block select-all">
                              {user.token}
                          </code>
                      </div>
                  )}

                  <div className="flex items-center gap-2 text-sm">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      {user.role}
                    </span>
                    <span className="text-gray-500">
                      • {new Date(user.created_at).toLocaleDateString('tr-TR')}
                    </span>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleEdit(user)}
                      className="flex-1 bg-blue-50 text-blue-600 hover:bg-blue-100 py-2 rounded-lg transition font-medium text-sm"
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={() => openTokenModal(user)}
                      className="flex-1 bg-purple-50 text-purple-600 hover:bg-purple-100 py-2 rounded-lg transition font-medium text-sm"
                    >
                      Token Oluştur
                    </button>
                    <Link
                      href="/admin/collaterals"
                      className="flex-1 bg-orange-50 text-orange-600 hover:bg-orange-100 py-2 rounded-lg transition font-medium text-sm text-center"
                    >
                      Jeton Yükle
                    </Link>
                  </div>
                  <div className="pt-1">
                    {(user as any).deleted_at ? (
                      <button
                        onClick={() => handleReactivate(user.id)}
                        className="w-full bg-green-50 text-green-600 hover:bg-green-100 py-2 rounded-lg transition font-bold text-sm"
                      >
                        Kullanıcıyı Tekrar Aktif Et
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="w-full bg-red-50 text-red-600 hover:bg-red-100 py-2 rounded-lg transition font-medium text-sm"
                      >
                        Kullanıcıyı Sil (Inaktif Yap)
                      </button>
                    )}
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
