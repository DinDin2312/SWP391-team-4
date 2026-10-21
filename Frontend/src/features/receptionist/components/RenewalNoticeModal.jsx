import React from 'react';
import { Info, X, CheckCircle2, ArrowRightCircle } from 'lucide-react';
import { t, useLanguage } from '../../../i18n/useLanguage';
import { formatDateTime } from '../../../utils/displayFormat';

const RenewalNoticeModal = ({ notice, onClose, onEnrollOther }) => {
    useLanguage();
    if (!notice || !notice.isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10001,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '480px',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '1rem',
                padding: '1.5rem',
                boxShadow: 'var(--shadow)',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '0.5rem', backgroundColor: 'var(--primary-soft)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Info style={{ width: '18px', height: '18px' }} />
                        </div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                            {t("Course Renewal Notice")}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}
                    >
                        <X style={{ width: '18px', height: '18px' }} />
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.875rem' }}>
                    <div style={{
                        padding: '0.85rem 1rem',
                        backgroundColor: 'var(--surface-hover)',
                        borderRadius: '0.65rem',
                        border: '1px solid var(--border)',
                        lineHeight: 1.55,
                        color: 'var(--text)'
                    }}>
                        {notice.type === 'ALREADY_RENEWED' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success-text)', fontWeight: 700, fontSize: '0.95rem' }}>
                                    <CheckCircle2 style={{ width: '18px', height: '18px' }} />
                                    <span>{t("Course renewed successfully!")}</span>
                                </div>
                                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    {t("Member has been registered and enrolled into the next batch:")}
                                </p>
                                <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.825rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>{t("Next Batch:")}</span>
                                        <strong style={{ color: 'var(--primary)' }}>{notice.nextCourse?.courseName}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>{t("Coach / Room:")}</span>
                                        <span style={{ color: 'var(--text)' }}>{notice.nextCourse?.coachName} • {notice.nextCourse?.roomName}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>{t("Timeline:")}</span>
                                        <span style={{ color: 'var(--text)' }}>{formatDateTime(notice.nextCourse?.firstSessionDate)} → {formatDateTime(notice.nextCourse?.lastSessionDate)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>{t("Total Sessions:")}</span>
                                        <strong style={{ color: 'var(--success-text)' }}>{notice.nextCourse?.sessionsCount} {t("sessions (In schedule)")}</strong>
                                    </div>
                                </div>
                            </div>
                        ) : notice.type === 'ALREADY_ENROLLED' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success-text)', fontWeight: 600 }}>
                                    <CheckCircle2 style={{ width: '18px', height: '18px' }} />
                                    <span>{notice.message}</span>
                                </div>
                            </div>
                        ) : (
                            <>
                                <span>{t("No upcoming recurring schedule found for course:")} </span>
                                <strong style={{ color: 'var(--primary)' }}>{notice.courseName}</strong>.
                                <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    {t("The center has not scheduled the next recurring batch for this course yet. You can enroll the member into another available class or check back later.")}
                                </p>
                            </>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem', borderTop: '1px solid var(--border)', paddingTop: '0.85rem' }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '0.55rem 1.1rem',
                            backgroundColor: 'var(--surface)',
                            color: 'var(--text)',
                            border: '1px solid var(--border)',
                            borderRadius: '0.5rem',
                            fontSize: '0.85rem',
                            fontWeight: 500,
                            cursor: 'pointer'
                        }}
                    >
                        {t("Close")}
                    </button>
                    {notice.type === 'NO_SCHEDULE' && onEnrollOther && (
                        <button
                            onClick={() => {
                                onClose();
                                onEnrollOther();
                            }}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                padding: '0.55rem 1.1rem',
                                backgroundColor: 'var(--primary)',
                                color: 'var(--on-primary)',
                                border: 'none',
                                borderRadius: '0.5rem',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            <ArrowRightCircle style={{ width: '15px', height: '15px' }} />
                            <span>{t("Enroll Another Class")}</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RenewalNoticeModal;
