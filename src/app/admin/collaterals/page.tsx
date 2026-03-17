'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface CollateralData {
  users: {
    id: number;
    username: string;
    email: string;
    token_balance: number;
    role: string;
  }[];
  clients: {
    id: number;
    account_number: string;
    account_name: string;
    token_balance: number;
    required_collateral: number;
    estimated_commission: number;
    free_token_balance: number;
    owner?: { username: string };
    status: string;
  }[];
  isAdmin: boolean;
  currentUser: {
    id: number;
    username: string;
    role: string;
  };
}

export default function CollateralsPage() {
  const [data, setData] = useState<CollateralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'clients'>('users');
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [targetUser, setTargetUser] = useState<{id: number, username: string} | null>(null);
  const [targetClient, setTargetClient] = useState<{id: number, name: string} | null>(null);
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/collaterals');
      if (res.ok) {
        const json = await res.json();
        setData(json.data);
      } else {
        setError('Veri alınamadı: ' + res.statusText);
      }
    } catch (err) {
      console.error(err);
      setError('Bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddTokens = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !amount) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/collaterals/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: targetUser?.id,
          clientId: targetClient?.id,
          amount: parseFloat(amount)
        })
      });

      if (res.ok) {
        alert('Jeton başarıyla yüklendi.');
        setShowModal(false);
        setAmount('');
        setTargetUser(null);
        setTargetClient(null);
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || 'Hata oluştu');
      }
    } catch (err) {
      alert('İşlem sırasında bir hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = data?.users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredClients = data?.clients.filter(c => 
    c.account_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.account_number.includes(searchTerm)
  ) || [];

  const totalUserTokens = data?.users.reduce((sum, u) => sum + Number(u.token_balance), 0) || 0;
  const totalClientTokens = data?.clients.reduce((sum, c) => sum + Number(c.token_balance), 0) || 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Teminat (Jeton) Takibi</h1>
        <p className="text-gray-600 mt-1">Sistem genelindeki kullanıcı ve client bakiyelerini yönetin.</p>
      </div>

      {/* Stats Summary Card */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl shadow-lg p-8 text-white">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="border-r border-white/10 pr-8">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Toplam Kullanıcı Jetonu</p>
            <h2 className="text-4xl font-black">
              {totalUserTokens.toLocaleString()}
              <span className="text-xl ml-2 font-normal opacity-50 uppercase">Jeton</span>
            </h2>
          </div>
          <div className="border-r border-white/10 pr-8">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Toplam Client Jetonu</p>
            <h2 className="text-4xl font-black">
              {totalClientTokens.toLocaleString()}
              <span className="text-xl ml-2 font-normal opacity-50 uppercase">Jeton</span>
            </h2>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Genel Toplam</p>
              <h2 className="text-4xl font-black text-blue-400">
                {(totalUserTokens + totalClientTokens).toLocaleString()}
              </h2>
            </div>
            <button 
              onClick={fetchData}
              disabled={loading}
              className="bg-white/10 hover:bg-white/20 transition p-3 rounded-full"
              title="Yenile"
            >
              🔄
            </button>
          </div>
        </div>
      </div>

      {/* Tabs and Search Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between p-2 bg-gray-50/50 border-b border-gray-100">
          <div className="flex p-1 gap-1">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-2 rounded-lg font-bold text-xs transition-all ${activeTab === 'users' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Kullanıcı Bakiyeleri
            </button>
            <button
              onClick={() => setActiveTab('clients')}
              className={`px-6 py-2 rounded-lg font-bold text-xs transition-all ${activeTab === 'clients' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Client Bakiyeleri
            </button>
          </div>
          <div className="p-1 w-full md:w-64">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={activeTab === 'users' ? "Kullanıcı ara..." : "Client ara..."}
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none transition text-sm"
            />
          </div>
        </div>

        {error && <div className="p-4 bg-red-50 text-red-700 border-b border-red-100 text-sm font-medium">{error}</div>}
        
        {loading ? (
          <div className="p-20 text-center text-gray-500 italic">Veriler yükleniyor...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {activeTab === 'users' ? (
                    <>
                      <th className="px-6 py-3 text-left">Kullanıcı</th>
                      <th className="px-6 py-3 text-left">Rol</th>
                      <th className="px-6 py-3 text-right">Jeton Bakiyesi</th>
                      <th className="px-6 py-3 text-center">İşlem</th>
                    </>
                  ) : (
                    <>
                      <th className="px-6 py-3 text-left">Client / Hesap</th>
                      <th className="px-6 py-3 text-left">Sahibi</th>
                      <th className="px-6 py-3 text-right">Gerekli Teminat</th>
                      <th className="px-6 py-3 text-right">Beklenen Komisyon</th>
                      <th className="px-6 py-3 text-right">Serbest Bakiye</th>
                      <th className="px-6 py-3 text-right font-black text-gray-600">Toplam Jeton</th>
                      <th className="px-6 py-3 text-center">İşlem</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activeTab === 'users' ? (
                  filteredUsers.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-400 italic">Kayıt bulunamadı.</td></tr>
                  ) : (
                    filteredUsers.map(user => (
                      <tr key={user.id} className="hover:bg-gray-50 transition group">
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-gray-800">{user.username}</div>
                          <div className="text-[10px] text-gray-400 font-medium">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-bold uppercase tracking-tight">{user.role}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-lg font-black text-gray-800">{Number(user.token_balance).toLocaleString()}</span>
                          <span className="ml-1 text-[10px] text-gray-400 font-bold uppercase">Jeton</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {data?.isAdmin && (
                            <button 
                              onClick={() => {
                                setTargetUser({ id: user.id, username: user.username });
                                setTargetClient(null);
                                setShowModal(true);
                              }}
                              className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm"
                            >
                              Bakiye Yükle
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )
                ) : (
                  filteredClients.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400 italic">Kayıt bulunamadı.</td></tr>
                  ) : (
                    filteredClients.map(client => (
                      <tr key={client.id} className="hover:bg-gray-50 transition group">
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-gray-800">{client.account_name}</div>
                          <div className="text-[10px] font-mono text-gray-400">#{client.account_number}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 font-medium">{client.owner?.username || '-'}</td>
                        <td className="px-6 py-4 text-right text-sm font-medium text-gray-600">
                          {client.required_collateral.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium text-amber-600">
                          {client.estimated_commission.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`text-sm font-bold ${client.free_token_balance < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {client.free_token_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-lg font-black text-gray-800">{Number(client.token_balance).toLocaleString()}</span>
                          <span className="ml-1 text-[10px] text-gray-400 font-bold uppercase">Jeton</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {data?.isAdmin && (
                            <button 
                              onClick={() => {
                                setTargetClient({ id: client.id, name: client.account_name });
                                setTargetUser(null);
                                setShowModal(true);
                              }}
                              className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm"
                            >
                              Bakiye Yükle
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">
                {targetUser ? 'Kullanıcıya Jeton Yükle' : 'Client\'a Jeton Yükle'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddTokens} className="p-6 space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <p className="text-xs text-blue-600 font-bold uppercase mb-1">Hedef:</p>
                <p className="text-sm font-bold text-blue-900">
                  {targetUser?.username || targetClient?.name}
                </p>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Miktar (Jeton)</label>
                <input 
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  autoFocus
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  İptal
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition font-bold shadow-md"
                >
                  {submitting ? 'Yükleniyor...' : 'Yüklemeyi Tamamla'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
