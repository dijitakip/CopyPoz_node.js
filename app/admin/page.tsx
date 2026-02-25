import Link from 'next/link';

export default function Admin() {
  const menuItems = [
    {
      title: 'Master Pozisyonları',
      description: 'Master trader\'ın açık pozisyonlarını görüntüle',
      href: '/admin/master',
      icon: '📊',
    },
    {
      title: 'Client Yönetimi',
      description: 'Client terminallerini yönet ve komut gönder',
      href: '/admin/clients',
      icon: '💻',
    },
    {
      title: 'Komut Yönetimi',
      description: 'Tüm komutları görüntüle ve yönet',
      href: '/admin/commands',
      icon: '⚙️',
    },
    {
      title: 'Master Grupları',
      description: 'Master gruplarını oluştur ve yönet',
      href: '/admin/master-groups',
      icon: '👥',
    },
    {
      title: 'Kullanıcılar',
      description: 'Sistem kullanıcılarını yönet',
      href: '/admin/users',
      icon: '👤',
    },
    {
      title: 'Lisanslar',
      description: 'Lisans yönetimi ve doğrulama',
      href: '/admin/licenses',
      icon: '🔐',
    },
  ];

  return (
    <main className="container">
      <div className="card">
        <h1>Admin Paneli</h1>
        <p className="text-gray-600 mt-2">CopyPoz V5 Yönetim Sistemi</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block p-4 border rounded-lg hover:shadow-lg transition-shadow bg-white"
            >
              <div className="text-3xl mb-2">{item.icon}</div>
              <h3 className="font-bold text-lg">{item.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{item.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
