'use client';

import { useEffect, useState } from 'react';

interface Client {
  id: number;
  account_number: number;
  account_name: string;
  status: string;
  balance: number;
  equity: number;
  open_positions: number;
  last_seen: string | null;
}

export default function AdminClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [command, setCommand] = useState('PAUSE');

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('master_token') || process.env.NEXT_PUBLIC_MASTER_TOKEN;
      const res = await fetch('/api/clients', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to fetch clients');
      const data = await res.json();
      setClients(data.clients || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
    const interval = setInterval(fetchClients, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSendCommand = async () => {
    if (!selectedClient) return;

    try {
      const token = localStorage.getItem('master_token') || process.env.NEXT_PUBLIC_MASTER_TOKEN;
      const res = await fetch('/api/commands', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: selectedClient.id,
          command,
          params: null,
        }),
      });

      if (!res.ok) throw new Error('Failed to send command');
      alert('Komut gönderildi');
      setSelectedClient(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  if (loading) return <div className="container"><p>Yükleniyor...</p></div>;

  return (
    <main className="container">
      <div className="card">
        <h1>Client Yönetimi</h1>

        {error && <p className="text-red-600 mb-4">Hata: {error}</p>}

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3">Hesap</th>
                <th className="px-6 py-3">Ad</th>
                <th className="px-6 py-3">Durum</th>
                <th className="px-6 py-3">Bakiye</th>
                <th className="px-6 py-3">Öz Sermaye</th>
                <th className="px-6 py-3">Açık Pozisyon</th>
                <th className="px-6 py-3">Son Görülme</th>
                <th className="px-6 py-3">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{client.account_number}</td>
                  <td className="px-6 py-4">{client.account_name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      client.status === 'active' ? 'bg-green-100 text-green-800' :
                      client.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {client.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">${Number(client.balance).toLocaleString()}</td>
                  <td className="px-6 py-4">${Number(client.equity).toLocaleString()}</td>
                  <td className="px-6 py-4">{client.open_positions}</td>
                  <td className="px-6 py-4 text-xs">
                    {client.last_seen ? new Date(client.last_seen).toLocaleString('tr-TR') : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setSelectedClient(client)}
                      className="text-blue-600 hover:text-blue-800 font-bold"
                    >
                      Komut Gönder
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {clients.length === 0 && (
          <p className="text-gray-500 mt-4">Client yok</p>
        )}
      </div>

      {selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">
              {selectedClient.account_name} - Komut Gönder
            </h2>
            
            <div className="mb-4">
              <label className="block text-sm font-bold mb-2">Komut</label>
              <select
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option>PAUSE</option>
                <option>RESUME</option>
                <option>CLOSE_ALL</option>
                <option>CLOSE_ALL_BUY</option>
                <option>CLOSE_ALL_SELL</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSendCommand}
                className="flex-1 bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700"
              >
                Gönder
              </button>
              <button
                onClick={() => setSelectedClient(null)}
                className="flex-1 bg-gray-300 text-gray-800 rounded px-4 py-2 hover:bg-gray-400"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
