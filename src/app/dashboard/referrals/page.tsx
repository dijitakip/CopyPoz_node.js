'use client';

import { useEffect, useState } from 'react';

interface ReferredUser {
  id: number;
  username: string;
  email: string;
  clientCount: number;
  totalBalance: number;
  totalEquity: number;
  totalPositions: number;
  clients: {
    id: number;
    account_number: string;
    account_name: string;
    balance: number;
    equity: number;
    status: string;
    open_positions: number;
  }[];
}

export default function ReferralsPage() {
  const [data, setData] = useState<{
    referral_code: string;
    commission_rate: number;
    referred_users: ReferredUser[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null);

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/user/referrals');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, []);

  if (loading && !data) {
    return <div className="p-10 text-center text-gray-500">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Referans Sistemim</h1>
          <p className="text-gray-600 mt-1">Davet ettiğiniz kullanıcıları ve performanslarını izleyin</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase">Referans Kodum</p>
            <p className="text-lg font-bold text-blue-600 select-all">{data?.referral_code || '---'}</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase">Komisyon Oranım</p>
            <p className="text-lg font-bold text-green-600">%{data?.commission_rate || '0'}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">Referans Olduğum Kullanıcılar</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider w-10"></th>
                <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Kullanıcı</th>
                <th className="px-6 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">Client Sayısı</th>
                <th className="px-6 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider">Toplam Bakiye</th>
                <th className="px-6 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">Açık Pozisyon</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data?.referred_users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-400 italic">Henüz referans olduğunuz bir kullanıcı bulunmamaktadır.</td>
                </tr>
              ) : (
                data?.referred_users.map(user => (
                  <>
                    <tr 
                      key={user.id} 
                      className={`hover:bg-blue-50/30 transition cursor-pointer ${expandedUserId === user.id ? 'bg-blue-50/50' : ''}`}
                      onClick={() => setExpandedUserId(expandedUserId === user.id ? null : user.id)}
                    >
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-block transition-transform ${expandedUserId === user.id ? 'rotate-90' : ''}`}>▶</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-gray-800">{user.username}</div>
                        <div className="text-[10px] text-gray-500">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs font-bold">{user.clientCount}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-sm font-bold text-gray-800">${user.totalBalance.toLocaleString()}</div>
                        <div className="text-[10px] text-gray-500">Equity: ${user.totalEquity.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${user.totalPositions > 0 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>
                          {user.totalPositions}
                        </span>
                      </td>
                    </tr>
                    {expandedUserId === user.id && (
                      <tr className="bg-gray-50/50">
                        <td colSpan={5} className="px-12 py-4">
                          <div className="bg-white rounded-lg border border-gray-200 shadow-inner overflow-hidden">
                            <table className="w-full text-xs">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-2 text-left text-gray-500 uppercase">Hesap</th>
                                  <th className="px-4 py-2 text-right text-gray-500 uppercase">Bakiye</th>
                                  <th className="px-4 py-2 text-center text-gray-500 uppercase">Durum</th>
                                  <th className="px-4 py-2 text-center text-gray-500 uppercase">Pozisyonlar</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {user.clients.map(client => (
                                  <tr key={client.id}>
                                    <td className="px-4 py-2">
                                      <div className="font-bold">{client.account_name}</div>
                                      <div className="text-[10px] text-gray-400">#{client.account_number}</div>
                                    </td>
                                    <td className="px-4 py-2 text-right font-bold">${client.balance.toLocaleString()}</td>
                                    <td className="px-4 py-2 text-center">
                                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${client.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {client.status}
                                      </span>
                                    </td>
                                    <td className="px-4 py-2 text-center font-bold text-blue-600">{client.open_positions}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
