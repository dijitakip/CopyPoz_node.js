import { useState, useEffect } from 'react';

interface ClosePositionButtonProps {
  clientId: string;
  command: string;
  params?: string;
  label: string;
  confirmMessage: string;
  className?: string;
  onSuccess?: () => void;
}

export default function ClosePositionButton({
  clientId,
  command,
  params,
  ticket, // ticket eklendi (geriye dönük uyumluluk)
  label,
  confirmMessage,
  className,
  onSuccess
}: ClosePositionButtonProps & { ticket?: string }) {
  const [status, setStatus] = useState<'idle' | 'pending' | 'processing' | 'success' | 'error'>('idle');
  const [commandId, setCommandId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Polling effect
  useEffect(() => {
    let intervalId: any;
    let timeoutId: any;

    if (status === 'processing' && commandId) {
      // 1. Polling Interval
      intervalId = setInterval(async () => {
        try {
          const token = localStorage.getItem('master_token') || 'master-local-123';
          const res = await fetch(`/api/client/command/status?id=${commandId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (res.ok) {
            const data = await res.json();
            // Check status strictly
            if (data.command && data.command.status === 'executed') {
              setStatus('success');
              if (onSuccess) onSuccess();
              // Reset to idle after 1 second
              setTimeout(() => setStatus('idle'), 800);
            } else if (data.command && data.command.status === 'failed') {
              setStatus('error');
              setErrorMessage(data.command.result_message || 'İşlem başarısız');
            }
          }
        } catch (err) {
          console.error('Polling error:', err);
        }
      }, 1000); // 1s polling

      // 2. Timeout (20 saniye)
      timeoutId = setTimeout(() => {
          setStatus((currentStatus) => {
              if (currentStatus === 'processing') {
                  return 'error';
              }
              return currentStatus;
          });
          setErrorMessage('Zaman aşımı: EA yanıt vermedi');
      }, 20000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [status, commandId, onSuccess]);

  const handleClick = async () => {
    if (!confirm(confirmMessage)) return;

    try {
      setStatus('pending');
      const token = localStorage.getItem('master_token') || 'master-local-123';
      const res = await fetch(`/api/client/command`, {
        method: 'POST',
        headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            client_id: clientId,
            command,
            params: params || ticket // params yoksa ticket kullan
        })
      });

      if (res.ok) {
        const data = await res.json();
        setCommandId(data.command.id);
        setStatus('processing');
      } else {
        setStatus('error');
        setErrorMessage('Komut gönderilemedi');
      }
    } catch (err) {
      console.error('Command error:', err);
      setStatus('error');
      setErrorMessage('Bir hata oluştu');
    }
  };

  if (status === 'success') {
    return (
      <span className="text-green-600 font-medium px-3 py-1 bg-green-50 rounded border border-green-200 inline-flex items-center gap-1">
        ✓ Başarılı
      </span>
    );
  }

  if (status === 'error') {
    return (
      <div className="inline-flex items-center gap-2">
        <span className="text-red-600 font-medium text-sm">Hata: {errorMessage}</span>
        <button 
          onClick={() => setStatus('idle')}
          className="text-gray-500 hover:text-gray-700 underline text-xs"
        >
          Tekrar Dene
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={status !== 'idle'}
      className={`${className} ${status !== 'idle' ? '!opacity-100 !visible pointer-events-auto' : ''} ${status !== 'idle' ? 'cursor-not-allowed' : ''}`}
    >
      {status === 'pending' || status === 'processing' ? (
        <span className="inline-flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          İşleniyor...
        </span>
      ) : (
        label
      )}
    </button>
  );
}