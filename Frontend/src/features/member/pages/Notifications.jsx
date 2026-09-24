import React from 'react';

const Notifications = () => {
  return (
    <>
      <div className="flex flex-col w-full pb-space-xl">
    {/* Dynamic Atmospheric Glow */}
    <div className="relative w-full">
        <div className="absolute -top-10 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10"></div>
        <div className="absolute top-20 right-10 w-80 h-80 bg-tertiary/10 rounded-full blur-3xl pointer-events-none -z-10"></div>
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md py-space-lg">
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-space-xs text-primary font-label-sm uppercase tracking-widest">
                    <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
                    <span>Telemetry &amp; Notification Control Center</span>
                </div>
                <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight flex items-center gap-space-sm">
                    Notifications &amp; Alerts
                    <span className="px-space-xs py-0.5 rounded-full bg-primary-container text-on-primary-container font-label-sm text-label-sm font-semibold">12 NEW</span>
                </h1>
                <p className="font-body-md text-body-md text-on-surface-variant">
                    Real-time updates on class schedules, membership status, biometric insights, and facility operations.
                </p>
            </div>
            {/* Global Actions */}
            <div className="flex items-center gap-space-sm flex-wrap">
                <button className="flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-label-md font-label-md transition-all shadow-sm" id="mark-all-read">
                    <span className="material-symbols-outlined text-[18px] text-tertiary">done_all</span>
                    <span>Mark all as read</span>
                </button>
                <button className="flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-error text-label-md font-label-md transition-all">
                    <span className="material-symbols-outlined text-[18px]">clear_all</span>
                    <span>Clear read</span>
                </button>
                <div className="h-6 w-px bg-surface-container-highest hidden sm:block"></div>
                <button className="flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-surface-container-high text-primary hover:bg-primary hover:text-on-primary font-label-md text-label-md transition-all shadow-sm">
                    <span className="material-symbols-outlined text-[18px]">tune</span>
                    <span className="hidden md:inline">Filter options</span>
                </button>
            </div>
        </div>
        {/* Filter Segmented Tabs Bar */}
        <div className="flex items-center justify-between gap-space-md overflow-x-auto pb-space-xs scrollbar-none">
            <div className="flex items-center gap-2 p-1.5 rounded-xl bg-surface-container-lowest shadow-inner" id="filter-tabs">
                <button className="filter-btn active-tab flex items-center gap-space-xs px-space-md py-2 rounded-lg bg-surface-container-high text-primary font-label-md text-label-md shadow-sm transition-all" data-category="all">
                    <span className="material-symbols-outlined text-[18px]">notifications</span>
                    <span>All</span>
                    <span className="px-1.5 py-0.5 rounded-md bg-surface-container-highest text-on-surface font-label-sm text-label-sm">12</span>
                </button>
                <button className="filter-btn flex items-center gap-space-xs px-space-md py-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container font-label-md text-label-md transition-all" data-category="schedule">
                    <span className="material-symbols-outlined text-[18px]">event_upcoming</span>
                    <span>Schedule Reminders</span>
                    <span className="px-1.5 py-0.5 rounded-md bg-surface-container-high text-primary font-label-sm text-label-sm">3</span>
                </button>
                <button className="filter-btn flex items-center gap-space-xs px-space-md py-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container font-label-md text-label-md transition-all" data-category="membership">
                    <span className="material-symbols-outlined text-[18px]">credit_card</span>
                    <span>Plans &amp; Billing</span>
                    <span className="px-1.5 py-0.5 rounded-md bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">2</span>
                </button>
                <button className="filter-btn flex items-center gap-space-xs px-space-md py-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container font-label-md text-label-md transition-all" data-category="facility">
                    <span className="material-symbols-outlined text-[18px]">warning</span>
                    <span>Facility Alerts</span>
                    <span className="px-1.5 py-0.5 rounded-md bg-surface-container-high text-tertiary font-label-sm text-label-sm">1</span>
                </button>
                <button className="filter-btn flex items-center gap-space-xs px-space-md py-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container font-label-md text-label-md transition-all" data-category="news">
                    <span className="material-symbols-outlined text-[18px]">campaign</span>
                    <span>NEXUS Lab News</span>
                </button>
            </div>
            <div className="hidden xl:flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm whitespace-nowrap pl-space-md">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                <span>Synced: 40s ago</span>
            </div>
        </div>
        {/* Main Grid Content: 12-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter mt-space-lg items-start">
            {/* Primary List Column (8 Columns) */}
            <div className="lg:col-span-8 flex flex-col gap-space-md min-w-0">
                {/* Feed Group: Today (Active Urgent Stack) */}
                <div className="flex items-center justify-between pt-space-xs pb-1">
<span className="font-label-sm text-label-sm tracking-wider uppercase text-on-surface-variant font-semibold flex items-center gap-1.5">
<span className="material-symbols-outlined text-[14px] text-primary">schedule</span>
            Today • Real-time
          </span>
                    <span className="font-label-sm text-label-sm text-tertiary">High Priority</span>
                </div>
                {/* Notification 1: Class Reminder (Urgent HIIT Class) */}
                <article className="group relative rounded-xl bg-surface-container-low hover:bg-surface-container p-space-lg transition-all duration-200 shadow-md shadow-surface-container-lowest/50 flex flex-col gap-space-md">
                    <div className="flex items-start justify-between gap-space-md">
                        <div className="flex items-start gap-space-md">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                                <span className="material-symbols-outlined text-[26px]">fitness_center</span>
                            </div>
                            <div className="flex flex-col gap-1 min-w-0">
                                <div className="flex items-center gap-space-xs flex-wrap">
<span className="px-2 py-0.5 rounded bg-error-container text-on-error-container font-label-sm text-label-sm font-semibold flex items-center gap-1">
<span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse"></span>
                    IMPORTANT
                  </span>
                                    <span className="px-2 py-0.5 rounded bg-surface-container-highest text-tertiary font-label-sm text-label-sm font-semibold">
                    Functional Lab 01
                  </span>
                                    <span className="font-label-sm text-label-sm text-on-surface-variant">• 15m ago</span>
                                </div>
                                <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold group-hover:text-primary transition-colors">
                                    Reminder: HIIT Endurance class starts in 1h 45m
                                </h3>
                                <p className="font-body-md text-body-md text-on-surface-variant line-clamp-2">
                                    The HIIT Endurance class will take place at Functional Lab 01 at 16:30. Please bring an electrolyte drink and open your NEXUS QR code in the lobby for automated gate check-in.
                                </p>
                            </div>
                        </div>
                        {/* Context Dropdown Icon */}
                        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest shrink-0" title="Options">
                            <span className="material-symbols-outlined text-[18px]">more_vert</span>
                        </button>
                    </div>
                    {/* Bottom Action Deck & Quick Stats */}
                    <div className="flex flex-wrap items-center justify-between gap-space-md pt-space-xs">
                        <div className="flex items-center gap-space-md text-on-surface-variant font-label-sm text-label-sm">
                            <div className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-[16px] text-primary">person</span>
                                <span>Coach: Alex Carter</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-[16px] text-tertiary">local_fire_department</span>
                                <span>Est: 650 kcal</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-space-xs">
                            <button className="px-space-md py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-label-md font-label-md transition-all">
                                Reschedule
                            </button>
                            <button className="flex items-center gap-1 px-space-md py-2 rounded-lg bg-primary-container text-on-primary-container hover:bg-inverse-primary hover:text-surface text-label-md font-label-md transition-all font-semibold shadow-sm">
                                <span>View Session Details</span>
                                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                            </button>
                        </div>
                    </div>
                </article>
                {/* Notification 2: Membership & Billing */}
                <article className="group relative rounded-xl bg-surface-container-low hover:bg-surface-container p-space-lg transition-all duration-200 shadow-md shadow-surface-container-lowest/50 flex flex-col gap-space-md">
                    <div className="flex items-start justify-between gap-space-md">
                        <div className="flex items-start gap-space-md">
                            <div className="w-12 h-12 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0 mt-0.5">
                                <span className="material-symbols-outlined text-[26px]">card_membership</span>
                            </div>
                            <div className="flex flex-col gap-1 min-w-0">
                                <div className="flex items-center gap-space-xs flex-wrap">
<span className="px-2 py-0.5 rounded bg-surface-container-highest text-primary font-label-sm text-label-sm font-semibold">
                    PRO MEMBER
                  </span>
                                    <span className="font-label-sm text-label-sm text-on-surface-variant">• 2 hours ago</span>
                                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                                </div>
                                <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold group-hover:text-secondary transition-colors">
                                    '1-Month Gym PRO' plan expires in 7 days
                                </h3>
                                <p className="font-body-md text-body-md text-on-surface-variant">
                                    Your subscription expires on 11/01/2026. Renew before expiration to keep your accumulated Nexus Rewards points and maintain your -15% loyalty membership rate.
                                </p>
                            </div>
                        </div>
                        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest shrink-0" title="Options">
                            <span className="material-symbols-outlined text-[18px]">more_vert</span>
                        </button>
                    </div>
                    {/* Progress Micro-bar for Membership Remaining */}
                    <div className="flex flex-col gap-1.5 p-space-sm rounded-lg bg-surface-container-lowest">
                        <div className="flex items-center justify-between text-label-sm font-label-sm">
                            <span className="text-on-surface-variant">Cycle: Day 23 / 30</span>
                            <span className="text-secondary font-semibold">7 days remaining</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
                            <div className="h-full bg-secondary-container rounded-full" style={{ width: '76%' }}></div>
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-space-xs pt-space-xs">
                        <button className="px-space-md py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-label-md font-label-md transition-all">
                            Dismiss
                        </button>
                        <button className="flex items-center gap-1.5 px-space-md py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-fixed-dim font-label-md text-label-md font-semibold transition-all shadow-sm">
                            <span className="material-symbols-outlined text-[18px]">autorenew</span>
                            <span>Renew Now</span>
                        </button>
                    </div>
                </article>
                {/* Feed Group: Yesterday & Earlier */}
                <div className="flex items-center justify-between pt-space-md pb-1">
<span className="font-label-sm text-label-sm tracking-wider uppercase text-on-surface-variant font-semibold flex items-center gap-1.5">
<span className="material-symbols-outlined text-[14px]">history</span>
            Yesterday &amp; Weekly Log
          </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">3 entries</span>
                </div>
                {/* Notification 3: Biometrics & Telemetry Report */}
                <article className="group relative rounded-xl bg-surface-container-low hover:bg-surface-container p-space-lg transition-all duration-200 shadow-md shadow-surface-container-lowest/50 flex flex-col gap-space-md">
                    <div className="flex items-start justify-between gap-space-md">
                        <div className="flex items-start gap-space-md">
                            <div className="w-12 h-12 rounded-xl bg-tertiary-container/30 text-tertiary flex items-center justify-center shrink-0 mt-0.5">
                                <span className="material-symbols-outlined text-[26px]">vital_signs</span>
                            </div>
                            <div className="flex flex-col gap-1 min-w-0">
                                <div className="flex items-center gap-space-xs flex-wrap">
<span className="px-2 py-0.5 rounded bg-surface-container-highest text-tertiary font-label-sm text-label-sm font-semibold">
                    BIOMETRICS LAB
                  </span>
                                    <span className="font-label-sm text-label-sm text-on-surface-variant">• Yesterday, 19:30</span>
                                </div>
                                <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold group-hover:text-tertiary transition-colors">
                                    Post-workout biometric analysis report is ready
                                </h3>
                                <p className="font-body-md text-body-md text-on-surface-variant">
                                    Your muscular recovery and physical Readiness Score reached an optimal <strong className="text-tertiary font-semibold">94/100</strong>. Deep sleep recorded at 2h 15m.
                                </p>
                            </div>
                        </div>
                        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest shrink-0" title="Options">
                            <span className="material-symbols-outlined text-[18px]">more_vert</span>
                        </button>
                    </div>
                    {/* In-Card Data Telemetry Snippet */}
                    <div className="grid grid-cols-3 gap-space-sm p-space-md rounded-lg bg-surface-container-lowest">
                        <div className="flex flex-col">
                            <span className="text-label-sm font-label-sm text-on-surface-variant">Readiness Score</span>
                            <span className="text-headline-sm font-headline-sm text-on-surface font-bold text-tertiary">94<span className="text-label-sm font-label-sm text-on-surface-variant">/100</span></span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-label-sm font-label-sm text-on-surface-variant">Average HRV</span>
                            <span className="text-headline-sm font-headline-sm text-on-surface font-bold">78 ms</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-label-sm font-label-sm text-on-surface-variant">Training Load (TL)</span>
                            <span className="text-headline-sm font-headline-sm text-on-surface font-bold text-primary">Optimal</span>
                        </div>
                    </div>
                    <div className="flex items-center justify-end">
                        <button className="flex items-center gap-1.5 px-space-md py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-primary font-label-md text-label-md transition-all font-semibold">
                            <span className="material-symbols-outlined text-[18px]">insights</span>
                            <span>View Detailed Telemetry</span>
                        </button>
                    </div>
                </article>
                {/* Notification 4: Smart Court Tennis 3 */}
                <article className="group relative rounded-xl bg-surface-container-low hover:bg-surface-container p-space-lg transition-all duration-200 shadow-md shadow-surface-container-lowest/50 flex flex-col gap-space-md">
                    <div className="flex items-start justify-between gap-space-md">
                        <div className="flex items-start gap-space-md">
                            <div className="w-12 h-12 rounded-xl bg-surface-container-high text-primary flex items-center justify-center shrink-0 mt-0.5">
                                <span className="material-symbols-outlined text-[26px]">sports_tennis</span>
                            </div>
                            <div className="flex flex-col gap-1 min-w-0">
                                <div className="flex items-center gap-space-xs flex-wrap">
<span className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface font-label-sm text-label-sm font-semibold">
                    SMART COURT
                  </span>
                                    <span className="font-label-sm text-label-sm text-on-surface-variant">• Yesterday, 14:15</span>
                                </div>
                                <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold group-hover:text-primary transition-colors">
                                    Reservation confirmed: Smart Court Tennis 3
                                </h3>
                                <p className="font-body-md text-body-md text-on-surface-variant">
                                    Booking for Court 03 equipped with AI Camera Tracking tomorrow at 09:00 - 10:30 is activated. Automated door access PIN: <code className="px-1.5 py-0.5 rounded bg-surface-container-lowest font-mono text-tertiary">#TC-8891</code>.
                                </p>
                            </div>
                        </div>
                        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest shrink-0" title="Options">
                            <span className="material-symbols-outlined text-[18px]">more_vert</span>
                        </button>
                    </div>
                    <div className="flex items-center justify-between pt-space-xs">
<span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
<span className="material-symbols-outlined text-[16px]">videocam</span>
              4K AI Recording enabled
            </span>
                        <button className="px-space-md py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-label-md font-label-md transition-all">
                            Manage Booking
                        </button>
                    </div>
                </article>
                {/* Notification 5: Facility Maintenance Alert */}
                <article className="group relative rounded-xl bg-surface-container-low hover:bg-surface-container p-space-lg transition-all duration-200 shadow-md shadow-surface-container-lowest/50 flex flex-col gap-space-md">
                    <div className="flex items-start justify-between gap-space-md">
                        <div className="flex items-start gap-space-md">
                            <div className="w-12 h-12 rounded-xl bg-surface-container-highest text-tertiary flex items-center justify-center shrink-0 mt-0.5">
                                <span className="material-symbols-outlined text-[26px]">ac_unit</span>
                            </div>
                            <div className="flex flex-col gap-1 min-w-0">
                                <div className="flex items-center gap-space-xs flex-wrap">
<span className="px-2 py-0.5 rounded bg-tertiary-container text-on-tertiary-container font-label-sm text-label-sm font-semibold">
                    FACILITY MAINTENANCE
                  </span>
                                    <span className="font-label-sm text-label-sm text-on-surface-variant">• 2 days ago</span>
                                </div>
                                <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                                    Maintenance notice: Cryo Chamber Zone 4
                                </h3>
                                <p className="font-body-md text-body-md text-on-surface-variant">
                                    Cryo Chamber Unit 4 will be temporarily offline for cryogenic nitrogen recalibration and sensor safety checks from 12:00 - 13:30 this Thursday. Chambers 1-3 remain fully operational.
                                </p>
                            </div>
                        </div>
                        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest shrink-0" title="Options">
                            <span className="material-symbols-outlined text-[18px]">more_vert</span>
                        </button>
                    </div>
                    <div className="flex items-center justify-end">
                        <button className="px-space-md py-1.5 rounded-lg text-tertiary hover:bg-surface-container-highest text-label-md font-label-md transition-all">
                            View Maintenance Schedule
                        </button>
                    </div>
                </article>
            </div>
            {/* Right Aside Panel: Quick Settings & Facility Status (4 Columns) */}
            <div className="lg:col-span-4 flex flex-col gap-space-md">
                {/* Quick Facility Alerts & Live Status Widget */}
                <div className="rounded-xl bg-surface-container-low p-space-lg shadow-md shadow-surface-container-lowest/50 flex flex-col gap-space-md">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-space-xs">
                            <span className="material-symbols-outlined text-primary text-[22px]">domain</span>
                            <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Zone Live Status</h2>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-surface-container-highest text-tertiary font-label-sm text-label-sm">LIVE</span>
                    </div>
                    {/* Mini Map / Zone Visualizer Card */}
                    <div className="relative rounded-lg overflow-hidden h-36 bg-surface-container-lowest flex items-center justify-center border-none">
                        <div className="absolute inset-0 bg-gradient-to-tr from-surface via-surface-container-high/40 to-transparent"></div>
                        <div className="relative z-10 flex flex-col items-center gap-1 text-center p-space-sm">
                            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                                <span className="material-symbols-outlined text-[18px]">map</span>
                            </div>
                            <span className="font-label-md text-label-md text-on-surface font-semibold">Nexus Complex Zone A &amp; B</span>
                            <span className="font-label-sm text-label-sm text-on-surface-variant">Current occupancy: 68% capacity</span>
                        </div>
                    </div>
                    {/* Status List */}
                    <div className="flex flex-col gap-space-xs">
                        <div className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container-lowest">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-tertiary"></span>
                                <span className="font-label-md text-label-md text-on-surface">Functional Zone 01 &amp; 02</span>
                            </div>
                            <span className="font-label-sm text-label-sm text-tertiary font-semibold">Available</span>
                        </div>
                        <div className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container-lowest">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-primary"></span>
                                <span className="font-label-md text-label-md text-on-surface">Aqua Hydrotherapy Pool</span>
                            </div>
                            <span className="font-label-sm text-label-sm text-primary font-semibold">Open</span>
                        </div>
                        <div className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container-lowest">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-error"></span>
                                <span className="font-label-md text-label-md text-on-surface">Cryo Chamber Zone 4</span>
                            </div>
                            <span className="font-label-sm text-label-sm text-error font-semibold">Maint. Thu</span>
                        </div>
                    </div>
                </div>
                {/* Notification Preferences Panel */}
                <div className="rounded-xl bg-surface-container-low p-space-lg shadow-md shadow-surface-container-lowest/50 flex flex-col gap-space-md">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-space-xs">
                            <span className="material-symbols-outlined text-secondary text-[22px]">tune</span>
                            <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Notification Preferences</h2>
                        </div>
                        <a className="text-primary hover:underline font-label-sm text-label-sm font-semibold" href="#">Advanced</a>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                        Customize instant alert channels across your mobile devices, smartwatch, and SMS.
                    </p>
                    {/* Toggle Switches */}
                    <div className="flex flex-col gap-space-sm divide-y-0">
                        {/* Push Notification Toggle */}
                        <label className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container-lowest cursor-pointer hover:bg-surface-container transition-colors">
                            <div className="flex flex-col">
                                <span className="font-label-md text-label-md text-on-surface font-semibold">Push Notifications</span>
                                <span className="font-label-sm text-label-sm text-on-surface-variant">Instant session reminders &amp; alerts</span>
                            </div>
                            <input checked="" className="accent-primary w-4 h-4 rounded cursor-pointer" type="checkbox"/>
                        </label>
                        {/* SMS Alerts Toggle */}
                        <label className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container-lowest cursor-pointer hover:bg-surface-container transition-colors">
                            <div className="flex flex-col">
                                <span className="font-label-md text-label-md text-on-surface font-semibold">SMS Alerts &amp; Urgent</span>
                                <span className="font-label-sm text-label-sm text-on-surface-variant">Schedule changes &amp; smart court PINs</span>
                            </div>
                            <input checked="" className="accent-primary w-4 h-4 rounded cursor-pointer" type="checkbox"/>
                        </label>
                        {/* Email Weekly Digest Toggle */}
                        <label className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container-lowest cursor-pointer hover:bg-surface-container transition-colors">
                            <div className="flex flex-col">
                                <span className="font-label-md text-label-md text-on-surface font-semibold">Biometric Reports (Email)</span>
                                <span className="font-label-sm text-label-sm text-on-surface-variant">Weekly digest sent every Sunday</span>
                            </div>
                            <input checked="" className="accent-primary w-4 h-4 rounded cursor-pointer" type="checkbox"/>
                        </label>
                        {/* Emergency Safety Alerts */}
                        <label className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container-lowest cursor-pointer hover:bg-surface-container transition-colors">
                            <div className="flex flex-col">
                                <span className="font-label-md text-label-md text-on-surface font-semibold">Facility &amp; Safety Alerts</span>
                                <span className="font-label-sm text-label-sm text-on-surface-variant">Highest priority for unexpected maintenance</span>
                            </div>
                            <input checked="" className="accent-primary w-4 h-4 rounded cursor-pointer" type="checkbox"/>
                        </label>
                    </div>
                    {/* Save Notification State Indicator */}
                    <div className="flex items-center justify-between pt-space-xs text-on-surface-variant font-label-sm text-label-sm">
<span className="flex items-center gap-1">
<span className="material-symbols-outlined text-[16px] text-tertiary">check_circle</span>
              Auto-saved settings
            </span>
                        <button className="text-primary hover:text-on-surface font-semibold transition-colors">Reset</button>
                    </div>
                </div>
                {/* Quick Help / Support Card */}
                <div className="rounded-xl bg-gradient-to-br from-surface-container-high to-surface-container-low p-space-lg shadow-md flex flex-col gap-space-sm">
                    <div className="flex items-center gap-space-sm">
                        <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center font-bold">
                            <span className="material-symbols-outlined text-[20px]">headset_mic</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="font-label-lg text-label-lg text-on-surface font-semibold">Need help with scheduling?</span>
                            <span className="font-label-sm text-label-sm text-on-surface-variant">Zone A front desk concierge</span>
                        </div>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                        Encountered QR check-in issues or need to freeze your membership plan? Contact the NEXUS Lab concierge immediately.
                    </p>
                    <button className="mt-space-xs w-full py-2.5 rounded-lg bg-surface-container-highest hover:bg-primary hover:text-on-primary text-on-surface font-label-md text-label-md transition-all font-semibold flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">call</span>
                        <span>Call Concierge Desk (Ext: 104)</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>
    
    </>
  );
};

export default Notifications;
