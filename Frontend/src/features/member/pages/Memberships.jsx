import React from 'react';

const Memberships = () => {
  return (
    <>
      <div className="flex flex-col w-full pb-space-xl">
    {/* Top Meta & Title Section */}
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md mb-space-lg">
        <div className="flex flex-col">
            <div className="flex items-center gap-space-sm mb-space-xs">
                <span className="font-label-sm text-label-sm text-tertiary uppercase tracking-widest bg-surface-container-high px-space-sm py-0.5 rounded">Memberships &amp; Services</span>
                <span className="w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
                <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">ID: #NX-88071-VN</span>
            </div>
            <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">Memberships &amp; Training Plans</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">Manage your membership benefits, upgrade high-performance athletic privileges, and review billing history.</p>
        </div>
        {/* Quick Billing & Support Controls */}
        <div className="flex items-center gap-space-sm">
            <button className="flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-surface-container-high text-on-surface font-label-md text-label-md hover:bg-surface-container-highest transition-all shadow-sm">
                <span className="material-symbols-outlined text-[18px] text-tertiary">credit_card</span>
                <span>Payment Methods</span>
            </button>
            <button className="flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-inverse-primary hover:text-surface transition-all shadow-md">
                <span className="material-symbols-outlined text-[18px]">upgrade</span>
                <span>Upgrade to All-Access</span>
            </button>
        </div>
    </div>
    {/* Section 1: Active Membership Overview & Telemetry */}
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-space-lg mb-space-xl">
        {/* Main Active Card (2 columns on XL) */}
        <div className="xl:col-span-2 relative overflow-hidden rounded-xl bg-surface-container p-space-lg sm:p-space-xl flex flex-col justify-between shadow-md">
            {/* Glow ambient background */}
            <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-primary/10 blur-3xl pointer-events-none"></div>
            <div className="absolute top-0 right-0 p-space-md">
<span className="inline-flex items-center gap-1.5 px-space-sm py-1 rounded bg-secondary-container/60 text-secondary-fixed font-label-sm text-label-sm font-semibold tracking-wider uppercase">
<span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
          Active
        </span>
            </div>
            <div className="flex flex-col">
                <div className="flex items-center gap-space-sm mb-space-sm">
                    <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-tertiary shadow-sm">
                        <span className="material-symbols-outlined text-[28px]">sports_martial_arts</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="font-label-sm text-label-sm text-tertiary uppercase tracking-wider">Pro Tier Member</span>
                        <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold">1-Month Gym Pass PRO</h2>
                    </div>
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl mb-space-lg">
                    Full access to the Olympic training zone, Smart Locker systems, Nexus Telemetry biometric monitoring, and 4 Personal Coaching sessions per cycle.
                </p>
                {/* Progress & Expiry Matrix */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md p-space-md rounded-xl bg-surface-container-low mb-space-lg">
                    {/* Item 1 */}
                    <div className="flex flex-col">
                        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Time Remaining</span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                            <span className="font-headline-lg text-headline-lg text-tertiary font-bold">7</span>
                            <span className="font-body-sm text-body-sm text-on-surface-variant">days (Until Nov 01, 2026)</span>
                        </div>
                        <div className="w-full bg-surface-container-highest h-1.5 rounded-full mt-2 overflow-hidden">
                            <div className="bg-tertiary h-full rounded-full" style={{ width: '76%' }}></div>
                        </div>
                    </div>
                    {/* Item 2 */}
                    <div className="flex flex-col">
                        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Classes Attended / Cycle</span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                            <span className="font-headline-lg text-headline-lg text-primary font-bold">14</span>
                            <span className="font-body-sm text-body-sm text-on-surface-variant">/ 20 sessions accrued</span>
                        </div>
                        <div className="w-full bg-surface-container-highest h-1.5 rounded-full mt-2 overflow-hidden">
                            <div className="bg-primary h-full rounded-full" style={{ width: '70%' }}></div>
                        </div>
                    </div>
                    {/* Item 3 */}
                    <div className="flex flex-col">
                        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Access Control (Turnstile)</span>
                        <div className="flex items-center gap-1.5 mt-1.5">
                            <span className="material-symbols-outlined text-[18px] text-tertiary">nfc</span>
                            <span className="font-label-md text-label-md text-on-surface font-semibold">NFC Pass Active</span>
                        </div>
                        <span className="font-label-sm text-label-sm text-on-surface-variant mt-1">FaceID &amp; App QR Turnstile</span>
                    </div>
                </div>
            </div>
            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-space-sm pt-space-xs">
                <button className="flex items-center gap-space-xs px-space-lg py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-inverse-primary hover:text-surface transition-all shadow-md">
                    <span className="material-symbols-outlined text-[18px]">autorenew</span>
                    <span>Renew Membership</span>
                </button>
                <button className="flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-surface-container-high text-on-surface font-label-md text-label-md hover:bg-surface-container-highest transition-all shadow-sm">
                    <span className="material-symbols-outlined text-[18px] text-tertiary">bolt</span>
                    <span>Upgrade to All-Access</span>
                </button>
                <button className="flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all">
                    <span className="material-symbols-outlined text-[18px]">tune</span>
                    <span>Configure Auto-Debit</span>
                </button>
            </div>
        </div>
        {/* Active Privilege Showcase Side-Card */}
        <div className="rounded-xl bg-surface-container p-space-lg flex flex-col justify-between shadow-md">
            <div>
                <div className="flex items-center justify-between mb-space-md">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Included Privileges</span>
                    <span className="font-label-sm text-label-sm text-tertiary px-space-xs py-0.5 rounded bg-surface-container-low">4 Active Perks</span>
                </div>
                <div className="flex flex-col gap-space-sm">
                    <div className="flex items-start gap-space-sm p-space-sm rounded-lg bg-surface-container-low">
                        <span className="material-symbols-outlined text-primary text-[20px] mt-0.5">sports_tennis</span>
                        <div className="flex flex-col">
                            <span className="font-label-md text-label-md text-on-surface font-semibold">Priority Smart Court Booking</span>
                            <span className="font-body-sm text-body-sm text-on-surface-variant">48-hour early access window</span>
                        </div>
                    </div>
                    <div className="flex items-start gap-space-sm p-space-sm rounded-lg bg-surface-container-low">
                        <span className="material-symbols-outlined text-tertiary text-[20px] mt-0.5">fitness_center</span>
                        <div className="flex flex-col">
                            <span className="font-label-md text-label-md text-on-surface font-semibold">Scheduled 1-on-1 PT</span>
                            <span className="font-body-sm text-body-sm text-on-surface-variant">1 of 4 sessions remaining this month</span>
                        </div>
                    </div>
                    <div className="flex items-start gap-space-sm p-space-sm rounded-lg bg-surface-container-low">
                        <span className="material-symbols-outlined text-secondary text-[20px] mt-0.5">spa</span>
                        <div className="flex flex-col">
                            <span className="font-label-md text-label-md text-on-surface font-semibold">Sauna &amp; Hydro Lounge</span>
                            <span className="font-body-sm text-body-sm text-on-surface-variant">Unlimited post-workout recovery access</span>
                        </div>
                    </div>
                </div>
            </div>
            {/* Quick Facility Snapshot placeholder */}
            <div className="mt-space-md pt-space-md flex items-center justify-between bg-surface-container-low p-space-sm rounded-lg">
                <div className="flex items-center gap-space-sm">
                    <img className="w-10 h-10 rounded-lg object-cover" data-alt="High performance athletic indoor gym with sleek blue LED overhead lighting, polished dark rubber flooring, high-tech cardio machines, and glass partition recovery chambers in deep navy modern ambiance." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAZUaU9ANlYAnUlkLl4YwjfrB9Ga6siD1W4mhvDRXNYJc0MsKYtJKl6tldwEGmmSempLI0F4OtlwLcSd0ayJT__ZYNNWWAee3PeTua1THWknMZGOFul2RpsPMfMje2Loj0SqIjVZ7boLqAIbVA1VhxUL45lXO1gTfHuaBpgpE1jDAPufK2pPan4uhrB1ZysfpHO_EANvWRNBeCw1QFbiyPte4D0x30t19FNYl40x7sabpHNDbRmRgNG"/>
                    <div className="flex flex-col">
                        <span className="font-label-sm text-label-sm text-on-surface font-semibold">Nexus Hub Thu Thiem</span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">Primary Training Facility</span>
                    </div>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant text-[18px]">verified</span>
            </div>
        </div>
    </div>
    {/* Section 2: Membership Tier Pricing & Comparison Table */}
    <div className="flex flex-col mb-space-xl">
        {/* Header with Billing Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-space-md mb-space-lg">
            <div className="flex flex-col">
                <div className="flex items-center gap-space-xs text-tertiary font-label-sm text-label-sm uppercase tracking-wider mb-1">
                    <span className="material-symbols-outlined text-[16px]">military_tech</span>
                    <span>Membership Tier Comparison</span>
                </div>
                <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">Select Your Membership Tier</h2>
                <p className="font-body-md text-body-md text-on-surface-variant">Scale your athletic progression from everyday physical conditioning to elite competitive readiness.</p>
            </div>
            {/* Toggle Switch for Monthly / Yearly */}
            <div className="flex items-center bg-surface-container-high p-1 rounded-xl self-start sm:self-auto">
                <button className="px-space-md py-1.5 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md transition-all shadow-sm" id="toggle-monthly">
                    Monthly
                </button>
                <button className="px-space-md py-1.5 rounded-lg text-on-surface-variant hover:text-on-surface font-label-md text-label-md transition-all flex items-center gap-1.5" id="toggle-yearly">
                    <span>Yearly</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-tertiary-container text-on-tertiary-container uppercase">-20%</span>
                </button>
            </div>
        </div>
        {/* 3 Tiers Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-lg">
            {/* Tier 1: Standard Fitness */}
            <div className="rounded-xl bg-surface-container p-space-lg flex flex-col justify-between hover:bg-surface-container-high transition-all shadow-md">
                <div>
                    <div className="flex items-center justify-between mb-space-sm">
                        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">Tier 01</span>
                        <span className="w-7 h-7 rounded-lg bg-surface-container-low flex items-center justify-center text-on-surface-variant">
<span className="material-symbols-outlined text-[18px]">exercise</span>
</span>
                    </div>
                    <h3 className="font-headline-md text-headline-md text-on-surface font-bold">Standard Fitness</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 mb-space-md">Engineered for dedicated athletes maintaining consistent day-to-day baseline performance.</p>
                    <div className="flex items-baseline gap-1 mb-space-lg">
                        <span className="font-headline-xl text-headline-xl text-on-surface font-extrabold tier-price" data-monthly="1,200,000 ₫" data-yearly="960,000 ₫">1,200,000 ₫</span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">/ month</span>
                    </div>
                    {/* Feature List */}
                    <div className="flex flex-col gap-space-sm mb-space-lg">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
                            <span className="font-body-md text-body-md text-on-surface">Full access to Gym &amp; Free Weights zone</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
                            <span className="font-body-md text-body-md text-on-surface">Smart Locker with PIN access</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
                            <span className="font-body-md text-body-md text-on-surface">Standard Nexus Telemetry (Heart rate &amp; BMI)</span>
                        </div>
                        <div className="flex items-center gap-2 opacity-50">
                            <span className="material-symbols-outlined text-outline text-[18px]">cancel</span>
                            <span className="font-body-md text-body-md text-on-surface-variant">Studio Classes &amp; Peak Hour Booking</span>
                        </div>
                        <div className="flex items-center gap-2 opacity-50">
                            <span className="material-symbols-outlined text-outline text-[18px]">cancel</span>
                            <span className="font-body-md text-body-md text-on-surface-variant">Cryo Recovery &amp; Cold Plunge</span>
                        </div>
                    </div>
                </div>
                <button className="w-full py-2.5 rounded-lg bg-surface-container-high text-on-surface font-label-md text-label-md hover:bg-surface-container-highest transition-all shadow-sm">
                    Select Standard Plan
                </button>
            </div>
            {/* Tier 2: Pro Athlete (CURRENT TIER / HIGHLIGHTED) */}
            <div className="rounded-xl bg-surface-container-low p-space-lg flex flex-col justify-between relative shadow-xl transform lg:-translate-y-2">
                {/* Floating Popular Pill */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-space-md py-0.5 rounded-full bg-primary-container text-on-primary-container font-label-sm text-label-sm font-bold shadow-md uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">star</span>
                    Current Plan • Recommended
                </div>
                <div>
                    <div className="flex items-center justify-between mb-space-sm pt-space-xs">
                        <span className="font-label-sm text-label-sm text-primary uppercase font-bold tracking-wider">Tier 02 • PRO ATHLETE</span>
                        <span className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
<span className="material-symbols-outlined text-[20px]">workspace_premium</span>
</span>
                    </div>
                    <h3 className="font-headline-md text-headline-md text-on-surface font-bold">Pro Athlete Suite</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 mb-space-md">Tailored for serious performers demanding intensive classes and continuous metric analysis.</p>
                    <div className="flex items-baseline gap-1 mb-space-lg">
                        <span className="font-headline-xl text-headline-xl text-primary font-extrabold tier-price" data-monthly="2,400,000 ₫" data-yearly="1,920,000 ₫">2,400,000 ₫</span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">/ month</span>
                    </div>
                    {/* Feature List */}
                    <div className="flex flex-col gap-space-sm mb-space-lg">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-tertiary text-[18px]">check_circle</span>
                            <span className="font-body-md text-body-md text-on-surface font-semibold">All Standard Plan benefits</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-tertiary text-[18px]">check_circle</span>
                            <span className="font-body-md text-body-md text-on-surface font-semibold">Unlimited Yoga, HIIT &amp; Cycling sessions</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-tertiary text-[18px]">check_circle</span>
                            <span className="font-body-md text-body-md text-on-surface">4 1-on-1 Personal Trainer sessions / month</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-tertiary text-[18px]">check_circle</span>
                            <span className="font-body-md text-body-md text-on-surface">Smart badminton / pickleball court priority</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-tertiary text-[18px]">check_circle</span>
                            <span className="font-body-md text-body-md text-on-surface">Real-time telemetry &amp; muscular strain analytics</span>
                        </div>
                    </div>
                </div>
                <button className="w-full py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-inverse-primary hover:text-surface transition-all shadow-md font-bold flex items-center justify-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px]">check</span>
                    <span>Current Active Plan (Renew)</span>
                </button>
            </div>
            {/* Tier 3: Elite All-Access Lab */}
            <div className="rounded-xl bg-surface-container p-space-lg flex flex-col justify-between hover:bg-surface-container-high transition-all shadow-md">
                <div>
                    <div className="flex items-center justify-between mb-space-sm">
                        <span className="font-label-sm text-label-sm text-tertiary uppercase font-semibold">Tier 03</span>
                        <span className="w-7 h-7 rounded-lg bg-surface-container-low flex items-center justify-center text-tertiary">
<span className="material-symbols-outlined text-[18px]">science</span>
</span>
                    </div>
                    <h3 className="font-headline-md text-headline-md text-on-surface font-bold">Elite All-Access Lab</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 mb-space-md">The pinnacle of athletic science, deep cryo-recovery protocols, and fully personalized training.</p>
                    <div className="flex items-baseline gap-1 mb-space-lg">
                        <span className="font-headline-xl text-headline-xl text-on-surface font-extrabold tier-price" data-monthly="4,500,000 ₫" data-yearly="3,600,000 ₫">4,500,000 ₫</span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">/ month</span>
                    </div>
                    {/* Feature List */}
                    <div className="flex flex-col gap-space-sm mb-space-lg">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
                            <span className="font-body-md text-body-md text-on-surface font-semibold">All Pro Athlete privileges</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
                            <span className="font-body-md text-body-md text-on-surface">Unlimited Cryo Chamber (-110°C) &amp; Hyperbaric O2</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
                            <span className="font-body-md text-body-md text-on-surface">Full VO2 Max &amp; Metabolic Expenditure Testing</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
                            <span className="font-body-md text-body-md text-on-surface">3D Gait &amp; Biomechanical Motion Capture</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
                            <span className="font-body-md text-body-md text-on-surface">4 VIP Guest Passes per month</span>
                        </div>
                    </div>
                </div>
                <button className="w-full py-2.5 rounded-lg bg-surface-container-high text-on-surface font-label-md text-label-md hover:bg-surface-container-highest transition-all shadow-sm">
                    Upgrade to Elite Lab
                </button>
            </div>
        </div>
    </div>
    {/* Section 3: Add-on Packages & Session Bundles */}
    <div className="flex flex-col mb-space-xl">
        <div className="flex items-center justify-between mb-space-md">
            <div>
                <h2 className="font-headline-md text-headline-md text-on-surface font-bold">Add-On Bundles &amp; Credit Packs</h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Flexibly top up training sessions or access specialized sports rehabilitation labs.</p>
            </div>
            <a className="font-label-md text-label-md text-tertiary hover:underline flex items-center gap-1" href="#">
                <span>View all add-on services</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg">
            {/* Add-on 1: Class Pack */}
            <div className="rounded-xl bg-surface-container p-space-md flex flex-col justify-between shadow-sm">
                <div className="flex items-start gap-space-md">
                    <img className="w-20 h-20 rounded-lg object-cover flex-shrink-0" data-alt="Athletes performing high intensity interval training with kettlebells in modern fitness center with neon blue backlights, clean reflections on the floor." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCj43iVETe8Ul4Kf6ROcBhNEvlita8ACygCGqVUvI7vXZxTa30l_jbXG1_PCldMJXnubqYS25u56E37_rTbx5v1qJuFE_Vck9u_cUtPB4RB785be4-C7ZXCbhKlIwCcyZgDhFFDpIOVur7M85HvmCHVlC6BzjbJ7IgsMe0NPjOPQRbeC3EDlRAQrAdfh7CCwaNpP5zqsrTxmkJPbXud09yu68tAXGa2Etv0KAFxENhO-tLvVCycpdeC"/>
                    <div className="flex flex-col">
                        <span className="font-label-sm text-label-sm text-tertiary uppercase font-semibold">Flexible Pack</span>
                        <h4 className="font-headline-sm text-headline-sm text-on-surface font-bold">10 Group Classes (Yoga &amp; HIIT)</h4>
                        <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Valid for 90 days from activation date</span>
                    </div>
                </div>
                <div className="flex items-center justify-between pt-space-md mt-space-md bg-surface-container-low -mx-space-md -mb-space-md p-space-md rounded-b-xl">
                    <div className="flex flex-col">
                        <span className="font-label-sm text-label-sm text-on-surface-variant">Special Price</span>
                        <span className="font-headline-sm text-headline-sm text-on-surface font-bold">1,450,000 ₫</span>
                    </div>
                    <button className="px-space-md py-1.5 rounded-lg bg-surface-container-high text-on-surface font-label-md text-label-md hover:bg-surface-container-highest transition-all">
                        Purchase
                    </button>
                </div>
            </div>
            {/* Add-on 2: PT Session Bundle */}
            <div className="rounded-xl bg-surface-container p-space-md flex flex-col justify-between shadow-sm">
                <div className="flex items-start gap-space-md">
                    <img className="w-20 h-20 rounded-lg object-cover flex-shrink-0" data-alt="Personal athletic coach guiding an athlete on a modern tech-driven cable machine with telemetry monitors in high contrast dark studio setting." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDbk7cU1P5FDvK_Vl8nrgF-LdXcnboOAXGUYX7LqBqyI7cVB_LEA7wiuKnnFXVbHkxcJ3EQsLmtbGx74EEi2wOKzpfDUlJRnyKbqvSdCOy2yiSuwL9kivUMANvi9M5-AMVewU1-U-JLv9QIR0TouSuwXA8mv-L-OJjvYCpl9MPsKgXGkWuWXq-xuxZ0M_JsK38r3KNPO6m3gpLEKLUdSF1Tf_AiHVi412O_pNZ2KsUmwhjDZkSaFQc7"/>
                    <div className="flex flex-col">
                        <span className="font-label-sm text-label-sm text-primary uppercase font-semibold">Pro Coaching</span>
                        <h4 className="font-headline-sm text-headline-sm text-on-surface font-bold">5-Session 1-on-1 PT Bundle</h4>
                        <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Custom training protocol + telemetry tracking</span>
                    </div>
                </div>
                <div className="flex items-center justify-between pt-space-md mt-space-md bg-surface-container-low -mx-space-md -mb-space-md p-space-md rounded-b-xl">
                    <div className="flex flex-col">
                        <span className="font-label-sm text-label-sm text-on-surface-variant">Special Price</span>
                        <span className="font-headline-sm text-headline-sm text-on-surface font-bold">3,200,000 ₫</span>
                    </div>
                    <button className="px-space-md py-1.5 rounded-lg bg-surface-container-high text-on-surface font-label-md text-label-md hover:bg-surface-container-highest transition-all">
                        Purchase
                    </button>
                </div>
            </div>
            {/* Add-on 3: Cryo Recovery Pass */}
            <div className="rounded-xl bg-surface-container p-space-md flex flex-col justify-between shadow-sm">
                <div className="flex items-start gap-space-md">
                    <img className="w-20 h-20 rounded-lg object-cover flex-shrink-0" data-alt="Futuristic whole body cryotherapy chamber with cold nitrogen vapors and blue atmospheric LED lighting in an elite sports rehabilitation facility." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDZhnVsi8BYm57YclBMuVbJeeCtBM6jU-UJgzftG9gqox-8-pVUfRx09P_aNPqgnXJbE3wVvUHJqIk2Hvo6mx_oX1UgUq-P7mt8d2ggI57rtargLoLWlhXquXiMH8bU8IFRF2No1Tyw-UIH5TRq740t--hKfnpfrfYtwEMmvd3BthamhLlZJxHAwIo9O_BHpTBlxV99NbHuCIAJrJW5nHlLTiVTiLMVcnhrxBvDXRj_urAh2Lf33IhC"/>
                    <div className="flex flex-col">
                        <span className="font-label-sm text-label-sm text-secondary uppercase font-semibold">Express Recovery</span>
                        <h4 className="font-headline-sm text-headline-sm text-on-surface font-bold">3 Full-Body Cryotherapy Sessions</h4>
                        <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">-110°C chamber for acute muscular inflammation</span>
                    </div>
                </div>
                <div className="flex items-center justify-between pt-space-md mt-space-md bg-surface-container-low -mx-space-md -mb-space-md p-space-md rounded-b-xl">
                    <div className="flex flex-col">
                        <span className="font-label-sm text-label-sm text-on-surface-variant">Special Price</span>
                        <span className="font-headline-sm text-headline-sm text-on-surface font-bold">1,800,000 ₫</span>
                    </div>
                    <button className="px-space-md py-1.5 rounded-lg bg-surface-container-high text-on-surface font-label-md text-label-md hover:bg-surface-container-highest transition-all">
                        Purchase
                    </button>
                </div>
            </div>
        </div>
    </div>
    {/* Section 4: Billing History & Invoices Table */}
    <div className="flex flex-col rounded-xl bg-surface-container overflow-hidden shadow-md">
        <div className="p-space-lg flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm bg-surface-container">
            <div className="flex flex-col">
                <h2 className="font-headline-md text-headline-md text-on-surface font-bold">Transaction History &amp; E-Invoices</h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">View and download tax receipts and statements for all renewals and add-ons.</p>
            </div>
            <div className="flex items-center gap-space-sm">
                <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-on-surface-variant">search</span>
                    <input className="bg-surface-container-low text-on-surface placeholder:text-on-surface-variant font-body-sm text-body-sm pl-9 pr-3 py-2 rounded-lg outline-none focus:bg-surface-container-high" placeholder="Search by Invoice ID..." type="text"/>
                </div>
                <button className="flex items-center gap-1 px-space-md py-2 rounded-lg bg-surface-container-low text-on-surface font-label-md text-label-md hover:bg-surface-container-high transition-all">
                    <span className="material-symbols-outlined text-[18px]">filter_list</span>
                    <span>Filter</span>
                </button>
            </div>
        </div>
        {/* Responsive Table */}
        <div className="overflow-x-auto w-full">
            <table className="w-full text-left font-body-md text-body-md">
                <thead>
                <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                    <th className="py-space-sm px-space-lg">Invoice ID</th>
                    <th className="py-space-sm px-space-md">Date &amp; Time</th>
                    <th className="py-space-sm px-space-md">Service / Plan</th>
                    <th className="py-space-sm px-space-md">Payment Method</th>
                    <th className="py-space-sm px-space-md">Amount</th>
                    <th className="py-space-sm px-space-md">Status</th>
                    <th className="py-space-sm px-space-lg text-right">Actions</th>
                </tr>
                </thead>
                <tbody className="divide-y-0">
                {/* Row 1 */}
                <tr className="hover:bg-surface-container-high/60 transition-colors">
                    <td className="py-space-md px-space-lg font-mono font-semibold text-tertiary">#NX-INV-99201</td>
                    <td className="py-space-md px-space-md text-on-surface-variant">10/01/2026 • 09:14</td>
                    <td className="py-space-md px-space-md">
                        <div className="flex flex-col">
                            <span className="font-label-md text-label-md text-on-surface font-semibold">1-Month Gym Pass PRO</span>
                            <span className="font-body-sm text-body-sm text-on-surface-variant">Automated cycle renewal</span>
                        </div>
                    </td>
                    <td className="py-space-md px-space-md text-on-surface-variant">Visa •••• 4092</td>
                    <td className="py-space-md px-space-md font-mono font-semibold text-on-surface">2,400,000 ₫</td>
                    <td className="py-space-md px-space-md">
<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-label-sm text-label-sm font-semibold bg-tertiary-container/30 text-tertiary">
<span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                Paid
              </span>
                    </td>
                    <td className="py-space-md px-space-lg text-right">
                        <button className="inline-flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors font-label-sm text-label-sm" title="Download PDF">
                            <span className="material-symbols-outlined text-[18px]">download</span>
                            <span>PDF</span>
                        </button>
                    </td>
                </tr>
                {/* Row 2 */}
                <tr className="hover:bg-surface-container-high/60 transition-colors">
                    <td className="py-space-md px-space-lg font-mono font-semibold text-tertiary">#NX-INV-98540</td>
                    <td className="py-space-md px-space-md text-on-surface-variant">09/15/2026 • 14:20</td>
                    <td className="py-space-md px-space-md">
                        <div className="flex flex-col">
                            <span className="font-label-md text-label-md text-on-surface font-semibold">5-Session 1-on-1 PT Bundle</span>
                            <span className="font-body-sm text-body-sm text-on-surface-variant">Personal coach add-on pack</span>
                        </div>
                    </td>
                    <td className="py-space-md px-space-md text-on-surface-variant">MoMo Smart Pay</td>
                    <td className="py-space-md px-space-md font-mono font-semibold text-on-surface">3,200,000 ₫</td>
                    <td className="py-space-md px-space-md">
<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-label-sm text-label-sm font-semibold bg-tertiary-container/30 text-tertiary">
<span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                Paid
              </span>
                    </td>
                    <td className="py-space-md px-space-lg text-right">
                        <button className="inline-flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors font-label-sm text-label-sm" title="Download PDF">
                            <span className="material-symbols-outlined text-[18px]">download</span>
                            <span>PDF</span>
                        </button>
                    </td>
                </tr>
                {/* Row 3 */}
                <tr className="hover:bg-surface-container-high/60 transition-colors">
                    <td className="py-space-md px-space-lg font-mono font-semibold text-tertiary">#NX-INV-97422</td>
                    <td className="py-space-md px-space-md text-on-surface-variant">09/01/2026 • 08:30</td>
                    <td className="py-space-md px-space-md">
                        <div className="flex flex-col">
                            <span className="font-label-md text-label-md text-on-surface font-semibold">1-Month Gym Pass PRO</span>
                            <span className="font-body-sm text-body-sm text-on-surface-variant">Initial membership registration</span>
                        </div>
                    </td>
                    <td className="py-space-md px-space-md text-on-surface-variant">Visa •••• 4092</td>
                    <td className="py-space-md px-space-md font-mono font-semibold text-on-surface">2,400,000 ₫</td>
                    <td className="py-space-md px-space-md">
<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-label-sm text-label-sm font-semibold bg-tertiary-container/30 text-tertiary">
<span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                Paid
              </span>
                    </td>
                    <td className="py-space-md px-space-lg text-right">
                        <button className="inline-flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors font-label-sm text-label-sm" title="Download PDF">
                            <span className="material-symbols-outlined text-[18px]">download</span>
                            <span>PDF</span>
                        </button>
                    </td>
                </tr>
                </tbody>
            </table>
        </div>
        {/* Table Footer Pagination */}
        <div className="px-space-lg py-space-sm bg-surface-container-low flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
            <span>Showing 3 of 12 recent invoices</span>
            <div className="flex items-center gap-2">
                <button className="w-7 h-7 rounded flex items-center justify-center bg-surface-container text-on-surface-variant hover:text-on-surface" disabled="">
                    <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                </button>
                <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface font-semibold">1</span>
                <button className="w-7 h-7 rounded flex items-center justify-center bg-surface-container text-on-surface-variant hover:text-on-surface">
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
            </div>
        </div>
    </div>
</div>
    
    </>
  );
};

export default Memberships;
