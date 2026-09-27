import React, { useState } from 'react';
import { UserPlus, User, Mail, Phone, Lock, FileText, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import receptionistService from '../services/receptionistService';

export default function RegisterMemberView({ onSuccess }) {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        defaultPassword: '',
        bio: ''
    });

    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setFeedback(null);

        try {
            await receptionistService.registerMember(formData);
            setFeedback({ type: 'success', message: 'New member account created successfully!' });
            setFormData({
                fullName: '',
                email: '',
                phone: '',
                defaultPassword: '',
                bio: ''
            });
            if (onSuccess) {
                setTimeout(onSuccess, 1200);
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.response?.data || 'Failed to register new member.';
            setFeedback({ type: 'error', message: errorMsg });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '2rem 1.5rem' }}>
            <div style={{
                backgroundColor: '#0a1120',
                border: '1px solid #1e293b',
                borderRadius: '1.25rem',
                padding: '2rem',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)'
            }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.5rem', borderBottom: '1px solid #1e293b', paddingBottom: '1.25rem' }}>
                    <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '0.75rem',
                        backgroundColor: 'rgba(56, 189, 248, 0.15)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#38bdf8'
                    }}>
                        <UserPlus style={{ width: '22px', height: '22px' }} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>Register New Member</h2>
                        <p style={{ margin: '0.2rem 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
                            Create an account for walk-in customers directly at the front desk.
                        </p>
                    </div>
                </div>

                {/* Feedback Alert */}
                {feedback && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        padding: '0.85rem 1rem',
                        borderRadius: '0.75rem',
                        marginBottom: '1.5rem',
                        backgroundColor: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        border: `1px solid ${feedback.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                        color: feedback.type === 'success' ? '#34d399' : '#f87171',
                        fontSize: '0.875rem'
                    }}>
                        {feedback.type === 'success' ? <CheckCircle2 style={{ width: '18px', height: '18px', flexShrink: 0 }} /> : <AlertCircle style={{ width: '18px', height: '18px', flexShrink: 0 }} />}
                        <span>{feedback.message}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {/* Full Name */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                            Full Name *
                        </label>
                        <div style={{ position: 'relative' }}>
                            <User style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#64748b' }} />
                            <input
                                type="text"
                                name="fullName"
                                required
                                placeholder="e.g. John Doe"
                                value={formData.fullName}
                                onChange={handleChange}
                                style={{
                                    width: '100%',
                                    backgroundColor: '#060b17',
                                    border: '1px solid #1e293b',
                                    borderRadius: '0.65rem',
                                    padding: '0.75rem 1rem 0.75rem 2.5rem',
                                    color: '#f8fafc',
                                    fontSize: '0.875rem',
                                    outline: 'none'
                                }}
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                            Email Address *
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Mail style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#64748b' }} />
                            <input
                                type="email"
                                name="email"
                                required
                                placeholder="member@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                style={{
                                    width: '100%',
                                    backgroundColor: '#060b17',
                                    border: '1px solid #1e293b',
                                    borderRadius: '0.65rem',
                                    padding: '0.75rem 1rem 0.75rem 2.5rem',
                                    color: '#f8fafc',
                                    fontSize: '0.875rem',
                                    outline: 'none'
                                }}
                            />
                        </div>
                    </div>

                    {/* Phone */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                            Phone Number *
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Phone style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#64748b' }} />
                            <input
                                type="tel"
                                name="phone"
                                required
                                placeholder="09xxxxxxxx"
                                value={formData.phone}
                                onChange={handleChange}
                                style={{
                                    width: '100%',
                                    backgroundColor: '#060b17',
                                    border: '1px solid #1e293b',
                                    borderRadius: '0.65rem',
                                    padding: '0.75rem 1rem 0.75rem 2.5rem',
                                    color: '#f8fafc',
                                    fontSize: '0.875rem',
                                    outline: 'none'
                                }}
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                            Default Password *
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Lock style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#64748b' }} />
                            <input
                                type="password"
                                name="defaultPassword"
                                required
                                placeholder="Create initial password for member"
                                value={formData.defaultPassword}
                                onChange={handleChange}
                                style={{
                                    width: '100%',
                                    backgroundColor: '#060b17',
                                    border: '1px solid #1e293b',
                                    borderRadius: '0.65rem',
                                    padding: '0.75rem 1rem 0.75rem 2.5rem',
                                    color: '#f8fafc',
                                    fontSize: '0.875rem',
                                    outline: 'none'
                                }}
                            />
                        </div>
                    </div>

                    {/* Bio / Medical Notes */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                            Notes / Sports Interests (Optional)
                        </label>
                        <div style={{ position: 'relative' }}>
                            <FileText style={{ position: 'absolute', left: '0.85rem', top: '0.85rem', width: '16px', height: '16px', color: '#64748b' }} />
                            <textarea
                                name="bio"
                                rows={3}
                                placeholder="e.g. Interested in Basketball & Badminton classes..."
                                value={formData.bio}
                                onChange={handleChange}
                                style={{
                                    width: '100%',
                                    backgroundColor: '#060b17',
                                    border: '1px solid #1e293b',
                                    borderRadius: '0.65rem',
                                    padding: '0.75rem 1rem 0.75rem 2.5rem',
                                    color: '#f8fafc',
                                    fontSize: '0.875rem',
                                    outline: 'none',
                                    resize: 'vertical'
                                }}
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            marginTop: '0.5rem',
                            padding: '0.85rem',
                            backgroundColor: '#2563eb',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '0.75rem',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1,
                            transition: 'background-color 0.2s'
                        }}
                    >
                        {loading ? <RefreshCw style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} /> : <UserPlus style={{ width: '16px', height: '16px' }} />}
                        <span>{loading ? 'Registering...' : 'Complete Registration'}</span>
                    </button>
                </form>
            </div>
        </div>
    );
}