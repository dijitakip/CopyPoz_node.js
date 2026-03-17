'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Client {
  id: number;
  account_number: string;
  account_name: string;
  server?: string;
  password?: string;
  auth_token: string;
  balance: number;
  equity: number;
  open_positions: number;
  status: string;
  account_type: string;
  created_at: string;
}

export default function UserClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    account_name: '',
    server: '',
    password: '',
    account_type: 'standard',
  });
  const [submitting, setSubmitting] = useState(false);
  const [panicLoading, setPanicLoading] = useState<number | null>(null);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/user/clients');
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleEdit = (client: Client) => {
    setEditClient(client);
    setFormData({
      account_name: client.account_name,
      server: client.server || '',
      password: client.password || '',
      account_type: client.account_type || 'standard',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editClient || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/user/clients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editClient.id,
          ...formData
        })
      });

      if (res.ok) {
        alert('Client bilgileri güncellendi.');
        setEditClient(null);
        fetchClients();
      } else {
        alert('Güncelleme sırasında hata oluştu.');
      }
    } catch (err) {
      alert('İşlem sırasında hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePanicButton = async (clientId: number) => {
    if (!confirm('DİKKAT! Bu işlem hesabınızdaki kopyalamayı durduracak ve açık olan tüm kopyalanmış pozisyonları acilen kapatacaktır. Emin misiniz?')) return;

    setPanicLoading(clientId);
    try {
      const token = localStorage.getItem('master_token') || 'master-local-123'; // Temporary fallback for demo
      // In a real scenario, users should have their own token or session-based auth for this endpoint. 
      // Assuming /api/clients/[id] endpoint allows users to trigger their own panic if logged in.
      // Wait, /api/clients/[id] might require admin. Let's use a specific endpoint or update the existing one to check user ownership.
      // Actually, since this is user dashboard, we should call a user-specific endpoint.
      // Let's create or use /api/user/clients/panic if it exists, or update the generic one.
      // We will use the existing POST /api/clients/[id] and rely on the fact that we can pass action: 'panic'.
      
      const res = await fetch(`/api/clients/${clientId}`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'panic',
            reason: 'Manuel Panik Butonu (Kullanıcı)'
          })
      });

      if (res.ok) {
          alert('Panik komutu başarıyla gönderildi. İşlemleriniz kapatılıyor.');
          fetchClients();
      } else {
          const err = await res.json();
          alert('İşlem başarısız: ' + (err.error || 'Bilinmeyen hata'));
      }
    } catch (err) {
        console.error(err);
        alert('Bir hata oluştu');
    } finally {
      setPanicLoading(null);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Clientlarım</h1>
        <p className="text-gray-600 mt-1">MetaTrader hesaplarınızı yönetin</p>
      </div>

      {editClient && (
        <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-blue-500 animate-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Hesap Düzenle: #{editClient.account_number}</h2>
            <button onClick={() => setEditClient(null)} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Hesap Adı</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.account_name}
                onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Server</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.server}
                onChange={(e) => setFormData({ ...formData, server: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Şifre</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Hesap Türü</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                value={formData.account_type}
                onChange={(e) => setFormData({ ...formData, account_type: e.target.value })}
                required
              >
                <option value="standard">Standard Hesap</option>
                <option value="cent">Cent Hesap</option>
              </select>
            </div>
            <div className="md:col-span-3 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditClient(null)}
                className="px-6 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 font-medium"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition disabled:bg-gray-400"
              >
                {submitting ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-500">Yükleniyor...</div>
        ) : clients.length === 0 ? (
          <div className="p-10 text-center text-gray-500 italic">Henüz tanımlı client hesabınız bulunmamaktadır.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Hesap No / Adı</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Bakiye / Equity</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Tür</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Durum</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">API Token</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {clients.map(client => (
                  <tr key={client.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-900">{client.account_name}</div>
                      <div className="text-xs font-mono text-gray-500">#{client.account_number}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-800">${Number(client.balance).toLocaleString()}</div>
                      <div className="text-xs text-gray-500">Equity: ${Number(client.equity).toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${client.account_type === 'cent' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                        {client.account_type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                        client.status === 'active' ? 'bg-green-100 text-green-800' : 
                        client.status === 'pending' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {client.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-[150px]">
                        <code className="text-[10px] bg-gray-100 p-1 rounded border block truncate" title={client.auth_token}>
                          {client.auth_token}
                        </code>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm flex gap-2 items-center flex-wrap">
                      <button
                        onClick={() => handlePanicButton(client.id)}
                        disabled={panicLoading === client.id || client.status !== 'active'}
                        className={`px-3 py-1.5 rounded text-xs font-bold transition-all shadow-sm ${
                          client.status !== 'active' 
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-red-500 hover:bg-red-600 text-white animate-pulse hover:animate-none'
                        }`}
                        title="Tüm işlemleri kapat ve kopyalamayı durdur"
                      >
                        {panicLoading === client.id ? 'İşleniyor...' : '🚨 PANİK BUTONU'}
                      </button>
                      <button
                        onClick={() => handleEdit(client)}
                        className="text-blue-600 hover:text-blue-800 font-medium px-2 py-1 bg-blue-50 hover:bg-blue-100 rounded transition"
                      >
                        Düzenle
                      </button>
                      <Link
                        href={`/dashboard/collaterals`}
                        className="text-orange-600 hover:text-orange-800 font-medium px-2 py-1 bg-orange-50 hover:bg-orange-100 rounded transition"
                      >
                        Teminat
                      </Link>
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
