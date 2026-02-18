import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg p-4 mb-8">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/dashboard" className="text-white text-xl font-bold flex items-center">
            <span className="mr-2">📈</span> CopyPoz V5
          </Link>
          <div className="flex items-center space-x-4">
            <span className="text-white opacity-80 text-sm">Welcome, User</span>
            <button className="text-white opacity-80 hover:opacity-100 flex items-center">
              <span className="mr-1">🚪</span> Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
            <h3 className="text-gray-500 text-sm font-bold uppercase mb-2">Master Status</h3>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-gray-800">Active</span>
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Connected</span>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
            <h3 className="text-gray-500 text-sm font-bold uppercase mb-2">Clients</h3>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-gray-800">12</span>
              <span className="text-sm text-gray-500">Connected</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
            <h3 className="text-gray-500 text-sm font-bold uppercase mb-2">Total Balance</h3>
            <div className="text-2xl font-bold text-gray-800">$45,230.00</div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
            <h3 className="text-gray-500 text-sm font-bold uppercase mb-2">Open Positions</h3>
            <div className="text-2xl font-bold text-gray-800">5</div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Clients List */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800">Connected Clients</h2>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-semibold">View All</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="px-6 py-3">Account</th>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Balance</th>
                    <th className="px-6 py-3">Last Seen</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">12345678</td>
                    <td className="px-6 py-4">Client A</td>
                    <td className="px-6 py-4"><span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Active</span></td>
                    <td className="px-6 py-4">$10,000</td>
                    <td className="px-6 py-4">2 mins ago</td>
                  </tr>
                  <tr className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">87654321</td>
                    <td className="px-6 py-4">Client B</td>
                    <td className="px-6 py-4"><span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">Paused</span></td>
                    <td className="px-6 py-4">$5,230</td>
                    <td className="px-6 py-4">1 hour ago</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Actions / Master Controls */}
          <div className="bg-white rounded-lg shadow-md p-6 h-fit">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Master Controls</h2>
            <div className="space-y-3">
              <button className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded transition">
                ⏸ PAUSE COPYING
              </button>
              <button className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition">
                ▶ RESUME COPYING
              </button>
              <button className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition">
                🔴 CLOSE ALL POSITIONS
              </button>
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Admin Links</h3>
              <div className="flex flex-col space-y-2">
                <Link href="/admin/users" className="text-blue-600 hover:underline">👥 User Management</Link>
                <Link href="/admin/licenses" className="text-blue-600 hover:underline">📜 License Management</Link>
                <Link href="/admin/settings" className="text-blue-600 hover:underline">⚙️ System Settings</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
