'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui/table';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { Skeleton } from '@/src/components/ui/skeleton';
import { Users, Monitor, Wallet, Activity, ArrowRight, ShieldCheck, Terminal, Crown, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    totalClients: 0,
    activeClients: 0,
    totalBalance: 0,
    totalPositions: 0,
    recentClients: [] as any[],
    weeklyPerformance: [] as any[] // Yeni eklendi
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse user from localStorage');
      }
    }

    const fetchStats = async () => {
      try {
        const res = await fetch('/api/admin/dashboard/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 10000); // 10 saniyede bir güncelle
    return () => clearInterval(interval);
  }, []);

  const StatCard = ({ title, value, icon: Icon, colorClass }: any) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 text-muted-foreground ${colorClass}`} />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Platform durumuna genel bakış ve hızlı işlemler.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Toplam Clientler" 
          value={stats.totalClients} 
          icon={Users} 
          colorClass="text-blue-500"
        />
        <StatCard 
          title="Aktif Clientler" 
          value={stats.activeClients} 
          icon={Activity} 
          colorClass="text-green-500"
        />
        <StatCard 
          title="Toplam Bakiye" 
          value={`$${stats.totalBalance.toLocaleString()}`} 
          icon={Wallet} 
          colorClass="text-purple-500"
        />
        <StatCard 
          title="Açık Pozisyonlar" 
          value={stats.totalPositions} 
          icon={Monitor} 
          colorClass="text-orange-500"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Sol Sütun (Client Tablosu ve Performans) */}
        <div className="col-span-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Son Aktif Clientler</CardTitle>
              <CardDescription>
                Platformda işlem gören son client hesapları.
              </CardDescription>
            </CardHeader>
            <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Hesap</TableHead>
                  <TableHead>Bakiye</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">Son Görülme</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-[120px] ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : stats.recentClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                      Kayıt bulunamadı.
                    </TableCell>
                  </TableRow>
                ) : (
                  stats.recentClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{client.account_name}</span>
                          <span className="text-xs text-muted-foreground">#{client.account_number}</span>
                        </div>
                      </TableCell>
                      <TableCell>${Number(client.balance).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={client.status === 'active' ? 'default' : 'destructive'}>
                          {client.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {client.last_seen ? new Date(client.last_seen).toLocaleString('tr-TR') : '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <div className="mt-4 flex justify-end">
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/clients">
                  Tümünü Gör <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Performans Özeti Kartı */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" /> Haftalık Performans Özeti
            </CardTitle>
            <CardDescription>
              Tüm client hesaplarının son 7 günlük kâr/zarar durumu.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
               <Skeleton className="h-[200px] w-full" />
            ) : stats.weeklyPerformance && stats.weeklyPerformance.length > 0 ? (
               <div className="space-y-4">
                 {stats.weeklyPerformance.map((perf, index) => (
                   <div key={index} className="flex justify-between items-center border-b pb-2 last:border-0">
                     <div>
                       <div className="font-semibold text-sm">{new Date(perf.date).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'short' })}</div>
                       <div className="text-xs text-muted-foreground">Aktif Hesap: {perf.clientCount}</div>
                     </div>
                     <div className={`font-bold ${perf.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                       {perf.totalProfit >= 0 ? '+' : ''}${perf.totalProfit.toFixed(2)}
                     </div>
                   </div>
                 ))}
               </div>
            ) : (
               <div className="text-center text-muted-foreground py-8">
                 Henüz performans verisi oluşmamış. Gün sonlarında sistem otomatik kaydedecektir.
               </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Hızlı İşlemler</CardTitle>
            <CardDescription>
              Sık kullanılan yönetim araçlarına hızlı erişim.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {(user?.role === 'admin') && (
              <Button variant="outline" className="h-20 justify-start space-x-4" asChild>
                <Link href="/admin/users">
                  <div className="bg-blue-100 dark:bg-blue-900/20 p-2 rounded-full">
                    <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-bold">Kullanıcılar</span>
                    <span className="text-xs text-muted-foreground">Kullanıcı yönetimi</span>
                  </div>
                </Link>
              </Button>
            )}
            
            {(user?.role === 'admin' || user?.role === 'master_owner' || user?.role === 'trader') && (
              <Button variant="outline" className="h-20 justify-start space-x-4" asChild>
                <Link href="/admin/clients">
                  <div className="bg-green-100 dark:bg-green-900/20 p-2 rounded-full">
                    <Monitor className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-bold">Clientler</span>
                    <span className="text-xs text-muted-foreground">Hesap listesi ve durumu</span>
                  </div>
                </Link>
              </Button>
            )}

            {(user?.role === 'admin' || user?.role === 'master_owner') && (
              <Button variant="outline" className="h-20 justify-start space-x-4" asChild>
                <Link href="/admin/commands">
                  <div className="bg-purple-100 dark:bg-purple-900/20 p-2 rounded-full">
                    <Terminal className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-bold">Komutlar</span>
                    <span className="text-xs text-muted-foreground">Sistem komutları gönder</span>
                  </div>
                </Link>
              </Button>
            )}

            {(user?.role === 'admin' || user?.role === 'master_owner' || user?.role === 'trader') && (
              <Button variant="outline" className="h-20 justify-start space-x-4" asChild>
                <Link href="/admin/master-groups">
                  <div className="bg-orange-100 dark:bg-orange-900/20 p-2 rounded-full">
                    <Crown className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-bold">Gruplar</span>
                    <span className="text-xs text-muted-foreground">Master grup ayarları</span>
                  </div>
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
