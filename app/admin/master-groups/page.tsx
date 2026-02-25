'use client';

import { useEffect, useState } from 'react';

interface Client {
  id: number;
  account_number: number;
  account_name: string;
}

interface MasterGroup {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  assignments: Array<{
    id: number;
    client: Client;
  }>;
}

export default function MasterGroupsPage() {
  const [groups, setGroups] = useState<MasterGroup[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
  });
  const [selectedGroup, setSelectedGroup] = useState<MasterGroup | null>(null);
  const [selectedClientId, setSelectedClientId] = useState('');

  const fetchGroups = async () => {
    try {
      const token = localStorage.getItem('master_token') || process.env.NEXT_PUBLIC_MASTER_TOKEN;
      const res = await fetch('/api/master-groups', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to fetch groups');
      const data = await res.json();
      setGroups(data.groups || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

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
      console.error('Failed to fetch clients:', err);
    }
  };

  useEffect(() => {
    fetchGroups();
    fetchClients();
  }, []);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('master_token') || process.env.NEXT_PUBLIC_MASTER_TOKEN;
      const res = await fetch('/api/master-groups', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newGroup.name,
          description: newGroup.description,
          created_by: 1, // TODO: Get from session
        }),
      });

      if (!res.ok) throw new Error('Failed to create group');
      
      setNewGroup({ name: '', description: '' });
      fetchGroups();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleDeleteGroup = async (id: number) => {
    if (!confirm('Grubu silmek istediğinizden emin misiniz?')) return;
    
    try {
      const token = localStorage.getItem('master_token') || process.env.NEXT_PUBLIC_MASTER_TOKEN;
      const res = await fetch(`/api/master-groups/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to delete group');
      fetchGroups();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleAddClientToGroup = async (groupId: number) => {
    if (!selectedClientId) {
      alert('Lütfen bir client seçin');
      return;
    }

    try {
      const token = localStorage.getItem('master_token') || process.env.NEXT_PUBLIC_MASTER_TOKEN;
      const res = await fetch(`/api/master-groups/${groupId}/clients`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: parseInt(selectedClientId),
          master_id: 1,
        }),
      });

      if (!res.ok) throw new Error('Failed to add client');
      
      setSelectedClientId('');
      setSelectedGroup(null);
      fetchGroups();
      alert('Client gruba eklendi');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleRemoveClientFromGroup = async (groupId: number, assignmentId: number) => {
    if (!confirm('Client\'ı gruptan çıkarmak istediğinizden emin misiniz?')) return;

    try {
      const token = localStorage.getItem('master_token') || process.env.NEXT_PUBLIC_MASTER_TOKEN;
      const res = await fetch(`/api/master-groups/${groupId}/clients?assignment_id=${assignmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to remove client');
      fetchGroups();
      alert('Client gruptan çıkarıldı');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  if (loading) return <div className="container"><p>Yükleniyor...</p></div>;

  return (
    <main className="container">
      <div className="card">
        <h1>Master Grupları</h1>

        <div className="bg-blue-50 p-4 rounded mt-4 mb-6">
          <h2 className="font-bold mb-4">Yeni Grup Oluştur</h2>
          <form onSubmit={handleCreateGroup} className="grid grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Grup Adı"
              value={newGroup.name}
              onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
              className="border rounded px-3 py-2"
              required
            />
            <input
              type="text"
              placeholder="Açıklama"
              value={newGroup.description}
              onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
              className="border rounded px-3 py-2"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700"
            >
              Oluştur
            </button>
          </form>
        </div>

        {error && <p className="text-red-600 mb-4">Hata: {error}</p>}

        <div className="space-y-4">
          {groups.map((group) => (
            <div key={group.id} className="border rounded p-4 bg-white">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-lg">{group.name}</h3>
                  <p className="text-sm text-gray-600">{group.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Oluşturulma: {new Date(group.created_at).toLocaleString('tr-TR')}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteGroup(group.id)}
                  className="text-red-600 hover:text-red-800 font-bold"
                >
                  Sil
                </button>
              </div>

              {group.assignments.length > 0 ? (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-sm font-bold mb-2">Atanan Clientler ({group.assignments.length})</p>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {group.assignments.map((assign) => (
                      <div key={assign.id} className="bg-gray-50 p-2 rounded text-sm flex justify-between items-center">
                        <span>{assign.client.account_name} ({assign.client.account_number})</span>
                        <button
                          onClick={() => handleRemoveClientFromGroup(group.id, assign.id)}
                          className="text-red-600 hover:text-red-800 text-xs font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 mt-3">Atanan client yok</p>
              )}

              {selectedGroup?.id === group.id && (
                <div className="mt-3 pt-3 border-t bg-blue-50 p-3 rounded">
                  <p className="text-sm font-bold mb-2">Client Ekle</p>
                  <div className="flex gap-2">
                    <select
                      value={selectedClientId}
                      onChange={(e) => setSelectedClientId(e.target.value)}
                      className="flex-1 border rounded px-3 py-2 text-sm"
                    >
                      <option value="">Client Seç</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.account_name} ({client.account_number})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleAddClientToGroup(group.id)}
                      className="bg-green-600 text-white rounded px-3 py-2 hover:bg-green-700 text-sm"
                    >
                      Ekle
                    </button>
                    <button
                      onClick={() => setSelectedGroup(null)}
                      className="bg-gray-400 text-white rounded px-3 py-2 hover:bg-gray-500 text-sm"
                    >
                      İptal
                    </button>
                  </div>
                </div>
              )}

              {selectedGroup?.id !== group.id && (
                <button
                  onClick={() => setSelectedGroup(group)}
                  className="mt-3 text-blue-600 hover:text-blue-800 font-bold text-sm"
                >
                  + Client Ekle
                </button>
              )}
            </div>
          ))}
        </div>

        {groups.length === 0 && (
          <p className="text-gray-500 mt-4">Grup yok</p>
        )}
      </div>
    </main>
  );
}
