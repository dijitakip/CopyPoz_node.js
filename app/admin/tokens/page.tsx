'use client';

import { useEffect, useState } from 'react';

interface Token {
  id: number;
  user_id: number;
  client_id: number;
  token_value: string;
  token_type: string;
  status: string;
  created_at: string;
  expires_at: string | null;
  last_used: string | null;
  user?: { username: string };
  client?: { account_name: string };
}

export default function TokensPage() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newToken, setNewToken] = useState({
    user_id: '',
    client_id: '',
    token_type: 'CLIENT_TOKEN',
    expires_days: 30,
  });

  const fetchTokens = async () => {
    try {
      const token = localStorage.getItem('master_token') || process.env.NEXT_PUBLIC_MASTER_TOKEN;
      const res = await fetch('/api/tokens', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to fetch tokens');
      const data = await res.json();
      setTokens(data.tokens || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokens();
  }, []);

  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('master_token') || process.env.NEXT_PUBLIC_MASTER_TOKEN;
      const res = await fetch('/api/tokens', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newToken),
      });

      if (!res.ok) throw new Error('Failed to create token');
      
      setNewToken({ user_id: '', client_id: '', token_type: 'CLIENT_TOKEN', expires_days: 30 });
      fetchTokens();
      alert('Token oluşturuldu');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleRevokeToken = async (id: number) => {
    if (!confirm('Token'ı iptal etmek istediğinizden emin misiniz?')) return;
    
    try {
      const token = localStorage.getItem('master_token') || process.env.NEXT_PUBLIC_MASTER_TOKEN;
      const res = await fetch(`/api/tokens/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to revoke token');
      fetchTokens();
      alert('Token iptal edildi');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Token kopyalandı');
  };

  if (loading) return <div className="container"><p>Yükleniyor...</p></div>;

  return (
    <main className="container">
      <div className="card">
        <h1>Token Yönetimi</h1>

        <div className="bg-blue-50 p-4 rounded mt-4 mb-6">
          <h2 className="font-bold mb-4">Yeni Token Oluştur</h2>
          <form onSubmit={handleCreateToken} className="grid grid-cols-5 gap-4">
            <input
              type="number"
              placeholder="User ID"
              value={newToken.user_id}
              onChange={(e) => setNewToken({ ...newToken, user_id: e.target.value })}
              className="border rounded px-3 py-2"
              required
            />
            <input
              type="number"
              placeholder="Client ID"
              value={newToken.client_id}
              onChange={(e) => setNewToken({ ...newToken, client_id: e.target.value })}
              className="border rounded px-3 py-2"
              required
            />
            <select
              value={newToken.token_type}
              onChange={(e) => setNewToken({ ...newToken, token_type: e.target.value })}
              className="border rounded px-3 py-2"
            >
              <option value="CLIENT_TOKEN">Client Token</option>
              <option value="TRADER_TOKEN">Trader Token</option>
              <option value="MASTER_TOKEN">Master Token</option>
              <option value="ADMIN_TOKEN">Admin Token</option>
            </select>
            <input
              type="number"
              placeholder="Gün Sayısı"
              value={newToken.expires_days}
              onChange={(e) => setNewToken({ ...newToken, expires_days: parseInt(e.target.value) })}
              className="border rounded px-3 py-2"
              min="1"
              required
            />
            <button
              type="submit"
              className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700"
            >
              Oluştur
            </button>
          </form>
        </div>

        {error && <p className="text-red-600 mb-4">Hata: {error}</p>}

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3">Token</th>
                <th className="px-6 py-3">Tip</th>
                <th className="px-6 py-3">Durum</th>
                <th className="px-6 py-3">Oluşturulma</th>
                <th className="px-6 py-3">Son Kullanım</th>
                <th className="px-6 py-3">Bitiş</th>
                <th className="px-6 py-3">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {tokens.map((token) => (
                <tr key={token.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-mono text-xs">
                    <div className="flex items-center gap-2">
                      <span>{token.token_value.substring(0, 20)}...</span>
                      <button
                        onClick={() => copyToClipboard(token.token_value)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Kopyala"
                      >
                        📋
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded text-xs font-bold bg-indigo-100 text-indigo-800">
                      {token.token_type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      token.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {token.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs">
                    {new Date(token.created_at).toLocaleString('tr-TR')}
                  </td>
                  <td className="px-6 py-4 text-xs">
                    {token.last_used ? new Date(token.last_used).toLocaleString('tr-TR') : '-'}
                  </td>
                  <td className="px-6 py-4 text-xs">
                    {token.expires_at ? new Date(token.expires_at).toLocaleDateString('tr-TR') : 'Unlimited'}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleRevokeToken(token.id)}
                      className="text-red-600 hover:text-red-800 font-bold"
                    >
                      İptal Et
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {tokens.length === 0 && (
          <p className="text-gray-500 mt-4">Token yok</p>
        )}
      </div>
    </main>
  );
}
