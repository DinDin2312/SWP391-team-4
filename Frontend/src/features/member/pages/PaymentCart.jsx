import { t, useLanguage } from '../../../i18n/useLanguage';
import { formatMoney } from '../../../utils/displayFormat';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ShoppingCart, Trash2, ArrowRight, CreditCard,
  Wallet, QrCode, AlertCircle, CheckCircle2
} from 'lucide-react';

const PaymentCart = () => {
  useLanguage();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [selectedMethod, setSelectedMethod] = useState('credit');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, type: 'success', title: '', message: '' });

  useEffect(() => {
    fetchCartItems();
  }, []);

  const fetchCartItems = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const [cartRes, profileRes] = await Promise.all([
        axios.get('http://localhost:8080/api/v1/payment/cart', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://localhost:8080/api/v1/user/profile', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const response = cartRes;
      if (profileRes.data) {
        const tier = profileRes.data.memberTier;
        if (tier === 'PLATINUM') setDiscountPercent(15);
        else if (tier === 'GOLD') setDiscountPercent(10);
        else if (tier === 'SILVER') setDiscountPercent(5);
      }
      setItems(response.data.items || []);
      setTotalPrice(response.data.totalPrice || 0);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to load cart items. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  const handleRemoveItem = async (id, type) => {
    try {
      const token = localStorage.getItem('token');
      if (type === 'PACKAGE') {
        await axios.delete(`http://localhost:8080/api/v1/payment/cart/package/${id}`, {
          headers: { Authorization: `Bearer ${token}`}
        });
      } else {
        await axios.delete(`http://localhost:8080/api/v1/payment/cart/${id}`, {
          headers: { Authorization: `Bearer ${token}`}
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
      const response = await axios.post('http://localhost:8080/api/v1/payment/checkout', { paymentMethod: selectedMethod }, {
        headers: { Authorization: `Bearer ${token}`}
      });

      // Redirect to VNPay.
      if (response.data && response.data.paymentUrl) {
          window.location.href = response.data.paymentUrl;
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
      <div className={`fixed bottom-6 right-6 z-50 transform transition-all duration-300 ease-out flex items-center gap-3 px-5 py-4 rounded-xl bg-[var(--surface)] text-[var(--text)] shadow-[var(--shadow)] border border-[var(--border)] ${toast.visible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
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
          <div className="bg-[var(--surface)] border border-[var(--border)] p-8 rounded-2xl flex flex-col items-center max-w-sm w-full mx-4 shadow-[var(--shadow)]">
            <div className="w-16 h-16 border-4 border-[var(--primary-soft)] border-t-blue-500 rounded-full animate-spin mb-6"></div>
            <h3 className="text-xl font-bold text-[var(--text)] mb-2">{t("Processing Payment")}</h3>
            <p className="text-sm text-[var(--text-muted)] text-center">
              {t(selectedMethod === 'vnpay' ? t('Connecting to VNPay Gateway...') :
               selectedMethod === 'momo' ? t('Opening Momo App...') :
               t('Verifying Credit Card Details...'))}
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-6 animate-pulse">{t("Please do not close this window")}</p>
          </div>
        </div>
      )}

      <section className="mb-8">
        <h1 className="text-4xl font-extrabold text-[var(--text)] tracking-tight flex items-center gap-3">
          <ShoppingCart className="w-8 h-8 text-[var(--primary)]" />{t("Checkout")}</h1>
        <p className="text-sm text-[var(--text-muted)] mt-2">{t("Review your pending courses and complete the payment to secure your spots.")}</p>
      </section>

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
              </div>

              <div className="h-px w-full bg-[var(--surface)]"></div>

              <div className="flex justify-between items-center">
                <span className="text-[var(--text)]">{t("Total")}</span>
                <span className="text-2xl font-black text-[var(--text)]">{formatMoney(totalPrice * (100 - discountPercent) / 100)}</span>
              </div>

              <button
                onClick={handleCheckout}
                disabled={checkoutLoading}
                className="w-full mt-4 px-6 py-4 bg-[var(--success-hover)] hover:bg-[var(--success-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-[color:var(--on-primary)] rounded-xl font-bold transition-all shadow-[var(--shadow)] flex items-center justify-center gap-2"
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