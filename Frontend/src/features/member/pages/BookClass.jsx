import React from 'react';

const BookClass = () => {
  return (
    <>
      <div className="flex flex-col w-full pb-space-xl">
    {/* Interactive Toast Notification */}
    <div className="fixed bottom-6 right-6 z-50 transform translate-y-20 opacity-0 pointer-events-none transition-all duration-300 ease-out flex items-center gap-space-sm px-space-md py-space-sm rounded-xl bg-surface-container-high text-on-surface shadow-2xl" id="booking-toast">
        <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">done_all</span>
        </div>
        <div className="flex flex-col">
            <span className="font-label-lg text-label-lg font-bold text-on-surface" id="toast-title">Booking Confirmed</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant" id="toast-desc">Session synced to your Nexus Pass wallet.</span>
        </div>
        <button className="ml-space-sm text-on-surface-variant hover:text-on-surface" onclick="hideToast()">
            <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
    </div>
    {/* Header & Status Bar */}
    <section className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-lg">
        <div>
            <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
                <span className="font-label-sm text-label-sm uppercase tracking-widest text-tertiary">Real-time Facility Telemetry</span>
            </div>
            <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">Book Classes &amp; Courts</h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">Explore high-performance sessions, biometric tracking labs, and digitized athletic courts.</p>
        </div>
        {/* Live Metrics Counter */}
        <div className="flex items-center gap-space-sm self-start md:self-auto bg-surface-container-low p-1.5 rounded-xl shadow-sm">
            <div className="px-space-md py-1.5 rounded-lg bg-surface-container flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-primary text-[18px]">sensors</span>
                <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant leading-none">Smart Courts</span>
                    <span className="font-label-md text-label-md text-on-surface font-semibold">4/6 Available</span>
                </div>
            </div>
            <div className="px-space-md py-1.5 rounded-lg bg-surface-container flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-tertiary text-[18px]">ac_unit</span>
                <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant leading-none">Cryo Pods</span>
                    <span className="font-label-md text-label-md text-on-surface font-semibold">3 Pods Free</span>
                </div>
            </div>
        </div>
    </section>
    {/* Filter & Search Toolbar (Bento Panel) */}
    <section className="bg-surface-container-low rounded-xl p-space-md mb-space-lg shadow-sm flex flex-col gap-space-md">
        {/* Top row: Search input & Level selection */}
        <div className="flex flex-col lg:flex-row items-center gap-space-md">
            {/* Search */}
            <div className="relative flex-1 w-full">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-[20px]">search</span>
                <input className="w-full pl-11 pr-4 py-2.5 rounded-lg bg-surface-container-lowest text-on-surface placeholder:text-outline font-body-md text-body-md focus:outline-none focus:ring-1 focus:ring-primary shadow-inner" id="search-input" oninput="handleSearch(this.value)" placeholder="Search classes, trainers, sports, recovery labs..." type="text"/>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-surface-container-high text-outline text-label-sm font-label-sm">⌘ K</span>
                </div>
            </div>
            {/* Quick Level Selectors */}
            <div className="flex items-center gap-1.5 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0">
<span className="font-label-sm text-label-sm text-on-surface-variant whitespace-nowrap mr-1 flex items-center gap-1">
<span className="material-symbols-outlined text-[16px]">tune</span> Level:
        </span>
                <button className="level-filter-btn px-3 py-1.5 rounded-lg font-label-md text-label-md whitespace-nowrap bg-primary-container text-on-primary-container font-semibold transition-all" onclick="filterLevel(this, 'all')">All Levels</button>
                <button className="level-filter-btn px-3 py-1.5 rounded-lg font-label-md text-label-md whitespace-nowrap bg-surface-container text-on-surface-variant hover:text-on-surface transition-all" onclick="filterLevel(this, 'beginner')">Beginner</button>
                <button className="level-filter-btn px-3 py-1.5 rounded-lg font-label-md text-label-md whitespace-nowrap bg-surface-container text-on-surface-variant hover:text-on-surface transition-all" onclick="filterLevel(this, 'intermediate')">Intermediate</button>
                <button className="level-filter-btn px-3 py-1.5 rounded-lg font-label-md text-label-md whitespace-nowrap bg-surface-container text-on-surface-variant hover:text-on-surface transition-all" onclick="filterLevel(this, 'pro')">Advanced / Pro</button>
            </div>
        </div>
        {/* Middle row: Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button className="category-chip px-3.5 py-1.5 rounded-full font-label-md text-label-md whitespace-nowrap bg-secondary-container text-on-secondary-container flex items-center gap-1.5 shadow-sm transition-all" onclick="filterCategory(this, 'all')">
                <span className="material-symbols-outlined text-[16px]">apps</span>
                All Disciplines
            </button>
            <button className="category-chip px-3.5 py-1.5 rounded-full font-label-md text-label-md whitespace-nowrap bg-surface-container text-on-surface-variant hover:text-on-surface flex items-center gap-1.5 transition-all" onclick="filterCategory(this, 'hiit')">
                <span className="material-symbols-outlined text-[16px]">sprint</span>
                HIIT &amp; Conditioning
            </button>
            <button className="category-chip px-3.5 py-1.5 rounded-full font-label-md text-label-md whitespace-nowrap bg-surface-container text-on-surface-variant hover:text-on-surface flex items-center gap-1.5 transition-all" onclick="filterCategory(this, 'yoga')">
                <span className="material-symbols-outlined text-[16px]">self_improvement</span>
                Yoga &amp; Pilates
            </button>
            <button className="category-chip px-3.5 py-1.5 rounded-full font-label-md text-label-md whitespace-nowrap bg-surface-container text-on-surface-variant hover:text-on-surface flex items-center gap-1.5 transition-all" onclick="filterCategory(this, 'tennis')">
                <span className="material-symbols-outlined text-[16px]">sports_tennis</span>
                Smart Tennis / Badminton
            </button>
            <button className="category-chip px-3.5 py-1.5 rounded-full font-label-md text-label-md whitespace-nowrap bg-surface-container text-on-surface-variant hover:text-on-surface flex items-center gap-1.5 transition-all" onclick="filterCategory(this, 'recovery')">
                <span className="material-symbols-outlined text-[16px]">mode_fan</span>
                Hydro &amp; Cryo Recovery
            </button>
            <button className="category-chip px-3.5 py-1.5 rounded-full font-label-md text-label-md whitespace-nowrap bg-surface-container text-on-surface-variant hover:text-on-surface flex items-center gap-1.5 transition-all" onclick="filterCategory(this, 'strength')">
                <span className="material-symbols-outlined text-[16px]">exercise</span>
                Strength &amp; Weightlifting
            </button>
        </div>
        {/* Bottom row: Date quick selectors */}
        <div className="flex items-center justify-between gap-space-sm pt-2">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <span className="font-label-sm text-label-sm text-on-surface-variant whitespace-nowrap mr-2">Date:</span>
                <button className="date-chip px-3 py-1 rounded-md bg-surface-container-high text-primary font-label-sm text-label-sm font-semibold flex items-center gap-1 shadow-sm">
                    <span>Today (Oct 01)</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                </button>
                <button className="date-chip px-3 py-1 rounded-md bg-surface-container text-on-surface-variant hover:text-on-surface font-label-sm text-label-sm transition-colors">
                    Tomorrow (Oct 02)
                </button>
                <button className="date-chip px-3 py-1 rounded-md bg-surface-container text-on-surface-variant hover:text-on-surface font-label-sm text-label-sm transition-colors">
                    Friday (Oct 03)
                </button>
                <button className="date-chip px-3 py-1 rounded-md bg-surface-container text-on-surface-variant hover:text-on-surface font-label-sm text-label-sm transition-colors">
                    Saturday (Oct 04)
                </button>
                <button className="date-chip px-3 py-1 rounded-md bg-surface-container text-on-surface-variant hover:text-on-surface font-label-sm text-label-sm transition-colors">
                    Sunday (Oct 05)
                </button>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm whitespace-nowrap">
                <span className="material-symbols-outlined text-[16px]">schedule</span>
                <span>Timezone: GMT+7 (Hanoi)</span>
            </div>
        </div>
    </section>
    {/* Main Grid: Class Catalog + Utility Sidebar */}
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg items-start">
        {/* Left Column: Available Classes & Facilities (8 Columns) */}
        <div className="xl:col-span-8 flex flex-col gap-space-md">
            {/* Class Item 1: HIIT */}
            <article className="class-card group bg-surface-container-low hover:bg-surface-container p-space-md rounded-xl shadow-sm transition-all duration-200 flex flex-col sm:flex-row gap-space-md items-start sm:items-center justify-between" data-category="hiit" data-level="pro" data-title="HIIT Performance &amp; Biometrics Marcus Vance">
                <div className="flex items-start gap-space-md w-full sm:w-auto">
                    {/* Time block */}
                    <div className="w-16 h-20 rounded-lg bg-surface-container-lowest flex flex-col items-center justify-center text-center p-1 shrink-0">
                        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">TODAY</span>
                        <span className="font-headline-sm text-headline-sm font-bold text-primary">17:30</span>
                        <span className="font-label-sm text-label-sm text-outline">60 min</span>
                    </div>
                    {/* Class Details */}
                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
<span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-error-container text-on-error-container font-semibold flex items-center gap-1">
<span className="w-1.5 h-1.5 rounded-full bg-error animate-ping"></span>
                Only 2 spots left
              </span>
                            <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container-highest text-secondary">Pro Level</span>
                            <span className="font-label-sm text-label-sm text-outline flex items-center gap-0.5">
<span className="material-symbols-outlined text-[14px]">ecg_heart</span> Live HR Telemetry
              </span>
                        </div>
                        <h3 className="font-headline-md text-headline-md text-on-surface group-hover:text-primary transition-colors truncate">
                            HIIT Performance &amp; Biometrics
                        </h3>
                        <div className="flex items-center gap-space-md text-on-surface-variant font-body-sm text-body-sm mt-1 flex-wrap">
<span className="flex items-center gap-1 text-on-surface">
<span className="material-symbols-outlined text-[16px] text-tertiary">sports_gymnastics</span>
                Coach Marcus Vance
              </span>
                            <span className="flex items-center gap-1">
<span className="material-symbols-outlined text-[16px]">location_on</span>
                Functional Lab 01 (Level 1)
              </span>
                            <span className="text-tertiary font-semibold flex items-center gap-1">
<span className="material-symbols-outlined text-[16px]">group</span>
                18/20 Athletes
              </span>
                        </div>
                    </div>
                </div>
                {/* Action / Booking */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-space-sm pt-2 sm:pt-0">
                    <div className="text-right">
                        <span className="font-label-sm text-label-sm text-on-surface-variant">Included in</span>
                        <span className="font-label-md text-label-md text-primary font-bold block">Nexus Pro Plan</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="w-9 h-9 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-tertiary flex items-center justify-center transition-colors" onclick="toggleBookmark(this)" title="Save class">
                            <span className="material-symbols-outlined text-[18px]">bookmark_border</span>
                        </button>
                        <button className="px-space-md py-2 rounded-lg bg-primary-container hover:bg-secondary-container text-on-primary-container font-label-md text-label-md font-semibold transition-all active:scale-95 shadow-sm whitespace-nowrap" onclick="openBooking('HIIT Performance &amp; Biometrics', '17:30 - 18:30', 'Coach Marcus Vance')">
                            Book Spot
                        </button>
                    </div>
                </div>
            </article>
            {/* Class Item 2: Tennis Smart Court */}
            <article className="class-card group bg-surface-container-low hover:bg-surface-container p-space-md rounded-xl shadow-sm transition-all duration-200 flex flex-col sm:flex-row gap-space-md items-start sm:items-center justify-between" data-category="tennis" data-level="intermediate" data-title="Smart Court Tennis Practice Sarah Lin">
                <div className="flex items-start gap-space-md w-full sm:w-auto">
                    <div className="w-16 h-20 rounded-lg bg-surface-container-lowest flex flex-col items-center justify-center text-center p-1 shrink-0">
                        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">TOMORROW</span>
                        <span className="font-headline-sm text-headline-sm font-bold text-tertiary">09:00</span>
                        <span className="font-label-sm text-label-sm text-outline">90 min</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
<span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-tertiary-container/30 text-tertiary font-semibold flex items-center gap-1">
<span className="material-symbols-outlined text-[14px]">videocam</span>
                AI Hawkeye Tracking
              </span>
                            <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container-highest text-secondary">Intermediate</span>
                            <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
<span className="w-2 h-2 rounded-full bg-secondary"></span> 1 Match partner needed
              </span>
                        </div>
                        <h3 className="font-headline-md text-headline-md text-on-surface group-hover:text-primary transition-colors truncate">
                            Smart Court Tennis Practice &amp; Match
                        </h3>
                        <div className="flex items-center gap-space-md text-on-surface-variant font-body-sm text-body-sm mt-1 flex-wrap">
<span className="flex items-center gap-1 text-on-surface">
<span className="material-symbols-outlined text-[16px] text-tertiary">sports_tennis</span>
                Coach Sarah Lin
              </span>
                            <span className="flex items-center gap-1">
<span className="material-symbols-outlined text-[16px]">stadium</span>
                Court 03 - Smart Outdoor Court
              </span>
                            <span className="text-on-surface-variant font-medium flex items-center gap-1">
                Automated Video Highlights
              </span>
                        </div>
                    </div>
                </div>
                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-space-sm pt-2 sm:pt-0">
                    <div className="text-right">
                        <span className="font-label-sm text-label-sm text-on-surface-variant">Court Fee</span>
                        <span className="font-label-md text-label-md text-on-surface font-bold block">1 Court Pass / 90m</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="w-9 h-9 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-tertiary flex items-center justify-center transition-colors" onclick="toggleBookmark(this)" title="Save court">
                            <span className="material-symbols-outlined text-[18px]">bookmark_border</span>
                        </button>
                        <button className="px-space-md py-2 rounded-lg bg-secondary-container hover:bg-primary-container text-on-secondary-container hover:text-on-primary-container font-label-md text-label-md font-semibold transition-all active:scale-95 shadow-sm whitespace-nowrap" onclick="openBooking('Smart Court Tennis Practice', '09:00 - 10:30', 'Coach Sarah Lin')">
                            Book Court &amp; Match
                        </button>
                    </div>
                </div>
            </article>
            {/* Class Item 3: Yoga & Sound Bath */}
            <article className="class-card group bg-surface-container-low hover:bg-surface-container p-space-md rounded-xl shadow-sm transition-all duration-200 flex flex-col sm:flex-row gap-space-md items-start sm:items-center justify-between" data-category="yoga" data-level="beginner" data-title="Deep Stretch &amp; Neural Recovery Yoga Mai Anh Tran">
                <div className="flex items-start gap-space-md w-full sm:w-auto">
                    <div className="w-16 h-20 rounded-lg bg-surface-container-lowest flex flex-col items-center justify-center text-center p-1 shrink-0">
                        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">TODAY</span>
                        <span className="font-headline-sm text-headline-sm font-bold text-primary">18:00</span>
                        <span className="font-label-sm text-label-sm text-outline">90 min</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container-highest text-on-surface font-medium">Beginner &amp; All Levels</span>
                            <span className="font-label-sm text-label-sm text-tertiary flex items-center gap-1">
<span className="material-symbols-outlined text-[14px]">spa</span> Tibetan Sound Bowls
              </span>
                        </div>
                        <h3 className="font-headline-md text-headline-md text-on-surface group-hover:text-primary transition-colors truncate">
                            Deep Stretch &amp; Neural Recovery Yoga
                        </h3>
                        <div className="flex items-center gap-space-md text-on-surface-variant font-body-sm text-body-sm mt-1 flex-wrap">
<span className="flex items-center gap-1 text-on-surface">
<span className="material-symbols-outlined text-[16px] text-tertiary">person</span>
                Coach Mai Anh Tran
              </span>
                            <span className="flex items-center gap-1">
<span className="material-symbols-outlined text-[16px]">meeting_room</span>
                Zen Studio Level 2
              </span>
                            <span className="text-tertiary font-semibold flex items-center gap-1">
<span className="material-symbols-outlined text-[16px]">event_seat</span>
                12/15 Mats Reserved
              </span>
                        </div>
                    </div>
                </div>
                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-space-sm pt-2 sm:pt-0">
                    <div className="text-right">
                        <span className="font-label-sm text-label-sm text-on-surface-variant">Status</span>
                        <span className="font-label-md text-label-md text-tertiary font-bold block">3 Mats Left</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="w-9 h-9 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-tertiary flex items-center justify-center transition-colors" onclick="toggleBookmark(this)" title="Save class">
                            <span className="material-symbols-outlined text-[18px]">bookmark_border</span>
                        </button>
                        <button className="px-space-md py-2 rounded-lg bg-primary-container hover:bg-secondary-container text-on-primary-container font-label-md text-label-md font-semibold transition-all active:scale-95 shadow-sm whitespace-nowrap" onclick="openBooking('Deep Stretch &amp; Neural Recovery Yoga', '18:00 - 19:30', 'Coach Mai Anh Tran')">
                            Book Mat
                        </button>
                    </div>
                </div>
            </article>
            {/* Class Item 4: Cryo Chamber */}
            <article className="class-card group bg-surface-container-low hover:bg-surface-container p-space-md rounded-xl shadow-sm transition-all duration-200 flex flex-col sm:flex-row gap-space-md items-start sm:items-center justify-between" data-category="recovery" data-level="all" data-title="Cryo Chamber Bio-Recovery Therapy Elena Marks">
                <div className="flex items-start gap-space-md w-full sm:w-auto">
                    <div className="w-16 h-20 rounded-lg bg-surface-container-lowest flex flex-col items-center justify-center text-center p-1 shrink-0">
                        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">TODAY</span>
                        <span className="font-headline-sm text-headline-sm font-bold text-tertiary">14:00</span>
                        <span className="font-label-sm text-label-sm text-outline">45 min</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
<span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-tertiary/20 text-tertiary font-semibold flex items-center gap-1">
<span className="material-symbols-outlined text-[14px]">thermostat</span> -110°C Bio-Pod
              </span>
                            <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container-highest text-secondary">Personalized 1:1</span>
                        </div>
                        <h3 className="font-headline-md text-headline-md text-on-surface group-hover:text-primary transition-colors truncate">
                            Cryo Chamber &amp; Bio-Recovery Therapy
                        </h3>
                        <div className="flex items-center gap-space-md text-on-surface-variant font-body-sm text-body-sm mt-1 flex-wrap">
<span className="flex items-center gap-1 text-on-surface">
<span className="material-symbols-outlined text-[16px] text-tertiary">medical_services</span>
                Dr. Elena Marks (Sports Med)
              </span>
                            <span className="flex items-center gap-1">
<span className="material-symbols-outlined text-[16px]">airline_seat_recline_extra</span>
                Recovery Wing Zone 4
              </span>
                            <span className="text-on-surface font-medium">3 pods available</span>
                        </div>
                    </div>
                </div>
                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-space-sm pt-2 sm:pt-0">
                    <div className="text-right">
                        <span className="font-label-sm text-label-sm text-on-surface-variant">Support</span>
                        <span className="font-label-md text-label-md text-tertiary font-bold block">Supervised by MD</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="w-9 h-9 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-tertiary flex items-center justify-center transition-colors" onclick="toggleBookmark(this)" title="Save pod">
                            <span className="material-symbols-outlined text-[18px]">bookmark_border</span>
                        </button>
                        <button className="px-space-md py-2 rounded-lg bg-primary-container hover:bg-secondary-container text-on-primary-container font-label-md text-label-md font-semibold transition-all active:scale-95 shadow-sm whitespace-nowrap" onclick="openBooking('Cryo Chamber &amp; Bio-Recovery', '14:00 - 14:45', 'Dr. Elena Marks')">
                            Book Session
                        </button>
                    </div>
                </div>
            </article>
            {/* Class Item 5: Olympic Weightlifting */}
            <article className="class-card group bg-surface-container-low hover:bg-surface-container p-space-md rounded-xl shadow-sm transition-all duration-200 flex flex-col sm:flex-row gap-space-md items-start sm:items-center justify-between" data-category="strength" data-level="pro" data-title="Olympic Weightlifting Strength Lab Dmitri Ivanov">
                <div className="flex items-start gap-space-md w-full sm:w-auto">
                    <div className="w-16 h-20 rounded-lg bg-surface-container-lowest flex flex-col items-center justify-center text-center p-1 shrink-0">
                        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">TODAY</span>
                        <span className="font-headline-sm text-headline-sm font-bold text-primary">19:30</span>
                        <span className="font-label-sm text-label-sm text-outline">90 min</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container-highest text-secondary font-semibold">Advanced / Pro</span>
                            <span className="font-label-sm text-label-sm text-tertiary flex items-center gap-1">
<span className="material-symbols-outlined text-[14px]">speed</span> Barbell Velocity Tracker
              </span>
                        </div>
                        <h3 className="font-headline-md text-headline-md text-on-surface group-hover:text-primary transition-colors truncate">
                            Olympic Weightlifting &amp; Strength Lab
                        </h3>
                        <div className="flex items-center gap-space-md text-on-surface-variant font-body-sm text-body-sm mt-1 flex-wrap">
<span className="flex items-center gap-1 text-on-surface">
<span className="material-symbols-outlined text-[16px] text-tertiary">fitness_center</span>
                Coach Dmitri Ivanov
              </span>
                            <span className="flex items-center gap-1">
<span className="material-symbols-outlined text-[16px]">domain</span>
                Heavy Metal Arena A
              </span>
                            <span className="text-on-surface-variant font-semibold">8/10 platforms</span>
                        </div>
                    </div>
                </div>
                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-space-sm pt-2 sm:pt-0">
                    <div className="text-right">
                        <span className="font-label-sm text-label-sm text-on-surface-variant">Eleiko Platform</span>
                        <span className="font-label-md text-label-md text-primary font-bold block">2 Platforms Free</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="w-9 h-9 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-tertiary flex items-center justify-center transition-colors" onclick="toggleBookmark(this)" title="Save platform">
                            <span className="material-symbols-outlined text-[18px]">bookmark_border</span>
                        </button>
                        <button className="px-space-md py-2 rounded-lg bg-primary-container hover:bg-secondary-container text-on-primary-container font-label-md text-label-md font-semibold transition-all active:scale-95 shadow-sm whitespace-nowrap" onclick="openBooking('Olympic Weightlifting &amp; Strength Lab', '19:30 - 21:00', 'Coach Dmitri Ivanov')">
                            Reserve Platform
                        </button>
                    </div>
                </div>
            </article>
            {/* Class Item 6: Hydrotherapy & Lap Swimming */}
            <article className="class-card group bg-surface-container-low hover:bg-surface-container p-space-md rounded-xl shadow-sm transition-all duration-200 flex flex-col sm:flex-row gap-space-md items-start sm:items-center justify-between" data-category="recovery" data-level="intermediate" data-title="Hydrotherapy Lap Swimming Aquatic Coach Team">
                <div className="flex items-start gap-space-md w-full sm:w-auto">
                    <div className="w-16 h-20 rounded-lg bg-surface-container-lowest flex flex-col items-center justify-center text-center p-1 shrink-0">
                        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">TOMORROW</span>
                        <span className="font-headline-sm text-headline-sm font-bold text-tertiary">07:00</span>
                        <span className="font-label-sm text-label-sm text-outline">60 min</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
<span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-tertiary/20 text-tertiary font-semibold flex items-center gap-1">
<span className="material-symbols-outlined text-[14px]">pool</span> Heated Saline Pool 32°C
              </span>
                            <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container-highest text-secondary">All Levels</span>
                        </div>
                        <h3 className="font-headline-md text-headline-md text-on-surface group-hover:text-primary transition-colors truncate">
                            Hydrotherapy &amp; Lap Swimming
                        </h3>
                        <div className="flex items-center gap-space-md text-on-surface-variant font-body-sm text-body-sm mt-1 flex-wrap">
<span className="flex items-center gap-1 text-on-surface">
<span className="material-symbols-outlined text-[16px] text-tertiary">water</span>
                Aquatic Coach Team
              </span>
                            <span className="flex items-center gap-1">
<span className="material-symbols-outlined text-[16px]">waves</span>
                FINA-Standard Olympic Pool
              </span>
                            <span className="text-tertiary font-semibold">15 Open Lanes</span>
                        </div>
                    </div>
                </div>
                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-space-sm pt-2 sm:pt-0">
                    <div className="text-right">
                        <span className="font-label-sm text-label-sm text-on-surface-variant">Locker &amp; Towel</span>
                        <span className="font-label-md text-label-md text-on-surface font-bold block">Complimentary</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="w-9 h-9 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-tertiary flex items-center justify-center transition-colors" onclick="toggleBookmark(this)" title="Save lane">
                            <span className="material-symbols-outlined text-[18px]">bookmark_border</span>
                        </button>
                        <button className="px-space-md py-2 rounded-lg bg-primary-container hover:bg-secondary-container text-on-primary-container font-label-md text-label-md font-semibold transition-all active:scale-95 shadow-sm whitespace-nowrap" onclick="openBooking('Hydrotherapy &amp; Lap Swimming', '07:00 - 08:00', 'Aquatic Coach Team')">
                            Reserve Lane
                        </button>
                    </div>
                </div>
            </article>
            {/* Empty Filter State (Hidden by default) */}
            <div className="hidden p-space-xl flex-col items-center justify-center text-center bg-surface-container-low rounded-xl" id="empty-state">
                <span className="material-symbols-outlined text-outline text-[48px] mb-space-sm">search_off</span>
                <h4 className="font-headline-md text-headline-md text-on-surface">No matching sessions found</h4>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-sm mt-1">Try resetting your filters or searching for general keywords like "Yoga", "Marcus", or "Tennis".</p>
                <button className="mt-space-md px-space-md py-2 rounded-lg bg-surface-container-high text-primary hover:bg-surface-container-highest font-label-md text-label-md font-semibold transition-colors" onclick="resetFilters()">
                    Reset Filters
                </button>
            </div>
        </div>
        {/* Right Column: Sidebar Info & Quick Access (4 Columns) */}
        <aside className="xl:col-span-4 flex flex-col gap-space-lg">
            {/* Facility Policy Card */}
            <div className="bg-surface-container-low rounded-xl p-space-lg shadow-sm">
                <div className="flex items-center justify-between pb-space-sm mb-space-sm border-b border-surface-container-highest/40">
                    <div className="flex items-center gap-space-xs">
                        <span className="material-symbols-outlined text-primary text-[22px]">policy</span>
                        <h3 className="font-headline-sm text-headline-sm text-on-surface">Booking Policy</h3>
                    </div>
                    <span className="font-label-sm text-label-sm text-tertiary bg-tertiary-container/20 px-2 py-0.5 rounded">Nexus Pro Pass</span>
                </div>
                <ul className="space-y-space-sm font-body-sm text-body-sm text-on-surface-variant">
                    <li className="flex items-start gap-space-xs">
                        <span className="material-symbols-outlined text-tertiary text-[18px] shrink-0 mt-0.5">check_circle</span>
                        <span><strong className="text-on-surface">Flexible Cancellation:</strong> Cancel at least <strong>2 hours</strong> before start time without credit forfeiture or penalties.</span>
                    </li>
                    <li className="flex items-start gap-space-xs">
                        <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">qr_code_scanner</span>
                        <span><strong className="text-on-surface">Express Check-in:</strong> Scan your Nexus Pass QR code at the court/pod gate <strong>10 minutes prior</strong> for automatic locker assignment.</span>
                    </li>
                    <li className="flex items-start gap-space-xs">
                        <span className="material-symbols-outlined text-secondary text-[18px] shrink-0 mt-0.5">sync_alt</span>
                        <span><strong className="text-on-surface">Biometric Gear:</strong> Chest heart-rate monitors &amp; IMU sensors are provided at the Level 1 Tech Desk.</span>
                    </li>
                    <li className="flex items-start gap-space-xs">
                        <span className="material-symbols-outlined text-error text-[18px] shrink-0 mt-0.5">warning</span>
                        <span><strong className="text-on-surface">No-Show Policy:</strong> More than 2 missed sessions per month temporarily restricts 48h advance reservations.</span>
                    </li>
                </ul>
                <div className="mt-space-md pt-space-sm border-t border-surface-container-highest/40 flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-outline">Need immediate rescheduling?</span>
                    <button className="font-label-sm text-label-sm text-primary hover:text-secondary font-semibold transition-colors flex items-center gap-1">
                        <span>Chat with Front Desk</span>
                        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </button>
                </div>
            </div>
            {/* Quick Bookmarked / Saved Sessions */}
            <div className="bg-surface-container-low rounded-xl p-space-lg shadow-sm">
                <div className="flex items-center justify-between mb-space-sm">
                    <div className="flex items-center gap-space-xs">
                        <span className="material-symbols-outlined text-tertiary text-[20px]">bookmarks</span>
                        <h3 className="font-headline-sm text-headline-sm text-on-surface">Saved &amp; Favorite Sessions</h3>
                    </div>
                    <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-surface-container-high text-tertiary font-bold" id="saved-counter">2 Saved</span>
                </div>
                <div className="flex flex-col gap-2" id="saved-classes-container">
                    {/* Item 1 */}
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors">
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-primary-container/20 text-primary flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-[16px]">sports_tennis</span>
                            </div>
                            <div className="truncate">
                                <h4 className="font-label-md text-label-md text-on-surface truncate font-semibold">Smart Court Tennis Practice</h4>
                                <p className="font-body-sm text-body-sm text-on-surface-variant">Thursday, 09:00</p>
                            </div>
                        </div>
                        <button className="font-label-sm text-label-sm text-primary hover:underline ml-2 whitespace-nowrap" onclick="openBooking('Smart Court Tennis Practice', '09:00', 'Coach Sarah Lin')">
                            Quick Book
                        </button>
                    </div>
                    {/* Item 2 */}
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors">
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-tertiary-container/20 text-tertiary flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-[16px]">mode_fan</span>
                            </div>
                            <div className="truncate">
                                <h4 className="font-label-md text-label-md text-on-surface truncate font-semibold">Cryo Chamber Bio-Recovery</h4>
                                <p className="font-body-sm text-body-sm text-on-surface-variant">Saturday, 14:00</p>
                            </div>
                        </div>
                        <button className="font-label-sm text-label-sm text-primary hover:underline ml-2 whitespace-nowrap" onclick="openBooking('Cryo Chamber Bio-Recovery', '14:00', 'Dr. Elena Marks')">
                            Quick Book
                        </button>
                    </div>
                </div>
            </div>
            {/* Facility Capacity Live Sensor Visualizer */}
            <div className="bg-surface-container-low rounded-xl p-space-lg shadow-sm">
                <div className="flex items-center justify-between mb-space-sm">
                    <div className="flex items-center gap-space-xs">
                        <span className="material-symbols-outlined text-secondary text-[20px]">hub</span>
                        <h3 className="font-headline-sm text-headline-sm text-on-surface">Live Facility Capacity</h3>
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Live</span>
                </div>
                <div className="space-y-space-sm font-label-sm text-label-sm">
                    {/* Zone A */}
                    <div>
                        <div className="flex justify-between text-on-surface mb-1">
                            <span>Main Strength &amp; Cardio Arena</span>
                            <span className="text-tertiary font-bold">42% (Optimal Space)</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-surface-container-lowest overflow-hidden">
                            <div className="h-full bg-tertiary rounded-full" style={{ width: '42%' }}></div>
                        </div>
                    </div>
                    {/* Zone B */}
                    <div>
                        <div className="flex justify-between text-on-surface mb-1">
                            <span>Zen Yoga &amp; Sound Studio</span>
                            <span className="text-primary font-bold">80% (Nearly Full)</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-surface-container-lowest overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: '80%' }}></div>
                        </div>
                    </div>
                    {/* Zone C */}
                    <div>
                        <div className="flex justify-between text-on-surface mb-1">
                            <span>Smart Tennis Courts</span>
                            <span className="text-secondary font-bold">66% (2 Courts Free)</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-surface-container-lowest overflow-hidden">
                            <div className="h-full bg-secondary rounded-full" style={{ width: '66%' }}></div>
                        </div>
                    </div>
                </div>
                <div className="mt-space-md p-space-sm rounded-lg bg-surface-container flex items-center gap-space-xs text-body-sm font-body-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-primary text-[18px]">lightbulb</span>
                    <span>Peak serenity hours: <strong>13:00 - 16:00</strong> daily.</span>
                </div>
            </div>
        </aside>
    </div>
    {/* Booking Confirmation Modal (Hidden by Default) */}
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 hidden opacity-0 transition-opacity duration-200" id="booking-modal">
        <div className="w-full max-w-lg bg-surface-container-low rounded-2xl p-space-lg shadow-2xl flex flex-col gap-space-md transform scale-95 transition-transform duration-200" id="modal-container">
            <div className="flex items-center justify-between border-b border-surface-container-highest/40 pb-space-sm">
                <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center">
                        <span className="material-symbols-outlined text-[20px]">fitness_center</span>
                    </div>
                    <div>
                        <h3 className="font-headline-md text-headline-md text-on-surface">Confirm Reservation</h3>
                        <p className="font-body-sm text-body-sm text-outline">NEXUS Smart Facility Reservation</p>
                    </div>
                </div>
                <button className="w-8 h-8 rounded-lg bg-surface-container text-on-surface-variant hover:text-on-surface flex items-center justify-center" onclick="closeModal()">
                    <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
            </div>
            <div className="bg-surface-container p-space-md rounded-xl flex flex-col gap-2">
                <div className="flex justify-between items-center text-body-md font-body-md">
                    <span className="text-on-surface-variant">Class / Court:</span>
                    <span className="font-semibold text-on-surface text-right" id="modal-class-name">HIIT Performance</span>
                </div>
                <div className="flex justify-between items-center text-body-md font-body-md">
                    <span className="text-on-surface-variant">Time Slot:</span>
                    <span className="font-semibold text-primary" id="modal-class-time">17:30 - 18:30</span>
                </div>
                <div className="flex justify-between items-center text-body-md font-body-md">
                    <span className="text-on-surface-variant">Lead Instructor:</span>
                    <span className="font-semibold text-on-surface" id="modal-class-coach">Coach Marcus Vance</span>
                </div>
                <div className="flex justify-between items-center text-body-md font-body-md">
                    <span className="text-on-surface-variant">Athlete Profile:</span>
                    <span className="text-tertiary font-semibold">Alex Morgan (NX-88071)</span>
                </div>
            </div>
            {/* Option Switches */}
            <div className="flex flex-col gap-2">
                <label className="flex items-center justify-between p-2 rounded-lg bg-surface-container hover:bg-surface-container-high cursor-pointer transition-colors">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[20px] text-tertiary">watch</span>
                        <span className="font-body-sm text-body-sm text-on-surface">Reserve Nexus telemetry chest strap</span>
                    </div>
                    <input checked="" className="w-4 h-4 accent-primary rounded cursor-pointer" type="checkbox"/>
                </label>
                <label className="flex items-center justify-between p-2 rounded-lg bg-surface-container hover:bg-surface-container-high cursor-pointer transition-colors">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[20px] text-primary">notifications_active</span>
                        <span className="font-body-sm text-body-sm text-on-surface">SMS &amp; Calendar alert 30 minutes prior</span>
                    </div>
                    <input checked="" className="w-4 h-4 accent-primary rounded cursor-pointer" type="checkbox"/>
                </label>
            </div>
            <div className="flex items-center gap-space-sm pt-space-xs">
                <button className="w-1/2 py-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold transition-colors" onclick="closeModal()">
                    Back
                </button>
                <button className="w-1/2 py-2.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-semibold transition-all shadow-md active:scale-95" onclick="confirmBooking()">
                    Complete Booking
                </button>
            </div>
        </div>
    </div>
</div>
    
    </>
  );
};

export default BookClass;
