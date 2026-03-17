'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Geçersiz doğrulama anahtarı.');
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(`/api/auth/verify?token=${token}`);
        const data = await res.json();

        if (res.ok) {
          setStatus('success');
          setMessage(data.message);
          // 3 saniye sonra login sayfasına yönlendir
          setTimeout(() => router.push('/login'), 3000);
        } else {
          setStatus('error');
          setMessage(data.error || 'Doğrulama başarısız.');
        }
      } catch (err) {
        setStatus('error');
        setMessage('Sunucu hatası.');
      }
    };

    verify();
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl overflow-hidden p-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Email Doğrulama</h1>
        
        {status === 'loading' && (
          <div className="space-y-4">
            <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-gray-500 font-medium">E-posta adresiniz doğrulanıyor, lütfen bekleyin...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-3xl shadow-sm border border-green-200">
              ✓
            </div>
            <p className="text-green-700 font-bold text-lg">{message}</p>
            <p className="text-gray-500 text-sm">Yönlendiriliyorsunuz...</p>
            <div className="mt-6">
              <Link href="/login" className="text-blue-600 font-bold hover:underline">
                Hemen Giriş Yap
              </Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-3xl shadow-sm border border-red-200">
              !
            </div>
            <p className="text-red-700 font-bold text-lg">{message}</p>
            <div className="mt-6">
              <Link href="/register" className="text-blue-600 font-bold hover:underline">
                Tekrar Kayıt Ol
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
