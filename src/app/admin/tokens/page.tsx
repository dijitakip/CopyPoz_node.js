'use client';

import { useEffect, useState } from 'react';

interface Token {
  id: number;
  token_value: string;
  token_type: string;
  status: string;
  created_at: string;
  expires_at?: string;
  user?: { username: string };
}

export default function TokensPage() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [users, setUsers] = useState<{id: number, username: string}[]>([]);
  const [clients, setClients] = useState<{id: number, account_number: string, account_name: string}[]>([]);
  
  // Form State
  const [formType, setFormType] = useState('CLIENT_TOKEN');
  const [formUserId, setFormUserId] = useState('');
  const [formClientId, setFormClientId] = useState('');
  const [formDays, setFormDays] = useState('365');
  const [createdToken, setCreatedToken] = useState('');

  // Filtering and Sorting States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchTokens();
    fetchUsers();
    fetchClients();
  }, []);

  const fetchTokens = async () => {
    try {
      const res = await fetch('/api/tokens');

      if (res.ok) {
        const data = await res.json();
        setTokens(data.tokens || []);
      }
    } catch (err) {
      console.error('Failed to fetch tokens:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
      try {
          const res = await fetch('/api/users');
          if(res.ok) {
              const data = await res.json();
              setUsers(data.users || []);
              if(data.users.length > 0) setFormUserId(data.users[0].id.toString());
          }
      } catch(e) { console.error(e); }
  };

  const fetchClients = async () => {
      try {
          const res = await fetch('/api/clients');
          if(res.ok) {
              const data = await res.json();
              setClients(data.clients || []);
          }
      } catch(e) { console.error(e); }
  };

  const handleCreateToken = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          const res = await fetch('/api/tokens', {
              method: 'POST',
              headers: { 
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                  user_id: formUserId,
                  client_id: formClientId || undefined,
                  token_type: formType,
                  expires_days: parseInt(formDays)
              })
          });
          
          if(res.ok) {
              const data = await res.json();
              setCreatedToken(data.token.token_value);
              fetchTokens();
              // Modalı kapatma, tokenı göster
          } else {
              alert('Token oluşturulamadı');
          }
      } catch(err) {
          console.error(err);
          alert('Bir hata oluştu');
      }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Token kopyalandı');
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const filteredTokens = tokens
    .filter((t) => {
      const search = searchTerm.toLowerCase();
      return (
        (t.token_value.toLowerCase().includes(search) ||
          (t.user?.username || '').toLowerCase().includes(search)) &&
        (filterType === 'all' || t.token_type === filterType)
      );
    })
    .sort((a, b) => {
      let valA: any = a[sortBy as keyof Token];
      let valB: any = b[sortBy as keyof Token];

      if (sortBy === 'user') valA = a.user?.username || '';
      if (sortBy === 'user') valB = b.user?.username || '';

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Token Yönetimi</h1>
          <p className="text-gray-600 mt-1">Sistem ve client tokenlarını yönetin</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setCreatedToken(''); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Yeni Token Oluştur
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Token veya Kullanıcı Ara</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Arama..."
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Tip</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">Tümü</option>
            <option value="CLIENT_TOKEN">Client Token</option>
            <option value="MASTER_TOKEN">Master Token</option>
          </select>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {createdToken ? 'Token Oluşturuldu' : 'Yeni Token Oluştur'}
            </h2>

            {createdToken ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 font-medium mb-2">Token başarıyla oluşturuldu!</p>
                  <div className="bg-white p-3 rounded border border-green-200 font-mono text-sm break-all text-gray-700">
                    {createdToken}
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  Bu token'ı güvenli bir yere kaydedin. Pencereyi kapattıktan sonra tekrar göremeyebilirsiniz.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => copyToClipboard(createdToken)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition"
                  >
                    Kopyala
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 rounded-lg font-medium transition"
                  >
                    Kapat
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateToken} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Token Tipi</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="CLIENT_TOKEN">Client Token (EA)</option>
                    <option value="MASTER_TOKEN">Master Token</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kullanıcı</label>
                  <select
                    value={formUserId}
                    onChange={(e) => setFormUserId(e.target.value)}
                    className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seçiniz</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.username}</option>
                    ))}
                  </select>
                </div>

                {formType === 'CLIENT_TOKEN' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">İstemci (Client)</label>
                    <select
                      value={formClientId}
                      onChange={(e) => setFormClientId(e.target.value)}
                      className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="">Genel (Client Bağımsız)</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.account_name} ({c.account_number})</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Belirli bir MetaTrader hesabına bağlamak için seçin.</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Geçerlilik Süresi</label>
                  <select
                    value={formDays}
                    onChange={(e) => setFormDays(e.target.value)}
                    className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="30">30 Gün</option>
                    <option value="90">90 Gün</option>
                    <option value="180">6 Ay</option>
                    <option value="365">1 Yıl</option>
                    <option value="1095">3 Yıl</option>
                  </select>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition shadow-sm"
                  >
                    Oluştur
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-500">Yükleniyor...</div>
        ) : tokens.length === 0 ? (
          <div className="p-10 text-center text-gray-500">Token bulunamadı</div>
        ) : (
          <>
            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('token_value')}>
                      Token {sortBy === 'token_value' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('user')}>
                      Kullanıcı {sortBy === 'user' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('token_type')}>
                      Tip {sortBy === 'token_type' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('status')}>
                      Durum {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('created_at')}>
                      Oluşturulma {sortBy === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('expires_at')}>
                      Bitiş {sortBy === 'expires_at' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTokens.map((token) => (
                    <tr key={token.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm font-mono text-gray-500">
                        {token.token_value.substring(0, 15)}...
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-800">
                        {token.user?.username || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                          {token.token_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          token.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {token.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(token.created_at).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {token.expires_at ? new Date(token.expires_at).toLocaleDateString('tr-TR') : 'Süresiz'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => copyToClipboard(token.token_value)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Kopyala
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden divide-y divide-gray-200">
              {filteredTokens.map((token) => (
                <div key={token.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 mr-4">
                      <div className="bg-gray-50 p-2 rounded border border-gray-200 mb-2">
                          <code className="text-xs break-all text-gray-700 font-mono block select-all">
                              {token.token_value}
                          </code>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-800">
                          {token.user?.username || 'Kullanıcı Yok'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                          {token.token_type}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(token.created_at).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                      token.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {token.status}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm pt-1">
                    <span className="text-gray-500">
                      Bitiş: <span className="font-medium text-gray-700">{token.expires_at ? new Date(token.expires_at).toLocaleDateString('tr-TR') : 'Süresiz'}</span>
                    </span>
                    <button
                      onClick={() => copyToClipboard(token.token_value)}
                      className="text-blue-600 hover:text-blue-800 font-medium bg-blue-50 px-3 py-1 rounded transition"
                    >
                      Kopyala
                    </button>
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
