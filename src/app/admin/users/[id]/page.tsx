'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
}

interface Token {
  id: number;
  token_value: string;
  token_type: string;
  status: string;
  created_at: string;
  expires_at?: string;
  client?: { account_name: string };
}

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTokenForm, setShowTokenForm] = useState(false);
  const [newTokenData, setNewTokenData] = useState({
    expires_days: '30',
    manual_token: '',
    client_id: '',
  });
  const [clients, setClients] = useState<{id: number, account_name: string}[]>([]);

  const fetchUserAndTokens = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('master_token') || 'master-local-123';
      
      // Kullanıcı detayını çek
      const resUsers = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (resUsers.ok) {
        const data = await resUsers.json();
        const foundUser = data.users.find((u: any) => u.id === Number(params.id));
        setUser(foundUser);

        if (foundUser) {
            // Kullanıcının tokenlarını çek
            const resTokens = await fetch('/api/tokens', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (resTokens.ok) {
                const data = await resTokens.json();
                // Username eşleşmesi
                const userTokens = data.tokens
                  .filter((t: any) => t.user?.username === foundUser.username)
                  .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                setTokens(userTokens);
            }
        }
      }
      
      // Clients çek
      const resClients = await fetch('/api/clients', {
          headers: { 'Authorization': `Bearer ${token}` },
      });
      if (resClients.ok) {
          const data = await resClients.json();
          setClients(data.clients || []);
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserAndTokens();
  }, [params.id]);

  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const token = localStorage.getItem('master_token') || 'master-local-123';
      const res = await fetch('/api/tokens', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          client_id: newTokenData.client_id || undefined,
          expires_days: Number(newTokenData.expires_days),
          manual_token: newTokenData.manual_token || undefined,
        }),
      });

      if (res.ok) {
        setShowTokenForm(false);
        setNewTokenData({ expires_days: '30', manual_token: '', client_id: '' });
        // Refresh
        window.location.reload();
      } else {
        alert('Token oluşturulamadı');
      }
    } catch (err) {
      console.error(err);
      alert('Hata oluştu');
    }
  };

  const handleDeleteToken = async (tokenId: number) => {
    if (!confirm('Bu tokenı silmek istediğinize emin misiniz?')) return;
    try {
        const token = localStorage.getItem('master_token') || 'master-local-123';
        const res = await fetch(`/api/tokens/${tokenId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (res.ok) {
            setTokens(tokens.filter(t => t.id !== tokenId));
        } else {
            alert('Silinemedi');
        }
    } catch (err) {
        console.error(err);
    }
  };

  if (loading) return <div className="p-8 text-center">Yükleniyor...</div>;
  if (!user) return <div className="p-8 text-center">Kullanıcı bulunamadı</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
            <Link href="/admin/users" className="text-blue-600 hover:underline mb-2 inline-block">← Kullanıcılara Dön</Link>
            <h1 className="text-3xl font-bold text-gray-800">{user.username}</h1>
            <p className="text-gray-600">{user.email}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h2 className="text-xl font-bold text-gray-800">Token Yönetimi</h2>
            <button 
                onClick={() => setShowTokenForm(!showTokenForm)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded transition text-sm"
            >
                {showTokenForm ? 'İptal' : '+ Yeni Token Oluştur'}
            </button>
        </div>

        {showTokenForm && (
            <form onSubmit={handleCreateToken} className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Geçerlilik (Gün)</label>
                        <input
                            type="number"
                            value={newTokenData.expires_days}
                            onChange={(e) => setNewTokenData({ ...newTokenData, expires_days: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 outline-none"
                            min="1"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Manuel Token (Opsiyonel)</label>
                        <input
                            type="text"
                            value={newTokenData.manual_token}
                            onChange={(e) => setNewTokenData({ ...newTokenData, manual_token: e.target.value })}
                            placeholder="Özel token..."
                            className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Client Kısıtlaması (Opsiyonel)</label>
                        <select
                            value={newTokenData.client_id}
                            onChange={(e) => setNewTokenData({ ...newTokenData, client_id: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 outline-none"
                        >
                            <option value="">Tüm Clientlar (Genel)</option>
                            {clients.map(c => (
                                <option key={c.id} value={c.id}>{c.account_name} (#{c.id})</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="mt-4 flex justify-end">
                    <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded transition">
                        Oluştur
                    </button>
                </div>
            </form>
        )}

        {tokens.length === 0 ? (
            <div className="text-center text-gray-500 py-4">Bu kullanıcıya ait token bulunmamaktadır.</div>
        ) : (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-600 uppercase font-bold text-[10px] border-b border-gray-200">
                        <tr>
                            <th className="px-4 py-3">Token Bilgisi</th>
                            <th className="px-4 py-3">Durum</th>
                            <th className="px-4 py-3">Oluşturulma</th>
                            <th className="px-4 py-3">Bitiş Tarihi</th>
                            <th className="px-4 py-3 text-right">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {tokens.map((token, index) => {
                            const isNewest = index === 0;
                            const isExpired = token.expires_at && new Date(token.expires_at) < new Date();
                            
                            return (
                                <tr key={token.id} className={`hover:bg-gray-50 transition ${isNewest ? 'bg-purple-50/30' : ''}`}>
                                    <td className="px-4 py-3 max-w-[200px]">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <code className="bg-gray-100 text-purple-700 px-1.5 py-0.5 rounded font-mono text-xs font-bold truncate select-all" title={token.token_value}>
                                                    {token.token_value}
                                                </code>
                                                {isNewest && (
                                                    <span className="text-[9px] bg-purple-600 text-white px-1.5 rounded-full font-bold uppercase animate-pulse">AKTİF</span>
                                                )}
                                            </div>
                                            <div className="text-[10px] text-gray-400">
                                                Tip: {token.token_type} {token.client && `• Client: ${token.client.account_name}`}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                            token.status === 'active' && !isExpired ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                            {isExpired ? 'SÜRESİ DOLDU' : token.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 text-xs">
                                        {new Date(token.created_at).toLocaleDateString('tr-TR')}
                                    </td>
                                    <td className="px-4 py-3">
                                        {token.expires_at ? (
                                            <div className="flex flex-col">
                                                <span className={`text-xs font-medium ${isExpired ? 'text-red-500 line-through' : 'text-gray-700'}`}>
                                                    {new Date(token.expires_at).toLocaleDateString('tr-TR')}
                                                </span>
                                                {!isExpired && (
                                                    <span className="text-[9px] text-gray-400">
                                                        {Math.ceil((new Date(token.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} gün kaldı
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 text-xs italic">Süresiz</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-1">
                                            <button 
                                                onClick={() => {
                                                    navigator.clipboard.writeText(token.token_value);
                                                    alert('Token kopyalandı');
                                                }}
                                                className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded transition shadow-sm"
                                                title="Kopyala"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1m-7-13l-7 7-7-7" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 4v12l-4-4-4 4V4" />
                                                </svg>
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteToken(token.id)}
                                                className="p-1.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded transition shadow-sm"
                                                title="Sil"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        )}
      </div>
    </div>
  );
}