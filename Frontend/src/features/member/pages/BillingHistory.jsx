import { formatDateTime } from '../../../utils/displayFormat';
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BillingHistory = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:8080/api/v1/invoices', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setInvoices(res.data);
      } catch (err) {
        console.error("Failed to fetch invoices", err);
        setError("Unable to load billing history.");
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-64">
        <div className="text-on-surface-variant flex items-center gap-2 font-semibold">
          <span className="material-symbols-outlined animate-spin">sync</span>
          Loading Billing History...
        </div>
      </div>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'SUCCESS':
      case 'COMPLETED':
      case 'PAID':
        return 'bg-[var(--success-soft)] text-[var(--success-text)]';
      case 'PENDING':
        return 'bg-[var(--warning-soft)] text-[var(--warning-text)]';
      case 'FAILED':
      case 'CANCELLED':
        return 'bg-[var(--rose-soft)] text-[var(--rose)]';
      default:
        return 'bg-surface-container-high text-on-surface-variant';
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen">
      <div className="flex flex-col gap-1 pb-6 border-b border-surface-container mb-6">
        <h1 className="text-3xl lg:text-4xl text-on-surface tracking-tight font-extrabold flex items-center gap-3">
          Billing & Invoices
        </h1>
        <p className="text-sm text-on-surface-variant mt-1">
          View your purchase history, membership payments, and class bookings.
        </p>
      </div>

      {error ? (
        <div className="p-4 bg-error-container text-on-error-container rounded-xl text-sm font-bold">
          {error}
        </div>
      ) : invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-surface-container-lowest rounded-xl border border-surface-container text-center">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4">receipt_long</span>
          <h3 className="text-xl font-bold text-on-surface">No invoices found</h3>
          <p className="text-sm text-on-surface-variant mt-2">You haven't made any purchases yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6 max-w-5xl">
          {invoices.map((invoice) => (
            <div key={invoice.invoiceId} className="flex flex-col bg-surface-container-lowest rounded-2xl border border-surface-container overflow-hidden shadow-[var(--shadow)]">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-surface-container-low border-b border-surface-container">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[24px]">receipt_long</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-on-surface flex items-center gap-2">
                      Invoice #{invoice.invoiceId.toString().padStart(6, '0')}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wider uppercase ${getStatusColor(invoice.status)}`}>
                        {invoice.status || 'UNKNOWN'}
                      </span>
                    </span>
                    <span className="text-xs text-on-surface-variant mt-1">
                      {formatDateTime(invoice.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col sm:items-end">
                  <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Total Amount</span>
                  <span className="text-lg font-black text-primary">{formatCurrency(invoice.totalAmount)}</span>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 flex flex-col gap-6">

                {/* Details List */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Purchased Items</h4>
                  {invoice.details && invoice.details.length > 0 ? (
                    invoice.details.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-surface-container-lowest border border-surface-container-high/50">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-tertiary text-[20px]">
                            {item.itemType === 'CLASS' || item.itemType === 'CLASS_SCHEDULE' ? 'fitness_center' : 'card_membership'}
                          </span>
                          <span className="text-sm font-bold text-on-surface">{item.itemName}</span>
                        </div>
                        <span className="text-sm font-semibold text-on-surface-variant">{formatCurrency(item.unitPrice)}</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-sm text-on-surface-variant">No detailed items found for this invoice.</span>
                  )}
                </div>

                {/* Payment Info */}
                {(invoice.paymentMethod || invoice.transactionNo) && (
                  <div className="flex flex-col sm:flex-row gap-6 p-4 rounded-xl bg-surface-container-high/30">
                    {invoice.paymentMethod && (
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Payment Method</span>
                        <span className="text-sm font-semibold text-on-surface mt-1">{invoice.paymentMethod}</span>
                      </div>
                    )}
                    {invoice.transactionNo && (
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Transaction ID</span>
                        <span className="text-sm font-mono font-semibold text-on-surface mt-1">{invoice.transactionNo}</span>
                      </div>
                    )}
                    {invoice.paymentDate && (
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Payment Date</span>
                        <span className="text-sm font-semibold text-on-surface mt-1">{formatDateTime(invoice.paymentDate)}</span>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BillingHistory;
