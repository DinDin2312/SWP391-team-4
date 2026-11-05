import React, { useRef, useState } from 'react';
import { Printer, X, CheckCircle2, Receipt, Building2, Phone, Mail, MapPin, Copy, Check, Tag } from 'lucide-react';
import { formatMoney, formatDateTime } from '../../../utils/displayFormat';
import { t } from '../../../i18n/useLanguage';

export default function InvoiceReceiptModal({ isOpen, onClose, receipt }) {
  const [copied, setCopied] = useState(false);
  const printContainerRef = useRef(null);

  if (!isOpen || !receipt) return null;

  const handleCopyCode = () => {
    const code = receipt.invoiceCode || `INV-${receipt.invoiceId}`;
    if (code) {
      void navigator.clipboard?.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const paymentMethodLabel = (method) => {
    if (!method) return t('Cash');
    const m = method.toUpperCase();
    if (m === 'CASH') return t('Cash');
    if (m === 'BANK_TRANSFER' || m === 'TRANSFER') return t('Bank Transfer');
    if (m === 'PAYOS' || m === 'VIETQR') return 'VietQR (PayOS)';
    if (m === 'VNPAY') return 'VNPay';
    if (m === 'MOMO') return 'MoMo';
    return method;
  };

  const hasDiscount = (receipt.discountAmount && Number(receipt.discountAmount) > 0) ||
    (receipt.subtotal && receipt.totalAmount && Number(receipt.subtotal) > Number(receipt.totalAmount));

  const subtotalAmount = receipt.subtotal && Number(receipt.subtotal) > 0
    ? Number(receipt.subtotal)
    : Number(receipt.totalAmount || 0);

  const discountVal = receipt.discountAmount && Number(receipt.discountAmount) > 0
    ? Number(receipt.discountAmount)
    : Math.max(0, subtotalAmount - Number(receipt.totalAmount || 0));

  const itemsList = (receipt.items && receipt.items.length > 0) ? receipt.items : (receipt.details || []);

  const handlePrint = () => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    const invCode = receipt.invoiceCode || `INV-${receipt.invoiceId}`;
    const formattedDate = formatDateTime(receipt.createdAt);
    const totalFormatted = formatMoney(receipt.totalAmount);
    const subtotalFormatted = formatMoney(subtotalAmount);
    const discountFormatted = formatMoney(discountVal);
    const cashier = receipt.cashierName || t('Front Desk');

    const itemsList = (receipt.items && receipt.items.length > 0) ? receipt.items : (receipt.details || []);
    const itemsRows = itemsList.length > 0
      ? itemsList.map((it, idx) => `
        <tr>
          <td style="text-align: center; color: #64748b;">${idx + 1}</td>
          <td style="font-weight: 700; color: #0f172a;">${it.itemName || ''}</td>
          <td style="color: #475569;">${it.itemType === 'PACKAGE' ? t('Membership Package') : it.itemType === 'CLASS' ? t('Class / Course') : t('Sports Service')}</td>
          <td style="text-align: center; color: #334155;">${it.durationDays ? `${it.durationDays} ${t('days')}` : (it.totalSessions ? `${it.totalSessions} ${t('sessions')}` : '-')}</td>
          <td style="text-align: right; color: #334155;">${formatMoney(it.unitPrice)}</td>
          <td style="text-align: right; font-weight: 700; color: #0f172a;">${formatMoney(it.amount || it.unitPrice)}</td>
        </tr>
      `).join('')
      : `
        <tr>
          <td style="text-align: center; color: #64748b;">1</td>
          <td style="font-weight: 700; color: #0f172a;">${t('Front Desk Sports Service')}</td>
          <td style="color: #475569;">${t('Sports Service')}</td>
          <td style="text-align: center; color: #334155;">-</td>
          <td style="text-align: right; color: #334155;">${subtotalFormatted}</td>
          <td style="text-align: right; font-weight: 700; color: #0f172a;">${subtotalFormatted}</td>
        </tr>
      `;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="vi">
        <head>
          <meta charset="utf-8" />
          <title>${invCode}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 12mm 15mm;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            }
            body {
              background: #ffffff;
              color: #0f172a;
              font-size: 12px;
              line-height: 1.5;
            }
            .header {
              text-align: center;
              border-bottom: 1.5px dashed #cbd5e1;
              padding-bottom: 12px;
              margin-bottom: 14px;
            }
            .center-name {
              font-size: 18px;
              font-weight: 800;
              color: #0f172a;
              letter-spacing: -0.2px;
            }
            .center-sub {
              font-size: 11px;
              color: #475569;
              margin-top: 2px;
            }
            .center-contact {
              font-size: 10px;
              color: #64748b;
              margin-top: 4px;
            }
            .title-box {
              text-align: center;
              margin-bottom: 16px;
            }
            .receipt-title {
              font-size: 15px;
              font-weight: 800;
              color: #0f172a;
              letter-spacing: 0.5px;
            }
            .receipt-sub {
              font-size: 10px;
              color: #64748b;
              letter-spacing: 1px;
            }
            .meta-strip {
              display: flex;
              justify-content: center;
              gap: 16px;
              margin-top: 6px;
              font-size: 11px;
              color: #334155;
            }
            .code-badge {
              font-family: monospace;
              color: #1d4ed8;
              font-weight: 700;
            }
            .status-badge {
              border: 1px solid #86efac;
              background: #f0fdf4;
              color: #166534;
              font-weight: 700;
              padding: 1px 6px;
              border-radius: 4px;
            }
            .box {
              border: 1px solid #cbd5e1;
              border-radius: 4px;
              padding: 10px 12px;
              margin-bottom: 14px;
              background: #f8fafc;
            }
            .box-title {
              font-size: 11px;
              font-weight: 700;
              color: #1e293b;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 4px;
              margin-bottom: 6px;
              display: flex;
              justify-content: space-between;
            }
            .grid-2 {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 4px 12px;
              font-size: 11px;
            }
            .table-wrap {
              border: 1px solid #cbd5e1;
              border-radius: 4px;
              overflow: hidden;
              margin-bottom: 14px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 11px;
            }
            th {
              background: #f1f5f9;
              border-bottom: 1px solid #cbd5e1;
              padding: 7px 10px;
              font-weight: 700;
              color: #334155;
              text-align: left;
            }
            td {
              padding: 7px 10px;
              border-bottom: 1px solid #f1f5f9;
            }
            .financial-card {
              border: 1px solid #cbd5e1;
              border-radius: 4px;
              background: #f8fafc;
              padding: 10px 14px;
              margin-bottom: 16px;
            }
            .financial-row {
              display: flex;
              justify-content: space-between;
              font-size: 11.5px;
              padding: 3px 0;
            }
            .discount-row {
              color: #059669;
              font-weight: 600;
            }
            .total-row {
              border-top: 1.5px solid #cbd5e1;
              margin-top: 6px;
              padding-top: 6px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .total-val {
              font-size: 18px;
              font-weight: 900;
              color: #0f172a;
            }
            .sigs {
              display: flex;
              justify-content: space-between;
              text-align: center;
              padding-top: 14px;
              border-top: 1px dashed #cbd5e1;
              margin-bottom: 22px;
            }
            .sig-col {
              width: 45%;
            }
            .sig-name {
              font-weight: 700;
              font-size: 12px;
              color: #1e293b;
            }
            .sig-sub {
              font-size: 10px;
              font-style: italic;
              color: #64748b;
              margin-top: 2px;
              margin-bottom: 50px;
            }
            .footer-msg {
              text-align: center;
              font-size: 10.5px;
              font-style: italic;
              color: #64748b;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="center-name">Nexus Sport Center</h1>
            <p class="center-sub">${t('International Sports & Fitness Center')}</p>
            <p class="center-contact">Toà nhà FPT, Cái Răng, Cần Thơ &nbsp;|&nbsp; Hotline: 1900 6868 &nbsp;|&nbsp; support@nexussport.vn</p>
          </div>

          <div class="title-box">
            <h2 class="receipt-title">${t('Service Payment Receipt')}</h2>
            <p class="receipt-sub">SERVICE PAYMENT RECEIPT</p>
            <div class="meta-strip">
              <span>${t('Invoice No.')}: <strong class="code-badge">${invCode}</strong></span>
              <span>${t('Date & Time')}: <strong>${formattedDate}</strong></span>
              <span class="status-badge">${receipt.status === 'PAID' ? t('PAID') : (receipt.status || t('COMPLETED'))}</span>
            </div>
          </div>

          <div class="box">
            <div class="box-title">
              <span>${t('Member Information')}</span>
              ${receipt.userId ? `<span style="font-family: monospace; color: #64748b;">ID #${receipt.userId}</span>` : ''}
            </div>
            <div class="grid-2">
              <div><span style="color: #64748b;">${t('Customer')}:</span> <strong>${receipt.memberName || t('Walk-in Guest')}</strong></div>
              <div><span style="color: #64748b;">${t('Phone number')}:</span> <strong>${receipt.memberPhone || '-'}</strong></div>
              <div style="grid-column: span 2;"><span style="color: #64748b;">Email:</span> <strong>${receipt.memberEmail || '-'}</strong></div>
            </div>
          </div>

          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style="width: 32px; text-align: center;">#</th>
                  <th>${t('Service / Course Name')}</th>
                  <th>${t('Service Type')}</th>
                  <th style="text-align: center;">${t('Duration / Sessions')}</th>
                  <th style="text-align: right;">${t('Unit Price')}</th>
                  <th style="text-align: right;">${t('Total')}</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRows}
              </tbody>
            </table>
          </div>

          <div class="financial-card">
            <div class="financial-row">
              <span style="color: #64748b;">${t('Subtotal')}:</span>
              <strong>${subtotalFormatted}</strong>
            </div>
            ${hasDiscount ? `
              <div class="financial-row discount-row">
                <span>${t('Discount / Voucher')}${receipt.voucherCode ? ` (${receipt.voucherCode})` : ''}:</span>
                <span>-${discountFormatted}</span>
              </div>
            ` : ''}
            <div class="total-row">
              <div>
                <span style="color: #64748b; font-size: 11px;">${t('Payment Method')}: <strong>${paymentMethodLabel(receipt.paymentMethod)}</strong></span>
                ${receipt.transactionNo ? `<div style="color: #64748b; font-size: 10px; font-family: monospace;">Ref: ${receipt.transactionNo}</div>` : ''}
              </div>
              <div style="text-align: right;">
                <span style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 700; display: block;">${t('Total Payment')}</span>
                <span class="total-val">${totalFormatted}</span>
              </div>
            </div>
          </div>

          <div class="sigs">
            <div class="sig-col">
              <div class="sig-name">${t('Payer / Customer')}</div>
              <div class="sig-sub">${t('(Signature & Full Name)')}</div>
            </div>
            <div class="sig-col">
              <div class="sig-name">${t('Cashier / Receptionist')}</div>
              <div class="sig-sub">${receipt.cashierName || t('(Signature & Full Name)')}</div>
            </div>
          </div>

          <p class="footer-msg">
            ${t('Thank you for using our services at Nexus Sport Center!')}
          </p>
        </body>
      </html>
    `);

    doc.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 500);
  };

  const invCode = receipt.invoiceCode || `INV-${receipt.invoiceId}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] rounded-md shadow-xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Modal Top Header - Clean & Sharp */}
        <div className="px-5 py-3.5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface-hover)] shrink-0">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-[var(--primary)]" />
            <h3 className="font-bold text-sm sm:text-base text-[var(--text)]">
              {t('Official Receipt')}
            </h3>
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-sm bg-[var(--bg)] border border-[var(--border)] text-[var(--primary)]">
              {invCode}
            </span>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg)] border border-transparent hover:border-[var(--border)] transition-colors cursor-pointer"
            aria-label={t('Close')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Printable Receipt Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          
          {/* Header Banner - Business Stamp */}
          <div className="text-center pb-3 border-b border-dashed border-[var(--border)]">
            <h2 className="text-lg font-black tracking-tight text-[var(--text)] uppercase">
              Nexus Sport Center
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {t('International Sports & Fitness Center')}
            </p>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">
              Toà nhà FPT, Cái Răng, Cần Thơ &nbsp;|&nbsp; Hotline: 1900 6868
            </p>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-2.5 text-xs">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--surface-hover)] rounded-sm font-mono text-[var(--text)] border border-[var(--border)]">
                <span className="text-[var(--text-muted)]">{t('Invoice No.')}:</span>
                <span className="font-bold text-[var(--primary)]">{invCode}</span>
                <button
                  onClick={handleCopyCode}
                  type="button"
                  className="ml-1 text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors cursor-pointer"
                  title={t('Copy')}
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="text-[var(--text-muted)]">
                {t('Date & Time')}: <span className="font-semibold text-[var(--text)]">{formatDateTime(receipt.createdAt)}</span>
              </div>

              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs font-semibold border ${
                receipt.status === 'PAID'
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'
              }`}>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{receipt.status === 'PAID' ? t('PAID') : (receipt.status || t('COMPLETED'))}</span>
              </span>
            </div>
          </div>

          {/* Customer Info Box */}
          <div className="bg-[var(--surface-hover)] rounded-md p-3.5 border border-[var(--border)] text-xs sm:text-sm space-y-2">
            <div className="font-semibold text-[var(--text)] border-b border-[var(--border)] pb-1.5 flex justify-between items-center">
              <span>{t('Member Information')}</span>
              {receipt.userId && (
                <span className="font-mono text-[var(--text-muted)] text-xs">
                  ID #{receipt.userId}
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[var(--text)]">
              <div>
                <span className="text-[var(--text-muted)]">{t('Customer')}: </span>
                <span className="font-bold">{receipt.memberName || t('Walk-in Guest')}</span>
              </div>
              <div>
                <span className="text-[var(--text-muted)]">{t('Phone number')}: </span>
                <span className="font-semibold font-mono">{receipt.memberPhone || '-'}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-[var(--text-muted)]">Email: </span>
                <span className="font-semibold">{receipt.memberEmail || '-'}</span>
              </div>
            </div>
          </div>

          {/* Itemized Services Table */}
          <div className="border border-[var(--border)] rounded-md overflow-hidden">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-[var(--surface-hover)] border-b border-[var(--border)] text-[var(--text-muted)] font-semibold">
                  <th className="py-2.5 px-3 w-10 text-center">#</th>
                  <th className="py-2.5 px-3">{t('Service / Course Name')}</th>
                  <th className="py-2.5 px-3">{t('Service Type')}</th>
                  <th className="py-2.5 px-3 text-center">{t('Duration / Sessions')}</th>
                  <th className="py-2.5 px-3 text-right">{t('Unit Price')}</th>
                  <th className="py-2.5 px-3 text-right">{t('Total')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-[var(--text)] bg-[var(--surface)]">
                {itemsList && itemsList.length > 0 ? (
                  itemsList.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[var(--surface-hover)]/50 transition-colors">
                      <td className="py-2.5 px-3 text-center font-mono text-[var(--text-muted)]">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-bold text-[var(--text)]">
                        {item.itemName}
                      </td>
                      <td className="py-2.5 px-3 text-[var(--text-muted)]">
                        {item.itemType === 'PACKAGE'
                          ? t('Membership Package')
                          : item.itemType === 'CLASS'
                          ? t('Class / Course')
                          : t('Sports Service')}
                      </td>
                      <td className="py-2.5 px-3 text-center text-[var(--text)] font-medium">
                        {item.durationDays ? `${item.durationDays} ${t('days')}` : (item.totalSessions ? `${item.totalSessions} ${t('sessions')}` : '-')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-[var(--text-muted)]">
                        {formatMoney(item.unitPrice)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-[var(--text)]">
                        {formatMoney(item.amount || item.unitPrice)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="py-2.5 px-3 text-center font-mono text-[var(--text-muted)]">1</td>
                    <td className="py-2.5 px-3 font-bold text-[var(--text)]">
                      {t('Front Desk Sports Service')}
                    </td>
                    <td className="py-2.5 px-3 text-[var(--text-muted)]">{t('Sports Service')}</td>
                    <td className="py-2.5 px-3 text-center text-[var(--text-muted)]">-</td>
                    <td className="py-2.5 px-3 text-right font-medium text-[var(--text-muted)]">{formatMoney(subtotalAmount)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-[var(--text)]">{formatMoney(subtotalAmount)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Financial Breakdown Card - Clean & Transparent */}
          <div className="bg-[var(--surface-hover)] rounded-md border border-[var(--border)] p-4 text-xs sm:text-sm space-y-2">
            <div className="flex justify-between items-center text-[var(--text)]">
              <span className="text-[var(--text-muted)]">{t('Subtotal')}:</span>
              <span className="font-semibold font-mono">{formatMoney(subtotalAmount)}</span>
            </div>

            {hasDiscount && (
              <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Tag className="w-3.5 h-3.5 shrink-0" />
                  <span className="font-semibold">{t('Discount / Voucher')}:</span>
                  {receipt.voucherCode && (
                    <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-sm bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                      {receipt.voucherCode}
                    </span>
                  )}
                </div>
                <span className="font-bold font-mono">-{formatMoney(discountVal)}</span>
              </div>
            )}

            <div className="pt-2 border-t border-[var(--border)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="space-y-0.5 text-xs text-[var(--text-muted)]">
                <div>
                  <span>{t('Payment Method')}: </span>
                  <strong className="text-[var(--text)]">{paymentMethodLabel(receipt.paymentMethod)}</strong>
                </div>
                {receipt.transactionNo && (
                  <div className="font-mono text-[11px]">
                    Ref: <span className="font-semibold text-[var(--text)]">{receipt.transactionNo}</span>
                  </div>
                )}
                {receipt.cashierName && (
                  <div>
                    <span>{t('Cashier')}: </span>
                    <strong className="text-[var(--text)]">{receipt.cashierName}</strong>
                  </div>
                )}
              </div>

              <div className="text-right w-full sm:w-auto">
                <span className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] font-bold block">
                  {t('Total Payment')}
                </span>
                <span className="text-xl sm:text-2xl font-black text-[var(--text)]">
                  {formatMoney(receipt.totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Signatures & Note */}
          <div className="pt-4 border-t border-dashed border-[var(--border)]">
            <div className="grid grid-cols-2 text-center text-xs sm:text-sm">
              <div className="space-y-12">
                <span className="font-bold text-[var(--text)] block">
                  {t('Payer / Customer')}
                </span>
                <span className="text-xs italic text-[var(--text-muted)] block">{t('(Signature & Full Name)')}</span>
              </div>
              <div className="space-y-12">
                <span className="font-bold text-[var(--text)] block">
                  {t('Cashier / Receptionist')}
                </span>
                <span className="text-xs italic text-[var(--text-muted)] block">{receipt.cashierName || t('(Signature & Full Name)')}</span>
              </div>
            </div>

            <p className="mt-8 text-center text-[11px] text-[var(--text-muted)] italic">
              {t('Thank you for using our services at Nexus Sport Center!')}
            </p>
          </div>

        </div>

        {/* Modal Bottom Actions */}
        <div className="px-5 py-3 bg-[var(--surface-hover)] border-t border-[var(--border)] flex items-center justify-end gap-2.5 shrink-0">
          <button
            onClick={onClose}
            type="button"
            className="px-4 py-1.5 text-xs sm:text-sm font-medium text-[var(--text)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] rounded-md transition-colors shadow-xs cursor-pointer"
          >
            {t('Close')}
          </button>
          <button
            onClick={handlePrint}
            type="button"
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs sm:text-sm font-semibold text-white bg-[var(--primary)] hover:opacity-90 rounded-md shadow-xs transition-opacity cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{t('Print Invoice')}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
