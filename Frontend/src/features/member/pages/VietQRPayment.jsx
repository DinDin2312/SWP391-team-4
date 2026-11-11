import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Copy, Check, Clock, AlertCircle, ArrowLeft, 
  CheckCircle2, ShieldCheck, Download, Loader2, Sparkles
} from 'lucide-react';
import { t, useLanguage } from '../../../i18n/useLanguage';
import { API_ORIGIN } from '../../../config/apiBase.js';

const VietQRPayment = () => {
  useLanguage();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const invoiceId = searchParams.get('invoiceId');

  const [loading, setLoading] = useState(true);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [error, setError] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes
  const pollTimerRef = useRef(null);
  const countdownTimerRef = useRef(null);
  const redirectTimerRef = useRef(null);

  const handleCancelAndReturnToCart = async () => {
    try {
      setCancelling(true);
      const token = localStorage.getItem('token');
      if (invoiceId) {
        await axios.post(`${API_ORIGIN}/api/v1/payment/cancel-pending-checkout`,
          { invoiceId: Number(invoiceId) },
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );
      }
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (e) {
      console.warn("Cancel pending checkout silently failed or already closed:", e);
    } finally {
      navigate('/member/cart');
    }
  };

  const handleSubmitTransfer = async () => {
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_ORIGIN}/api/v1/payment/vietqr-submit-transfer/${invoiceId}`, {}, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      window.dispatchEvent(new Event('cartUpdated'));

      window.dispatchEvent(new Event('cartUpdated'));
      window.dispatchEvent(new Event('notificationUpdated'));
      handlePaymentSuccess();
    } catch (err) {
      alert(err.response?.data?.message || t('An error occurred while submitting payment confirmation.'));
      setSubmitting(false);
    }
  };

  const handlePaymentSuccess = () => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    setIsSuccess(true);
    sessionStorage.removeItem('awaitingInvoiceId');
    window.dispatchEvent(new Event('cartUpdated'));
    window.dispatchEvent(new Event('notificationUpdated'));

    redirectTimerRef.current = setTimeout(() => {
      navigate('/member/cart?paymentSuccess=true');
    }, 2500);
  };

  useEffect(() => {
    if (!invoiceId) {
      navigate('/member/cart');
      return;
    }

    const fetchPaymentInfo = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_ORIGIN}/api/v1/payment/vietqr-info/${invoiceId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });

        const data = response.data;
        setPaymentInfo(data);

        // If invoice is already paid, trigger success flow
        if (data.status === 'PAID') {
          handlePaymentSuccess();
        }
      } catch (err) {
        setError(err.response?.data?.message || t('Unable to load VietQR payment information.'));
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentInfo();

    // Polling check every 3.5 seconds
    pollTimerRef.current = setInterval(async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_ORIGIN}/api/v1/payment/vietqr-info/${invoiceId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (response.data && response.data.status === 'PAID') {
          handlePaymentSuccess();
        }
      } catch  {
        // Ignore polling errors
      }
    }, 3500);

    // Countdown timer
    countdownTimerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(countdownTimerRef.current);
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, [invoiceId, navigate]);

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatCurrency = (val) => {
    if (!val && val !== 0) return '0 đ';
    return Number(val).toLocaleString('vi-VN') + ' đ';
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
        <h2 className="text-xl font-bold text-[var(--text)]">{t('Generating VietQR payment code...')}</h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">{t('Fetching beneficiary account information...')}</p>
      </div>
    );
  }

  if (error || !paymentInfo) {
    return (
      <div className="flex-1 p-8">
        <div className="max-w-xl mx-auto mt-12 p-8 bg-[var(--surface)] border border-[var(--border)] rounded-2xl text-center shadow-[var(--shadow)]">
          <AlertCircle className="w-16 h-16 text-[var(--danger-text)] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[var(--text)] mb-2">{t('Payment Loading Error')}</h2>
          <p className="text-[var(--danger-text)] mb-6">{error ? t(error) : t('Invoice not found or expired.')}</p>
          <button
            onClick={() => navigate('/member/cart')}
            className="px-6 py-3 bg-[var(--surface-hover)] hover:bg-[var(--border)] text-[var(--text)] rounded-xl font-semibold transition-all inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> {t('Back to Cart')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full relative">
      {/* Success Modal Overlay */}
      {isSuccess && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-[var(--surface)] border border-emerald-500/30 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl relative">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-5 border-2 border-emerald-500/30 animate-bounce">
              <CheckCircle2 className="w-12 h-12 text-emerald-500" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5" /> {t('Payment Verified')}
            </div>
            <h2 className="text-2xl font-black text-[var(--text)] mb-2">
              {t('Payment Successful!')}
            </h2>
            <p className="text-sm text-[var(--text-muted)] mb-6 leading-relaxed">
              {t('Your bank transfer has been received and confirmed. Your memberships and classes have been activated.')}
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-6">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{t('Redirecting back to your cart...')}</span>
            </div>
            <button
              onClick={() => navigate('/member/cart?paymentSuccess=true')}
              className="w-full py-3.5 px-6 rounded-2xl font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
            >
              <span>{t('Return to Cart Now')}</span>
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <button
            onClick={handleCancelAndReturnToCart}
            disabled={cancelling || submitting}
            className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)] mb-2 transition-colors disabled:opacity-50"
          >
            {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowLeft className="w-4 h-4" />}
            {t('Cancel / Back to Cart')}
          </button>
          <h1 className="text-2xl md:text-3xl font-black text-[var(--text)] tracking-tight">
            {t('VietQR Bank Transfer Payment')}
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {t('Open any banking app or e-wallet to scan Napas 247 QR')}
          </p>
        </div>

        {/* Countdown Badge */}
        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl font-mono text-sm font-semibold w-fit">
          <Clock className="w-4 h-4 animate-pulse" />
          <span>{t('Expires in:')} <strong>{formatTimer(timeLeft)}</strong></span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: VietQR Image Card */}
        <div className="lg:col-span-5 bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 shadow-[var(--shadow)] flex flex-col items-center text-center">
          <div className="w-full flex items-center justify-between pb-4 border-b border-[var(--border)] mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md">
              VietQR • Napas 247
            </span>
            <span className="text-xs text-[var(--text-muted)]">
              {paymentInfo.bankId}
            </span>
          </div>

          {/* QR Code Container - High Contrast White background for crisp mobile camera scanning */}
          <div className="relative p-4 bg-white rounded-2xl shadow-inner border border-gray-200 inline-block my-2">
            <img 
              src={paymentInfo.qrUrl} 
              alt="VietQR Code" 
              className="w-64 h-64 md:w-72 md:h-72 object-contain"
            />
            {timeLeft === 0 && (
              <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-4">
                <AlertCircle className="w-12 h-12 text-rose-500 mb-2" />
                <p className="font-bold text-gray-800 text-sm">{t('QR code has expired')}</p>
                <button 
                  onClick={handleCancelAndReturnToCart}
                  disabled={cancelling}
                  className="mt-3 text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-black transition-colors"
                >
                  {cancelling ? t('Cancelling...') : t('Re-create order')}
                </button>
              </div>
            )}
          </div>

          <p className="text-xs text-[var(--text-muted)] mt-3">
            {t('System automatically fills the exact Amount & Content when scanning')}
          </p>

          <a 
            href={paymentInfo.qrUrl} 
            download={`VietQR-HD-${invoiceId}.png`}
            target="_blank" 
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            <Download className="w-3.5 h-3.5" /> {t('Download QR Code Image')}
          </a>
        </div>

        {/* Right Column: Bank Details & Automated Verification Notice */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 md:p-8 shadow-[var(--shadow)]">
            <h2 className="text-lg font-bold text-[var(--text)] mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              {t('Beneficiary Transfer Information')}
            </h2>

            <div className="space-y-4">
              {/* Bank Name */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] gap-2">
                <span className="text-xs text-[var(--text-muted)] font-medium">{t('Beneficiary Bank')}</span>
                <span className="text-sm font-bold text-[var(--text)] text-right">
                  {paymentInfo.bankName || paymentInfo.bankId}
                </span>
              </div>

              {/* Account Number */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] gap-2">
                <span className="text-xs text-[var(--text-muted)] font-medium">{t('Account Number')}</span>
                <div className="flex items-center gap-2 sm:justify-end">
                  <span className="text-base font-black tracking-wider text-emerald-600 dark:text-emerald-400 font-mono">
                    {paymentInfo.accountNo}
                  </span>
                  <button
                    onClick={() => handleCopy(paymentInfo.accountNo, 'accountNo')}
                    className="p-1.5 rounded-lg hover:bg-[var(--border)] text-[var(--text-muted)] transition-colors"
                    title={t('Copy')}
                  >
                    {copiedField === 'accountNo' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Account Name */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] gap-2">
                <span className="text-xs text-[var(--text-muted)] font-medium">{t('Account Holder Name')}</span>
                <span className="text-sm font-bold uppercase text-[var(--text)] text-right">
                  {paymentInfo.accountName}
                </span>
              </div>

              {/* Amount */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] gap-2">
                <span className="text-xs text-[var(--text-muted)] font-medium">{t('Transfer Amount')}</span>
                <div className="flex items-center gap-2 sm:justify-end">
                  <span className="text-lg font-black text-[var(--text)] font-mono">
                    {formatCurrency(paymentInfo.amount)}
                  </span>
                  <button
                    onClick={() => handleCopy(paymentInfo.amount, 'amount')}
                    className="p-1.5 rounded-lg hover:bg-[var(--border)] text-[var(--text-muted)] transition-colors"
                    title={t('Copy')}
                  >
                    {copiedField === 'amount' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Transfer Content */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 gap-2">
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold block">{t('Transfer Content (Required)')}</span>
                <div className="flex items-center gap-2 sm:justify-end">
                  <span className="text-base font-black text-emerald-700 dark:text-emerald-300 font-mono tracking-wider">
                    {paymentInfo.description}
                  </span>
                  <button
                    onClick={() => handleCopy(paymentInfo.description, 'description')}
                    className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-600 dark:text-emerald-300 transition-colors"
                    title={t('Copy')}
                  >
                    {copiedField === 'description' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
              <button
                onClick={handleSubmitTransfer}
                disabled={submitting || cancelling || timeLeft === 0}
                className="w-full sm:flex-1 py-4 px-6 rounded-2xl font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-[0.98] transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{t('Verifying payment...')}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>{t('I have transferred successfully')}</span>
                  </>
                )}
              </button>

              <button
                onClick={handleCancelAndReturnToCart}
                disabled={submitting || cancelling}
                className="w-full sm:w-auto py-4 px-6 rounded-2xl font-semibold bg-[var(--surface-hover)] hover:bg-[var(--border)] text-[var(--text)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {cancelling && <Loader2 className="w-4 h-4 animate-spin" />}
                {t('Cancel')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VietQRPayment;
