'use client';

import { useEffect, useState } from 'react';

interface Client {
  id: number;
  account_number: string;
  account_name: string;
  token_balance: number;
  required_collateral: number;
  estimated_commission: number;
  free_token_balance: number;
  balance: number;
  status: string;
}

interface UserData {
  id: number;
  username: string;
  token_balance: number;
}

export default function UserCollateralsPage() {
  const [data, setData] = useState<{ user: UserData; clients: Client[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [transferAmount, setTransferAmount] = useState<string>('');
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [transferType, setTransferType] = useState<'deposit' | 'withdraw'>('deposit');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/user/collaterals');
      if (res.ok) {
        const json = await res.json();
        setData(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !transferAmount || submitting) return;

    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/user/collaterals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClientId,
          amount: parseFloat(transferAmount),
          type: transferType
        })
      });

      const result = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: result.message || 'İşlem başarıyla tamamlandı.' });
        setTransferAmount('');
        fetchData();
      } else {
        setMessage({ type: 'error', text: result.error || 'İşlem sırasında hata oluştu.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Sunucu hatası oluştu.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !data) {
    return <div className="p-10 text-center text-gray-500">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Teminat Yönetimi</h1>
        <p className="text-gray-600 mt-1">Ana bakiyenizden client hesaplarınıza jeton transfer edin.</p>
      </div>

      {/* Main Balance Card */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-lg p-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-1">Ana Jeton Bakiyeniz</p>
            <h2 className="text-5xl font-black mt-1">
              {Number(data?.user.token_balance).toLocaleString()} 
              <span className="text-2xl ml-2 font-normal opacity-80 uppercase">Jeton</span>
            </h2>
          </div>
          <button 
            onClick={fetchData}
            disabled={loading}
            className="bg-white/20 hover:bg-white/30 transition p-3 rounded-full shadow-inner"
            title="Yenile"
          >
            🔄
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transfer Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-4">
            <h3 className="font-bold text-gray-800 mb-4 border-b border-gray-50 pb-2">Jeton İşlemleri</h3>
            
            <div className="flex p-1 bg-gray-100 rounded-lg mb-6">
              <button 
                onClick={() => setTransferType('deposit')}
                className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${transferType === 'deposit' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Yükle (Depozit)
              </button>
              <button 
                onClick={() => setTransferType('withdraw')}
                className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${transferType === 'withdraw' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Geri Çek (Çekim)
              </button>
            </div>

            <form onSubmit={handleTransfer} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-tight mb-1">Kaynak / Hedef Client</label>
                <select 
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white font-medium"
                  value={selectedClientId || ''}
                  onChange={(e) => setSelectedClientId(Number(e.target.value))}
                  required
                >
                  <option value="">Seçiniz...</option>
                  {data?.clients.map(c => (
                    <option key={c.id} value={c.id}>{c.account_name} (#{c.account_number})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-tight mb-1">Miktar</label>
                <input 
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                  placeholder="0.00"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  required
                />
              </div>
              <button 
                type="submit"
                disabled={submitting}
                className={`w-full ${transferType === 'deposit' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'} disabled:bg-gray-300 text-white font-bold py-2.5 rounded-lg transition shadow-md shadow-blue-200`}
              >
                {submitting ? 'İşleniyor...' : (transferType === 'deposit' ? 'Transferi Başlat' : 'Geri Çekmeyi Başlat')}
              </button>
              {message && (
                <div className={`text-xs p-3 rounded-lg border animate-in fade-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-100 font-medium' : 'bg-red-50 text-red-700 border-red-100 font-medium'}`}>
                  {message.text}
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Clients Table */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">Client Bakiyeleriniz</h3>
              <span className="text-[10px] font-bold bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full uppercase">{data?.clients.length} Hesap</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3 text-left">Hesap Bilgisi</th>
                    <th className="px-6 py-3 text-right">Gerekli Teminat</th>
                    <th className="px-6 py-3 text-right">Beklenen Komisyon</th>
                    <th className="px-6 py-3 text-right">Serbest Bakiye</th>
                    <th className="px-6 py-3 text-right font-black text-gray-600">Toplam Jeton</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data?.clients.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-10 text-center text-gray-400 italic">Henüz tanımlı client bulunamadı.</td>
                    </tr>
                  ) : (
                    data?.clients.map(client => (
                      <tr key={client.id} className="hover:bg-gray-50 transition group">
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-gray-800">{client.account_name}</div>
                          <div className="text-[10px] font-mono text-gray-400">#{client.account_number}</div>
                          <span className={`mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-tight ${client.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {client.status}
                          </span>
                        </td>
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
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-6 bg-amber-50 border border-amber-100 rounded-xl p-5 flex gap-4 shadow-sm shadow-amber-50">
            <div className="bg-amber-100 w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0">ℹ️</div>
            <div>
              <h4 className="font-bold text-amber-900 text-sm mb-1">Önemli Hatırlatma</h4>
              <p className="text-xs text-amber-800 leading-relaxed font-medium">
                Client hesaplarınızın aktif kalması için trading bakiyenizin en az <strong>%20'si</strong> kadar teminat jetonuna sahip olmanız gerekir. Yetersiz teminat durumunda kopyalama işlemleri güvenlik amacıyla duraklatılır.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
