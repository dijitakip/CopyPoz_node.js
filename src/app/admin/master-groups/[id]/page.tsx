'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Client {
  id: number;
  account_number: number;
  account_name: string;
}

interface MasterGroup {
  id: number;
  name: string;
  description?: string;
  assignments: {
    id: number;
    client: Client;
  }[];
}

export default function MasterGroupDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [group, setGroup] = useState<MasterGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState('');

  const fetchGroup = async () => {
    try {
      const token = localStorage.getItem('master_token') || 'master-local-123';
      const res = await fetch(`/api/master-groups/${params.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setGroup(data.group);
      } else {
        alert('Grup bulunamadı');
        router.push('/admin/master-groups');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('master_token') || 'master-local-123';
      const res = await fetch('/api/clients', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchGroup();
    fetchClients();
  }, []);

  const handleAddClient = async () => {
    if (!selectedClient) return;
    try {
      const token = localStorage.getItem('master_token') || 'master-local-123';
      const res = await fetch(`/api/master-groups/${params.id}/clients`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ client_id: parseInt(selectedClient) }),
      });

      if (res.ok) {
        fetchGroup();
        setSelectedClient('');
        alert('Client eklendi');
      } else {
        const data = await res.json();
        alert(data.error || 'Ekleme başarısız');
      }
    } catch (err) {
      alert('Bir hata oluştu');
    }
  };

  const handleRemoveClient = async (assignmentId: number) => {
    if (!confirm('Bu clientı gruptan çıkarmak istediğinize emin misiniz?')) return;
    try {
      const token = localStorage.getItem('master_token') || 'master-local-123';
      const res = await fetch(`/api/master-groups/${params.id}/clients?assignment_id=${assignmentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (res.ok) {
        fetchGroup();
      } else {
        alert('Silme başarısız');
      }
    } catch (err) {
      alert('Bir hata oluştu');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Yükleniyor...</div>;
  if (!group) return <div className="p-8 text-center text-gray-500">Grup bulunamadı</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/master-groups" className="text-blue-600 hover:underline">
          ← Geri
        </Link>
        <h1 className="text-3xl font-bold text-gray-800">{group.name}</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Gruba Client Ekle</h2>
        <div className="flex gap-4">
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Client Seçin...</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.account_name} ({client.account_number})
              </option>
            ))}
          </select>
          <button
            onClick={handleAddClient}
            disabled={!selectedClient}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition"
          >
            Ekle
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Grup Üyeleri</h2>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-sm">
              <th className="px-6 py-3 font-medium">Hesap No</th>
              <th className="px-6 py-3 font-medium">Hesap Adı</th>
              <th className="px-6 py-3 font-medium text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {group.assignments?.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                  Bu grupta henüz hiç client yok.
                </td>
              </tr>
            ) : (
              group.assignments?.map((assignment) => (
                <tr key={assignment.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 text-gray-800">{assignment.client.account_number}</td>
                  <td className="px-6 py-4 text-gray-600">{assignment.client.account_name}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleRemoveClient(assignment.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Çıkar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
