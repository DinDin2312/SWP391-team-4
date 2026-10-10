import { t, useLanguage } from '../../../i18n/useLanguage';
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';

const PaymentResult = () => {
  useLanguage();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Processing your payment result...');

  useEffect(() => {
    const processPayment = async () => {
      try {
        const token = localStorage.getItem('token');
        const queryString = searchParams.toString();

        // Gửi kết quả về backend để validate
        let endpoint = 'vnpay-callback';
        if (searchParams.has('partnerCode')) {
            endpoint = 'momo-callback';
        }
        const response = await axios.get(`http://localhost:8080/api/v1/payment/${endpoint}?${queryString}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setStatus(response.data.status==='PAID'?'success':'error');
        window.dispatchEvent(new Event('notificationUpdated'));
        setMessage(response.data.message || 'Payment Successful! Your courses are now confirmed.');
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Payment failed or signature is invalid.');
      }
    };

    if (searchParams.toString()) {
      processPayment();
    } else {
      setStatus('error');
      setMessage('No payment data found in URL.');
    }
  }, [searchParams]);

  return (
    <div className="flex-1 p-8">
      <div className="max-w-2xl mx-auto mt-20 p-10 bg-[var(--surface)] border border-[var(--border)] rounded-3xl flex flex-col items-center justify-center text-center shadow-[var(--shadow)]">
        {status === 'processing' && (
          <>
            <Loader2 className="w-20 h-20 text-[var(--success-text)] animate-spin mb-6" />
            <h1 className="text-3xl font-black text-[var(--text)] mb-2">{t("Processing Payment")}</h1>
            <p className="text-[var(--text-muted)]">{t("Please do not close this window...")}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="w-20 h-20 text-[var(--success-text)] mb-6" />
            <h1 className="text-3xl font-black text-[var(--text)] mb-2">{t("Payment Successful!")}</h1>
            <p className="text-[var(--success-text)] mb-8">{t(message)}</p>
            <button
              onClick={() => navigate('/member/schedule')}
              className="px-8 py-4 bg-[var(--success-hover)] hover:bg-[var(--success-hover)] text-[color:var(--on-primary)] rounded-xl font-bold transition-all shadow-[var(--shadow)] flex items-center justify-center gap-2"
            >{t("Go to My Schedule")}<ArrowRight className="w-5 h-5" />
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-20 h-20 text-[var(--danger-text)] mb-6" />
            <h1 className="text-3xl font-black text-[var(--text)] mb-2">{t("Payment Failed")}</h1>
            <p className="text-[var(--danger-text)] mb-8">{t(message)}</p>
            <button
              onClick={() => navigate('/member/cart')}
              className="px-8 py-4 bg-[var(--surface-hover)] hover:bg-[var(--surface-hover)] text-[var(--text)] rounded-xl font-bold transition-all flex items-center justify-center gap-2"
            >{t("Back to Cart")}<ArrowRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentResult;
