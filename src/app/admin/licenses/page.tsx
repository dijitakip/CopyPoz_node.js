'use client';

import { useEffect, useState } from 'react';

interface License {
  id: number;
  license_key: string;
  type: string;
  status: string;
  expiry_date: string;
  max_clients: number;
  created_at: string;
}

export default function LicensesPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtering and Sorting States
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('expiry_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const fetchLicenses = async () => {
      try {
        const token = localStorage.getItem('master_token') || 'master-local-123';
        const res = await fetch('/api/licenses', {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setLicenses(data.licenses || []);
        }
      } catch (err) {
        console.error('Failed to fetch licenses:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLicenses();
  }, []);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const filteredLicenses = licenses
    .filter((l) => {
      const search = searchTerm.toLowerCase();
      return (
        l.license_key.toLowerCase().includes(search) ||
        l.type.toLowerCase().includes(search)
      );
    })
    .sort((a, b) => {
      const valA = a[sortBy as keyof License] || '';
      const valB = b[sortBy as keyof License] || '';

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Lisans Yönetimi</h1>
        <p className="text-gray-600 mt-1">Sistem lisanslarını yönetin</p>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Lisans Ara</label>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Lisans anahtarı veya tip..."
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-500">Yükleniyor...</div>
        ) : licenses.length === 0 ? (
          <div className="p-10 text-center text-gray-500">Lisans bulunamadı</div>
        ) : (
          <>
            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('license_key')}>
                      Lisans Anahtarı {sortBy === 'license_key' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('type')}>
                      Tip {sortBy === 'type' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('max_clients')}>
                      Max Clientler {sortBy === 'max_clients' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('expiry_date')}>
                      Bitiş Tarihi {sortBy === 'expiry_date' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('status')}>
                      Durum {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredLicenses.map((license) => (
                    <tr key={license.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm font-mono text-gray-600">{license.license_key}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">
                          {license.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{license.max_clients}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(license.expiry_date).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          license.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {license.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden divide-y divide-gray-200">
              {filteredLicenses.map((license) => (
                <div key={license.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-mono font-bold text-gray-900">{license.license_key}</h3>
                      <p className="text-xs text-gray-500 mt-1">Bitiş: {new Date(license.expiry_date).toLocaleDateString('tr-TR')}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      license.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {license.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">
                      {license.type}
                    </span>
                    <span className="text-gray-600">
                      Max: {license.max_clients} Client
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
