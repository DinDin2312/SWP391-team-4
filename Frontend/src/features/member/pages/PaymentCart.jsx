import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ShoppingCart, Trash2, ArrowRight, CreditCard, 
  Wallet, QrCode, AlertCircle, CheckCircle2 
} from 'lucide-react';

const PaymentCart = () => {
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
      setToast({ visible: true, type: 'success', title: 'Removed', message: 'Item removed from cart.' });
      setTimeout(() => setToast({ visible: false, type: 'success', title: '', message: '' }), 3000);
      fetchCartItems(); // Refresh the cart
      window.dispatchEvent(new Event('cartUpdated')); // Update the global badge
    } catch (err) {
      setToast({ visible: true, type: 'error', title: 'Error', message: 'Failed to remove item.' });
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
      
      // ChuyÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â¡Ă„â€Ă¢â‚¬ÂÄ‚â€Ă‚Â»Ă„â€Ă¢â‚¬Â Ä‚Â¢Ă¢â€Â¬Ă¢â€Â¢n hÄ‚â€Ă¢â‚¬ÂÄ‚Â¢Ă¢â€Â¬Ă‚Â Ă„â€Ă¢â‚¬ÂÄ‚â€Ă‚Â°Ä‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â¡Ă„â€Ă¢â‚¬ÂÄ‚â€Ă‚Â»Ă„â€Ă‚Â¢Ä‚Â¢Ă¢â‚¬ÂĂ‚Â¬Ä‚â€Ă‚Âºng sang trang VNPay
      if (response.data && response.data.paymentUrl) {
          window.location.href = response.data.paymentUrl;
      }
      
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Payment failed. Please try again.';
      setToast({ visible: true, type: 'error', title: 'Checkout Error', message: errorMsg });
      setTimeout(() => setToast({ visible: false, type: 'error', title: '', message: '' }), 5000);
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading your cart...</div>;
  }

  return (
    <div className="flex flex-col w-full pb-10">
      {/* Toast Notification */}
      <div className={`fixed bottom-6 right-6 z-50 transform transition-all duration-300 ease-out flex items-center gap-3 px-5 py-4 rounded-xl bg-[#091124] text-slate-200 shadow-2xl border border-[#1a2947] ${toast.visible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${toast.type === 'error' ? 'bg-red-500/20 text-red-500' : 'bg-emerald-500/20 text-emerald-400'}`}>
          {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
        </div>
        <div className="flex flex-col">
          <span className={`font-bold text-sm ${toast.type === 'error' ? 'text-red-500' : 'text-emerald-400'}`}>{toast.title}</span>
          <span className="text-xs text-slate-400">{toast.message}</span>
        </div>
      </div>

      
      {checkoutLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0e172a] border border-[#1a2947] p-8 rounded-2xl flex flex-col items-center max-w-sm w-full mx-4 shadow-2xl">
            <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-6"></div>
            <h3 className="text-xl font-bold text-white mb-2">Processing Payment</h3>
            <p className="text-sm text-slate-400 text-center">
              {selectedMethod === 'vnpay' ? 'Connecting to VNPay Gateway...' : 
               selectedMethod === 'momo' ? 'Opening Momo App...' : 
               'Verifying Credit Card Details...'}
            </p>
            <p className="text-xs text-slate-500 mt-6 animate-pulse">Please do not close this window</p>
          </div>
        </div>
      )}

      <section className="mb-8">
        <h1 className="text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <ShoppingCart className="w-8 h-8 text-blue-500" /> Checkout
        </h1>
        <p className="text-sm text-slate-400 mt-2">
          Review your pending courses and complete the payment to secure your spots.
        </p>
      </section>

      {error ? (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-[#091124] rounded-2xl border border-[#15203b]">
          <ShoppingCart className="w-16 h-16 text-slate-600 mb-4" />
          <h2 className="text-xl font-bold text-slate-300">Your cart is empty</h2>
          <p className="text-sm text-slate-500 mt-2 mb-6">Looks like you haven't enrolled in any courses yet.</p>
          <button onClick={() => navigate('/member/book-class')} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-colors">
            Browse Courses
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: Cart Items */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <h2 className="text-lg font-bold text-white mb-2">Cart Items ({items.length})</h2>
            {items.map((item, idx) => (
              <div key={idx} className="bg-[#0e172a] border border-[#1a2947] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  {item.type === 'PACKAGE' ? (
                    <>
                      <h3 className="font-bold text-white text-lg">{item.packageName}</h3>
                      <p className="text-sm text-slate-400">Duration: {item.durationDays} Days</p>
                      <div className="mt-2 inline-block px-2.5 py-1 rounded-lg bg-green-500/10 text-green-400 text-xs font-semibold">
                        Membership Package
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="font-bold text-white text-lg">{item.className}</h3>
                      <p className="text-sm text-slate-400">Coach: {item.coachName}</p>
                      <div className="mt-2 inline-block px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-semibold">
                        {item.sessionCount} Sessions
                      </div>
                    </>
                  )}
                </div>
                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                  <span className="text-xl font-extrabold text-white">
                    {Number(item.price).toLocaleString()} VND
                  </span>
                  <button onClick={() => handleRemoveItem(item.type === 'PACKAGE' ? item.packageId : item.classId, item.type)} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 font-semibold transition-colors">
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* RIGHT: Payment Options & Summary */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Payment Methods */}
            <div className="bg-[#091124] border border-[#15203b] rounded-2xl p-6 flex flex-col gap-4">
              <h2 className="text-lg font-bold text-white mb-2">Payment Method</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button 
                  onClick={() => setSelectedMethod('credit')}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-colors ${selectedMethod === 'credit' ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-[#1a2947] bg-[#0e172a] text-slate-400 hover:border-[#2a3b5c]'}`}
                >
                  <CreditCard className="w-6 h-6 mb-2" />
                  <span className="text-xs font-bold">Credit Card</span>
                </button>
                <button 
                  onClick={() => setSelectedMethod('momo')}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-colors ${selectedMethod === 'momo' ? 'border-pink-500 bg-pink-500/10 text-pink-400' : 'border-[#1a2947] bg-[#0e172a] text-slate-400 hover:border-[#2a3b5c]'}`}
                >
                  <Wallet className="w-6 h-6 mb-2" />
                  <span className="text-xs font-bold">Momo</span>
                </button>
                <button 
                  onClick={() => setSelectedMethod('vnpay')}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-colors ${selectedMethod === 'vnpay' ? 'border-sky-500 bg-sky-500/10 text-sky-400' : 'border-[#1a2947] bg-[#0e172a] text-slate-400 hover:border-[#2a3b5c]'}`}
                >
                  <QrCode className="w-6 h-6 mb-2" />
                  <span className="text-xs font-bold">VNPay</span>
                </button>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-[#0e172a] border border-[#1a2947] rounded-2xl p-6 flex flex-col gap-5">
              <h2 className="text-lg font-bold text-white">Order Summary</h2>
              
              <div className="flex flex-col gap-3 text-sm text-slate-300">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-white">{Number(totalPrice).toLocaleString()} VND</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (0%)</span>
                  <span className="font-semibold text-white">0 VND</span>
                </div>
                <div className="flex justify-between text-emerald-400">
                  <span>Discount</span>
                  <span className="font-semibold">- {(totalPrice * discountPercent / 100).toLocaleString()} VND</span>
                </div>
              </div>

              <div className="h-px w-full bg-[#1a2947]"></div>
              
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Total</span>
                <span className="text-2xl font-black text-white">{Number(totalPrice * (100 - discountPercent) / 100).toLocaleString()} <span className="text-base text-slate-400 font-bold">VND</span></span>
              </div>

              <button 
                onClick={handleCheckout} 
                disabled={checkoutLoading}
                className="w-full mt-4 px-6 py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/50 flex items-center justify-center gap-2"
              >
                {checkoutLoading ? 'Processing...' : 'Confirm & Pay Now'} 
                {!checkoutLoading && <ArrowRight className="w-5 h-5" />}
              </button>
              
              <p className="text-[10px] text-center text-slate-500 uppercase tracking-wider font-bold">
                Secure 256-bit SSL Encryption
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentCart;