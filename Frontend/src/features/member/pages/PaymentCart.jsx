import { t, useLanguage } from '../../../i18n/useLanguage';
import { formatMoney } from '../../../utils/displayFormat';
import TermsOfServiceModal from '../../../components/TermsOfServiceModal';
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  ShoppingCart, Trash2, ArrowRight, CreditCard,
  Wallet, QrCode, AlertCircle, CheckCircle2, Ticket, X,
  Clock, XCircle, Loader2, ChevronDown, ChevronUp, FileText, Lock
} from 'lucide-react';
import { API_ORIGIN } from '../../../config/apiBase.js';
import {
  summarizeMemberCartState,
  filterSelectableCredits,
  formatPendingCountdown,
  formatPaymentMethodLabel
} from '../memberUtils';

const PaymentCart = () => {
  const currentLang = useLanguage();
  const lang = (currentLang === 'vi' || globalThis.localStorage?.getItem('nexusLanguage') === 'vi') ? 'vi' : 'en';
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [availableCredits, setAvailableCredits] = useState([]);
  const [selectedCredit, setSelectedCredit] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState('payos');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [pendingInvoice, setPendingInvoice] = useState(null);
  const [pendingTimeLeft, setPendingTimeLeft] = useState(0);
  const [showPendingDetails, setShowPendingDetails] = useState(false);
  const [cancellingCheckout, setCancellingCheckout] = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [toast, setToast] = useState({ visible: false, type: 'success', title: '', message: '' });

  useEffect(() => {
    if (searchParams.get('paymentSuccess') === 'true') {
      setToast({
        visible: true,
        type: 'success',
        title: t('Payment Successful!'),
        message: t('Your membership and class bookings have been activated successfully.')
      });
      setTimeout(() => setToast({ visible: false, type: 'success', title: '', message: '' }), 6000);
      searchParams.delete('paymentSuccess');
      setSearchParams(searchParams, { replace: true });
      fetchCartItems();
      window.dispatchEvent(new Event('cartUpdated'));
    } else if (searchParams.get('awaitingConfirmation') === 'true') {
      setToast({
        visible: true,
        type: 'success',
        title: t('Transfer Submitted!'),
        message: t('Your payment transfer was sent to Reception. Please wait for confirmation.')
      });
      setTimeout(() => setToast({ visible: false, type: 'success', title: '', message: '' }), 6000);
      searchParams.delete('awaitingConfirmation');
      setSearchParams(searchParams, { replace: true });
      fetchCartItems();
      window.dispatchEvent(new Event('cartUpdated'));
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    fetchCartItems();

    const handlePageShow = () => {
      setCheckoutLoading(false);
      fetchCartItems();
    };
    const handlePageHide = () => {
      setCheckoutLoading(false);
    };
    const handleCartUpdated = () => {
      fetchCartItems(true);
    };
    const handleFocusSync = () => {
      if (document.visibilityState === 'visible') {
        fetchCartItems(true);
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('cartUpdated', handleCartUpdated);
    window.addEventListener('focus', handleFocusSync);
    document.addEventListener('visibilitychange', handleFocusSync);
    return () => {
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('cartUpdated', handleCartUpdated);
      window.removeEventListener('focus', handleFocusSync);
      document.removeEventListener('visibilitychange', handleFocusSync);
    };
  }, []);

  const pendingInvoiceId = pendingInvoice?.invoiceId || null;

  useEffect(() => {
    if (!pendingInvoiceId) return;
    const timer = setInterval(() => {
      setPendingTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          fetchCartItems(true);
          window.dispatchEvent(new Event('cartUpdated'));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [pendingInvoiceId]);

  useEffect(() => {
    if (!checkoutLoading) return;
    const timer = setTimeout(() => {
      setCheckoutLoading(false);
    }, 8000);
    return () => clearTimeout(timer);
  }, [checkoutLoading]);

  const fetchCartItems = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const token = localStorage.getItem('token');
      const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
      const [cartRes, profileRes, creditsRes] = await Promise.allSettled([
        axios.get(`${API_ORIGIN}/api/v1/payment/cart`, { headers: authHeader }),
        axios.get(`${API_ORIGIN}/api/v1/user/profile`, { headers: authHeader }),
        axios.get(`${API_ORIGIN}/api/v1/member/support/credits`, { headers: authHeader })
      ]);

      if (cartRes.status === 'fulfilled' && cartRes.value?.data) {
        const cartState = summarizeMemberCartState(cartRes.value.data);
        setItems(cartState.items);
        setTotalPrice(cartState.totalPrice);
        if (cartState.pendingOrder) {
          setPendingInvoice(cartState.pendingOrder);
          setPendingTimeLeft(cartState.pendingOrder.remainingSeconds);
          if (cartState.items.length === 0) {
            setShowPendingDetails((prev) => prev || !silent);
          }
        } else {
          setPendingInvoice(null);
          setPendingTimeLeft(0);
          setShowPendingDetails(false);
        }
      }

      if (profileRes.status === 'fulfilled' && profileRes.value?.data) {
        const tier = profileRes.value.data.memberTier;
        if (tier === 'PLATINUM') setDiscountPercent(15);
        else if (tier === 'GOLD') setDiscountPercent(10);
        else if (tier === 'SILVER') setDiscountPercent(5);
      }

      if (creditsRes.status === 'fulfilled' && Array.isArray(creditsRes.value?.data)) {
        const active = filterSelectableCredits(creditsRes.value.data);
        setAvailableCredits(active);
        setSelectedCredit((prev) => (prev && active.some((c) => c.creditCode === prev.creditCode) ? prev : null));
      }

      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to load cart items. Please try again.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleCancelPendingCheckout = async (targetInvoiceId = null) => {
    try {
      setCancellingCheckout(true);
      const token = localStorage.getItem('token');
      const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
      const invId = targetInvoiceId || pendingInvoice?.invoiceId;
      try {
        await axios.post(`${API_ORIGIN}/api/v1/payment/cancel-pending-checkout`, { invoiceId: invId }, { headers: authHeader });
      } catch (primaryErr) {
        if (primaryErr?.response?.data?.code === 'PAYMENT_ALREADY_COMPLETED') {
          throw primaryErr;
        }
        await axios.post(`${API_ORIGIN}/api/v1/payment/cart/cancel-pending`, {}, { headers: authHeader });
      }
      setToast({
        visible: true,
        type: 'success',
        title: t('Checkout Cancelled'),
        message: t('Pending checkout session has been cancelled. Items and vouchers have been returned to your cart.')
      });
      setTimeout(() => setToast({ visible: false, type: 'success', title: '', message: '' }), 4000);
      setPendingInvoice(null);
      setPendingTimeLeft(0);
      setShowPendingDetails(false);
      await fetchCartItems();
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (err) {
      if (err?.response?.data?.code === 'PAYMENT_ALREADY_COMPLETED') {
        setToast({
          visible: true,
          type: 'success',
          title: t('Payment Successful!'),
          message: t('Your payment has been confirmed and services have been activated.')
        });
        setTimeout(() => setToast({ visible: false, type: 'success', title: '', message: '' }), 4000);
        setPendingInvoice(null);
        await fetchCartItems();
        window.dispatchEvent(new Event('cartUpdated'));
        window.dispatchEvent(new Event('notificationUpdated'));
        return;
      }
      const msg = err.response?.data?.message || err.response?.data || t('Unable to cancel checkout session.');
      setToast({ visible: true, type: 'error', title: t('Error'), message: t(msg) });
      setTimeout(() => setToast({ visible: false, type: 'error', title: '', message: '' }), 4000);
    } finally {
      setCancellingCheckout(false);
    }
  };

  const handleConfirmPayment = async (targetInvoiceId = null) => {
    try {
      setConfirmingPayment(true);
      const token = localStorage.getItem('token');
      const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
      const invId = targetInvoiceId || pendingInvoice?.invoiceId;

      await axios.post(`${API_ORIGIN}/api/v1/payment/vietqr-submit-transfer/${invId}`, {}, { headers: authHeader });

      setToast({
        visible: true,
        type: 'success',
        title: t('Payment Successful!'),
        message: t('Your payment has been confirmed and services have been activated.')
      });

      window.dispatchEvent(new Event('cartUpdated'));
      window.dispatchEvent(new Event('notificationUpdated'));

      setPendingInvoice(null);
      await fetchCartItems();
      navigate('/member/cart?paymentSuccess=true');
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || t('Unable to confirm payment.');
      setToast({ visible: true, type: 'error', title: t('Error'), message: t(msg) });
      setTimeout(() => setToast({ visible: false, type: 'error', title: '', message: '' }), 4000);
    } finally {
      setConfirmingPayment(false);
    }
  };

  const handleRemoveItem = async (id, type) => {
    try {
      const token = localStorage.getItem('token');
      const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
      if (type === 'PACKAGE') {
        await axios.delete(`${API_ORIGIN}/api/v1/payment/cart/package/${id}`, {
          headers: authHeader
        });
      } else {
        await axios.delete(`${API_ORIGIN}/api/v1/payment/cart/${id}`, {
          headers: authHeader
        });
      }
      setToast({ visible: true, type: 'success', title: t('Removed'), message: t('Item removed from cart.') });
      setTimeout(() => setToast({ visible: false, type: 'success', title: '', message: '' }), 3000);
      fetchCartItems(); // Refresh the cart
      window.dispatchEvent(new Event('cartUpdated')); // Update the global badge
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data || t('Failed to remove item.');
      setToast({ visible: true, type: 'error', title: t('Error'), message: t(errorMsg) });
      setTimeout(() => setToast({ visible: false, type: 'error', title: '', message: '' }), 4000);
      fetchCartItems(); // Refresh to catch pending checkout if locked
    }
  };

  const handleCheckout = async () => {
    if (items.length === 0) return;
    if (pendingInvoice) {
      setToast({
        visible: true,
        type: 'error',
        title: t('Pending Checkout Session'),
        message: t('Please complete or cancel the active pending session before creating a new checkout.')
      });
      setTimeout(() => setToast({ visible: false, type: 'error', title: '', message: '' }), 4500);
      return;
    }
    try {
      setCheckoutLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_ORIGIN}/api/v1/payment/checkout`, {
        paymentMethod: selectedMethod,
        creditCode: selectedCredit ? selectedCredit.creditCode : null,
        cancelPending: false
      }, {
        headers: { Authorization: `Bearer ${token}`}
      });

      // Redirect to payment gateway or internal payment page
      if (response.data && response.data.paymentUrl) {
          window.dispatchEvent(new Event("cartUpdated"));
          if (response.data.paymentUrl.startsWith('/') || response.data.completed) {
              setCheckoutLoading(false);
              navigate(response.data.paymentUrl);
          } else {
              window.location.href = response.data.paymentUrl;
          }
      }

    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Payment failed. Please try again.';
      setToast({ visible: true, type: 'error', title: t('Checkout Error'), message: t(errorMsg) });
      setTimeout(() => setToast({ visible: false, type: 'error', title: '', message: '' }), 5000);
      setCheckoutLoading(false);
      fetchCartItems(); // Refresh to detect pending checkout if locked
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-[var(--text-muted)]">{t("Loading your cart...")}</div>;
  }

  return (
    <div className="flex flex-col w-full pb-10">
      {/* Toast Notification */}
      <div className={`fixed bottom-6 left-6 z-50 transform transition-all duration-300 ease-out flex items-center gap-3 px-5 py-4 rounded-xl bg-[var(--surface)] text-[var(--text)] shadow-[var(--shadow)] border border-[var(--border)] ${toast.visible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${toast.type === 'error' ? 'bg-[var(--danger-soft)] text-[var(--danger-text)]' : 'bg-[var(--success-soft)] text-[var(--success-text)]'}`}>
          {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
        </div>
        <div className="flex flex-col">
          <span className={`font-bold text-sm ${toast.type === 'error' ? 'text-[var(--danger-text)]' : 'text-[var(--success-text)]'}`}>{toast.title}</span>
          <span className="text-xs text-[var(--text-muted)]">{t(toast.message)}</span>
        </div>
      </div>


      {checkoutLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay)] backdrop-blur-sm">
          <div className="relative bg-[var(--surface)] border border-[var(--border)] p-8 rounded-2xl flex flex-col items-center max-w-sm w-full mx-4 shadow-[var(--shadow)]">
            <button
              type="button"
              onClick={() => setCheckoutLoading(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
              title={t("Close")}
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-16 h-16 border-4 border-[var(--primary-soft)] border-t-blue-500 rounded-full animate-spin mb-6"></div>
            <h3 className="text-xl font-bold text-[var(--text)] mb-2">{t("Processing Payment")}</h3>
            <p className="text-sm text-[var(--text-muted)] text-center">
              {t(selectedMethod === 'payos' ? t('Generating VietQR payment code...') :
               selectedMethod === 'vnpay' ? t('Connecting to VNPay Gateway...') :
               selectedMethod === 'momo' ? t('Opening Momo App...') :
               t('Verifying Credit Card Details...'))}
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-4 animate-pulse">{t("Please do not close this window")}</p>
            <button
              type="button"
              onClick={() => setCheckoutLoading(false)}
              className="mt-6 px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--surface-hover)] hover:bg-[var(--border)] text-[var(--text)] transition-colors cursor-pointer"
            >
              {t("Cancel / Close")}
            </button>
          </div>
        </div>
      )}

      <section className="mb-8">
        <h1 className="text-4xl font-extrabold text-[var(--text)] tracking-tight flex items-center gap-3">
          <ShoppingCart className="w-8 h-8 text-[var(--primary)]" />{t("Checkout")}</h1>
        <p className="text-sm text-[var(--text-muted)] mt-2">{t("Courses in cart are first-come, first-served. Complete payment to secure your spot.")}</p>
      </section>

      {/* Pending Checkout Order Card */}
      {pendingInvoice && (() => {
        const pendingItems = pendingInvoice.items || [];
        const totalDiscount = Number(pendingInvoice.discountAmount || 0);
        const creditDiscount = Number(pendingInvoice.creditDiscount || 0);
        const loyaltyDiscount = Math.max(0, totalDiscount - creditDiscount);
        const hasVoucherDisplay = Boolean(pendingInvoice.creditCode || (pendingInvoice.voucherCode && creditDiscount > 0));

        return (
          <div className="mb-8 rounded-2xl bg-blue-500/10 border border-blue-500/30 shadow-sm overflow-hidden">
            <div className="p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="w-5 h-5 animate-pulse" />
                </div>
                <div className="flex flex-col">
                  <div className="font-bold text-sm text-[var(--text)] flex flex-wrap items-center gap-2">
                    <span>{t("Pending Checkout Session")}</span>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-700 dark:text-blue-300 font-bold">
                      #{pendingInvoice.invoiceId}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)]">
                      {formatPaymentMethodLabel(pendingInvoice.paymentMethod, lang)}
                    </span>
                    <span className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded ${pendingTimeLeft > 0 ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300' : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'}`}>
                      {pendingTimeLeft > 0 ? `${t("Expires in:")} ${formatPendingCountdown(pendingTimeLeft)}` : t("Expired")}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed">
                    {t("This checkout session is locked with")} <strong className="text-[var(--text)]">{pendingItems.length}</strong> {t("services")} • <strong className="text-[var(--text)] font-mono">{formatMoney(pendingInvoice.totalAmount)}</strong>
                    {hasVoucherDisplay && (
                      <> • {t("Applied voucher:")} <strong className="font-mono text-emerald-600 dark:text-emerald-400">{pendingInvoice.creditCode || pendingInvoice.voucherCode}</strong></>
                    )}.{' '}
                    {t("Complete or cancel this session before starting a new checkout.")}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto shrink-0 justify-end">
                <button
                  type="button"
                  onClick={() => setShowPendingDetails((prev) => !prev)}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text)] transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-500" />
                  <span>{showPendingDetails ? t("Hide Details") : t("View Order Details")}</span>
                  {showPendingDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => handleCancelPendingCheckout(pendingInvoice.invoiceId)}
                  disabled={cancellingCheckout || confirmingPayment}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-[var(--border)] text-[var(--danger-text)] hover:bg-[var(--danger-soft)] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {cancellingCheckout ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                  {t("Cancel Order")}
                </button>
                {pendingInvoice.isVietQR && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        if (pendingInvoice.paymentUrl) {
                          navigate(pendingInvoice.paymentUrl);
                        } else {
                          navigate(`/member/vietqr-pay?invoiceId=${pendingInvoice.invoiceId}`);
                        }
                      }}
                      disabled={cancellingCheckout || confirmingPayment || pendingTimeLeft <= 0}
                      className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text)] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <QrCode className="w-3.5 h-3.5 text-blue-500" />
                      {t("View QR Code")}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleConfirmPayment(pendingInvoice.invoiceId)}
                      disabled={cancellingCheckout || confirmingPayment || pendingTimeLeft <= 0}
                      className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {confirmingPayment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      {confirmingPayment ? t("Confirming...") : t("I Have Paid (Confirm Now)")}
                    </button>
                  </>
                )}
              </div>
            </div>

            {showPendingDetails && (
              <div className="px-5 pb-5 pt-4 border-t border-blue-500/20 bg-[var(--surface)]/80 space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                  <div className="lg:col-span-7 space-y-2.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      {t("Locked Services in Session")} #{pendingInvoice.invoiceId} ({pendingItems.length})
                    </h4>
                    {pendingItems.map((item, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] flex items-center justify-between gap-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-sm text-[var(--text)]">
                            {item.type === 'PACKAGE' ? item.packageName : item.className}
                          </span>
                          <span className="text-xs text-[var(--text-muted)]">
                            {item.type === 'PACKAGE'
                              ? `${t("Duration:")} ${item.durationDays || 30} ${t("Days")}`
                              : `${t("Coach:")} ${item.coachName || t("Unknown")} • ${item.sessionCount || 1} ${t("Sessions")}`}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-sm text-[var(--text)] shrink-0">
                          {formatMoney(item.price)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="lg:col-span-5 p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)] space-y-2.5 text-xs">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                      {t("Order Breakdown & Vouchers")}
                    </h4>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">{t("Subtotal")}</span>
                      <span className="font-mono font-semibold text-[var(--text)]">{formatMoney(pendingInvoice.subtotal)}</span>
                    </div>
                    {loyaltyDiscount > 0 && (
                      <div className="flex justify-between text-[var(--success-text)]">
                        <span>{t("Member Tier Discount")} (LOYALTYVIP)</span>
                        <span className="font-mono font-semibold">- {formatMoney(loyaltyDiscount)}</span>
                      </div>
                    )}
                    {pendingInvoice.creditCode ? (
                      <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-semibold">
                        <span className="flex items-center gap-1.5">
                          <Ticket className="w-3.5 h-3.5" />
                          <span>{t("Voucher Credit")}</span>
                          <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/25">
                            {pendingInvoice.creditCode}
                          </span>
                        </span>
                        <span className="font-mono">- {formatMoney(creditDiscount)}</span>
                      </div>
                    ) : pendingInvoice.voucherCode && loyaltyDiscount === 0 && totalDiscount > 0 ? (
                      <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                        <span>{t("Voucher / Promo")} ({pendingInvoice.voucherCode})</span>
                        <span className="font-mono">- {formatMoney(totalDiscount)}</span>
                      </div>
                    ) : null}
                    <div className="pt-2.5 border-t border-[var(--border)] flex justify-between items-center">
                      <span className="font-bold text-sm text-[var(--text)]">{t("Total")}</span>
                      <span className="text-lg font-black font-mono text-[var(--text)]">{formatMoney(pendingInvoice.totalAmount)}</span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] pt-1 leading-relaxed">
                      {t("Cancelling this order will return all locked services and applied vouchers to your cart immediately.")}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {error ? (
        <div className="p-4 rounded-xl bg-[var(--danger-soft)] border border-[var(--danger-soft)] text-[var(--danger-text)] text-sm">
          {t(error)}
        </div>
      ) : items.length === 0 ? (
        pendingInvoice ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-[var(--surface)] rounded-2xl border border-[var(--border)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--surface-hover)] text-[var(--text-muted)] flex items-center justify-center shrink-0">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[var(--text)]">{t("No additional items in your new cart")}</h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {t("Please complete or cancel your active pending order above.")}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => navigate('/member/package-store')}
                className="px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg)] hover:bg-[var(--surface-hover)] text-xs font-semibold text-[var(--text)] transition-colors cursor-pointer"
              >
                {t("Explore Package Store")}
              </button>
              <button
                type="button"
                onClick={() => navigate('/member/book-class')}
                className="px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg)] hover:bg-[var(--surface-hover)] text-xs font-semibold text-[var(--text)] transition-colors cursor-pointer"
              >
                {t("Browse Courses")}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-[var(--surface)] rounded-2xl border border-[var(--border)]">
            <ShoppingCart className="w-16 h-16 text-[var(--text-muted)] mb-4" />
            <h2 className="text-xl font-bold text-[var(--text)]">{t("Your cart is empty")}</h2>
            <p className="text-sm text-[var(--text-muted)] mt-2 mb-6">{t("Looks like you haven't enrolled in any courses yet.")}</p>
            <button onClick={() => navigate('/member/book-class')} className="px-6 py-3 bg-[var(--primary)] hover:bg-[var(--primary)] text-[color:var(--on-primary)] rounded-xl font-bold transition-colors">{t("Browse Courses")}</button>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* LEFT: Cart Items */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <h2 className="text-lg font-bold text-[var(--text)] mb-2">
              {pendingInvoice ? `${t("New Cart Items")} (${items.length})` : `${t("Cart Items (")} ${items.length})`}
            </h2>
            {items.map((item, idx) => (
              <div key={idx} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  {item.type === 'PACKAGE' ? (
                    <>
                      <h3 className="font-bold text-[var(--text)] text-lg">{item.packageName}</h3>
                      <p className="text-sm text-[var(--text-muted)]">{t("Duration:")}{' '}{item.durationDays}{' '}{t("Days")}</p>
                      <div className="mt-2 inline-block px-2.5 py-1 rounded-lg bg-[var(--success-soft)] text-[var(--success-text)] text-xs font-semibold">{t("Membership Package")}</div>
                    </>
                  ) : (
                    <>
                      <h3 className="font-bold text-[var(--text)] text-lg">{item.className}</h3>
                      <p className="text-sm text-[var(--text-muted)]">{t("Coach:")}{' '}{item.coachName}</p>
                      <div className="mt-2 inline-block px-2.5 py-1 rounded-lg bg-[var(--primary-soft)] text-[var(--primary)] text-xs font-semibold">
                        {item.sessionCount}{' '}{t("Sessions")}</div>
                    </>
                  )}
                </div>
                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                  <span className="text-xl font-extrabold text-[var(--text)]">
                    {formatMoney(item.price)}
                  </span>
                  <button onClick={() => handleRemoveItem(item.type === 'PACKAGE' ? item.packageId : item.classId, item.type)} className="text-xs text-[var(--danger-text)] hover:text-[var(--danger-text)] flex items-center gap-1 font-semibold transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />{t("Remove")}</button>
                </div>
              </div>
            ))}
          </div>

          {/* RIGHT: Payment Options & Summary */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Course Credit Voucher Selector */}
            {availableCredits.length > 0 && (
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-[var(--primary)]" />
                    {t("Apply Course Credit Voucher")}
                  </h3>
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    {availableCredits.length} {t("available")}
                  </span>
                </div>
                <div className="space-y-2 mt-1">
                  <select
                    value={selectedCredit ? selectedCredit.creditCode : ''}
                    onChange={(e) => {
                      const found = availableCredits.find(c => c.creditCode === e.target.value);
                      setSelectedCredit(found || null);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-xs text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] font-mono"
                  >
                    <option value="">-- {t("Do not use credit voucher")} --</option>
                    {availableCredits.map(c => (
                      <option key={c.creditId} value={c.creditCode}>
                        {c.creditCode} - {formatMoney(c.remainingAmount)} ({t("Expires")}: {c.expiryDate})
                      </option>
                    ))}
                  </select>
                  {selectedCredit && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
                      <span>{t("Voucher applied:")} <strong className="font-mono">{selectedCredit.creditCode}</strong></span>
                      <button
                        type="button"
                        onClick={() => setSelectedCredit(null)}
                        className="text-red-500 hover:underline font-semibold"
                      >
                        {t("Remove")}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Payment Methods */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-[var(--text)]">{t("Payment Method")}</h2>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                  {t("Instant Bank Settlement")}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedMethod('payos')}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${selectedMethod === 'payos' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[var(--border)]'}`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${selectedMethod === 'payos' ? 'bg-emerald-500 text-white' : 'bg-[var(--surface-hover)] text-[var(--text-muted)]'}`}>
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[var(--text)]">{t("VietQR (Bank Transfer)")}</span>
                    <span className="text-[10px] text-[var(--text-muted)]">{t("Real-time bank payment")}</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('vnpay')}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${selectedMethod === 'vnpay' ? 'border-[var(--cyan-soft)] bg-[var(--cyan-soft)] text-[var(--cyan)] shadow-sm' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[var(--border)]'}`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${selectedMethod === 'vnpay' ? 'bg-[var(--cyan)] text-white' : 'bg-[var(--surface-hover)] text-[var(--text-muted)]'}`}>
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[var(--text)]">{t("VNPay")}</span>
                    <span className="text-[10px] text-[var(--text-muted)]">{t("VNPay gateway")}</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('momo')}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${selectedMethod === 'momo' ? 'border-[var(--rose-soft)] bg-[var(--rose-soft)] text-[var(--rose)] shadow-sm' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[var(--border)]'}`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${selectedMethod === 'momo' ? 'bg-[var(--rose)] text-white' : 'bg-[var(--surface-hover)] text-[var(--text-muted)]'}`}>
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[var(--text)]">{t("Momo")}</span>
                    <span className="text-[10px] text-[var(--text-muted)]">{t("MoMo e-wallet")}</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('credit')}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${selectedMethod === 'credit' ? 'border-[var(--primary-soft)] bg-[var(--primary-soft)] text-[var(--primary)] shadow-sm' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[var(--border)]'}`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${selectedMethod === 'credit' ? 'bg-[var(--primary)] text-white' : 'bg-[var(--surface-hover)] text-[var(--text-muted)]'}`}>
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[var(--text)]">{t("Credit Card")}</span>
                    <span className="text-[10px] text-[var(--text-muted)]">{t("International cards")}</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 flex flex-col gap-5">
              <h2 className="text-lg font-bold text-[var(--text)]">{t("Order Summary")}</h2>

              <div className="flex flex-col gap-3 text-sm text-[var(--text)]">
                <div className="flex justify-between">
                  <span>{t("Subtotal")}</span>
                  <span className="font-semibold text-[var(--text)]">{formatMoney(totalPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("Tax (0%)")}</span>
                  <span className="font-semibold text-[var(--text)]">{t("0 VND")}</span>
                </div>
                <div className="flex justify-between text-[var(--success-text)]">
                  <span>{t("Discount")}</span>
                  <span className="font-semibold">- {(totalPrice * discountPercent / 100).toLocaleString()}{' '}{t("VND")}</span>
                </div>
                {selectedCredit && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span>{t("Voucher Credit")} ({selectedCredit.creditCode})</span>
                    <span>- {formatMoney(Math.min(totalPrice * (100 - discountPercent) / 100, selectedCredit.remainingAmount))}</span>
                  </div>
                )}
              </div>

              <div className="h-px w-full bg-[var(--surface)]"></div>

              <div className="flex justify-between items-center">
                <span className="text-[var(--text)]">{t("Total")}</span>
                <span className="text-2xl font-black text-[var(--text)]">{formatMoney(Math.max(0, (totalPrice * (100 - discountPercent) / 100) - (selectedCredit ? selectedCredit.remainingAmount : 0)))}</span>
              </div>

              {pendingInvoice && (
                <div className="mt-2 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                  <Lock className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <span>
                    {t("Please complete or cancel the active pending session before creating a new checkout.")}
                  </span>
                </div>
              )}

              <button
                onClick={handleCheckout}
                disabled={checkoutLoading || Boolean(pendingInvoice)}
                className="w-full mt-4 px-6 py-4 bg-[var(--success-hover)] hover:bg-[var(--success-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-[color:var(--on-primary)] rounded-xl font-bold transition-all shadow-[var(--shadow)] flex items-center justify-center gap-2 cursor-pointer"
              >
                {t(checkoutLoading ? t('Processing...') : pendingInvoice ? t('Finish Pending Order First') : t('Confirm & Pay Now'))}
                {!checkoutLoading && !pendingInvoice && <ArrowRight className="w-5 h-5" />}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-xs text-[var(--text-muted)] text-center">
                <span>{t("By confirming payment, you agree to our")}</span>
                <button
                  type="button"
                  onClick={() => setIsTermsOpen(true)}
                  className="text-blue-500 hover:underline font-semibold cursor-pointer"
                >
                  {t("Terms of Service")}
                </button>
              </div>

              <p className="text-[10px] text-center text-[var(--text-muted)] uppercase tracking-wider font-bold">{t("Secure 256-bit SSL Encryption")}</p>
            </div>
          </div>
        </div>
      )}

      {/* Terms of Service Modal */}
      <TermsOfServiceModal
        isOpen={isTermsOpen}
        onClose={() => setIsTermsOpen(false)}
      />
    </div>
  );
};

export default PaymentCart;
