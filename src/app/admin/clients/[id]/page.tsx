'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  created_at: string;
  updated_at: string;
  owner_id?: number;
  owner?: { username: string };
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState<string>('viewer');
  const [panicLoading, setPanicLoading] = useState(false);

  useEffect(() => {
    // Kullanıcı rolünü al
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserRole(user.role || 'viewer');
      } catch (e) {
        console.error('Failed to parse user from localStorage');
      }
    }

    const fetchClient = async () => {
      try {
        const token = localStorage.getItem('master_token') || 'master-local-123';
        const res = await fetch(`/api/clients/${params.id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setClient(data.client);
        } else {
            const errData = await res.json();
            setError(errData.error || 'Client bulunamadı');
        }
      } catch (err) {
        console.error('Failed to fetch client:', err);
        setError('Bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
        fetchClient();
    }
  }, [params.id]);

  const handleDelete = async () => {
      if (!confirm('Bu clientı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) return;

      try {
        const token = localStorage.getItem('master_token') || 'master-local-123';
        const res = await fetch(`/api/clients/${params.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (res.ok) {
            alert('Client başarıyla silindi');
            router.push('/admin/clients');
        } else {
            alert('Silme işlemi başarısız oldu');
        }
      } catch (err) {
          console.error(err);
          alert('Bir hata oluştu');
      }
  };

  const handlePanicButton = async () => {
      if (!confirm('DİKKAT! Bu işlem client için tüm kopyalamayı durduracak ve açık olan tüm pozisyonları kapatması için acil komut gönderecektir. Emin misiniz?')) return;

      setPanicLoading(true);
      try {
        const token = localStorage.getItem('master_token') || 'master-local-123';
        const res = await fetch(`/api/clients/${params.id}`, {
            method: 'POST',
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              action: 'panic',
              reason: 'Manuel Panik Butonu (Admin/Owner)'
            })
        });

        if (res.ok) {
            alert('Panik komutu başarıyla gönderildi. İşlemler kapatılıyor.');
            window.location.reload();
        } else {
            const err = await res.json();
            alert('İşlem başarısız: ' + (err.error || 'Bilinmeyen hata'));
        }
      } catch (err) {
          console.error(err);
          alert('Bir hata oluştu');
      } finally {
        setPanicLoading(false);
      }
  };

  if (loading) return <div className="p-8 text-center">Yükleniyor...</div>;
  if (error) return <div className="p-8 text-center text-red-600">Hata: {error}</div>;
  if (!client) return <div className="p-8 text-center">Client bulunamadı</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
            <Link href="/admin/clients" className="text-blue-600 hover:underline mb-2 inline-block">← Listeye Dön</Link>
            <h1 className="text-3xl font-bold text-gray-800">Client Detayı: {client.account_name}</h1>
            <p className="text-gray-500">ID: {client.id}</p>
        </div>
        <div className="flex gap-2">
            {(userRole === 'admin' || userRole === 'master_owner' || userRole === 'client') && (
                <button 
                    onClick={handlePanicButton}
                    disabled={panicLoading || client.status !== 'active'}
                    className={`px-4 py-2 rounded transition font-bold ${
                      client.status !== 'active' 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-red-600 hover:bg-red-700 text-white animate-pulse hover:animate-none shadow-lg'
                    }`}
                >
                    {panicLoading ? 'İşleniyor...' : '🚨 PANİK BUTONU (Kapat)'}
                </button>
            )}
            <Link 
                href={`/admin/clients/${params.id}/positions`}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition flex items-center"
            >
                Pozisyonlar
            </Link>
            <Link 
                href={`/admin/clients/${params.id}/commands`}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded transition flex items-center"
            >
                Komutlar
            </Link>
            {userRole === 'admin' && (
                <button 
                    onClick={handleDelete}
                    className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded transition flex items-center"
                >
                    Sil
                </button>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Temel Bilgiler Kartı */}
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">Hesap Bilgileri</h2>
            <div className="space-y-3">
                <div className="flex justify-between">
                    <span className="text-gray-600">Hesap No:</span>
                    <span className="font-medium">{client.account_number}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">Hesap Adı:</span>
                    <span className="font-medium">{client.account_name}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">Sahibi:</span>
                    <span className="font-medium">{client.owner?.username || 'Atanmamış'}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">Durum:</span>
                    <span className={`px-2 py-0.5 rounded text-sm ${
                        client.status === 'active' ? 'bg-green-100 text-green-800' : 
                        client.status === 'pending' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                    }`}>
                        {client.status === 'pending' ? 'Beklemede' : client.status}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">Oluşturulma:</span>
                    <span className="text-sm">{new Date(client.created_at).toLocaleString('tr-TR')}</span>
                </div>
            </div>
        </div>

        {/* Finansal Durum Kartı */}
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">Finansal Durum</h2>
            <div className="space-y-3">
                <div className="flex justify-between">
                    <span className="text-gray-600">Bakiye:</span>
                    <span className="font-bold text-lg">${Number(client.balance).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">Equity (Varlık):</span>
                    <span className="font-bold text-lg">${Number(client.equity).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">Açık Pozisyonlar:</span>
                    <span className="font-medium">{client.open_positions}</span>
                </div>
            </div>
        </div>

        {/* Bağlantı Bilgileri Kartı */}
        <div className="bg-white rounded-lg shadow p-6 md:col-span-2">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">Bağlantı Bilgileri</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                    {userRole === 'admin' && (
                        <>
                            <div>
                                <span className="text-gray-600 block text-sm font-bold uppercase tracking-wider mb-1">Server:</span>
                                <code className="bg-gray-50 px-2 py-1 rounded border border-gray-200 text-blue-700 font-bold">{client.server || 'N/A'}</code>
                            </div>
                            <div>
                                <span className="text-gray-600 block text-sm font-bold uppercase tracking-wider mb-1">Login (Acc No):</span>
                                <code className="bg-gray-50 px-2 py-1 rounded border border-gray-200 text-gray-800 font-bold">{client.account_number}</code>
                            </div>
                            <div>
                                <span className="text-gray-600 block text-sm font-bold uppercase tracking-wider mb-1">Password:</span>
                                <div className="flex items-center gap-2">
                                    <code className="bg-gray-50 px-2 py-1 rounded border border-gray-200 text-red-600 font-bold flex-1">
                                        {client.password || 'N/A'}
                                    </code>
                                </div>
                            </div>
                        </>
                    )}
                </div>
                <div className="space-y-3 border-l pl-6">
                    <div>
                        <span className="text-gray-600 block text-sm font-bold uppercase tracking-wider mb-1">Auth Token (API):</span>
                        <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-xs break-all select-all shadow-inner">
                            {client.auth_token}
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2 italic">Bu tokenı MetaTrader Client ayarlarında (Web API Token) kullanın.</p>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
