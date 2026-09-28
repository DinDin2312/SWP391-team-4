import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';

const PaymentResult = () => {
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
        
        setStatus('success');
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
      <div className="max-w-2xl mx-auto mt-20 p-10 bg-[#0e172a] border border-[#1a2947] rounded-3xl flex flex-col items-center justify-center text-center shadow-2xl">
        {status === 'processing' && (
          <>
            <Loader2 className="w-20 h-20 text-emerald-500 animate-spin mb-6" />
            <h1 className="text-3xl font-black text-white mb-2">Processing Payment</h1>
            <p className="text-slate-400">Please do not close this window...</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <CheckCircle2 className="w-20 h-20 text-emerald-500 mb-6" />
            <h1 className="text-3xl font-black text-white mb-2">Payment Successful!</h1>
            <p className="text-emerald-400 mb-8">{message}</p>
            <button 
              onClick={() => navigate('/member/schedule')}
              className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/50 flex items-center justify-center gap-2"
            >
              Go to My Schedule <ArrowRight className="w-5 h-5" />
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-20 h-20 text-red-500 mb-6" />
            <h1 className="text-3xl font-black text-white mb-2">Payment Failed</h1>
            <p className="text-red-400 mb-8">{message}</p>
            <button 
              onClick={() => navigate('/member/cart')}
              className="px-8 py-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
            >
              Back to Cart <ArrowRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentResult;
