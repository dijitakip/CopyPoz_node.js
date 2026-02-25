'use client';

import { useEffect, useState } from 'react';

interface License {
  id: number;
  license_key: string;
  type: string;
  status: string;
  expiry_date: string;
  max_clients: number;
  last_check_date: string | null;
  last_terminal_id: string | null;
  created_at: string;
}

export default function LicensesPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newLicense, setNewLicense] = useState({
    license_key: '',
    type: 'TRIAL',
    max_clients: 5,
    expiry_days: 30,
  });

  const fetchLicenses = async () => {
    try {
      const token = localStorage.getItem('master_token') || process.env.NEXT_PUBLIC_MASTER_TOKEN;
      const res = await fetch('/api/licenses', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to fetch licenses');
      const data = await res.json();
      setLicenses(data.licenses || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLicenses();
  }, []);

  const handleCreateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('master_token') || process.env.NEXT_PUBLIC_MASTER_TOKEN;
      const res = await fetch('/api/licenses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newLicense),
      });

      if (!res.ok) throw new Error('Failed to create license');
      
      setNewLicense({ license_key: '', type: 'TRIAL', max_clients: 5, expiry_days: 30 });
      fetchLicenses();
      alert('Lisans oluşturuldu');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleDeleteLicense = async (id: number) => {
    if (!confirm('Lisansı silmek istediğinizden emin misiniz?')) return;
    
    try {
      const token = localStorage.getItem('master_token') || process.env.NEXT_PUBLIC_MASTER_TOKEN;
      const res = await fetch(`/api/licenses/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to delete license');
      fetchLicenses();
      alert('Lisans silindi');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const getLicenseTypeColor = (type: string) => {
    switch (type) {
      case 'TRIAL':
        return 'bg-yellow-100 text-yellow-800';
      case 'PRO':
        return 'bg-blue-100 text-blue-800';
      case 'ENTERPRISE':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date();
  };

  if (loading) return <div className="container"><p>Yükleniyor...</p></div>;

  return (
    <main className="container">
      <div className="card">
        <h1>Lisans Yönetimi</h1>

        <div className="bg-blue-50 p-4 rounded mt-4 mb-6">
          <h2 className="font-bold mb-4">Yeni Lisans Oluştur</h2>
          <form onSubmit={handleCreateLicense} className="grid grid-cols-5 gap-4">
            <input
              type="text"
              placeholder="Lisans Anahtarı"
              value={newLicense.license_key}
              onChange={(e) => setNewLicense({ ...newLicense, license_key: e.target.value })}
              className="border rounded px-3 py-2"
              required
            />
            <select
              value={newLicense.type}
              onChange={(e) => setNewLicense({ ...newLicense, type: e.target.value })}
              className="border rounded px-3 py-2"
            >
              <option value="TRIAL">Trial (30 gün)</option>
              <option value="PRO">Pro (1 yıl)</option>
              <option value="ENTERPRISE">Enterprise (Unlimited)</option>
            </select>
            <input
              type="number"
              placeholder="Max Clients"
              value={newLicense.max_clients}
              onChange={(e) => setNewLicense({ ...newLicense, max_clients: parseInt(e.target.value) })}
              className="border rounded px-3 py-2"
              min="1"
              required
            />
            <input
              type="number"
              placeholder="Gün Sayısı"
              value={newLicense.expiry_days}
              onChange={(e) => setNewLicense({ ...newLicense, expiry_days: parseInt(e.target.value) })}
              className="border rounded px-3 py-2"
              min="1"
              required
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

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3">Lisans Anahtarı</th>
                <th className="px-6 py-3">Tip</th>
                <th className="px-6 py-3">Durum</th>
                <th className="px-6 py-3">Max Clients</th>
                <th className="px-6 py-3">Son Kontrol</th>
                <th className="px-6 py-3">Bitiş Tarihi</th>
                <th className="px-6 py-3">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {licenses.map((license) => (
                <tr key={license.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-mono text-xs">{license.license_key}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${getLicenseTypeColor(license.type)}`}>
                      {license.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      license.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {license.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">{license.max_clients}</td>
                  <td className="px-6 py-4 text-xs">
                    {license.last_check_date ? new Date(license.last_check_date).toLocaleString('tr-TR') : '-'}
                  </td>
                  <td className="px-6 py-4 text-xs">
                    <span className={isExpired(license.expiry_date) ? 'text-red-600 font-bold' : ''}>
                      {new Date(license.expiry_date).toLocaleDateString('tr-TR')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleDeleteLicense(license.id)}
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

        {licenses.length === 0 && (
          <p className="text-gray-500 mt-4">Lisans yok</p>
        )}
      </div>
    </main>
  );
}
