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

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const token = localStorage.getItem('master_token') || 'master-local-123';
        const res = await fetch('/api/tokens', {
          headers: { 'Authorization': `Bearer ${token}` },
        });

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

    fetchTokens();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Token kopyalandı');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Token Yönetimi</h1>
        <p className="text-gray-600 mt-1">API tokenlarını yönetin</p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Yükleniyor...</div>
        ) : tokens.length === 0 ? (
          <div className="p-6 text-center text-gray-500">Token bulunamadı</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Token</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Tip</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Durum</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Bitiş</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tokens.map((token) => (
                  <tr key={token.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-mono text-gray-600">
                      {token.token_value.substring(0, 20)}...
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
                      {token.expires_at ? new Date(token.expires_at).toLocaleDateString('tr-TR') : 'Unlimited'}
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
        )}
      </div>
    </div>
  );
}
