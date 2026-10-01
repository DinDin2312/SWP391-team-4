import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Settings = () => {
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phone: '',
    bio: '',
    loyaltyPoints: 0
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  // Email Update States
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [emailStep, setEmailStep] = useState(1);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:8080/api/v1/user/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfile(res.data);
      } catch (err) {
        console.error("Failed to fetch profile", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      // Copy profile without email, email is handled separately now
      const { email, ...updateData } = profile;
      await axios.put('http://localhost:8080/api/v1/user/profile', updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      window.dispatchEvent(new Event('notificationUpdated'));
      setToastVisible(true);
      setTimeout(() => setToastVisible(false), 3000);
    } catch (err) {
      console.error("Failed to update profile", err);
    } finally {
      setSaving(false);
    }
  };

  const handleSendOtp = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!newEmail || !emailRegex.test(newEmail)) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    try {
      setEmailLoading(true);
      setEmailError('');
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8080/api/v1/user/email-change/send-otp', { newEmail }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmailStep(2);
    } catch (err) {
      setEmailError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    try {
      setEmailLoading(true);
      setEmailError('');
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8080/api/v1/user/email-change/verify', { newEmail, otp }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Success: force logout with notification
      setEmailStep(3); // Hide the form or show a success check
      setToastVisible(true);
      
      setTimeout(() => {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }, 2500);
      
    } catch (err) {
      setEmailError(err.response?.data?.message || 'Invalid OTP');
      setEmailLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-64">
        <div className="text-on-surface-variant flex items-center gap-2 font-semibold">
          <span className="material-symbols-outlined animate-spin">sync</span>
          Loading Profile...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      {/* Sub-header Breadcrumb & Context Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md pb-space-lg">
        <div className="flex flex-col">
          <div className="flex items-center gap-space-xs mb-1">
            <span className="font-label-sm text-[11px] text-tertiary uppercase tracking-widest font-bold">System Configuration</span>
            <span className="w-1.5 h-1.5 rounded-full bg-surface-container-highest"></span>
            <span className="font-label-sm text-[11px] text-on-surface-variant font-bold">UID: {profile.userId ? `NX-0${profile.userId}-VN` : 'NX-88071-VN'}</span>
          </div>
          <h1 className="text-3xl lg:text-4xl text-on-surface tracking-tight font-extrabold mt-2">Personal Profile</h1>
          <p className="text-sm text-on-surface-variant mt-1">Manage athlete profile and personal details.</p>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="w-full bg-surface-container-lowest rounded-xl p-1.5 mb-space-lg shadow-sm flex items-center gap-1 overflow-x-auto">
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all whitespace-nowrap bg-primary-container text-on-primary-container font-semibold shadow-sm">
          <span className="material-symbols-outlined text-[18px]">badge</span>
          <span>Personal Profile</span>
        </button>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg mb-space-xl">
        {/* LEFT COLUMN: Profile & Avatar Summary */}
        <div className="lg:col-span-4 flex flex-col gap-space-lg">
          <div className="bg-surface-container-low rounded-xl p-space-lg shadow-sm flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-tertiary/10 blur-2xl pointer-events-none"></div>
            
            <div className="relative mb-space-md">
              <div className="w-24 h-24 rounded-full bg-secondary-container text-on-secondary-container text-3xl flex items-center justify-center font-bold shadow-lg">
                {profile.fullName ? profile.fullName.substring(0, 2).toUpperCase() : 'U'}
              </div>
              <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center hover:bg-inverse-primary hover:text-surface transition-all shadow-md" title="Upload new photo">
                <span className="material-symbols-outlined text-[16px]">photo_camera</span>
              </button>
            </div>
            
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-tertiary/15 text-tertiary text-[10px] mb-2 font-bold tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse"></span>
              <span>VERIFIED ATHLETE</span>
            </div>
            
            <h3 className="text-xl text-on-surface font-bold">{profile.fullName || 'User'}</h3>
            <p className="text-xs text-on-surface-variant mb-space-md mt-1">{profile.email}</p>
            
            {/* Mini Telemetry Strip */}
            <div className="w-full grid grid-cols-2 gap-2 p-3 rounded-lg bg-surface-container text-left border border-surface-container-high">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-on-surface-variant uppercase">Nexus Points</span>
                <span className="text-lg text-primary font-extrabold">{profile.loyaltyPoints || 0}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-on-surface-variant uppercase">Status</span>
                <span className="text-sm mt-1 text-emerald-400 font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Edit Forms */}
        <div className="lg:col-span-8 flex flex-col gap-space-lg">
          <div className="bg-surface-container-low rounded-xl p-space-lg shadow-sm">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-surface-container">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[20px]">person</span>
                </div>
                <div>
                  <h2 className="text-lg text-on-surface font-bold">Personal Details</h2>
                  <p className="text-xs text-on-surface-variant mt-0.5">Manage your core identity</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface-variant">Full Legal Name</label>
                <div className="relative">
                  <input 
                    name="fullName"
                    value={profile.fullName || ''}
                    onChange={handleChange}
                    className="w-full bg-surface-container-lowest text-on-surface text-sm font-medium rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-primary shadow-sm border border-transparent focus:border-primary/50 transition-colors" 
                    type="text" 
                    placeholder="Enter your full name"
                  />
                  <span className="material-symbols-outlined absolute right-3 top-3 text-on-surface-variant text-[18px]">badge</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface-variant flex justify-between items-center">
                  Linked Email Address
                  {!showEmailModal && (
                    <button onClick={() => setShowEmailModal(true)} className="text-xs text-primary font-bold hover:underline">Change Email</button>
                  )}
                </label>
                
                {showEmailModal ? (
                  <div className="p-4 rounded-lg bg-surface-container border border-primary/30 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-on-surface">Update Email</span>
                      <button onClick={() => {setShowEmailModal(false); setEmailStep(1);}} className="text-xs text-on-surface-variant hover:text-on-surface"><span className="material-symbols-outlined text-[16px]">close</span></button>
                    </div>
                    {emailError && <div className="text-xs text-rose-400 bg-rose-500/10 p-2 rounded">{emailError}</div>}
                    
                    {emailStep === 1 && (
                      <>
                        <input 
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          placeholder="Enter new email address"
                          className="w-full bg-surface-container-lowest text-on-surface text-sm font-medium rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary shadow-sm" 
                          type="email" 
                        />
                        <button onClick={handleSendOtp} disabled={emailLoading || !newEmail} className="mt-1 w-full py-2 rounded bg-primary text-on-primary text-xs font-bold disabled:opacity-50">
                          {emailLoading ? 'Sending...' : 'Send Verification OTP'}
                        </button>
                      </>
                    )}
                    
                    {emailStep === 2 && (
                      <>
                        <p className="text-xs text-on-surface-variant">Enter the 6-digit code sent to {newEmail}</p>
                        <input 
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          placeholder="000000"
                          className="w-full bg-surface-container-lowest text-on-surface text-center tracking-widest text-lg font-bold rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary shadow-sm" 
                          type="text"
                          maxLength={6} 
                        />
                        <button onClick={handleVerifyOtp} disabled={emailLoading || otp.length < 6} className="mt-1 w-full py-2 rounded bg-emerald-500 text-white text-xs font-bold disabled:opacity-50">
                          {emailLoading ? 'Verifying...' : 'Verify & Change'}
                        </button>
                      </>
                    )}

                    {emailStep === 3 && (
                      <div className="flex flex-col items-center justify-center p-4 text-center">
                        <span className="material-symbols-outlined text-4xl text-emerald-500 mb-2">check_circle</span>
                        <span className="text-sm font-bold text-on-surface">Email Updated!</span>
                        <span className="text-xs text-on-surface-variant mt-1">Logging you out for security...</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative">
                    <input 
                      value={profile.email || ''}
                      disabled
                      className="w-full bg-surface-container text-on-surface-variant text-sm font-medium rounded-lg px-4 py-3 cursor-not-allowed border border-surface-container-high" 
                      type="email" 
                    />
                    <span className="material-symbols-outlined absolute right-3 top-3 text-primary text-[18px]">mail</span>
                  </div>
                )}
                <p className="text-[11px] text-on-surface-variant flex items-center gap-1 mt-1">
                  <span className="material-symbols-outlined text-[12px]">security</span>
                  Email updates require OTP verification. Changing it will log you out.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface-variant">Phone Number</label>
                <div className="relative">
                  <input 
                    name="phone"
                    value={profile.phone || ''}
                    onChange={handleChange}
                    className="w-full bg-surface-container-lowest text-on-surface text-sm font-medium rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-primary shadow-sm border border-transparent focus:border-primary/50 transition-colors" 
                    type="tel" 
                    placeholder="Enter phone number"
                  />
                  <span className="material-symbols-outlined absolute right-3 top-3 text-on-surface-variant text-[18px]">phone_iphone</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Floating / Fixed Action Bar */}
      <div className="sticky bottom-6 z-30 w-full p-4 rounded-xl bg-surface-container-high/90 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-surface-container-highest">
        <div className="flex items-center gap-2 text-on-surface-variant hidden sm:flex">
          <span className="material-symbols-outlined text-tertiary text-[20px]">info</span>
          <span className="text-xs">Your profile data is encrypted.</span>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-highest transition-all text-sm font-semibold" type="button">
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="w-full sm:w-auto px-8 py-2.5 rounded-lg bg-primary-container text-on-primary-container hover:bg-inverse-primary hover:text-surface transition-all text-sm font-bold flex items-center justify-center gap-2 shadow-md active:scale-95 disabled:opacity-50" 
            type="button"
          >
            {saving ? (
              <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
            ) : (
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
            )}
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Toast Notification Modal */}
      <div className={`fixed bottom-24 right-8 z-50 transform transition-all duration-300 flex items-center gap-3 px-6 py-4 rounded-xl bg-surface-container-highest text-on-surface shadow-2xl border border-surface-container/50 ${toastVisible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0 pointer-events-none"}`}>
        <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center">
          <span className="material-symbols-outlined text-[18px]">done_all</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-on-surface">Saved Successfully!</span>
          <span className="text-xs text-on-surface-variant">Your profile has been updated.</span>
        </div>
      </div>
    </div>
  );
};

export default Settings;
