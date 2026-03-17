'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function ClientCommandsPage() {
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const sendCommand = async (command: string, paramsStr?: string) => {
    try {
      setLoading(true);
      setSuccess('');
      setError('');
      
      const token = localStorage.getItem('master_token') || 'master-local-123';
      const res = await fetch(`/api/client/command`, {
        method: 'POST',
        headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            client_id: params.id,
            command,
            params: paramsStr
        })
      });

      if (res.ok) {
        setSuccess(`Komut başarıyla gönderildi: ${command}`);
      } else {
        const errData = await res.json();
        setError(errData.error || 'Komut gönderilemedi');
      }
    } catch (err) {
      console.error('Failed to send command:', err);
      setError('Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
            <Link href={`/admin/clients/${params.id}`} className="text-blue-600 hover:underline mb-2 inline-block">← Client Detayına Dön</Link>
            <h1 className="text-3xl font-bold text-gray-800">Komut Gönder</h1>
        </div>
      </div>

      {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">{success}</div>}
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">Acil Durum Komutları</h2>
            <div className="space-y-4">
                <button 
                    onClick={() => sendCommand('CLOSE_ALL')}
                    disabled={loading}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded"
                >
                    TÜM POZİSYONLARI KAPAT
                </button>
                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={() => sendCommand('CLOSE_ALL_BUY')}
                        disabled={loading}
                        className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
                    >
                        Tüm BUY Kapat
                    </button>
                    <button 
                        onClick={() => sendCommand('CLOSE_ALL_SELL')}
                        disabled={loading}
                        className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
                    >
                        Tüm SELL Kapat
                    </button>
                </div>
            </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">Senkronizasyon</h2>
            <div className="space-y-4">
                <button 
                    onClick={() => sendCommand('PAUSE')}
                    disabled={loading}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-4 rounded"
                >
                    Senkronizasyonu DURAKLAT
                </button>
                <button 
                    onClick={() => sendCommand('RESUME')}
                    disabled={loading}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded"
                >
                    Senkronizasyonu BAŞLAT
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}
