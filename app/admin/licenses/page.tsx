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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Lisans Yönetimi</h1>
        <p className="text-gray-600 mt-1">Sistem lisanslarını yönetin</p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Yükleniyor...</div>
        ) : licenses.length === 0 ? (
          <div className="p-6 text-center text-gray-500">Lisans bulunamadı</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Lisans Anahtarı</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Tip</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Max Clientler</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Bitiş Tarihi</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {licenses.map((license) => (
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
        )}
      </div>
    </div>
  );
}
