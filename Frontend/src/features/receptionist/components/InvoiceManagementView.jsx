import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Receipt,
  Search,
  Filter,
  RefreshCw,
  Printer,
  Calendar,
  CreditCard,
  Banknote,
  User,
  ArrowUpDown,
  RotateCw
} from 'lucide-react';
import { receptionistService } from '../services/receptionistService';
import InvoiceReceiptModal from './InvoiceReceiptModal';
import { formatMoney, formatDateTime } from '../../../utils/displayFormat';
import { t } from '../../../i18n/useLanguage';

export default function InvoiceManagementView() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL');
  const [sortOrder, setSortOrder] = useState('DESC');

  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const data = await receptionistService.getAllInvoices();
      setInvoices(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load invoices:', err);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Filter and sort invoices
  const filteredInvoices = useMemo(() => {
    let result = [...invoices];

    // Keyword search
    if (searchKeyword.trim()) {
      const kw = searchKeyword.trim().toLowerCase();
      result = result.filter((inv) => {
        const code = (inv.invoiceCode || `INV-${inv.invoiceId}`).toLowerCase();
        const memberName = (inv.memberName || '').toLowerCase();
        const memberPhone = (inv.memberPhone || '').toLowerCase();
        const cashier = (inv.cashierName || '').toLowerCase();
        const itemNames = (inv.items || []).map((it) => (it.itemName || '').toLowerCase()).join(' ');
        return (
          code.includes(kw) ||
          memberName.includes(kw) ||
          memberPhone.includes(kw) ||
          cashier.includes(kw) ||
          itemNames.includes(kw)
        );
      });
    }

    // Payment method filter
    if (paymentFilter !== 'ALL') {
      result = result.filter((inv) => {
        const method = (inv.paymentMethod || 'CASH').toUpperCase();
        if (paymentFilter === 'CASH') return method === 'CASH';
        if (paymentFilter === 'BANK_TRANSFER') return method === 'BANK_TRANSFER' || method === 'TRANSFER' || method === 'VNPAY';
        return true;
      });
    }

    // Date range filter
    if (dateFilter !== 'ALL') {
      const now = new Date();
      result = result.filter((inv) => {
        if (!inv.createdAt) return false;
        const invDate = new Date(inv.createdAt);
        if (dateFilter === 'TODAY') {
          return (
            invDate.getDate() === now.getDate() &&
            invDate.getMonth() === now.getMonth() &&
            invDate.getFullYear() === now.getFullYear()
          );
        }
        if (dateFilter === 'LAST_7_DAYS') {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return invDate >= sevenDaysAgo;
        }
        if (dateFilter === 'THIS_MONTH') {
          return (
            invDate.getMonth() === now.getMonth() &&
            invDate.getFullYear() === now.getFullYear()
          );
        }
        return true;
      });
    }

    // Sort by createdAt
    result.sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return sortOrder === 'DESC' ? timeB - timeA : timeA - timeB;
    });

    return result;
  }, [invoices, searchKeyword, paymentFilter, dateFilter, sortOrder]);

  const handleOpenReceipt = (invoice) => {
    setSelectedReceipt(invoice);
    setIsReceiptModalOpen(true);
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-5 max-w-7xl mx-auto w-full">
      {/* Front Desk Header - Clean & Focused */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center shrink-0 shadow-sm">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[var(--text)] tracking-tight">
                {t('Front Desk Invoices & Receipts')}
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">
                {t('Look up recent payment transactions and print/export service receipts for members.')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={fetchInvoices}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{t('Refresh')}</span>
          </button>
        </div>
      </div>

      {/* Filter and Quick Search Bar */}
      <div className="p-3.5 sm:p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder={t('Search by invoice code (#INV-...), member name, phone...')}
            className="w-full pl-9 pr-4 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-xs sm:text-sm text-[var(--text)] focus:outline-none focus:border-[var(--primary)] transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Payment Method Filter */}
          <div className="flex items-center gap-1 bg-[var(--bg)] border border-[var(--border)] rounded-lg p-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-[var(--text-muted)] ml-1" />
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="bg-transparent border-none text-[var(--text)] text-xs font-medium focus:outline-none pr-2 cursor-pointer"
            >
              <option value="ALL">{t('All Methods')}</option>
              <option value="CASH">{t('Cash')}</option>
              <option value="BANK_TRANSFER">{t('Bank Transfer')}</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-1 bg-[var(--bg)] border border-[var(--border)] rounded-lg p-1 text-xs">
            <Calendar className="w-3.5 h-3.5 text-[var(--text-muted)] ml-1" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-transparent border-none text-[var(--text)] text-xs font-medium focus:outline-none pr-2 cursor-pointer"
            >
              <option value="ALL">{t('All Time')}</option>
              <option value="TODAY">{t('Today')}</option>
              <option value="LAST_7_DAYS">{t('Last 7 Days')}</option>
              <option value="THIS_MONTH">{t('This Month')}</option>
            </select>
          </div>

          {/* Sort Order */}
          <button
            onClick={() => setSortOrder(prev => prev === 'DESC' ? 'ASC' : 'DESC')}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-[var(--bg)] hover:bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg text-xs font-medium text-[var(--text)] transition-colors"
            title={sortOrder === 'DESC' ? t('Newest First') : t('Oldest First')}
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span>{sortOrder === 'DESC' ? t('Newest') : t('Oldest')}</span>
          </button>
        </div>
      </div>

      {/* Main Invoices Table */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-[var(--text-muted)] text-sm space-y-3">
            <RotateCw className="w-7 h-7 animate-spin mx-auto text-[var(--primary)]" />
            <p className="font-medium">{t('Loading invoice list...')}</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="py-16 text-center text-[var(--text-muted)] space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[var(--surface-hover)] text-[var(--text-muted)] flex items-center justify-center mx-auto opacity-70">
              <Receipt className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-sm sm:text-base text-[var(--text)]">
                {t('No matching invoices found')}
              </h4>
              <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
                {t('Try changing search keywords or adjusting filters.')}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs sm:text-sm">
              <thead>
                <tr className="bg-[var(--surface-hover)] border-b border-[var(--border)] text-[var(--text-muted)] font-semibold">
                  <th className="py-3 px-2 w-10 text-center">#</th>
                  <th className="py-3 px-3 whitespace-nowrap">{t('Invoice No.')}</th>
                  <th className="py-3 px-3 whitespace-nowrap">{t('Date & Time')}</th>
                  <th className="py-3 px-3">{t('Customer')}</th>
                  <th className="py-3 px-3">{t('Service')}</th>
                  <th className="py-3 px-3 whitespace-nowrap">{t('Payment Method')}</th>
                  <th className="py-3 px-3 text-right whitespace-nowrap">{t('Amount')}</th>
                  <th className="py-3 px-3 whitespace-nowrap">{t('Cashier')}</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap">{t('Status')}</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap min-w-[130px]">{t('Action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-[var(--text)]">
                {filteredInvoices.map((inv, idx) => {
                  const method = (inv.paymentMethod || 'CASH').toUpperCase();
                  const isCash = method === 'CASH';

                  return (
                    <tr
                      key={inv.invoiceId}
                      className="hover:bg-[var(--surface-hover)]/70 transition-colors"
                    >
                      <td className="py-3 px-2 text-center font-mono text-[var(--text-muted)] text-xs">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-mono font-bold text-[var(--primary)]">
                          {inv.invoiceCode || `#INV-${inv.invoiceId}`}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[var(--text-muted)] text-xs whitespace-nowrap">
                        {formatDateTime(inv.createdAt)}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-[var(--text)]">
                          {inv.memberName || t('Walk-in Guest')}
                        </div>
                        {inv.memberPhone && (
                          <div className="text-[11px] text-[var(--text-muted)]">
                            {inv.memberPhone}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 max-w-[200px]">
                        <div className="font-medium truncate text-[var(--text)]" title={inv.items?.map(i => i.itemName).join(', ')}>
                          {inv.items && inv.items.length > 0
                            ? inv.items.map(it => it.itemName).join(', ')
                            : t('Sports Service')}
                        </div>
                        {inv.items && inv.items[0]?.durationDays && (
                          <div className="text-[11px] text-[var(--text-muted)]">
                            {inv.items[0].durationDays} {t('days')}
                          </div>
                        )}
                        {inv.items && inv.items[0]?.totalSessions && (
                          <div className="text-[11px] text-[var(--text-muted)]">
                            {inv.items[0].totalSessions} {t('sessions')}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold border border-[var(--border)] ${
                          isCash
                            ? 'bg-[var(--success-soft)] text-[var(--success-text)]'
                            : 'bg-[var(--primary-soft)] text-[var(--primary)]'
                        }`}>
                          {isCash ? <Banknote className="w-3.5 h-3.5 shrink-0" /> : <CreditCard className="w-3.5 h-3.5 shrink-0" />}
                          <span>{isCash ? t('Cash') : t('Bank Transfer')}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <span className="font-black text-sm text-[var(--text)]">
                          {formatMoney(inv.totalAmount)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-xs text-[var(--text-muted)] whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                          <span className="truncate max-w-[120px]">{inv.cashierName || t('Front Desk')}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--success-soft)] text-[var(--success-text)] border border-[var(--border)]">
                          {inv.status === 'PAID' ? t('PAID') : (inv.status || t('COMPLETED'))}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap min-w-[130px]">
                        <button
                          onClick={() => handleOpenReceipt(inv)}
                          type="button"
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--surface-hover)] text-[var(--primary)] border border-[var(--border)] hover:bg-[var(--primary-soft)] transition-colors shadow-sm whitespace-nowrap shrink-0"
                          title={t('Print Receipt')}
                        >
                          <Printer className="w-3.5 h-3.5 shrink-0" />
                          <span className="whitespace-nowrap">{t('Print Receipt')}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reusable White Paper Invoice Receipt Modal */}
      <InvoiceReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        receipt={selectedReceipt}
      />
    </div>
  );
}
