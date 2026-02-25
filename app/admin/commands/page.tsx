'use client';

import { useEffect, useState } from 'react';

interface Command {
  id: number;
  client_id: number;
  command: string;
  status: string;
  created_at: string;
  executed_at?: string;
  client?: { account_name: string };
}

export default function CommandsPage() {
  const [commands, setCommands] = useState<Command[]>([]);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    client_id: '',
    command: 'PAUSE',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('master_token') || 'master-local-123';
        
        const [cmdRes, clientRes] = await Promise.all([
          fetch('/api/commands', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/clients', { headers: { 'Authorization': `Bearer ${token}` } }),
        ]);

        if (cmdRes.ok) {
          const data = await cmdRes.json();
          setCommands(data.commands || []);
        }

        if (clientRes.ok) {
          const data = await clientRes.json();
          setClients(data.clients || []);
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('master_token') || 'master-local-123';
      const res = await fetch('/api/commands', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: parseInt(formData.client_id),
          command: formData.command,
        }),
      });

      if (res.ok) {
        setFormData({ client_id: '', command: 'PAUSE' });
        setShowForm(false);
        alert('Komut başarıyla gönderildi');
        // Refresh commands
        const cmdRes = await fetch('/api/commands', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (cmdRes.ok) {
          const data = await cmdRes.json();
          setCommands(data.commands || []);
        }
      }
    } catch (err) {
      alert('Hata: ' + (err instanceof Error ? err.message : 'Bilinmeyen hata'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Komut Yönetimi</h1>
          <p className="text-gray-600 mt-1">Clientlere komut gönderin</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
        >
          {showForm ? '✕ İptal' : '+ Yeni Komut'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Komut Gönder</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={formData.client_id}
              onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            >
              <option value="">Client Seçin</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.account_name} ({c.account_number})
                </option>
              ))}
            </select>

            <select
              value={formData.command}
              onChange={(e) => setFormData({ ...formData, command: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="PAUSE">Durdur</option>
              <option value="RESUME">Devam Et</option>
              <option value="CLOSE_ALL">Tümünü Kapat</option>
              <option value="CLOSE_BUY">Buy Pozisyonlarını Kapat</option>
              <option value="CLOSE_SELL">Sell Pozisyonlarını Kapat</option>
            </select>

            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
            >
              Gönder
            </button>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Yükleniyor...</div>
        ) : commands.length === 0 ? (
          <div className="p-6 text-center text-gray-500">Komut bulunamadı</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Client</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Komut</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Durum</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Oluşturulma</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Yürütülme</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {commands.map((cmd) => (
                  <tr key={cmd.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">
                      {cmd.client?.account_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{cmd.command}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        cmd.status === 'executed'
                          ? 'bg-green-100 text-green-800'
                          : cmd.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {cmd.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(cmd.created_at).toLocaleString('tr-TR')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {cmd.executed_at ? new Date(cmd.executed_at).toLocaleString('tr-TR') : '-'}
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
