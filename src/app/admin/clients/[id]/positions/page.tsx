'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ClosePositionButton from '@/src/components/ClosePositionButton';

interface Position {
  id: number;
  ticket: string;
  symbol: string;
  type: number;
  volume: number;
  open_price: number;
  sl: number | null;
  tp: number | null;
  current_price: number | null;
  profit: number | null;
  open_time: string;
}

export default function ClientPositionsPage() {
  const params = useParams();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('active');
  const [syncBuy, setSyncBuy] = useState<boolean>(true);
  const [syncSell, setSyncSell] = useState<boolean>(true);
  const [userRole, setUserRole] = useState<string>('viewer');
  
  // Risk & Performance State
  const [riskData, setRiskData] = useState<{ riskScore: number; maxDrawdown: number; suggestedMultiplier: number } | null>(null);
  
  // Filtreleme ve Sıralama State'leri
  const [filterSymbol, setFilterSymbol] = useState('');
  const [filterType, setFilterType] = useState<string>('all'); // 'all', '0' (buy), '1' (sell)
  const [sortBy, setSortBy] = useState<string>('open_time');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Otomatik Yenileme State'leri
  const REFRESH_INTERVAL = 10; // saniye
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);

  const [isOwner, setIsOwner] = useState(false);

  const fetchPositions = useCallback(async () => {
    try {
      const token = localStorage.getItem('master_token') || 'master-local-123';
      const res = await fetch(`/api/clients/${params.id}/positions?t=${Date.now()}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setPositions(data.positions);
        setLastSeen(data.last_seen);
        setStatus(data.status || 'active');
        setSyncBuy(data.sync_buy ?? true);
        setSyncSell(data.sync_sell ?? true);
        setIsOwner(data.is_owner || false);
        setCountdown(REFRESH_INTERVAL); // Reset timer
      } else {
        const errData = await res.json();
        setError(errData.error || 'Pozisyonlar alınamadı');
      }
      
      // Fetch Risk Data (Only for Traders)
      if (userRole !== 'viewer') {
          const riskRes = await fetch(`/api/clients/${params.id}/risk`, {
              headers: { 'Authorization': `Bearer ${token}` }
          });
          if (riskRes.ok) {
              const riskJson = await riskRes.json();
              if (riskJson.ok) {
                  setRiskData(riskJson.analysis);
              }
          }
      }

    } catch (err) {
      console.error('Failed to fetch positions:', err);
      setError('Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [params.id, userRole]);

  useEffect(() => {
    // Kullanıcı rolünü al
    const userStr = localStorage.getItem('user');
    console.log('Current user in localStorage:', userStr);
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        const role = user.role?.toLowerCase() || 'viewer';
        console.log('Setting userRole to:', role);
        setUserRole(role);
      } catch (e) {
        console.error('Failed to parse user from localStorage');
      }
    } else {
      console.log('No user found in localStorage, using default viewer role');
    }

    if (params.id) {
        fetchPositions();
    }
  }, [params.id, fetchPositions]);

  // Otomatik Yenileme Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchPositions(); // This will reset countdown via setCountdown(REFRESH_INTERVAL) inside fetchPositions
          return REFRESH_INTERVAL;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [fetchPositions]); // fetchPositions is stable now

  // Filtreleme ve Sıralama Mantığı
  const filteredPositions = positions
    .filter(pos => {
      const matchesSymbol = pos.symbol.toLowerCase().includes(filterSymbol.toLowerCase());
      const matchesType = filterType === 'all' || pos.type.toString() === filterType;
      return matchesSymbol && matchesType;
    })
    .sort((a, b) => {
      let valA: any = a[sortBy as keyof Position];
      let valB: any = b[sortBy as keyof Position];

      if (sortBy === 'profit' || sortBy === 'volume' || sortBy === 'open_price') {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  // Toplam kar/zarar hesaplamaları (filtrelenmiş liste üzerinden)
  const totalProfit = filteredPositions.reduce((sum, pos) => sum + (Number(pos.profit) || 0), 0);
  const buyPositionsCount = filteredPositions.filter(pos => pos.type === 0).length;
  const sellPositionsCount = filteredPositions.filter(pos => pos.type === 1).length;
  const buyProfit = filteredPositions.filter(pos => pos.type === 0).reduce((sum, pos) => sum + (Number(pos.profit) || 0), 0);
  const sellProfit = filteredPositions.filter(pos => pos.type === 1).reduce((sum, pos) => sum + (Number(pos.profit) || 0), 0);

  // Trader rolü için ek kısıtlama: İşlem yapamaz
  // Ancak kendi client'ı ise sync işlemlerini yapabilir
  // isOwner bilgisi backend'den dönmüyorsa bile "trader" veya "viewer" rolü kendi hesabını görebilir.
  // Ancak admin/master_owner dışındakiler için backend is_owner'ı true dönmelidir.
  const canManage = userRole === 'admin' || userRole === 'master_owner' || isOwner || userRole === 'trader';
  const canSync = canManage || (userRole === 'trader' && isOwner) || userRole === 'trader';

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4">
      {/* Üst Bilgi ve Başlık */}
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <Link href={`/admin/clients/${params.id}`} className="text-blue-600 hover:underline mb-2 inline-block text-sm">← Client Detayına Dön</Link>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Açık Pozisyonlar</h1>
                {lastSeen && (
                    <p className="text-xs text-gray-500 mt-1">
                        Client'dan Son Güncelleme: <span className="font-semibold">{new Date(lastSeen).toLocaleString('tr-TR')}</span>
                    </p>
                )}
            </div>
            <div className="flex items-center gap-2 self-end md:self-auto">
                <div className="flex flex-col items-end mr-2">
                    <span className="text-[10px] text-gray-400 uppercase font-bold">Yenileniyor</span>
                    <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden mt-1">
                        <div 
                            className="h-full bg-blue-500 transition-all duration-1000 ease-linear"
                            style={{ width: `${(countdown / REFRESH_INTERVAL) * 100}%` }}
                        ></div>
                    </div>
                    <span className="text-[10px] text-gray-500 mt-0.5">{countdown}s</span>
                </div>
                <button 
                    onClick={fetchPositions}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full transition shadow-sm"
                    title="Şimdi Yenile"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.001 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </button>
            </div>
        </div>

        {/* Filtreleme ve Sıralama Kontrolleri */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Sembol Ara</label>
                <input 
                    type="text" 
                    value={filterSymbol}
                    onChange={(e) => setFilterSymbol(e.target.value)}
                    placeholder="Örn: EURUSD"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
            </div>
            <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">İşlem Tipi</label>
                <select 
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                    <option value="all">Tümü</option>
                    <option value="0">Sadece BUY</option>
                    <option value="1">Sadece SELL</option>
                </select>
            </div>
            <div className="hidden lg:block">
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Sıralama</label>
                <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                    <option value="open_time">Açılış Zamanı</option>
                    <option value="symbol">Sembol</option>
                    <option value="profit">Kar/Zarar</option>
                    <option value="volume">Hacim</option>
                </select>
            </div>
            <div className="flex gap-2 ml-auto">
                {canManage && (
                    <ClosePositionButton
                        clientId={params.id as string}
                        command="CLOSE_ALL"
                        label={`HEPSİNİ KAPAT`}
                        confirmMessage={`Filtrelenmiş ${filteredPositions.length} pozisyonu kapatmak istediğinize emin misiniz?`}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-bold shadow-sm transition"
                        onSuccess={fetchPositions}
                    />
                )}
            </div>
        </div>

        {/* Risk ve Performans Uyarısı */}
        {userRole !== 'viewer' && riskData && (
            <div className={`p-4 rounded-lg shadow-sm border-l-4 ${riskData.riskScore > 70 ? 'bg-red-50 border-red-500' : riskData.riskScore > 40 ? 'bg-yellow-50 border-yellow-500' : 'bg-green-50 border-green-500'}`}>
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            {riskData.riskScore > 70 ? '⚠️ Yüksek Risk Uyarısı' : riskData.riskScore > 40 ? '⚡ Orta Risk Seviyesi' : '✅ Düşük Risk'}
                            <span className="text-xs font-normal text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">
                                Skor: {riskData.riskScore}/100
                            </span>
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                            Maksimum Drawdown: <span className="font-bold">%{riskData.maxDrawdown.toFixed(2)}</span>
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-500 uppercase font-bold">Önerilen Çarpan</p>
                        <p className="text-2xl font-bold text-gray-800">{riskData.suggestedMultiplier}x</p>
                    </div>
                </div>
            </div>
        )}

        {/* Özet Kartları ve Senkronizasyon Durumu */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white p-3 rounded-lg shadow-sm border-l-4 border-blue-500">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Pozisyon</p>
                <p className="text-xl font-bold text-gray-800">{filteredPositions.length}</p>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm border-l-4 border-green-500">
                <p className="text-[10px] font-bold text-gray-400 uppercase">BUY / SELL Adet</p>
                <p className="text-xl font-bold text-gray-800">{buyPositionsCount} / {sellPositionsCount}</p>
                <div className="flex gap-2 text-[9px] font-bold mt-1">
                    <span className={buyProfit >= 0 ? 'text-green-600' : 'text-red-600'}>B: ${buyProfit.toFixed(2)}</span>
                    <span className={sellProfit >= 0 ? 'text-green-600' : 'text-red-600'}>S: ${sellProfit.toFixed(2)}</span>
                </div>
            </div>
            <div className={`bg-white p-3 rounded-lg shadow-sm border-l-4 ${totalProfit >= 0 ? 'border-green-500' : 'border-red-500'}`}>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Toplam P/L</p>
                <p className={`text-xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${totalProfit.toFixed(2)}
                </p>
            </div>
            <div className={`bg-white p-3 rounded-lg shadow-sm border-l-4 ${status === 'active' ? 'border-green-500' : status === 'paused' ? 'border-red-500' : 'border-gray-500'}`}>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Sync Durumu</p>
                <div className="flex flex-col gap-1 mt-1">
                    <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${status === 'active' ? 'bg-green-500 animate-pulse' : status === 'paused' ? 'bg-red-500' : 'bg-gray-500'}`}></span>
                        <p className={`text-xs font-bold uppercase ${status === 'active' ? 'text-green-600' : status === 'paused' ? 'text-red-600' : 'text-gray-600'}`}>
                            {status === 'active' ? 'Çalışıyor' : status === 'paused' ? 'Duraklatıldı' : 'Bilinmiyor'}
                        </p>
                    </div>
                    <div className="flex gap-3 text-[9px] font-semibold">
                        <span className={syncBuy ? 'text-green-500' : 'text-red-500'}>BUY: {syncBuy ? 'AKTİF' : 'PASİF'}</span>
                        <span className={syncSell ? 'text-green-500' : 'text-red-500'}>SELL: {syncSell ? 'AKTİF' : 'PASİF'}</span>
                    </div>
                </div>
            </div>
            <div className="bg-white p-2 rounded-lg shadow-sm flex flex-col justify-center gap-2">
                {canSync ? (
                    <div className="flex gap-2">
                        <ClosePositionButton
                            key={`status-${status}`}
                            clientId={params.id as string}
                            command={status === 'active' ? 'PAUSE' : 'RESUME'}
                            label={status === 'active' ? 'Duraklat' : 'Başlat'}
                            confirmMessage={`Senkronizasyonu ${status === 'active' ? 'duraklatmak' : 'başlatmak'} istediğinize emin misiniz?`}
                            className={`flex-1 py-1 rounded text-[10px] font-bold transition shadow-sm ${status === 'active' ? 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-100' : 'bg-green-100 text-green-700 hover:bg-green-600 hover:text-white'}`}
                            onSuccess={fetchPositions}
                        />
                        <div className="flex flex-col gap-1 flex-1">
                            <ClosePositionButton
                                key={`buy-${syncBuy}`}
                                clientId={params.id as string}
                                command={syncBuy ? 'PAUSE_BUY' : 'RESUME_BUY'}
                                label={syncBuy ? 'BUY Durdur' : 'BUY Başlat'}
                                confirmMessage={`BUY senkronizasyonunu ${syncBuy ? 'durdurmak' : 'başlatmak'} istediğinize emin misiniz?`}
                                className={`w-full py-0.5 rounded text-[9px] font-bold transition ${syncBuy ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}
                                onSuccess={fetchPositions}
                            />
                            <ClosePositionButton
                                key={`sell-${syncSell}`}
                                clientId={params.id as string}
                                command={syncSell ? 'PAUSE_SELL' : 'RESUME_SELL'}
                                label={syncSell ? 'SELL Durdur' : 'SELL Başlat'}
                                confirmMessage={`SELL senkronizasyonunu ${syncSell ? 'durdurmak' : 'başlatmak'} istediğinize emin misiniz?`}
                                className={`w-full py-0.5 rounded text-[9px] font-bold transition ${syncSell ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}
                                onSuccess={fetchPositions}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-[10px] text-gray-400 font-bold uppercase py-2">
                        Kontrol Yetkisi Yok
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* Pozisyon Listesi */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
        {/* Desktop View (Table) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-bold border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('ticket')}>Ticket {sortBy === 'ticket' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('symbol')}>Sembol {sortBy === 'symbol' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('type')}>Tip {sortBy === 'type' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('volume')}>Hacim {sortBy === 'volume' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                <th className="px-4 py-3">Açılış Fiyatı</th>
                <th className="px-4 py-3">Anlık</th>
                <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('profit')}>Kâr/Zarar {sortBy === 'profit' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('open_time')}>Zaman {sortBy === 'open_time' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                {canManage && <th className="px-4 py-3 text-right">İşlem</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredPositions.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 9 : 8} className="px-4 py-10 text-center text-gray-500 italic bg-gray-50">
                    {positions.length === 0 ? 'Açık pozisyon bulunamadı.' : 'Filtreye uygun pozisyon yok.'}
                  </td>
                </tr>
              ) : (
                filteredPositions.map((pos) => (
                  <tr key={pos.ticket} className="hover:bg-blue-50/30 transition group">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{pos.ticket}</td>
                    <td className="px-4 py-3 font-bold text-gray-800">{pos.symbol}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        pos.type === 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {pos.type === 0 ? 'BUY' : 'SELL'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{pos.volume.toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-600">{pos.open_price.toFixed(5)}</td>
                    <td className="px-4 py-3 text-gray-600">{pos.current_price?.toFixed(5) || '-'}</td>
                    <td className={`px-4 py-3 font-bold ${
                      (pos.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ${(pos.profit || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-[10px]">
                      {new Date(pos.open_time).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    {canManage && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ClosePositionButton
                            clientId={params.id as string}
                            params={JSON.stringify({ ticket: pos.ticket, volume: pos.volume / 2 })}
                            command="CLOSE_PARTIAL"
                            label="%50 Kapat"
                            confirmMessage={`${pos.symbol} pozisyonunun yarısını (${(pos.volume / 2).toFixed(2)} lot) kapatmak istediğinize emin misiniz?`}
                            className="bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white border border-orange-200 px-2 py-1 rounded text-[10px] font-semibold"
                            onSuccess={fetchPositions}
                          />
                          <ClosePositionButton
                            clientId={params.id as string}
                            params={pos.ticket}
                            command="CLOSE_POSITION"
                            label="Tamamını Kapat"
                            confirmMessage={`${pos.symbol} ${pos.type === 0 ? 'BUY' : 'SELL'} (${pos.volume}) pozisyonunu tamamen kapatmak istediğinize emin misiniz?`}
                            className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-200 px-2 py-1 rounded text-[10px] font-semibold"
                            onSuccess={fetchPositions}
                          />
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View (Cards) */}
        <div className="md:hidden divide-y divide-gray-100">
          {filteredPositions.length === 0 ? (
            <div className="px-4 py-10 text-center text-gray-500 italic bg-gray-50">
              {positions.length === 0 ? 'Açık pozisyon bulunamadı.' : 'Filtreye uygun pozisyon yok.'}
            </div>
          ) : (
            filteredPositions.map((pos) => (
              <div key={pos.ticket} className="p-4 space-y-3 bg-white hover:bg-blue-50/20 transition">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-800 text-lg">{pos.symbol}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        pos.type === 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {pos.type === 0 ? 'BUY' : 'SELL'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">Ticket: #{pos.ticket} • {pos.volume.toFixed(2)} Lot</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${
                      (pos.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ${(pos.profit || 0).toFixed(2)}
                    </div>
                    <div className="text-[10px] text-gray-400">
                        {new Date(pos.open_time).toLocaleString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs p-2 bg-gray-50 rounded border border-gray-100">
                    <div>
                        <span className="text-gray-400 block uppercase text-[9px]">Açılış</span>
                        <span className="font-medium text-gray-700">{pos.open_price.toFixed(5)}</span>
                    </div>
                    <div>
                        <span className="text-gray-400 block uppercase text-[9px]">Anlık</span>
                        <span className="font-medium text-gray-700">{pos.current_price?.toFixed(5) || '-'}</span>
                    </div>
                </div>

                {canManage && (
                    <div className="flex justify-end pt-1 gap-2">
                        <ClosePositionButton
                            clientId={params.id as string}
                            params={JSON.stringify({ ticket: pos.ticket, volume: pos.volume / 2 })}
                            command="CLOSE_PARTIAL"
                            label="%50 Kapat"
                            confirmMessage={`${pos.symbol} pozisyonunun yarısını (${(pos.volume / 2).toFixed(2)} lot) kapatmak istediğinize emin misiniz?`}
                            className="w-1/2 bg-orange-50 text-orange-600 border border-orange-200 py-2 rounded text-xs font-bold active:bg-orange-600 active:text-white transition"
                            onSuccess={fetchPositions}
                        />
                        <ClosePositionButton
                            clientId={params.id as string}
                            ticket={pos.ticket}
                            command="CLOSE_POSITION"
                            label="Tamamını Kapat"
                            confirmMessage={`${pos.symbol} pozisyonunu tamamen kapatmak istediğinize emin misiniz?`}
                            className="w-1/2 bg-red-50 text-red-600 border border-red-200 py-2 rounded text-xs font-bold active:bg-red-600 active:text-white transition"
                            onSuccess={fetchPositions}
                        />
                    </div>
                )}
              </div>
            ))
          )}
        </div>
        
        {/* Footer Summary (Sticky on mobile if needed, or just bottom) */}
        {filteredPositions.length > 0 && (
            <div className="bg-gray-50 p-4 border-t border-gray-200 flex justify-between items-center font-bold">
                <span className="text-gray-600 text-sm uppercase">Filtrelenmiş Toplam:</span>
                <span className={`text-lg ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${totalProfit.toFixed(2)}
                </span>
            </div>
        )}
      </div>
    </div>
  );
}
