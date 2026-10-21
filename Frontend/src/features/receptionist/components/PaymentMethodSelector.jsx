import React from 'react';
import { Banknote, CreditCard } from 'lucide-react';
import { t, useLanguage } from '../../../i18n/useLanguage';

const PaymentMethodSelector = ({ paymentMethod, setPaymentMethod }) => {
    useLanguage();

    return (
        <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '0.4rem',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    border: paymentMethod === 'CASH' ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                    backgroundColor: paymentMethod === 'CASH' ? 'var(--primary-soft)' : 'var(--surface)',
                    color: paymentMethod === 'CASH' ? 'var(--primary)' : 'var(--text)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                }}
            >
                <Banknote style={{ width: '13px', height: '13px' }} />
                <span>{t("Cash")}</span>
            </button>
            <button
                type="button"
                onClick={() => setPaymentMethod('TRANSFER')}
                style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '0.4rem',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    border: paymentMethod === 'TRANSFER' ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                    backgroundColor: paymentMethod === 'TRANSFER' ? 'var(--primary-soft)' : 'var(--surface)',
                    color: paymentMethod === 'TRANSFER' ? 'var(--primary)' : 'var(--text)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                }}
            >
                <CreditCard style={{ width: '13px', height: '13px' }} />
                <span>{t("Bank Transfer")}</span>
            </button>
        </div>
    );
};

export default PaymentMethodSelector;
