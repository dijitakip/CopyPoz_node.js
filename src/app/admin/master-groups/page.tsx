'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  // Filtering and Sorting States
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {
        console.error('Failed to parse user');
      }
    }
    fetchGroups();
  }, []);

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
          created_by: user?.id || 1,
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
    <div className="space-y-6 max-w-6xl mx-auto p-4">
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
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase px-1">Grup Adı</label>
              <input
                type="text"
                placeholder="Grup Adı"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase px-1">Açıklama</label>
              <textarea
                placeholder="Açıklama"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                rows={3}
              />
            </div>
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition font-bold shadow-sm"
            >
              Grup Oluştur
            </button>
          </form>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center gap-4">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Grup Ara</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Grup adı veya açıklama..."
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Sırala</label>
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order as 'asc' | 'desc');
            }}
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="created_at-desc">En Yeni</option>
            <option value="created_at-asc">En Eski</option>
            <option value="name-asc">İsim (A-Z)</option>
            <option value="name-desc">İsim (Z-A)</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center text-gray-500 py-8">Yükleniyor...</div>
        ) : groups.length === 0 ? (
          <div className="col-span-full text-center text-gray-500 py-8">Master Grubu bulunamadı</div>
        ) : (
          groups
            .filter((g) => {
              const search = searchTerm.toLowerCase();
              return (
                g.name.toLowerCase().includes(search) ||
                (g.description || '').toLowerCase().includes(search)
              );
            })
            .sort((a, b) => {
              let valA: any = a[sortBy as keyof MasterGroup];
              let valB: any = b[sortBy as keyof MasterGroup];
              if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
              if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
              return 0;
            })
            .map((group) => (
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
              <Link 
                href={`/admin/master-groups/${group.id}`}
                className="block mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition text-sm text-center"
              >
                Yönet
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
