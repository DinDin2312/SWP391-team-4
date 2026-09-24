import React from 'react';

const MySchedule = () => {
  return (
    <>
      <div className="flex flex-col w-full pb-space-xl">
    {/* Ensure Sidebar 'My Schedule' item is marked as active in application state */}
    
    {/* Top Hero Context Bar / Title & Subtitle */}
    <div className="flex flex-col gap-space-sm mb-space-lg">
        <div className="flex flex-wrap items-center justify-between gap-space-md">
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-space-xs text-primary font-label-sm text-label-sm uppercase tracking-wider">
                    <span>Personal Schedule</span>
                    <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                    <span className="text-tertiary">Training &amp; Court Reservations</span>
                </div>
                <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">Nexus Sports Calendar</h1>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
                    Manage your athletic coaching, group fitness classes, and digitized court bookings for October 2026.
                </p>
            </div>
            {/* Quick Action Stats */}
            <div className="flex items-center gap-space-sm bg-surface-container-low px-space-md py-space-sm rounded-xl shadow-sm">
                <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-tertiary">
                    <span className="material-symbols-outlined text-[22px]">vital_signs</span>
                </div>
                <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Biometric Readiness</span>
                    <div className="flex items-center gap-1.5">
                        <span className="font-headline-sm text-headline-sm text-on-surface font-bold">94%</span>
                        <span className="font-label-sm text-label-sm px-1.5 py-0.5 rounded bg-surface-container-highest text-tertiary">Optimal</span>
                    </div>
                </div>
            </div>
        </div>
        {/* Category Filters & Month Control Header Bar */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-space-md mt-space-sm pt-space-sm">
            {/* Tabs */}
            <div className="flex items-center gap-space-xs overflow-x-auto pb-1 xl:pb-0 scrollbar-none">
                <button className="px-space-md py-2 rounded-lg bg-primary-container text-on-primary-container font-label-md text-label-md flex items-center gap-1.5 shrink-0 shadow-sm transition-all hover:bg-inverse-primary hover:text-surface">
                    <span>All Sessions</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-surface-container-lowest text-primary font-label-sm text-label-sm">7</span>
                </button>
                <button className="px-space-md py-2 rounded-lg bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface font-label-md text-label-md shrink-0 transition-all">
                    Yoga &amp; Pilates
                </button>
                <button className="px-space-md py-2 rounded-lg bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface font-label-md text-label-md shrink-0 transition-all">
                    Gym &amp; PT
                </button>
                <button className="px-space-md py-2 rounded-lg bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface font-label-md text-label-md shrink-0 transition-all">
                    Smart Courts
                </button>
                <button className="px-space-md py-2 rounded-lg bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface font-label-md text-label-md shrink-0 transition-all">
                    Recovery &amp; Cryo
                </button>
            </div>
            {/* Controls: Month & Book Button */}
            <div className="flex items-center flex-wrap gap-space-sm">
                {/* Month Picker */}
                <div className="flex items-center bg-surface-container-low rounded-lg p-1">
                    <button className="w-8 h-8 flex items-center justify-center rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all" title="Previous Month">
                        <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                    </button>
                    <span className="font-headline-sm text-headline-sm px-space-md text-on-surface">October 2026</span>
                    <button className="w-8 h-8 flex items-center justify-center rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all" title="Next Month">
                        <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                    </button>
                </div>
                <button className="px-space-md py-2 rounded-lg bg-surface-container-high text-on-surface hover:bg-surface-container-highest font-label-md text-label-md transition-all">
                    Today
                </button>
                <button className="flex items-center gap-space-xs px-space-md py-2 rounded-lg bg-primary text-on-primary font-label-lg text-label-lg hover:bg-primary-fixed-dim transition-all shadow-md">
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    <span>Book New Session</span>
                </button>
            </div>
        </div>
    </div>
    {/* Main Grid: 70% Calendar Grid | 30% Day Agenda Sidebar */}
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        {/* LEFT COLUMN: 70% Width (approx 8 of 12 cols on desktop) */}
        <div className="lg:col-span-8 flex flex-col gap-space-md">
            {/* Calendar Table Container */}
            <div className="bg-surface-container-low rounded-xl p-space-md shadow-md flex flex-col">
                {/* Days Header (Mon -> Sun) */}
                <div className="grid grid-cols-7 gap-1 pb-space-sm mb-space-xs text-center font-label-sm text-label-sm text-on-surface-variant tracking-wider uppercase">
                    <div className="py-1">Mon</div>
                    <div className="py-1">Tue</div>
                    <div className="py-1">Wed</div>
                    <div className="py-1">Thu</div>
                    <div className="py-1">Fri</div>
                    <div className="py-1 text-primary">Sat</div>
                    <div className="py-1 text-primary">Sun</div>
                </div>
                {/* 5-Week Calendar Grid: October 2026 (Starts Thursday Oct 1) */}
                <div className="grid grid-cols-7 gap-1.5 auto-rows-fr">
                    {/* Leading Empty Days (Sep 28, 29, 30) */}
                    <div className="min-h-[110px] p-2 rounded-lg bg-surface-container-lowest/40 opacity-30 flex flex-col">
                        <span className="font-label-md text-label-md text-on-surface-variant">28</span>
                    </div>
                    <div className="min-h-[110px] p-2 rounded-lg bg-surface-container-lowest/40 opacity-30 flex flex-col">
                        <span className="font-label-md text-label-md text-on-surface-variant">29</span>
                    </div>
                    <div className="min-h-[110px] p-2 rounded-lg bg-surface-container-lowest/40 opacity-30 flex flex-col">
                        <span className="font-label-md text-label-md text-on-surface-variant">30</span>
                    </div>
                    {/* Oct 1 (Thu) - Yoga */}
                    <div className="min-h-[110px] p-2 rounded-lg bg-surface-container hover:bg-surface-container-high transition-all flex flex-col justify-between cursor-pointer group">
                        <div className="flex items-center justify-between">
                            <span className="font-label-md text-label-md text-on-surface group-hover:text-primary transition-colors">01</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                        </div>
                        <div className="mt-1 flex flex-col gap-1">
                            <div className="px-1.5 py-1 rounded bg-surface-container-high group-hover:bg-surface-bright text-tertiary font-label-sm text-label-sm truncate">
                                <span className="text-on-surface font-semibold">13:00</span> Yoga Stretch
                            </div>
                        </div>
                        <div className="h-1"></div>
                    </div>
                    {/* Oct 2 (Fri) */}
                    <div className="min-h-[110px] p-2 rounded-lg bg-surface-container/60 hover:bg-surface-container transition-all flex flex-col justify-between cursor-pointer">
                        <span className="font-label-md text-label-md text-on-surface-variant">02</span>
                        <div></div>
                    </div>
                    {/* Oct 3 (Sat) - Conditioning */}
                    <div className="min-h-[110px] p-2 rounded-lg bg-surface-container hover:bg-surface-container-high transition-all flex flex-col justify-between cursor-pointer group">
                        <div className="flex items-center justify-between">
                            <span className="font-label-md text-label-md text-on-surface font-semibold group-hover:text-primary transition-colors">03</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                        </div>
                        <div className="mt-1 flex flex-col gap-1">
                            <div className="px-1.5 py-1 rounded bg-secondary-container/50 text-secondary font-label-sm text-label-sm truncate">
                                <span className="text-on-surface font-semibold">13:00</span> Conditioning
                            </div>
                        </div>
                        <div className="h-1"></div>
                    </div>
                    {/* Oct 4 (Sun) */}
                    <div className="min-h-[110px] p-2 rounded-lg bg-surface-container/60 hover:bg-surface-container transition-all flex flex-col justify-between cursor-pointer">
                        <span className="font-label-md text-label-md text-on-surface-variant">04</span>
                        <div></div>
                    </div>
                    {/* Oct 5 (Mon) */}
                    <div className="min-h-[110px] p-2 rounded-lg bg-surface-container/60 hover:bg-surface-container transition-all flex flex-col justify-between cursor-pointer">
                        <span className="font-label-md text-label-md text-on-surface-variant">05</span>
                        <div></div>
                    </div>
                    {/* Oct 6 (Tue) */}
                    <div className="min-h-[110px] p-2 rounded-lg bg-surface-container/60 hover:bg-surface-container transition-all flex flex-col justify-between cursor-pointer">
                        <span className="font-label-md text-label-md text-on-surface-variant">06</span>
                        <div></div>
                    </div>
                    {/* Oct 7 (Wed) - HIIT */}
                    <div className="min-h-[110px] p-2 rounded-lg bg-surface-container hover:bg-surface-container-high transition-all flex flex-col justify-between cursor-pointer group">
                        <div className="flex items-center justify-between">
                            <span className="font-label-md text-label-md text-on-surface group-hover:text-primary transition-colors">07</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
                        </div>
                        <div className="mt-1 flex flex-col gap-1">
                            <div className="px-1.5 py-1 rounded bg-surface-container-high text-primary font-label-sm text-label-sm truncate">
                                <span className="text-on-surface font-semibold">18:00</span> HIIT Training
                            </div>
                        </div>
                        <div className="h-1"></div>
                    </div>
                    {/* Oct 8 (Thu) */}
                    <div className="min-h-[110px] p-2 rounded-lg bg-surface-container/60 hover:bg-surface-container transition-all flex flex-col justify-between cursor-pointer">
                        <span className="font-label-md text-label-md text-on-surface-variant">08</span>
                        <div></div>
                    </div>
                    {/* Oct 9 (Fri) */}
                    <div className="min-h-[110px] p-2 rounded-lg bg-surface-container/60 hover:bg-surface-container transition-all flex flex-col justify-between cursor-pointer">
                        <span className="font-label-md text-label-md text-on-surface-variant">09</span>
                        <div></div>
                    </div>
                    {/* Oct 10 (Sat) - Smart Tennis */}
                    <div className="min-h-[110px] p-2 rounded-lg bg-surface-container hover:bg-surface-container-high transition-all flex flex-col justify-between cursor-pointer group">
                        <div className="flex items-center justify-between">
                            <span className="font-label-md text-label-md text-on-surface font-semibold group-hover:text-primary transition-colors">10</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-tertiary-fixed"></span>
                        </div>
                        <div className="mt-1 flex flex-col gap-1">
                            <div className="px-1.5 py-1 rounded bg-surface-container-high text-tertiary-fixed font-label-sm text-label-sm truncate">
                                <span className="text-on-surface font-semibold">09:00</span> Tennis C2
                            </div>
                        </div>
                        <div className="h-1"></div>
                    </div>
                    {/* Oct 11 (Sun) */}
                    <div className="min-h-[110px] p-2 rounded-lg bg-surface-container/60 hover:bg-surface-container transition-all flex flex-col justify-between cursor-pointer">
                        <span className="font-label-md text-label-md text-on-surface-variant">11</span>
                        <div></div>
                    </div>
                    {/* Oct 12 (Mon) */}
                    <div className="min-h-[110px] p-2 rounded-lg bg-surface-container/60 hover:bg-surface-container transition-all flex flex-col justify-between cursor-pointer">
                        <span className="font-label-md text-label-md text-on-surface-variant">12</span>
                        <div></div>
                    </div>
                    {/* Oct 13 (Tue) */}
                    <div className="min-h-[110px] p-2 rounded-lg bg-surface-container/60 hover:bg-surface-container transition-all flex flex-col justify-between cursor-pointer">
                        <span className="font-label-md text-label-md text-on-surface-variant">13</span>
                        <div></div>
                    </div>
                    {/* Oct 14 (Wed) - TODAY (Active Highlight Glow) */}
                    <div className="min-h-[125px] p-2 rounded-xl bg-surface-container-highest shadow-xl shadow-primary-container/10 flex flex-col justify-between cursor-pointer relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-bl-lg"></div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <span className="font-headline-sm text-headline-sm text-primary font-bold">14</span>
                                <span className="px-1.5 py-0.2 rounded bg-primary text-on-primary font-label-sm text-label-sm uppercase">TODAY</span>
                            </div>
                            <span className="font-label-sm text-label-sm text-tertiary font-bold">3 booked</span>
                        </div>
                        {/* Mini Session Badges for Oct 14 */}
                        <div className="mt-1 flex flex-col gap-1">
                            <div className="px-1.5 py-0.5 rounded bg-surface-container text-tertiary font-label-sm text-label-sm truncate">
                                <span className="font-semibold text-on-surface">13:00</span> Yoga Stretch
                            </div>
                            <div className="px-1.5 py-0.5 rounded bg-surface-container text-primary font-label-sm text-label-sm truncate">
                                <span className="font-semibold text-on-surface">17:30</span> HIIT Endurance
                            </div>
                            <div className="px-1.5 py-0.5 rounded bg-secondary-container/60 text-secondary font-label-sm text-label-sm truncate">
                                <span className="font-semibold text-on-surface">19:15</span> Cryo Chamber
                            </div>
                        </div>
                    </div>
                    {/* Oct 15 (Thu) */}
                    <div className="min-h-[110px] p-2 rounded-lg bg-surface-container/60 hover:bg-surface-container transition-all flex flex-col justify-between cursor-pointer">
                        <span className="font-label-md text-label-md text-on-surface-variant">15</span>
                        <div></div>
                    </div>
                    {/* Oct 16 (Fri) - Pilates */}
                    <div className="min-h-[110px] p-2 rounded-lg bg-surface-container hover:bg-surface-container-high transition-all flex flex-col justify-between cursor-pointer group">
                        <div className="flex items-center justify-between">
                            <span className="font-label-md text-label-md text-on-surface group-hover:text-primary transition-colors">16</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                        </div>
                        <div className="mt-1 flex flex-col gap-1">
                            <div className="px-1.5 py-1 rounded bg-surface-container-high text-tertiary font-label-sm text-label-sm truncate">
                                <span className="text-on-surface font-semibold">13:00</span> Pilates Core
                            </div>
                        </div>
                        <div className="h-1"></div>
                    </div>
                    {/* Oct 17 (Sat) - Swimming */}
                    <div className="min-h-[110px] p-2 rounded-lg bg-surface-container hover:bg-surface-container-high transition-all flex flex-col justify-between cursor-pointer group">
                        <div className="flex items-center justify-between">
                            <span className="font-label-md text-label-md text-on-surface font-semibold group-hover:text-primary transition-colors">17</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-tertiary-container"></span>
                        </div>
                        <div className="mt-1 flex flex-col gap-1">
                            <div className="px-1.5 py-1 rounded bg-surface-container-high text-tertiary font-label-sm text-label-sm truncate">
                                <span className="text-on-surface font-semibold">16:00</span> Lap Swim
                            </div>
                        </div>
                        <div className="h-1"></div>
                    </div>
                    {/* Oct 18 (Sun) */}
                    <div className="min-h-[110px] p-2 rounded-lg bg-surface-container/60 hover:bg-surface-container transition-all flex flex-col justify-between cursor-pointer">
                        <span className="font-label-md text-label-md text-on-surface-variant">18</span>
                        <div></div>
                    </div>
                    {/* Oct 19 (Mon) */}
                    <div className="min-h-[110px] p-2 rounded-lg bg-surface-container/60 hover:bg-surface-container transition-all flex flex-col justify-between cursor-pointer">
                        <span className="font-label-md text-label-md text-on-surface-variant">19</span>
                        <div></div>
                    </div>
                    {/* Oct 20 (Tue) */}
                    <div className="min-h-[110px] p-2 rounded-lg bg-surface-container/60 hover:bg-surface-container transition-all flex flex-col justify-between cursor-pointer">
                        <span className="font-label-md text-label-md text-on-surface-variant">20</span>
                        <div></div>
                    </div>
                    {/* Oct 21 (Wed) - Biometrics */}
                    <div className="min-h-[110px] p-2 rounded-lg bg-surface-container hover:bg-surface-container-high transition-all flex flex-col justify-between cursor-pointer group">
                        <div className="flex items-center justify-between">
                            <span className="font-label-md text-label-md text-on-surface group-hover:text-primary transition-colors">21</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                        </div>
                        <div className="mt-1 flex flex-col gap-1">
                            <div className="px-1.5 py-1 rounded bg-surface-container-high text-primary font-label-sm text-label-sm truncate">
                                <span className="text-on-surface font-semibold">17:30</span> Biometrics Lab
                            </div>
                        </div>
                        <div className="h-1"></div>
                    </div>
                    {/* Oct 22 (Thu) */}
                    <div className="min-h-[110px] p-2 rounded-lg bg-surface-container/60 hover:bg-surface-container transition-all flex flex-col justify-between cursor-pointer">
                        <span className="font-label-md text-label-md text-on-surface-variant">22</span>
                        <div></div>
                    </div>
                    {/* Oct 23 (Fri) */}
                    <div className="min-h-[110px] p-2 rounded-lg bg-surface-container/60 hover:bg-surface-container transition-all flex flex-col justify-between cursor-pointer">
                        <span className="font-label-md text-label-md text-on-surface-variant">23</span>
                        <div></div>
                    </div>
                    {/* Oct 24 (Sat) - Smart Badminton */}
                    <div className="min-h-[110px] p-2 rounded-lg bg-surface-container hover:bg-surface-container-high transition-all flex flex-col justify-between cursor-pointer group">
                        <div className="flex items-center justify-between">
                            <span className="font-label-md text-label-md text-on-surface font-semibold group-hover:text-primary transition-colors">24</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-tertiary-fixed"></span>
                        </div>
                        <div className="mt-1 flex flex-col gap-1">
                            <div className="px-1.5 py-1 rounded bg-surface-container-high text-tertiary-fixed font-label-sm text-label-sm truncate">
                                <span className="text-on-surface font-semibold">10:00</span> Badminton C1
                            </div>
                        </div>
                        <div className="h-1"></div>
                    </div>
                    {/* Oct 25 (Sun) */}
                    <div className="min-h-[110px] p-2 rounded-lg bg-surface-container/60 hover:bg-surface-container transition-all flex flex-col justify-between cursor-pointer">
                        <span className="font-label-md text-label-md text-on-surface-variant">25</span>
                        <div></div>
                    </div>
                    {/* Oct 26 (Mon) */}
                    <div className="min-h-[110px] p-2 rounded-lg bg-surface-container/60 hover:bg-surface-container transition-all flex flex-col justify-between cursor-pointer">
                        <span className="font-label-md text-label-md text-on-surface-variant">26</span>
                        <div></div>
                    </div>
                    {/* Oct 27 (Tue) */}
                    <div className="min-h-[110px] p-2 rounded-lg bg-surface-container/60 hover:bg-surface-container transition-all flex flex-col justify-between cursor-pointer">
                        <span className="font-label-md text-label-md text-on-surface-variant">27</span>
                        <div></div>
                    </div>
                    {/* Oct 28 (Wed) - Weightlifting */}
                    <div className="min-h-[110px] p-2 rounded-lg bg-surface-container hover:bg-surface-container-high transition-all flex flex-col justify-between cursor-pointer group">
                        <div className="flex items-center justify-between">
                            <span className="font-label-md text-label-md text-on-surface group-hover:text-primary transition-colors">28</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary-fixed"></span>
                        </div>
                        <div className="mt-1 flex flex-col gap-1">
                            <div className="px-1.5 py-1 rounded bg-surface-container-high text-secondary-fixed font-label-sm text-label-sm truncate">
                                <span className="text-on-surface font-semibold">13:00</span> Weightlifting PT
                            </div>
                        </div>
                        <div className="h-1"></div>
                    </div>
                    {/* Oct 29 (Thu) */}
                    <div className="min-h-[110px] p-2 rounded-lg bg-surface-container/60 hover:bg-surface-container transition-all flex flex-col justify-between cursor-pointer">
                        <span className="font-label-md text-label-md text-on-surface-variant">29</span>
                        <div></div>
                    </div>
                    {/* Oct 30 (Fri) */}
                    <div className="min-h-[110px] p-2 rounded-lg bg-surface-container/60 hover:bg-surface-container transition-all flex flex-col justify-between cursor-pointer">
                        <span className="font-label-md text-label-md text-on-surface-variant">30</span>
                        <div></div>
                    </div>
                    {/* Oct 31 (Sat) - Contrast Therapy */}
                    <div className="min-h-[110px] p-2 rounded-lg bg-surface-container hover:bg-surface-container-high transition-all flex flex-col justify-between cursor-pointer group">
                        <div className="flex items-center justify-between">
                            <span className="font-label-md text-label-md text-on-surface font-semibold group-hover:text-primary transition-colors">31</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                        </div>
                        <div className="mt-1 flex flex-col gap-1">
                            <div className="px-1.5 py-1 rounded bg-surface-container-high text-tertiary font-label-sm text-label-sm truncate">
                                <span className="text-on-surface font-semibold">15:00</span> Contrast Bath
                            </div>
                        </div>
                        <div className="h-1"></div>
                    </div>
                    {/* Trailing Empty Days for November (Nov 1) */}
                    <div className="min-h-[110px] p-2 rounded-lg bg-surface-container-lowest/40 opacity-30 flex flex-col">
                        <span className="font-label-md text-label-md text-on-surface-variant">01 Nov</span>
                    </div>
                </div>
                {/* Legend Bar at bottom of calendar */}
                <div className="flex flex-wrap items-center justify-between gap-space-sm pt-space-md mt-space-md bg-surface-container-lowest/50 px-space-md py-space-sm rounded-lg">
                    <div className="flex flex-wrap items-center gap-space-md font-label-sm text-label-sm text-on-surface-variant">
                        <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-tertiary"></span>
                            <span className="text-on-surface">Confirmed Class</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
                            <span className="text-on-surface">Personal Training / Lab</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-tertiary-fixed"></span>
                            <span className="text-on-surface">Smart Court Booking</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-primary-container"></span>
                            <span className="text-on-surface">Recovery Zone</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm">
                        <span className="material-symbols-outlined text-[16px]">touch_app</span>
                        <span>Click any day to inspect details</span>
                    </div>
                </div>
            </div>
            {/* Cancellation Policy Card */}
            <div className="bg-surface-container-low p-space-md rounded-xl flex items-center justify-between gap-space-md shadow-sm">
                <div className="flex items-start gap-space-sm">
                    <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0">
                        <span className="material-symbols-outlined text-[20px]">info</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="font-label-lg text-label-lg text-on-surface font-semibold">NEXUS Cancellation Policy</span>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                            Cancel at least 2 hours before session start time to retain monthly class credits. Late cancellations forfeit 1 token.
                        </p>
                    </div>
                </div>
                <button className="px-space-md py-1.5 rounded-lg bg-surface-container-high text-primary hover:bg-surface-container-highest font-label-md text-label-md shrink-0 transition-colors">
                    View Policy
                </button>
            </div>
            {/* Facility Court Overview Banner with Photo Placeholder */}
            <div className="relative overflow-hidden rounded-xl bg-surface-container-low p-space-lg flex flex-col md:flex-row items-center justify-between gap-space-lg shadow-md">
                <div className="flex flex-col gap-space-xs z-10 max-w-xl">
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-primary-container text-on-primary-container font-label-sm text-label-sm uppercase font-bold">Smart Arena</span>
                        <span className="text-tertiary font-label-sm text-label-sm uppercase tracking-wide">Optical Motion Tracking Live</span>
                    </div>
                    <h3 className="font-headline-lg text-headline-lg text-on-surface">Looking to practice on the Digitized Glass Court?</h3>
                    <p className="font-body-md text-body-md text-on-surface-variant">
                        Reserve automated ball cannons, high-speed line calling cameras, and real-time biomechanical racket telemetry.
                    </p>
                    <div className="pt-space-xs flex items-center gap-space-sm">
                        <button className="px-space-md py-2 rounded-lg bg-surface-container-highest text-on-surface hover:text-primary font-label-md text-label-md flex items-center gap-1.5 transition-colors">
                            <span className="material-symbols-outlined text-[18px]">sports_tennis</span>
                            <span>Reserve Court Now</span>
                        </button>
                    </div>
                </div>
                <div className="w-full md:w-56 h-36 rounded-lg overflow-hidden shrink-0 relative shadow-inner">
                    <img className="w-full h-full object-cover" data-alt="High-tech futuristic sports training facility featuring an illuminated electric blue digitized glass tennis court with glowing court markings and athlete biomechanical tracking sensors in a sleek dark obsidian sports lab." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBofxDrfktJjDw4K6MQejyaaPTxZq2AYjk5H5bG2W1aQthCfYnG0EsfZnZvMx8QwACIx-dEhGkjadk_6jrdk1SgP82NCshOP3ex8Fn7SRirQ95tXN2lxsl1NVwSmHprwr-aq_w9KOzYAXEfPUvjHDBXgTC4DttJez7-UDDnYv7CNrMiX1axvMBvr299IM2efiiDdhli2OlIJpVJwBmcrw2nhwx04LoG1WdoX2EINZ02ko0ooBUqHTJ_"/>
                    <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent"></div>
                </div>
            </div>
        </div>
        {/* RIGHT COLUMN: 30% Width (approx 4 of 12 cols on desktop) - Selected Day Agenda */}
        <div className="lg:col-span-4 flex flex-col gap-space-md">
            {/* Agenda Header */}
            <div className="bg-surface-container-low p-space-md rounded-xl shadow-md flex flex-col gap-space-md">
                <div className="flex items-start justify-between">
                    <div className="flex flex-col">
                        <span className="font-label-sm text-label-sm text-tertiary uppercase tracking-wider font-semibold">SESSION DETAILS</span>
                        <h2 className="font-headline-md text-headline-md text-on-surface font-bold">Wednesday, Oct 14</h2>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">Nexus High-Performance Center</span>
                    </div>
                    <div className="px-2.5 py-1 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm font-semibold flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-primary"></span>
                        <span>3 Sessions</span>
                    </div>
                </div>
                {/* Session Cards Stack */}
                <div className="flex flex-col gap-space-sm">
                    {/* Card 1: Yoga Stretch */}
                    <div className="p-space-md rounded-xl bg-surface-container flex flex-col gap-space-sm hover:bg-surface-container-high transition-all shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 font-label-sm text-label-sm text-on-surface font-semibold">
                                <span className="material-symbols-outlined text-primary text-[18px]">schedule</span>
                                <span>13:00 - 14:30</span>
                                <span className="text-on-surface-variant font-normal">(90 min)</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-surface-container-lowest text-tertiary font-label-sm text-label-sm font-bold tracking-wide">
                CONFIRMED
              </span>
                        </div>
                        <div className="flex flex-col">
                            <h4 className="font-headline-sm text-headline-sm text-on-surface font-semibold leading-snug">
                                Yoga Stretch &amp; Neural Recovery
                            </h4>
                            <span className="font-body-sm text-body-sm text-on-surface-variant">Mon-Wed-Fri Cycle</span>
                        </div>
                        <div className="grid grid-cols-2 gap-space-xs text-body-sm text-body-sm text-on-surface-variant pt-space-xs">
                            <div className="flex items-center gap-1 truncate">
                                <span className="material-symbols-outlined text-[16px] text-tertiary">person</span>
                                <span className="truncate">Coach Mai Anh Tran</span>
                            </div>
                            <div className="flex items-center gap-1 truncate">
                                <span className="material-symbols-outlined text-[16px] text-tertiary">location_on</span>
                                <span className="truncate">Zen Studio, Lvl 2</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-space-sm pt-space-xs">
                            <button className="flex-1 py-1.5 rounded-lg bg-primary-container text-on-primary-container hover:bg-inverse-primary hover:text-surface font-label-md text-label-md flex items-center justify-center gap-1 transition-colors">
                                <span className="material-symbols-outlined text-[16px]">qr_code</span>
                                <span>Check-in QR</span>
                            </button>
                            <button className="px-space-md py-1.5 rounded-lg bg-surface-container-highest text-on-surface hover:text-error font-label-md text-label-md transition-colors" title="Reschedule or Cancel">
                                Reschedule
                            </button>
                        </div>
                    </div>
                    {/* Card 2: HIIT Performance */}
                    <div className="p-space-md rounded-xl bg-surface-container flex flex-col gap-space-sm hover:bg-surface-container-high transition-all shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 font-label-sm text-label-sm text-on-surface font-semibold">
                                <span className="material-symbols-outlined text-primary text-[18px]">schedule</span>
                                <span>17:30 - 18:30</span>
                                <span className="text-on-surface-variant font-normal">(60 min)</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-surface-container-lowest text-tertiary font-label-sm text-label-sm font-bold tracking-wide">
                CONFIRMED
              </span>
                        </div>
                        <div className="flex flex-col">
                            <h4 className="font-headline-sm text-headline-sm text-on-surface font-semibold leading-snug">
                                HIIT Performance &amp; Biometrics
                            </h4>
                            <span className="font-body-sm text-body-sm text-on-surface-variant">Heart Rate Zone 4/5 Calibration</span>
                        </div>
                        <div className="grid grid-cols-2 gap-space-xs text-body-sm text-body-sm text-on-surface-variant pt-space-xs">
                            <div className="flex items-center gap-1 truncate">
                                <span className="material-symbols-outlined text-[16px] text-tertiary">sports_gymnastics</span>
                                <span className="truncate">Coach Marcus Vance</span>
                            </div>
                            <div className="flex items-center gap-1 truncate">
                                <span className="material-symbols-outlined text-[16px] text-tertiary">location_on</span>
                                <span className="truncate">Functional Lab 01</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-space-sm pt-space-xs">
                            <button className="flex-1 py-1.5 rounded-lg bg-primary-container text-on-primary-container hover:bg-inverse-primary hover:text-surface font-label-md text-label-md flex items-center justify-center gap-1 transition-colors">
                                <span className="material-symbols-outlined text-[16px]">qr_code</span>
                                <span>Check-in QR</span>
                            </button>
                            <button className="px-space-md py-1.5 rounded-lg bg-surface-container-highest text-on-surface hover:text-error font-label-md text-label-md transition-colors">
                                Reschedule
                            </button>
                        </div>
                    </div>
                    {/* Card 3: Cryo Recovery Chamber */}
                    <div className="p-space-md rounded-xl bg-surface-container-high flex flex-col gap-space-sm shadow-sm relative overflow-hidden">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 font-label-sm text-label-sm text-on-surface font-semibold">
                                <span className="material-symbols-outlined text-secondary text-[18px]">ac_unit</span>
                                <span>19:15 - 20:00</span>
                                <span className="text-on-surface-variant font-normal">(45 min)</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-bold tracking-wide flex items-center gap-1">
<span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse"></span>
<span>STARTING SOON</span>
</span>
                        </div>
                        <div className="flex flex-col">
                            <h4 className="font-headline-sm text-headline-sm text-on-surface font-semibold leading-snug">
                                Cryo Recovery Chamber (-110Â°C)
                            </h4>
                            <span className="font-body-sm text-body-sm text-on-surface-variant">Cellular Anti-Inflammation Protocol</span>
                        </div>
                        <div className="grid grid-cols-2 gap-space-xs text-body-sm text-body-sm text-on-surface-variant pt-space-xs">
                            <div className="flex items-center gap-1 truncate">
                                <span className="material-symbols-outlined text-[16px] text-secondary">medical_services</span>
                                <span className="truncate">Dr. Elena Marks</span>
                            </div>
                            <div className="flex items-center gap-1 truncate">
                                <span className="material-symbols-outlined text-[16px] text-secondary">location_on</span>
                                <span className="truncate">Recovery Zone 4</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-space-sm pt-space-xs">
                            <button className="flex-1 py-1.5 rounded-lg bg-secondary text-on-secondary hover:bg-secondary-fixed font-label-md text-label-md flex items-center justify-center gap-1 transition-colors font-bold shadow-sm">
                                <span className="material-symbols-outlined text-[16px]">lock_open</span>
                                <span>Unlock Chamber</span>
                            </button>
                            <button className="px-space-md py-1.5 rounded-lg bg-surface-container-highest text-on-surface hover:text-error font-label-md text-label-md transition-colors">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {/* Monthly Class Allocation Progress Widget */}
            <div className="bg-surface-container-low p-space-md rounded-xl shadow-md flex flex-col gap-space-sm">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">Monthly Allocation</span>
                        <span className="font-headline-sm text-headline-sm text-on-surface font-bold">14 / 20 Used</span>
                    </div>
                    <span className="font-headline-sm text-headline-sm text-primary font-bold">70%</span>
                </div>
                {/* Custom Progress Bar */}
                <div className="w-full h-2 rounded-full bg-surface-container-highest overflow-hidden">
                    <div className="h-full bg-primary-container rounded-full" style={{ width: '70%' }}></div>
                </div>
                <div className="flex items-center justify-between text-body-sm font-body-sm text-on-surface-variant pt-space-xs">
                    <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                        <span>6 sessions remaining</span>
                    </div>
                    <span>Renews Nov 1, 2026</span>
                </div>
                <div className="mt-space-xs p-space-sm rounded-lg bg-surface-container flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[20px]">verified</span>
                        <span className="font-label-md text-label-md text-on-surface font-medium">1-Month Gym Pass PRO</span>
                    </div>
                    <span className="font-label-sm text-label-sm text-tertiary uppercase">Active</span>
                </div>
            </div>
            {/* Sync to Calendar Utility */}
            <div className="bg-surface-container-low p-space-md rounded-xl shadow-md flex flex-col gap-space-sm">
                <div className="flex items-start gap-space-sm">
                    <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-primary shrink-0">
                        <span className="material-symbols-outlined text-[20px]">sync</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="font-label-lg text-label-lg text-on-surface font-semibold">Calendar Sync</span>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                            Sync your personal schedule with Google Calendar or Apple iCal to receive real-time push alerts.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-space-sm pt-space-xs">
                    <button className="flex-1 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-md text-label-md flex items-center justify-center gap-1 transition-colors">
                        <span className="material-symbols-outlined text-[16px]">calendar_add_on</span>
                        <span>Google Sync</span>
                    </button>
                    <button className="flex-1 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-md text-label-md flex items-center justify-center gap-1 transition-colors">
                        <span className="material-symbols-outlined text-[16px]">event</span>
                        <span>Export .ics</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>
    </>
  );
};

export default MySchedule;

