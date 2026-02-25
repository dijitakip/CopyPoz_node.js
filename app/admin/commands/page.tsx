'use client';

import { useEffect, useState } from 'react';

interface Command {
  id: number;
  client_id: number;
  command: string;
  params: string | null;
  status: string;
  created_at: string;
  executed_at: string | null;
  client?: {
    account_number: number;
    account_name: string;
  };
}

export default function CommandsPage() {
  const [commands, setCommands] = useState<Command[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newCommand, setNewCommand] = useState({
    client_id: '',
    command: 'PAUSE',
    params: '',
  });

  const fetchCommands = async () => {
    try {
      const token = localStorage.getItem('master_token') || process.env.NEXT_PUBLIC_MASTER_TOKEN;
      const res = await fetch('/api/commands', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to fetch commands');
      const data = await res.json();
      setCommands(data.commands || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommands();
    const interval = setInterval(fetchCommands, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSendCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('master_token') || process.env.NEXT_PUBLIC_MASTER_TOKEN;
      const res = await fetch('/api/commands', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: parseInt(newCommand.client_id),
          command: newCommand.command,
          params: newCommand.params ? JSON.parse(newCommand.params) : null,
        }),
      });

      if (!res.ok) throw new Error('Failed to send command');
      
      setNewCommand({ client_id: '', command: 'PAUSE', params: '' });
      fetchCommands();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleDeleteCommand = async (id: number) => {
    if (!confirm('Komutu silmek istediğinizden emin misiniz?')) return;
    
    try {
      const token = localStorage.getItem('master_token') || process.env.NEXT_PUBLIC_MASTER_TOKEN;
      const res = await fetch(`/api/commands/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to delete command');
      fetchCommands();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  if (loading) return <div className="container"><p>Yükleniyor...</p></div>;

  return (
    <main className="container">
      <div className="card">
        <h1>Komut Yönetimi</h1>

        <div className="bg-blue-50 p-4 rounded mt-4 mb-6">
          <h2 className="font-bold mb-4">Yeni Komut Gönder</h2>
          <form onSubmit={handleSendCommand} className="grid grid-cols-4 gap-4">
            <input
              type="number"
              placeholder="Client ID"
              value={newCommand.client_id}
              onChange={(e) => setNewCommand({ ...newCommand, client_id: e.target.value })}
              className="border rounded px-3 py-2"
              required
            />
            <select
              value={newCommand.command}
              onChange={(e) => setNewCommand({ ...newCommand, command: e.target.value })}
              className="border rounded px-3 py-2"
            >
              <option>PAUSE</option>
              <option>RESUME</option>
              <option>CLOSE_ALL</option>
              <option>CLOSE_ALL_BUY</option>
              <option>CLOSE_ALL_SELL</option>
            </select>
            <input
              type="text"
              placeholder="Parametreler (JSON)"
              value={newCommand.params}
              onChange={(e) => setNewCommand({ ...newCommand, params: e.target.value })}
              className="border rounded px-3 py-2"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700"
            >
              Gönder
            </button>
          </form>
        </div>

        {error && <p className="text-red-600 mb-4">Hata: {error}</p>}

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3">ID</th>
                <th className="px-6 py-3">Client</th>
                <th className="px-6 py-3">Komut</th>
                <th className="px-6 py-3">Durum</th>
                <th className="px-6 py-3">Oluşturulma</th>
                <th className="px-6 py-3">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {commands.map((cmd) => (
                <tr key={cmd.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{cmd.id}</td>
                  <td className="px-6 py-4">
                    {cmd.client?.account_name || `Client ${cmd.client_id}`}
                  </td>
                  <td className="px-6 py-4 font-mono">{cmd.command}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      cmd.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      cmd.status === 'executed' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {cmd.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs">
                    {new Date(cmd.created_at).toLocaleString('tr-TR')}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleDeleteCommand(cmd.id)}
                      className="text-red-600 hover:text-red-800 font-bold"
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {commands.length === 0 && (
          <p className="text-gray-500 mt-4">Komut yok</p>
        )}
      </div>
    </main>
  );
}
