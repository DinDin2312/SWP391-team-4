import React from 'react';
import {
    X,
    Clock,
    Sparkles,
    User,
    Calendar,
    Users,
    AlertTriangle,
    CheckCircle2,
    RefreshCw
} from 'lucide-react';
import { t, useLanguage } from '../../../i18n/useLanguage';
import { formatDateTime as displayFormatDateTime, formatMoney } from '../../../utils/displayFormat';
import PaymentMethodSelector from './PaymentMethodSelector';

const getOptionBoxStyle = (isSelected, isOptDisabled) => {
    let borderColor = 'var(--border)';
    let bg = 'var(--surface)';
    if (isSelected) {
        borderColor = 'var(--primary)';
        bg = 'var(--primary-soft)';
    } else if (isOptDisabled) {
        bg = 'var(--surface-hover)';
    }
    return {
        padding: '0.8rem 1rem',
        borderRadius: '0.75rem',
        borderWidth: isSelected ? '2px' : '1px',
        borderStyle: 'solid',
        borderColor,
        backgroundColor: bg,
        cursor: isOptDisabled ? 'not-allowed' : 'pointer',
        opacity: isOptDisabled ? 0.65 : 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.45rem'
    };
};

const renderClassDetail = (icon, label, value, highlightColor) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
        {icon}
        <span>{label}: <strong style={{ color: highlightColor || 'var(--text)' }}>{value}</strong></span>
    </span>
);

const ClassRenewalModal = ({
    isOpen,
    onClose,
    suggestedClass,
    memberName,
    selectedRenewalClassId,
    setSelectedRenewalClassId,
    paymentMethod,
    setPaymentMethod,
    onConfirm,
    confirming,
    feedback
}) => {
    useLanguage();
    if (!isOpen || !suggestedClass) return null;

    const optionsList = suggestedClass.options && suggestedClass.options.length > 0
        ? suggestedClass.options
        : [suggestedClass];
    const chosenOption = optionsList.find(o => o.classId === selectedRenewalClassId) || optionsList[0];
    const isChosenDisabled = chosenOption?.alreadyEnrolled || (chosenOption?.availableSlots <= 0);

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div style={{
                width: '100%',
                maxWidth: '680px',
                maxHeight: 'min(92vh, 800px)',
                height: 'auto',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '1rem',
                padding: '1.25rem 1.5rem',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}>
                <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.65rem' }}>
                    <div>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                            {t("Enroll Next Term Course")}
                        </h3>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {t("Select the next term class for {0} (Subject: {1})", [memberName, suggestedClass.subjectName || suggestedClass.currentClassName])}
                        </p>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}>
                        <X style={{ width: '18px', height: '18px' }} />
                    </button>
                </div>

                {feedback && (
                    <div style={{ flexShrink: 0, padding: '0.65rem 0.85rem', borderRadius: '0.5rem', marginBottom: '0.75rem', backgroundColor: feedback.type === 'success' ? 'var(--success-soft)' : 'var(--danger-soft)', color: feedback.type === 'success' ? 'var(--success-text)' : 'var(--danger-text)', fontSize: '0.825rem' }}>
                        {t(feedback.message)}
                    </div>
                )}

                {/* Banner thói quen tập luyện của lớp cũ */}
                <div style={{ flexShrink: 0, backgroundColor: 'var(--surface-hover)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '0.65rem 0.9rem', marginBottom: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.825rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{t("Current Course:")} <strong style={{ color: 'var(--text)' }}>{suggestedClass.currentClassName}</strong></span>
                        <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{suggestedClass.subjectName || ''}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
                        <Clock style={{ width: '13px', height: '13px', color: 'var(--primary)' }} />
                        <span>{t("Familiar Schedule:")} <strong style={{ color: 'var(--text)' }}>{suggestedClass.currentSchedulePattern || ''}</strong></span>
                    </div>
                </div>

                {/* Tiêu đề danh sách lớp mở */}
                <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text)' }}>
                        {t("Available Classes for Next Term:")} ({optionsList.length})
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {t("Select one class to enroll")}
                    </span>
                </div>

                {/* Danh sách các lớp học ứng viên - THANH CUỘN DUY NHẤT */}
                <div style={{
                    flex: '1 1 auto',
                    minHeight: '130px',
                    maxHeight: '320px',
                    overflowY: 'auto',
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'var(--border) transparent',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.6rem',
                    paddingRight: '0.4rem',
                    marginBottom: '0.75rem'
                }}>
                    {optionsList.map((opt) => {
                        const isSelected = selectedRenewalClassId === opt.classId;
                        const isOptDisabled = opt.alreadyEnrolled || (opt.availableSlots <= 0);

                        return (
                            <label
                                key={opt.classId}
                                                                style={getOptionBoxStyle(isSelected, isOptDisabled)}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <input
                                            type="radio"
                                            name="renewalModalClassChoice"
                                            checked={isSelected}
                                            disabled={isOptDisabled}
                                            onChange={() => setSelectedRenewalClassId(opt.classId)}
                                        />
                                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: isSelected ? 'var(--primary)' : 'var(--text)' }}>
                                            {opt.className}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                        {opt.isBestMatch && (
                                            <span style={{
                                                padding: '0.2rem 0.55rem',
                                                borderRadius: '9999px',
                                                fontSize: '0.72rem',
                                                fontWeight: 700,
                                                backgroundColor: 'rgba(234, 179, 8, 0.12)',
                                                color: '#ca8a04',
                                                border: '1px solid rgba(234, 179, 8, 0.25)',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.25rem'
                                            }}>
                                                <Sparkles style={{ width: '12px', height: '12px', color: '#eab308' }} />
                                                {t("Best Match - Same Schedule")}
                                            </span>
                                        )}
                                        {opt.alreadyEnrolled && (
                                            <span style={{
                                                padding: '0.2rem 0.5rem',
                                                borderRadius: '9999px',
                                                fontSize: '0.7rem',
                                                fontWeight: 600,
                                                backgroundColor: 'var(--success-soft)',
                                                color: 'var(--success-text)',
                                                border: '1px solid var(--border)'
                                            }}>
                                                {t("Already Enrolled")}
                                            </span>
                                        )}
                                        {!opt.alreadyEnrolled && opt.availableSlots <= 0 && (
                                            <span style={{
                                                padding: '0.2rem 0.5rem',
                                                borderRadius: '9999px',
                                                fontSize: '0.7rem',
                                                fontWeight: 600,
                                                backgroundColor: 'var(--danger-soft)',
                                                color: 'var(--danger-text)'
                                            }}>
                                                {t("Full")}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem 1.25rem', fontSize: '0.78rem', color: 'var(--text-muted)', paddingLeft: '1.4rem' }}>
                                    {renderClassDetail(<User style={{ width: '13px', height: '13px', color: 'var(--primary)' }} />, t("Coach"), `${opt.coachName} • ${opt.roomName}`)}
                                    {renderClassDetail(<Clock style={{ width: '13px', height: '13px', color: '#f59e0b' }} />, t("Schedule"), `${opt.daysOfWeekText || ''} · ${opt.timeSlotText || ''}`)}
                                    {renderClassDetail(<Calendar style={{ width: '13px', height: '13px', color: '#3b82f6' }} />, t("Starts"), displayFormatDateTime(opt.startTime), 'var(--primary)')}
                                    {renderClassDetail(<Users style={{ width: '13px', height: '13px', color: opt.availableSlots > 0 ? '#10b981' : '#ef4444' }} />, t("Availability"), `${opt.availableSlots} / ${opt.maxSlots} ${t("slots left")}`, opt.availableSlots > 0 ? 'var(--success-text)' : 'var(--danger-text)')}
                                </div>

                                {opt.hasConflict && (
                                    <div style={{ paddingLeft: '1.4rem', fontSize: '0.75rem', color: 'var(--danger-text)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                        <AlertTriangle style={{ width: '13px', height: '13px' }} />
                                        <span>{opt.conflictReason}</span>
                                    </div>
                                )}
                            </label>
                        );
                    })}
                </div>

                {/* Khung thanh toán tại quầy - Cố định ở đáy, không bao giờ bị che */}
                <div style={{ flexShrink: 0, backgroundColor: 'var(--surface-hover)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                            {t("Tuition Fee:")} <strong style={{ color: 'var(--text)' }}>{chosenOption?.className || ''}</strong>
                        </span>
                        <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--success-text)' }}>
                            {formatMoney(chosenOption?.price || suggestedClass.price)}
                        </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.45rem', borderTop: '1px dashed var(--border)' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.8rem' }}>{t("Payment method at counter:")}</span>
                        <PaymentMethodSelector paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} />
                    </div>
                </div>

                {/* Nút hành động cố định ở đáy modal */}
                <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.85rem' }}>
                    <button onClick={onClose} disabled={confirming} style={{ padding: '0.55rem 1rem', backgroundColor: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>{t("Cancel")}</button>
                    <button
                        onClick={onConfirm}
                        disabled={confirming || isChosenDisabled}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            padding: '0.55rem 1.25rem',
                            backgroundColor: 'var(--primary)',
                            color: 'var(--on-primary)',
                            border: 'none',
                            borderRadius: '0.5rem',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            cursor: (confirming || isChosenDisabled) ? 'not-allowed' : 'pointer',
                            opacity: isChosenDisabled ? 0.6 : 1
                        }}
                    >
                        {confirming ? <RefreshCw style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 style={{ width: '14px', height: '14px' }} />}
                        <span>{t(confirming ? t('Processing...') : t('Confirm Payment & Enroll'))}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ClassRenewalModal;
