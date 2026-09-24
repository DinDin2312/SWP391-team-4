import React from 'react';

const Settings = () => {
  return (
    <>
      <div className="flex flex-col w-full">
    {/* Sub-header Breadcrumb & Context Banner */}
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md pb-space-lg">
        <div className="flex flex-col">
            <div className="flex items-center gap-space-xs mb-1">
                <span className="font-label-sm text-label-sm text-tertiary uppercase tracking-widest font-bold">System Configuration</span>
                <span className="w-1.5 h-1.5 rounded-full bg-surface-container-highest"></span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">UID: NX-88071-VN</span>
            </div>
            <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">Account Settings &amp; Preferences</h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">Manage athlete profile, biometric baselines, and connected sports sensor telemetry.</p>
        </div>
        {/* Quick Status Pill & Sync State */}
        <div className="flex items-center gap-space-sm self-start md:self-auto">
            <div className="flex items-center gap-space-xs px-space-md py-2 rounded-lg bg-surface-container-low shadow-sm">
                <span className="material-symbols-outlined text-[18px] text-tertiary animate-spin" style={{ animationDuration: '4s' }}>sync</span>
                <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Cloud Sensors</span>
                    <span className="font-label-md text-label-md text-on-surface font-semibold">Synced: Today at 16:42</span>
                </div>
            </div>
            <button className="flex items-center gap-1.5 px-space-md py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-fixed-dim transition-all shadow-md">
                <span className="material-symbols-outlined text-[18px]">cloud_done</span>
                <span>Backup Now</span>
            </button>
        </div>
    </div>
    {/* Main Navigation Tabs */}
    <div className="w-full bg-surface-container-lowest rounded-xl p-1.5 mb-space-lg shadow-sm">
        <div className="flex items-center gap-1 overflow-x-auto" id="settings-tab-nav">
            <button className="tab-btn flex items-center gap-space-xs px-space-md py-2 rounded-lg font-label-md text-label-md transition-all whitespace-nowrap bg-primary-container text-on-primary-container font-semibold shadow-sm" data-target="profile" onclick="switchTab('profile')">
                <span className="material-symbols-outlined text-[18px]">badge</span>
                <span>Personal Profile</span>
            </button>
            <button className="tab-btn flex items-center gap-space-xs px-space-md py-2 rounded-lg font-label-md text-label-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all whitespace-nowrap" data-target="biometrics" onclick="switchTab('biometrics')">
                <span className="material-symbols-outlined text-[18px]">vital_signs</span>
                <span>Biometrics &amp; Fitness</span>
            </button>
            <button className="tab-btn flex items-center gap-space-xs px-space-md py-2 rounded-lg font-label-md text-label-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all whitespace-nowrap" data-target="devices" onclick="switchTab('devices')">
                <span className="material-symbols-outlined text-[18px]">watch</span>
                <span>Wearables &amp; IoT</span>
                <span className="w-2 h-2 rounded-full bg-tertiary"></span>
            </button>
            <button className="tab-btn flex items-center gap-space-xs px-space-md py-2 rounded-lg font-label-md text-label-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all whitespace-nowrap" data-target="security" onclick="switchTab('security')">
                <span className="material-symbols-outlined text-[18px]">security</span>
                <span>Security &amp; 2FA</span>
            </button>
            <button className="tab-btn flex items-center gap-space-xs px-space-md py-2 rounded-lg font-label-md text-label-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all whitespace-nowrap" data-target="billing" onclick="switchTab('billing')">
                <span className="material-symbols-outlined text-[18px]">credit_card</span>
                <span>Billing &amp; Invoices</span>
            </button>
            <button className="tab-btn flex items-center gap-space-xs px-space-md py-2 rounded-lg font-label-md text-label-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all whitespace-nowrap" data-target="notifications" onclick="switchTab('notifications')">
                <span className="material-symbols-outlined text-[18px]">tune</span>
                <span>Notification Preferences</span>
            </button>
        </div>
    </div>
    {/* Bento Grid Form Content Container */}
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg mb-space-xl">
        {/* LEFT COLUMN: Profile & Avatar Summary (4 cols on lg) */}
        <div className="lg:col-span-4 flex flex-col gap-space-lg">
            {/* Athlete Persona Card */}
            <div className="bg-surface-container-low rounded-xl p-space-lg shadow-sm flex flex-col items-center text-center relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-tertiary/10 blur-2xl pointer-events-none"></div>
                <div className="relative mb-space-md">
                    <div className="w-24 h-24 rounded-full bg-secondary-container text-on-secondary-container font-headline-xl text-headline-xl flex items-center justify-center font-bold shadow-lg">
                        AM
                    </div>
                    <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center hover:bg-inverse-primary hover:text-surface transition-all shadow-md" title="Upload new photo">
                        <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                    </button>
                </div>
                <div className="flex items-center gap-1.5 px-space-sm py-0.5 rounded-full bg-tertiary/15 text-tertiary font-label-sm text-label-sm mb-2 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse"></span>
                    <span>PRO ATHLETE TIER 1</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-on-surface font-semibold">Alex Morgan</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md">Member since October 2023</p>
                {/* Mini Telemetry Strip */}
                <div className="w-full grid grid-cols-3 gap-2 p-space-sm rounded-lg bg-surface-container mb-space-md text-left">
                    <div className="flex flex-col">
                        <span className="font-label-sm text-label-sm text-on-surface-variant">Sessions</span>
                        <span className="font-headline-sm text-headline-sm text-on-surface font-bold">142</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="font-label-sm text-label-sm text-on-surface-variant">VO2 Max</span>
                        <span className="font-headline-sm text-headline-sm text-tertiary font-bold">54.8</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="font-label-sm text-label-sm text-on-surface-variant">Nexus Points</span>
                        <span className="font-headline-sm text-headline-sm text-primary font-bold">2,840</span>
                    </div>
                </div>
                <div className="w-full flex flex-col gap-1 text-left pt-space-xs">
                    <div className="flex items-center justify-between text-body-sm">
                        <span className="text-on-surface-variant">NFC Pass Status</span>
                        <span className="font-label-md text-label-md text-primary font-semibold flex items-center gap-1">
<span className="material-symbols-outlined text-[16px]">contactless</span> Active
            </span>
                    </div>
                    <div className="flex items-center justify-between text-body-sm">
                        <span className="text-on-surface-variant">Smart Locker</span>
                        <span className="font-label-md text-label-md text-on-surface font-semibold">Unit #LK-402</span>
                    </div>
                </div>
            </div>
            {/* Quick Switch Branch & Access Badge */}
            <div className="bg-surface-container-low rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-space-xs text-on-surface font-headline-sm text-headline-sm">
                        <span className="material-symbols-outlined text-[20px] text-tertiary">domain</span>
                        <span>Primary Facility</span>
                    </div>
                    <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container text-tertiary font-semibold uppercase">Default</span>
                </div>
                <div className="p-space-md rounded-lg bg-surface-container flex flex-col gap-1.5">
                    <span className="font-label-lg text-label-lg text-on-surface font-semibold">NEXUS Landmark Center</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">Smart Sports Complex, Level 4, Landmark, Ho Chi Minh City</span>
                    <div className="flex items-center gap-2 mt-2 pt-2 text-on-surface-variant font-label-sm text-label-sm">
                        <span className="flex items-center gap-1 text-primary"><span className="material-symbols-outlined text-[14px]">bolt</span> Cryo Station • Available</span>
                        <span>•</span>
                        <span className="text-on-surface-variant">6 Pickleball Courts</span>
                    </div>
                </div>
                <button className="w-full py-2.5 rounded-lg bg-surface-container-high text-on-surface font-label-md text-label-md hover:bg-surface-container-highest transition-all flex items-center justify-center gap-space-xs">
                    <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
                    <span>Switch Training Facility</span>
                </button>
            </div>
            {/* Smart Locker Keycard Preview */}
            <div className="bg-surface-container-low rounded-xl p-space-lg shadow-sm flex flex-col gap-space-sm relative overflow-hidden">
                <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">RFID Smart Locker</span>
                    <span className="material-symbols-outlined text-primary text-[20px]">lock</span>
                </div>
                <div className="flex items-baseline gap-space-sm mt-1">
                    <span className="font-headline-xl text-headline-xl text-on-surface font-bold tracking-tight">LK-402</span>
                    <span className="font-label-md text-label-md text-tertiary">Zone B - Men Pro</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Unlocks automatically when bringing your Apple Watch or Nexus App within 10cm.</p>
                <div className="pt-space-xs">
                    <button className="w-full py-2 px-space-md rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-label-md text-label-md transition-all flex items-center justify-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">lock_reset</span>
                        <span>Generate Emergency PIN</span>
                    </button>
                </div>
            </div>
        </div>
        {/* RIGHT COLUMN: Detailed Settings Form Blocks (8 cols on lg) */}
        <div className="lg:col-span-8 flex flex-col gap-space-lg">
            {/* SECTION 1: Personal Profile Form */}
            <div className="bg-surface-container-low rounded-xl p-space-lg shadow-sm">
                <div className="flex items-center justify-between pb-space-md mb-space-md">
                    <div className="flex items-center gap-space-xs">
                        <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-[20px]">person</span>
                        </div>
                        <div>
                            <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Personal Profile Details</h2>
                            <p className="font-body-sm text-body-sm text-on-surface-variant">Information displayed on athlete leaderboards and membership agreements</p>
                        </div>
                    </div>
                    <span className="px-space-xs py-1 rounded bg-surface-container text-tertiary font-label-sm text-label-sm font-semibold">Verified</span>
                </div>
                <form className="grid grid-cols-1 md:grid-cols-2 gap-space-md" onsubmit="event.preventDefault();">
                    <div className="flex flex-col gap-1.5">
                        <label className="font-label-md text-label-md text-on-surface-variant">Full Legal Name</label>
                        <div className="relative">
                            <input className="w-full bg-surface-container-lowest text-on-surface font-body-md text-body-md rounded-lg px-space-md py-2.5 focus:outline-none focus:ring-1 focus:ring-primary shadow-sm" type="text" value="Alex Morgan"/>
                            <span className="material-symbols-outlined absolute right-3 top-2.5 text-on-surface-variant text-[18px]">verified</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="font-label-md text-label-md text-on-surface-variant">Linked Email Address</label>
                        <div className="relative">
                            <input className="w-full bg-surface-container-lowest text-on-surface font-body-md text-body-md rounded-lg px-space-md py-2.5 focus:outline-none focus:ring-1 focus:ring-primary shadow-sm" type="email" value="alex.morgan@nexussports.io"/>
                            <span className="material-symbols-outlined absolute right-3 top-2.5 text-primary text-[18px]">mail</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="font-label-md text-label-md text-on-surface-variant">Mobile Phone Number</label>
                        <div className="relative">
                            <input className="w-full bg-surface-container-lowest text-on-surface font-body-md text-body-md rounded-lg px-space-md py-2.5 focus:outline-none focus:ring-1 focus:ring-primary shadow-sm" type="tel" value="+84 912 345 678"/>
                            <span className="material-symbols-outlined absolute right-3 top-2.5 text-on-surface-variant text-[18px]">call</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="font-label-md text-label-md text-on-surface-variant">Date of Birth (YYYY-MM-DD)</label>
                        <input className="w-full bg-surface-container-lowest text-on-surface font-body-md text-body-md rounded-lg px-space-md py-2.5 focus:outline-none focus:ring-1 focus:ring-primary shadow-sm" type="date" value="1996-07-02"/>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="font-label-md text-label-md text-on-surface-variant">Gender</label>
                        <select className="w-full bg-surface-container-lowest text-on-surface font-body-md text-body-md rounded-lg px-space-md py-2.5 focus:outline-none focus:ring-1 focus:ring-primary shadow-sm">
                            <option selected="" value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other / Non-binary</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="font-label-md text-label-md text-on-surface-variant">System Display Language</label>
                        <select className="w-full bg-surface-container-lowest text-on-surface font-body-md text-body-md rounded-lg px-space-md py-2.5 focus:outline-none focus:ring-1 focus:ring-primary shadow-sm">
                            <option selected="" value="en">English (US - Default)</option>
                            <option value="vi">Tiếng Việt</option>
                        </select>
                    </div>
                </form>
            </div>
            {/* SECTION 2: Biometric & Athletic Baseline */}
            <div className="bg-surface-container-low rounded-xl p-space-lg shadow-sm">
                <div className="flex items-center justify-between pb-space-md mb-space-md">
                    <div className="flex items-center gap-space-xs">
                        <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-tertiary">
                            <span className="material-symbols-outlined text-[20px]">cardiology</span>
                        </div>
                        <div>
                            <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Biometric Baselines &amp; Physiological Metrics</h2>
                            <p className="font-body-sm text-body-sm text-on-surface-variant">Protected health data adhering to HIPAA compliance via NEXUS Lab</p>
                        </div>
                    </div>
                    <button className="px-space-sm py-1 rounded bg-surface-container text-primary font-label-sm text-label-sm hover:bg-surface-container-high transition-all flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">history</span>
                        <span>InBody History</span>
                    </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-space-md mb-space-md">
                    <div className="p-space-md rounded-lg bg-surface-container-lowest flex flex-col justify-between">
                        <span className="font-label-sm text-label-sm text-on-surface-variant">Current Height</span>
                        <div className="flex items-baseline gap-1 my-1">
                            <input className="w-16 bg-transparent font-headline-md text-headline-md text-on-surface font-bold focus:outline-none" type="number" value="182"/>
                            <span className="font-body-sm text-body-sm text-on-surface-variant">cm</span>
                        </div>
                        <span className="font-label-sm text-label-sm text-tertiary">Tested: Sep 15, 2024</span>
                    </div>
                    <div className="p-space-md rounded-lg bg-surface-container-lowest flex flex-col justify-between">
                        <span className="font-label-sm text-label-sm text-on-surface-variant">Target Weight</span>
                        <div className="flex items-baseline gap-1 my-1">
                            <input className="w-16 bg-transparent font-headline-md text-headline-md text-on-surface font-bold focus:outline-none" step="0.5" type="number" value="76.5"/>
                            <span className="font-body-sm text-body-sm text-on-surface-variant">kg</span>
                        </div>
                        <span className="font-label-sm text-label-sm text-primary">Current: 78.2 kg</span>
                    </div>
                    <div className="p-space-md rounded-lg bg-surface-container-lowest flex flex-col justify-between">
                        <span className="font-label-sm text-label-sm text-on-surface-variant">Blood Type</span>
                        <div className="flex items-baseline gap-1 my-1">
                            <select className="bg-transparent font-headline-md text-headline-md text-on-surface font-bold focus:outline-none cursor-pointer">
                                <option className="bg-surface-container" selected="" value="O+">O+</option>
                                <option className="bg-surface-container" value="A+">A+</option>
                                <option className="bg-surface-container" value="B+">B+</option>
                                <option className="bg-surface-container" value="AB+">AB+</option>
                            </select>
                        </div>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">Clinically Verified</span>
                    </div>
                    <div className="p-space-md rounded-lg bg-surface-container-lowest flex flex-col justify-between">
                        <span className="font-label-sm text-label-sm text-on-surface-variant">Resting Heart Rate</span>
                        <div className="flex items-baseline gap-1 my-1">
                            <span className="font-headline-md text-headline-md text-tertiary font-bold">48</span>
                            <span className="font-body-sm text-body-sm text-on-surface-variant">BPM</span>
                        </div>
                        <span className="font-label-sm text-label-sm text-tertiary">Elite Athlete Tier</span>
                    </div>
                </div>
                {/* Emergency Contact Module */}
                <div className="p-space-md rounded-lg bg-surface-container flex flex-col md:flex-row md:items-center justify-between gap-space-md">
                    <div className="flex items-center gap-space-md">
                        <div className="w-10 h-10 rounded-full bg-error-container text-on-error-container flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-[20px]">emergency</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="font-label-md text-label-md text-on-surface font-semibold">Emergency Contact (Head Coach • Personal Trainer)</span>
                            <span className="font-body-sm text-body-sm text-on-surface-variant">Coach Mai Anh Tran • +84 988 765 432 (Head of Lab Recovery)</span>
                        </div>
                    </div>
                    <button className="px-space-md py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-md text-label-md transition-all self-start md:self-auto shrink-0">
                        Edit Contact
                    </button>
                </div>
            </div>
            {/* SECTION 3: Connected IoT & Wearables */}
            <div className="bg-surface-container-low rounded-xl p-space-lg shadow-sm">
                <div className="flex items-center justify-between pb-space-md mb-space-md">
                    <div className="flex items-center gap-space-xs">
                        <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-[20px]">hub</span>
                        </div>
                        <div>
                            <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Wearable Devices &amp; Smart Court IoT</h2>
                            <p className="font-body-sm text-body-sm text-on-surface-variant">Live telemetry stream to fitness floor displays and Smart Courts</p>
                        </div>
                    </div>
                    <span className="flex items-center gap-1 font-label-sm text-label-sm text-tertiary">
<span className="w-2 h-2 rounded-full bg-tertiary animate-ping"></span>
            2 Devices Online
          </span>
                </div>
                <div className="flex flex-col gap-space-sm">
                    {/* Device Row 1: Apple Watch */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-space-md rounded-lg bg-surface-container-lowest gap-space-md">
                        <div className="flex items-center gap-space-md">
                            <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary shrink-0">
                                <span className="material-symbols-outlined text-[24px]">watch</span>
                            </div>
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                    <span className="font-label-lg text-label-lg text-on-surface font-semibold">Apple Watch Ultra 2</span>
                                    <span className="px-2 py-0.5 rounded text-tertiary bg-tertiary/10 font-label-sm text-label-sm font-semibold">CONNECTED</span>
                                </div>
                                <span className="font-body-sm text-body-sm text-on-surface-variant">Apple HealthKit • Streaming heart rate, VO2 max, and active training load</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-space-sm self-end sm:self-center">
                            <span className="font-label-sm text-label-sm text-on-surface-variant">Battery: 89%</span>
                            <button className="px-space-md py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-all">
                                Sync Now
                            </button>
                        </div>
                    </div>
                    {/* Device Row 2: Garmin Connect / Whoop */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-space-md rounded-lg bg-surface-container-lowest gap-space-md">
                        <div className="flex items-center gap-space-md">
                            <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-tertiary shrink-0">
                                <span className="material-symbols-outlined text-[24px]">vital_signs</span>
                            </div>
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                    <span className="font-label-lg text-label-lg text-on-surface font-semibold">Whoop 4.0 Strap</span>
                                    <span className="px-2 py-0.5 rounded text-primary bg-primary/10 font-label-sm text-label-sm font-semibold">STREAMING</span>
                                </div>
                                <span className="font-body-sm text-body-sm text-on-surface-variant">Real-time Recovery Score &amp; Autonomic Nervous System Strain</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-space-sm self-end sm:self-center">
                            <span className="font-label-sm text-label-sm text-on-surface-variant">Latency: 12ms</span>
                            <button className="px-space-md py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-all">
                                Configure
                            </button>
                        </div>
                    </div>
                    {/* Device Row 3: Polar H10 Chest Strap */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-space-md rounded-lg bg-surface-container-lowest gap-space-md opacity-75">
                        <div className="flex items-center gap-space-md">
                            <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-on-surface-variant shrink-0">
                                <span className="material-symbols-outlined text-[24px]">bluetooth_searching</span>
                            </div>
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                    <span className="font-label-lg text-label-lg text-on-surface font-semibold">Polar H10 Chest Strap</span>
                                    <span className="px-2 py-0.5 rounded text-on-surface-variant bg-surface-container font-label-sm text-label-sm">OFFLINE</span>
                                </div>
                                <span className="font-body-sm text-body-sm text-on-surface-variant">ECG peak heart rate monitoring during anaerobic HIIT sets</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-space-sm self-end sm:self-center">
                            <button className="px-space-md py-1.5 rounded-lg bg-primary-container text-on-primary-container font-label-md text-label-md hover:bg-inverse-primary hover:text-surface transition-all">
                                Reconnect
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {/* SECTION 4: Security & Two-Factor Authentication (2FA) */}
            <div className="bg-surface-container-low rounded-xl p-space-lg shadow-sm">
                <div className="flex items-center justify-between pb-space-md mb-space-md">
                    <div className="flex items-center gap-space-xs">
                        <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-[20px]">lock_person</span>
                        </div>
                        <div>
                            <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Account Security &amp; Sign-In</h2>
                            <p className="font-body-sm text-body-sm text-on-surface-variant">Manage active sessions and facility gate encryption keys</p>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-space-md">
                    {/* Password update trigger */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-space-md rounded-lg bg-surface-container-lowest gap-space-sm">
                        <div className="flex items-center gap-space-md">
                            <span className="material-symbols-outlined text-[24px] text-on-surface-variant">password</span>
                            <div className="flex flex-col">
                                <span className="font-label-lg text-label-lg text-on-surface font-semibold">Account Password</span>
                                <span className="font-body-sm text-body-sm text-on-surface-variant">Last changed 42 days ago • High strength</span>
                            </div>
                        </div>
                        <button className="px-space-md py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-all self-start sm:self-auto">
                            Change Password
                        </button>
                    </div>
                    {/* 2FA Authenticator */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-space-md rounded-lg bg-surface-container-lowest gap-space-sm">
                        <div className="flex items-center gap-space-md">
                            <span className="material-symbols-outlined text-[24px] text-tertiary">shield</span>
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                    <span className="font-label-lg text-label-lg text-on-surface font-semibold">Two-Factor Authentication (2FA) via Authenticator App</span>
                                    <span className="px-2 py-0.5 rounded text-tertiary bg-tertiary/10 font-label-sm text-label-sm font-semibold">ENABLED</span>
                                </div>
                                <span className="font-body-sm text-body-sm text-on-surface-variant">Protects court bookings and specialized recovery session payments</span>
                            </div>
                        </div>
                        <button className="px-space-md py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-all self-start sm:self-auto">
                            Reconfigure
                        </button>
                    </div>
                    {/* Active Sessions List */}
                    <div className="p-space-md rounded-lg bg-surface-container flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <span className="font-label-md text-label-md text-on-surface font-semibold">Active Signed-In Devices</span>
                            <button className="font-label-sm text-label-sm text-primary hover:underline">Sign out of all other sessions</button>
                        </div>
                        <div className="flex items-center justify-between text-body-sm py-1.5">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px] text-primary">laptop_mac</span>
                                <span className="text-on-surface">MacBook Pro 16" • Chrome • Ho Chi Minh City</span>
                            </div>
                            <span className="font-label-sm text-label-sm text-tertiary font-medium">Current Session</span>
                        </div>
                        <div className="flex items-center justify-between text-body-sm py-1.5 opacity-80">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">smartphone</span>
                                <span className="text-on-surface">iPhone 15 Pro • Nexus iOS App</span>
                            </div>
                            <span className="font-label-sm text-label-sm text-on-surface-variant">Active 12 mins ago</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    {/* Bottom Floating / Fixed Action Bar */}
    <div className="sticky bottom-6 z-30 w-full p-space-md rounded-xl bg-surface-container-high/90 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-space-md">
        <div className="flex items-center gap-space-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-tertiary text-[20px]">info</span>
            <span className="font-body-sm text-body-sm">Changes to phone numbers and email addresses require OTP verification to take effect.</span>
        </div>
        <div className="flex items-center gap-space-sm w-full sm:w-auto justify-end">
            <button className="w-full sm:w-auto px-space-lg py-2.5 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-highest transition-all font-label-md text-label-md" type="button">
                Cancel
            </button>
            <button className="w-full sm:w-auto px-space-xl py-2.5 rounded-lg bg-primary-container text-on-primary-container hover:bg-inverse-primary hover:text-surface transition-all font-label-md text-label-md font-semibold flex items-center justify-center gap-2 shadow-md" id="save-settings-btn" type="button">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                <span>Save Changes</span>
            </button>
        </div>
    </div>
    {/* Toast Notification Modal (Micro-interaction) */}
    <div className="fixed bottom-24 right-8 z-50 transform translate-y-12 opacity-0 pointer-events-none transition-all duration-300 flex items-center gap-space-sm px-space-lg py-space-md rounded-xl bg-surface-container-highest text-on-surface shadow-2xl" id="save-toast">
        <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">done_all</span>
        </div>
        <div className="flex flex-col">
            <span className="font-label-md text-label-md font-bold text-on-surface">Saved Successfully!</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">All profile configurations and devices are now synced.</span>
        </div>
    </div>
</div>
    
    </>
  );
};

export default Settings;
