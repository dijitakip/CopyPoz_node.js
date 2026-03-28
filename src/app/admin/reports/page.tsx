'use client';

import { useEffect, useState } from 'react';
import { 
    Card, 
    CardContent, 
    CardHeader, 
    CardTitle,
    CardDescription 
} from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@/src/components/ui/table';
import { Badge } from '@/src/components/ui/badge';
import { Skeleton } from '@/src/components/ui/skeleton';

interface Report {
    id: number;
    client: {
        account_name: string;
        account_number: string;
    };
    month: string;
    total_profit: string;
    commission_amount: string;
    owner_amount: string;
    system_amount: string;
    payment_status: string;
    created_at: string;
}

export default function ReportsPage() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState('');
    const [error, setError] = useState('');

    const fetchReports = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/reports');
            if (res.ok) {
                const data = await res.json();
                setReports(data.reports);
            } else {
                setError('Raporlar yüklenemedi.');
            }
        } catch (err) {
            setError('Bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Set default month to previous month
        const date = new Date();
        date.setMonth(date.getMonth() - 1);
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        setSelectedMonth(`${yyyy}-${mm}`);

        fetchReports();
    }, []);

    const handleGenerate = async () => {
        if (!selectedMonth) return;
        if (!confirm(`${selectedMonth} dönemi için raporları oluşturmak istediğinize emin misiniz?`)) return;

        setGenerating(true);
        try {
            const res = await fetch('/api/admin/reports/generate', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    // Gerekirse token eklenebilir, NextAuth session kullanıyor.
                },
                body: JSON.stringify({ month: selectedMonth })
            });

            if (res.ok) {
                const data = await res.json();
                alert(`${data.generated} adet rapor başarıyla oluşturuldu.`);
                fetchReports();
            } else {
                const err = await res.json();
                alert(err.error || 'Rapor oluşturulamadı.');
            }
        } catch (err) {
            alert('Sunucu hatası.');
        } finally {
            setGenerating(false);
        }
    };

    const handleApprove = async (id: number) => {
        if (!confirm('Bu ödemeyi onaylamak istediğinize emin misiniz?')) return;

        try {
            const res = await fetch(`/api/admin/reports/${id}/approve`, {
                method: 'POST'
            });

            if (res.ok) {
                alert('Ödeme onaylandı.');
                fetchReports();
            } else {
                const err = await res.json();
                alert(err.error || 'Onaylama başarısız.');
            }
        } catch (err) {
            alert('Sunucu hatası.');
        }
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dönem Raporları</h1>
                    <p className="text-muted-foreground mt-1">
                        Aylık bazda kâr ve komisyon hesaplamalarını yönetin.
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Rapor Oluştur</CardTitle>
                    <CardDescription>Belirli bir ay için tüm client&apos;ların kâr durumunu analiz edip rapor oluşturun.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <input 
                            type="month" 
                            className="flex h-10 w-full md:w-48 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                        />
                        <Button 
                            onClick={handleGenerate} 
                            disabled={generating || !selectedMonth}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {generating ? 'Oluşturuluyor...' : 'Raporları Üret'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Rapor Listesi</CardTitle>
                    <CardDescription>Üretilmiş tüm dönemsel raporlar ve durumları.</CardDescription>
                </CardHeader>
                <CardContent>
                    {error && <div className="text-red-500 mb-4">{error}</div>}
                    
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Dönem</TableHead>
                                    <TableHead>Client</TableHead>
                                    <TableHead className="text-right">Toplam Kâr</TableHead>
                                    <TableHead className="text-right">Toplam Komisyon</TableHead>
                                    <TableHead className="text-right">Master Payı</TableHead>
                                    <TableHead className="text-right">Sistem Payı</TableHead>
                                    <TableHead>Durum</TableHead>
                                    <TableHead className="text-right">İşlem</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                            <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : reports.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center text-muted-foreground h-24">
                                            Kayıt bulunamadı.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    reports.map((report) => (
                                        <TableRow key={report.id}>
                                            <TableCell className="font-medium">{report.month}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span>{report.client.account_name}</span>
                                                    <span className="text-xs text-muted-foreground">#{report.client.account_number}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-medium text-green-600">
                                                ${Number(report.total_profit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </TableCell>
                                            <TableCell className="text-right font-medium text-amber-600">
                                                ${Number(report.commission_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground">
                                                ${Number(report.owner_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground">
                                                ${Number(report.system_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={report.payment_status === 'approved' ? 'default' : 'secondary'} className={
                                                    report.payment_status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                                                }>
                                                    {report.payment_status === 'approved' ? 'Onaylandı' : 'Bekliyor'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {report.payment_status !== 'approved' && (
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm"
                                                        onClick={() => handleApprove(report.id)}
                                                        className="border-green-200 text-green-700 hover:bg-green-50"
                                                    >
                                                        Onayla
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}