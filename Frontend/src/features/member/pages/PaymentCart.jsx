import { t, useLanguage } from '../../../i18n/useLanguage';
import { formatMoney } from '../../../utils/displayFormat';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ShoppingCart, Trash2, ArrowRight, CreditCard,
  Wallet, QrCode, AlertCircle, CheckCircle2, Ticket, X
} from 'lucide-react';

const PaymentCart = () => {
  useLanguage();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [availableCredits, setAvailableCredits] = useState([]);
  const [selectedCredit, setSelectedCredit] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState('credit');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [pendingCheckout, setPendingCheckout] = useState(null);
  const [toast, setToast] = useState({ visible: false, type: 'success', title: '', message: '' });

  useEffect(() => {
    fetchCartItems();

    const handlePageShow = () => {
      setCheckoutLoading(false);
      fetchCartItems();
    };
    const handlePageHide = () => {
      setCheckoutLoading(false);
    };

    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('pagehide', handlePageHide);
    return () => {
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, []);

  useEffect(() => {
    if (!checkoutLoading) return;
    const timer = setTimeout(() => {
      setCheckoutLoading(false);
    }, 8000);
    return () => clearTimeout(timer);
  }, [checkoutLoading]);

  const fetchCartItems = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
      const [cartRes, profileRes, creditsRes] = await Promise.allSettled([
        axios.get('http://localhost:8080/api/v1/payment/cart', { headers: authHeader }),
        axios.get('http://localhost:8080/api/v1/user/profile', { headers: authHeader }),
        axios.get('http://localhost:8080/api/v1/member/support/credits', { headers: authHeader })
      ]);

      if (cartRes.status === 'fulfilled' && cartRes.value?.data) {
        setItems(cartRes.value.data.items || []);
        setTotalPrice(cartRes.value.data.totalPrice || 0);
        if (cartRes.value.data.hasPendingCheckout) {
          setPendingCheckout({
            invoiceId: cartRes.value.data.pendingInvoiceId,
            paymentMethod: cartRes.value.data.pendingPaymentMethod
          });
        } else {
          setPendingCheckout(null);
        }
      }

      if (profileRes.status === 'fulfilled' && profileRes.value?.data) {
        const tier = profileRes.value.data.memberTier;
        if (tier === 'PLATINUM') setDiscountPercent(15);
        else if (tier === 'GOLD') setDiscountPercent(10);
        else if (tier === 'SILVER') setDiscountPercent(5);
      }

      if (creditsRes.status === 'fulfilled' && Array.isArray(creditsRes.value?.data)) {
        const active = creditsRes.value.data.filter(c => c.status === 'ACTIVE' && Number(c.remainingAmount) > 0);
        setAvailableCredits(active);
      }

      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to load cart items. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPending = async () => {
    try {
      const token = localStorage.getItem('token');
      const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post('http://localhost:8080/api/v1/payment/cart/cancel-pending', {}, { headers: authHeader });
      setPendingCheckout(null);
      setToast({ visible: true, type: 'success', title: t('Cancelled'), message: t('Pending session cancelled successfully.') });
      setTimeout(() => setToast({ visible: false, type: 'success', title: '', message: '' }), 3000);
      fetchCartItems();
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (err) {
      setToast({ visible: true, type: 'error', title: t('Error'), message: t('Failed to cancel pending session.') });
      setTimeout(() => setToast({ visible: false, type: 'error', title: '', message: '' }), 3000);
    }
  };

  const handleRemoveItem = async (id, type) => {
    try {
      const token = localStorage.getItem('token');
      const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
      if (type === 'PACKAGE') {
        await axios.delete(`http://localhost:8080/api/v1/payment/cart/package/${id}`, {
          headers: authHeader
        });
      } else {
        await axios.delete(`http://localhost:8080/api/v1/payment/cart/${id}`, {
          headers: authHeader
        });
      }
      setToast({ visible: true, type: 'success', title: 'Removed', message: t('Item removed from cart.') });
      setTimeout(() => setToast({ visible: false, type: 'success', title: '', message: '' }), 3000);
      fetchCartItems(); // Refresh the cart
      window.dispatchEvent(new Event('cartUpdated')); // Update the global badge
    } catch (err) {
      setToast({ visible: true, type: 'error', title: 'Error', message: t('Failed to remove item.') });
      setTimeout(() => setToast({ visible: false, type: 'error', title: '', message: '' }), 3000);
    }
  };

  const handleCheckout = async () => {
    if (items.length === 0) return;
    try {
      setCheckoutLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:8080/api/v1/payment/checkout', {
        paymentMethod: selectedMethod,
        creditCode: selectedCredit ? selectedCredit.creditCode : null,
        cancelPending: true
      }, {
        headers: { Authorization: `Bearer ${token}`}
      });

      // Redirect to VNPay / MoMo.
      if (response.data && response.data.paymentUrl) {
          window.dispatchEvent(new Event("cartUpdated"));
          if (response.data.completed) {
            setCheckoutLoading(false);
            navigate(response.data.paymentUrl);
          } else {
            window.location.href = response.data.paymentUrl;
          }
      }

    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Payment failed. Please try again.';
      setToast({ visible: true, type: 'error', title: t('Checkout Error'), message: errorMsg });
      setTimeout(() => setToast({ visible: false, type: 'error', title: '', message: '' }), 5000);
      setCheckoutLoading(false);
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
              {t(selectedMethod === 'vnpay' ? t('Connecting to VNPay Gateway...') :
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

      {/* Pending Session Banner */}
      {pendingCheckout && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-[var(--text)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm text-amber-700 dark:text-amber-300">
                {t('Checkout awaiting payment (Invoice #')}{pendingCheckout.invoiceId}{')'}
              </span>
              <span className="text-xs text-[var(--text-muted)]">
                {t('You can click Confirm & Pay to create a fresh payment link, or cancel the pending session.')}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCancelPending}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 font-semibold text-xs transition-colors self-end sm:self-auto cursor-pointer"
          >
            {t('Cancel Pending Session')}
          </button>
        </div>
      )}

      {error ? (
        <div className="p-4 rounded-xl bg-[var(--danger-soft)] border border-[var(--danger-soft)] text-[var(--danger-text)] text-sm">
          {t(error)}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-[var(--surface)] rounded-2xl border border-[var(--border)]">
          <ShoppingCart className="w-16 h-16 text-[var(--text-muted)] mb-4" />
          <h2 className="text-xl font-bold text-[var(--text)]">{t("Your cart is empty")}</h2>
          <p className="text-sm text-[var(--text-muted)] mt-2 mb-6">{t("Looks like you haven't enrolled in any courses yet.")}</p>
          <button onClick={() => navigate('/member/book-class')} className="px-6 py-3 bg-[var(--primary)] hover:bg-[var(--primary)] text-[color:var(--on-primary)] rounded-xl font-bold transition-colors">{t("Browse Courses")}</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* LEFT: Cart Items */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <h2 className="text-lg font-bold text-[var(--text)] mb-2">{t("Cart Items (")}{' '}{items.length})</h2>
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
              <h2 className="text-lg font-bold text-[var(--text)] mb-2">{t("Payment Method")}</h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => setSelectedMethod('credit')}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-colors ${selectedMethod === 'credit' ? t('border-[var(--primary-soft)] bg-[var(--primary-soft)] text-[var(--primary)]') : t('border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[var(--border)]')}`}
                >
                  <CreditCard className="w-6 h-6 mb-2" />
                  <span className="text-xs font-bold">{t("Credit Card")}</span>
                </button>
                <button
                  onClick={() => setSelectedMethod('momo')}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-colors ${selectedMethod === 'momo' ? t('border-[var(--rose-soft)] bg-[var(--rose-soft)] text-[var(--rose)]') : t('border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[var(--border)]')}`}
                >
                  <Wallet className="w-6 h-6 mb-2" />
                  <span className="text-xs font-bold">{t("Momo")}</span>
                </button>
                <button
                  onClick={() => setSelectedMethod('vnpay')}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-colors ${selectedMethod === 'vnpay' ? t('border-[var(--cyan-soft)] bg-[var(--cyan-soft)] text-[var(--cyan)]') : t('border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[var(--border)]')}`}
                >
                  <QrCode className="w-6 h-6 mb-2" />
                  <span className="text-xs font-bold">{t("VNPay")}</span>
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

              <button
                onClick={handleCheckout}
                disabled={checkoutLoading}
                className="w-full mt-4 px-6 py-4 bg-[var(--success-hover)] hover:bg-[var(--success-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-[color:var(--on-primary)] rounded-xl font-bold transition-all shadow-[var(--shadow)] flex items-center justify-center gap-2 cursor-pointer"
              >
                {t(checkoutLoading ? t('Processing...') : t('Confirm & Pay Now'))}
                {!checkoutLoading && <ArrowRight className="w-5 h-5" />}
              </button>

              <p className="text-[10px] text-center text-[var(--text-muted)] uppercase tracking-wider font-bold">{t("Secure 256-bit SSL Encryption")}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentCart;
