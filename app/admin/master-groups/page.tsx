'use client';

import { useEffect, useState } from 'react';

interface MasterGroup {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  assignments?: any[];
}

export default function MasterGroupsPage() {
  const [groups, setGroups] = useState<MasterGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const fetchGroups = async () => {
    try {
      const token = localStorage.getItem('master_token') || 'master-local-123';
      const res = await fetch('/api/master-groups', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setGroups(data.groups || []);
      }
    } catch (err) {
      console.error('Failed to fetch groups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('master_token') || 'master-local-123';
      const res = await fetch('/api/master-groups', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          created_by: 1,
        }),
      });

      if (res.ok) {
        setFormData({ name: '', description: '' });
        setShowForm(false);
        fetchGroups();
        alert('Master Grubu başarıyla oluşturuldu');
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
          <h1 className="text-3xl font-bold text-gray-800">Master Grupları</h1>
          <p className="text-gray-600 mt-1">Master EA gruplarını yönetin</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
        >
          {showForm ? '✕ İptal' : '+ Yeni Grup'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Yeni Master Grubu</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Grup Adı"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
            <textarea
              placeholder="Açıklama"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              rows={3}
            />
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
            >
              Oluştur
            </button>
          </form>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center text-gray-500 py-8">Yükleniyor...</div>
        ) : groups.length === 0 ? (
          <div className="col-span-full text-center text-gray-500 py-8">Master Grubu bulunamadı</div>
        ) : (
          groups.map((group) => (
            <div key={group.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
              <h3 className="text-lg font-bold text-gray-800">{group.name}</h3>
              <p className="text-sm text-gray-600 mt-2">{group.description || 'Açıklama yok'}</p>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Oluşturulma: {new Date(group.created_at).toLocaleDateString('tr-TR')}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Clientler: {group.assignments?.length || 0}
                </p>
              </div>
              <button className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition text-sm">
                Yönet
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
