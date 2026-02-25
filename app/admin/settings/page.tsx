'use client';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Sistem Ayarları</h1>
        <p className="text-gray-600 mt-1">Sistem konfigürasyonunu yönetin</p>
      </div>

      {/* Settings Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Genel Ayarlar</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sistem Adı</label>
              <input
                type="text"
                defaultValue="CopyPoz V5"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sistem Açıklaması</label>
              <textarea
                defaultValue="Profesyonel Forex Signal Copying Sistemi"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                rows={3}
              />
            </div>
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition">
              Kaydet
            </button>
          </div>
        </div>

        {/* API Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">API Ayarları</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">API URL</label>
              <input
                type="text"
                defaultValue="http://localhost:3000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">API Timeout (ms)</label>
              <input
                type="number"
                defaultValue="30000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition">
              Kaydet
            </button>
          </div>
        </div>

        {/* Database Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Database Ayarları</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Host</label>
              <input
                type="text"
                defaultValue="localhost"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Port</label>
              <input
                type="number"
                defaultValue="3306"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                disabled
              />
            </div>
            <button className="w-full bg-gray-400 text-white px-4 py-2 rounded-lg cursor-not-allowed">
              Bağlı ✓
            </button>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Güvenlik Ayarları</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">SSL/TLS</span>
              <span className="text-sm text-green-600 font-medium">Aktif</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">CORS</span>
              <span className="text-sm text-green-600 font-medium">Aktif</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Rate Limiting</span>
              <span className="text-sm text-green-600 font-medium">Aktif</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
