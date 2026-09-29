import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, ShoppingBag, Percent, Smartphone, RefreshCw, 
  Dumbbell, Flame, Trophy, Shield, Gauge, Activity, Snowflake, 
  Building2, Lock, QrCode, FileCheck, ArrowRight, CheckCircle2,
  Trash2, ShoppingCart, Check, ShieldCheck, Tag,
  CircleDollarSign, DollarSign, BadgeCheck
} from 'lucide-react';

const packages = [
  {
    id: 1,
    name: "Standard Fitness Pass",
    category: "membership",
    validity: "30 Days Validity",
    desc: "Foundation access for rigorous solo training & Olympic free-weight zones.",
    price: 1200000,
    priceSuffix: "/ month",
    icon: Dumbbell,
    iconColor: "text-primary",
    iconBg: "bg-surface-container-high group-hover:bg-primary-container/20 text-primary",
    features: [
      "Full access to Gym & Olympic Free Weights",
      "Smart Locker with contactless RFID pairing",
      "Standard Nexus Telemetry app sync",
      "Complimentary electrolyte hydration & linens"
    ]
  },
  {
    id: 2,
    name: "Pro Athlete Suite",
    category: "membership",
    validity: "30 Days Full Pass",
    desc: "High-frequency performance optimization with coach supervision & analytics.",
    price: 2400000,
    priceSuffix: "/ month",
    icon: Trophy,
    popular: true,
    tag: "Most Popular • Recommended",
    iconBg: "bg-primary-container text-on-primary-container",
    features: [
      "All Standard access & multi-club privileges",
      "Unlimited Yoga, Functional HIIT & Cycling sessions",
      "4 One-on-One Master Trainer consultations",
      "Priority Smart Tennis & Badminton court slots",
      "Weekly real-time Biometrics & VO2 Max telemetry"
    ]
  },
  {
    id: 3,
    name: "Elite All-Access Lab",
    category: "membership",
    validity: "VIP 30 Days",
    desc: "Uncompromised sports science protocols, physiotherapy & complete facility freedom.",
    price: 4500000,
    priceSuffix: "/ month",
    icon: Shield,
    iconColor: "text-tertiary",
    iconBg: "bg-surface-container-high group-hover:bg-tertiary/20 text-tertiary",
    features: [
      "Unrestricted entry to all zones & indoor courts",
      "Unlimited Cryotherapy (-110°C) & Hyperbaric O2",
      "Weekly 3D Gait & biomechanical motion scans",
      "Dedicated Sports Physiotherapist concierge",
      "4 VIP Guest Passes included per cycle"
    ]
  },
  {
    id: 4,
    name: "10-Session HIIT & Functional",
    category: "combo",
    validity: "60 Days Validity",
    typeTag: "10 SESSIONS",
    typeSuffix: "FLEX PACK",
    desc: "High-output conditioning led by senior sports lab coaches with HR live syncing.",
    price: 1850000,
    priceSuffix: "/ 10 classes",
    icon: Gauge,
    iconColor: "text-primary",
    iconBg: "bg-surface-container-high group-hover:bg-primary/20 text-primary",
    features: [
      "10 Coach-led high intensity training blocks",
      "Medical-grade heart rate telemetry band loaner",
      "Free reschedule penalty-free up to 2 hours",
      "Nutritional recovery smoothie perk post-session"
    ]
  },
  {
    id: 5,
    name: "Zen Yoga & Deep Recovery",
    category: "combo",
    validity: "45 Days Validity",
    typeTag: "8 CLASSES + SPA",
    typeSuffix: "WELLNESS",
    desc: "Holistic biomechanical mobility, sound frequency therapy, and nervous system reset.",
    price: 1450000,
    priceSuffix: "/ 8 classes",
    icon: Activity,
    iconColor: "text-tertiary",
    iconBg: "bg-surface-container-high group-hover:bg-tertiary/20 text-tertiary",
    features: [
      "8 Restorative Yoga & Sound Bath sessions",
      "2 Infrared Sauna & Cold Plunge spa tokens",
      "Lululemon mat & essential oil kit provided",
      "Complimentary range-of-motion assessment"
    ]
  },
  {
    id: 6,
    name: "Cryo Bio-Recovery Chamber",
    category: "amenity",
    validity: "Best Recovery Value",
    typeTag: "5 SESSIONS",
    typeSuffix: "CLINICAL",
    desc: "Whole-body sub-zero cryotherapy to flush systemic inflammation and boost ATP reload.",
    price: 1200000,
    priceSuffix: "/ 5 sessions",
    icon: Snowflake,
    iconColor: "text-tertiary",
    iconBg: "bg-surface-container-high group-hover:bg-tertiary-container/30 text-tertiary",
    features: [
      "5 Whole-body -110°C cryotherapy immersions",
      "Accelerated muscle repair & metabolic reboot",
      "Physician-supervised by Dr. Elena Marks",
      "Pre-session real-time vitals and blood pressure check"
    ]
  }
];

const PackageStore = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [cartCount, setCartCount] = useState(2);
  const [cartTotal, setCartTotal] = useState(3650000);
  
  const [toastVisible, setToastVisible] = useState(false);
  const [toastName, setToastName] = useState('');
  const [addedItems, setAddedItems] = useState({});

  const filteredPackages = packages.filter(p => {
    const matchCategory = activeCategory === 'all' || p.category === activeCategory;
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });

  const handleAddToCart = (pkg) => {
    setCartCount(prev => prev + 1);
    setCartTotal(prev => prev + pkg.price);
    
    // Show temporary feedback on button
    setAddedItems(prev => ({ ...prev, [pkg.id]: true }));
    setTimeout(() => {
      setAddedItems(prev => ({ ...prev, [pkg.id]: false }));
    }, 1400);

    // Show Toast
    setToastName(pkg.name);
    setToastVisible(true);
    setTimeout(() => {
      setToastVisible(false);
    }, 2800);
  };

  const clearCart = () => {
    setCartCount(0);
    setCartTotal(0);
  };

  return (
    <div className="flex flex-col w-full pb-32">
      {/* Top Ambient Glow Decorator */}
      <div className="relative w-full overflow-hidden rounded-2xl bg-surface-container-low mb-space-xl">
        <div className="absolute -top-24 -left-20 w-96 h-96 rounded-full bg-primary-container/15 blur-[100px] pointer-events-none"></div>
        <div className="absolute top-0 right-1/4 w-80 h-80 rounded-full bg-tertiary/10 blur-[90px] pointer-events-none"></div>
        <div className="absolute -bottom-20 right-0 w-72 h-72 rounded-full bg-secondary/20 blur-[80px] pointer-events-none"></div>
        
        <div className="relative z-10 p-space-lg lg:p-space-xl flex flex-col gap-space-lg">
          {/* Breadcrumb / Overline Info */}
          <div className="flex flex-wrap items-center justify-between gap-space-md">
            <div className="flex items-center gap-space-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-tertiary animate-pulse"></span>
              <span className="text-[11px] font-semibold tracking-widest text-tertiary uppercase">Performance Protocol Access</span>
              <span className="text-on-surface-variant mx-1">•</span>
              <span className="text-[11px] font-semibold text-on-surface-variant uppercase">Q3 Optimization Windows Open</span>
            </div>
            <div className="flex items-center gap-space-sm">
              <div className="flex items-center gap-1.5 px-space-sm py-1 rounded bg-surface-container-high text-on-surface text-[12px] font-semibold">
                <DollarSign className="w-4 h-4 text-tertiary" />
                <span>STORE CURRENCY:</span>
                <span className="font-bold text-primary">VND (₫)</span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 px-space-sm py-1 rounded bg-surface-container-high text-on-surface text-[12px] font-semibold">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span>NEXUS LAB SECURE</span>
              </div>
            </div>
          </div>

          {/* Main Banner Headline & Controls */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-lg">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-space-xs px-space-sm py-1 rounded-full bg-primary-container/20 text-primary text-[11px] font-bold mb-space-sm">
                <Tag className="w-3.5 h-3.5" />
                <span>DIGITAL CREDENTIAL STORE</span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-extrabold text-on-surface tracking-tight">NEXUS Package Store</h1>
              <p className="text-base lg:text-lg text-on-surface-variant mt-2 leading-relaxed">
                Upgrade your athletic journey with sports-science grade memberships, specialized recovery combos, and bio-tech lab privileges.
              </p>
            </div>

            {/* Header Actions: Search & Cart Button */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-space-sm">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
                <input 
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search tiers, cryo, passes..." 
                  className="w-full bg-surface-container-highest text-on-surface placeholder:text-on-surface-variant text-sm pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary border-none shadow-sm"
                />
              </div>
              <button 
                onClick={() => navigate('/member/cart')}
                className="flex-shrink-0 flex items-center gap-space-sm px-space-md py-2.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest transition-all group"
              >
                <div className="relative">
                  <ShoppingBag className="text-primary w-6 h-6 group-hover:scale-110 transition-transform" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary-container text-on-primary-container text-[10px] flex items-center justify-center font-bold">
                      {cartCount}
                    </span>
                  )}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[11px] font-semibold text-on-surface-variant uppercase leading-none">Cart Vault</span>
                  <span className="text-[14px] text-on-surface leading-tight font-bold">
                    {cartTotal.toLocaleString()} ₫
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Perks Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-space-sm pt-space-xs">
            <div className="flex items-center gap-space-sm p-space-sm rounded-lg bg-surface-container-highest/50">
              <div className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center">
                <Percent className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] text-on-surface font-semibold">Active Member Privilege</span>
                <span className="text-[11px] text-on-surface-variant">Instant 15% discount applied at checkout</span>
              </div>
            </div>
            <div className="flex items-center gap-space-sm p-space-sm rounded-lg bg-surface-container-highest/50">
              <div className="w-8 h-8 rounded bg-tertiary/10 text-tertiary flex items-center justify-center">
                <Smartphone className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] text-on-surface font-semibold">Instant NFC Band Sync</span>
                <span className="text-[11px] text-on-surface-variant">Digital wristband credentials activate instantly</span>
              </div>
            </div>
            <div className="flex items-center gap-space-sm p-space-sm rounded-lg bg-surface-container-highest/50 sm:col-span-2 lg:col-span-1">
              <div className="w-8 h-8 rounded bg-secondary/10 text-secondary flex items-center justify-center">
                <RefreshCw className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] text-on-surface font-semibold">Flexible Carry-Over</span>
                <span className="text-[11px] text-on-surface-variant">Unused bio-lab sessions rollover up to 60 days</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Filter Bar & View Toggle */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md mb-space-lg">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-container-low overflow-x-auto max-w-full">
          {[
            { id: 'all', label: 'All Packages', count: 6 },
            { id: 'membership', label: 'Membership Tiers', count: 3 },
            { id: 'combo', label: 'Class Combos', count: 2 },
            { id: 'amenity', label: 'Bio-Tech & Recovery', count: 1 },
          ].map(tab => {
            const isActive = activeCategory === tab.id;
            return (
              <button 
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={`flex items-center whitespace-nowrap gap-2 px-4 py-2 rounded-lg text-[13px] transition-all font-semibold ${
                  isActive 
                    ? 'bg-primary-container text-on-primary-container shadow-sm' 
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  isActive ? 'bg-on-primary-container/20' : 'bg-surface-container-high'
                }`}>
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Right Controls / Sort */}
        <div className="flex items-center gap-space-sm w-full md:w-auto justify-between md:justify-end">
          <span className="text-[13px] text-on-surface-variant hidden xl:inline">
            Showing {filteredPackages.length} verified packages
          </span>
          <div className="flex items-center gap-space-xs bg-surface-container-low p-1 rounded-lg">
            <span className="text-[11px] font-semibold text-on-surface-variant px-2">SORT:</span>
            <select className="bg-transparent text-on-surface text-[12px] font-semibold focus:outline-none cursor-pointer pr-2 border-none">
              <option className="bg-surface-container" value="featured">Featured Lab Packs</option>
              <option className="bg-surface-container" value="low">Price: Low to High</option>
              <option className="bg-surface-container" value="high">Price: High to Low</option>
              <option className="bg-surface-container" value="duration">Validity Duration</option>
            </select>
          </div>
        </div>
      </div>

      {/* Package Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPackages.map((pkg) => {
          const Icon = pkg.icon;
          const isPopular = pkg.popular;
          const isAdded = addedItems[pkg.id];

          return (
            <div 
              key={pkg.id} 
              className={`flex flex-col justify-between rounded-2xl p-6 transition-all duration-300 group relative ${
                isPopular 
                  ? 'bg-surface-container-high/90 shadow-xl shadow-primary-container/10 transform lg:-translate-y-2' 
                  : 'bg-surface-container-low hover:bg-surface-container shadow-md'
              }`}
            >
              {isPopular && (
                <>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-primary/30 via-transparent to-primary/10 pointer-events-none -z-0"></div>
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary-container text-on-primary-container text-[11px] font-bold tracking-widest uppercase shadow-md flex items-center gap-1 z-20 whitespace-nowrap">
                    <Flame className="w-3.5 h-3.5" />
                    <span>{pkg.tag}</span>
                  </div>
                </>
              )}

              <div className="relative z-10">
                {/* Card Top Indicator */}
                <div className="flex items-start justify-between mb-4 pt-1">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${pkg.iconBg}`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <span className={`px-2 py-1 rounded text-[11px] font-bold tracking-wider uppercase ${
                    isPopular ? 'bg-primary/20 text-primary' : 'bg-surface-container-high text-on-surface-variant'
                  }`}>
                    {pkg.validity}
                  </span>
                </div>

                <div className="mb-4">
                  {pkg.typeTag && (
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`text-[11px] font-bold ${pkg.iconColor}`}>{pkg.typeTag}</span>
                      <span className="text-on-surface-variant">•</span>
                      <span className="text-[11px] font-semibold text-on-surface-variant">{pkg.typeSuffix}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <h2 className={`text-xl font-bold text-on-surface transition-colors ${!isPopular && 'group-hover:' + pkg.iconColor}`}>
                      {pkg.name}
                    </h2>
                    {isPopular && <CheckCircle2 className="w-5 h-5 text-tertiary" title="Elite Verified" />}
                  </div>
                  <p className="text-[13px] text-on-surface-variant mt-1">{pkg.desc}</p>
                </div>

                {/* Price */}
                <div className={`mb-6 p-4 rounded-xl ${isPopular ? 'bg-surface-container-lowest/90' : 'bg-surface-container-lowest'}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] uppercase tracking-wider block font-semibold ${isPopular ? 'text-tertiary' : 'text-on-surface-variant'}`}>
                      {isPopular ? 'Tier Pricing' : 'Membership Fee'}
                    </span>
                    {isPopular && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-tertiary/15 text-tertiary font-semibold">Save 20%</span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-2xl font-extrabold text-on-surface">{pkg.price.toLocaleString()}</span>
                    <span className="text-[13px] text-primary font-bold">VND</span>
                    <span className="text-[12px] text-on-surface-variant ml-1">{pkg.priceSuffix}</span>
                  </div>
                </div>

                {/* Features List */}
                <div className="flex flex-col gap-3 mb-6">
                  <span className={`text-[11px] uppercase tracking-wider font-semibold ${isPopular ? 'text-primary' : 'text-on-surface-variant'}`}>
                    {isPopular ? 'Full Tier Privileges' : 'Included Privileges'}
                  </span>
                  {pkg.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-tertiary shrink-0 mt-0.5" />
                      <span className="text-[14px] text-on-surface">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <button 
                onClick={() => handleAddToCart(pkg)}
                className={`relative z-10 w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-semibold text-[14px] transition-all active:scale-[0.99] ${
                  isAdded 
                    ? 'bg-tertiary-container text-on-tertiary-container'
                    : isPopular 
                      ? 'bg-primary-container hover:bg-inverse-primary text-on-primary-container hover:text-surface shadow-lg shadow-primary-container/20'
                      : 'bg-surface-container-high hover:bg-primary text-on-surface hover:text-on-primary shadow-sm'
                }`}
              >
                {isAdded ? (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Added!</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5" />
                    <span>{isPopular ? 'Claim Pro Access' : 'Add to Cart'}</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Corporate Callout Banner */}
      <div className="mt-space-xl p-space-lg lg:p-space-xl rounded-2xl bg-surface-container-low flex flex-col md:flex-row items-center justify-between gap-space-lg shadow-md relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-primary/10 blur-3xl pointer-events-none"></div>
        <div className="flex items-center gap-space-md z-10">
          <div className="w-14 h-14 rounded-2xl bg-surface-container-high text-primary flex items-center justify-center shrink-0">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-[16px] font-bold text-on-surface">Athletic Squads & Enterprise Corporate Plans</h3>
            <p className="text-[14px] text-on-surface-variant max-w-xl mt-1">
              Equip your company or semi-pro sports franchise with pooled court access, biomechanical telemetry passes, and private training bookings.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 w-full md:w-auto z-10">
          <button className="w-full md:w-auto px-6 py-2.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-[13px] font-semibold transition-all">
            Corporate Inquiry
          </button>
          <button className="w-full md:w-auto px-6 py-2.5 rounded-lg bg-primary text-on-primary text-[13px] font-bold hover:bg-primary-container transition-all">
            Book Facility Tour
          </button>
        </div>
      </div>

      {/* Trust Indicators Footing */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 py-4 px-2 text-center">
        <div className="flex items-center justify-center gap-2 text-on-surface-variant">
          <Lock className="w-5 h-5 text-tertiary" />
          <span className="text-[11px] font-bold tracking-wide uppercase">256-Bit SSL Encrypted Checkout</span>
        </div>
        <div className="flex items-center justify-center gap-2 text-on-surface-variant">
          <QrCode className="w-5 h-5 text-primary" />
          <span className="text-[11px] font-bold tracking-wide uppercase">Instant NFC & QR Pass Provisioning</span>
        </div>
        <div className="flex items-center justify-center gap-2 text-on-surface-variant">
          <FileCheck className="w-5 h-5 text-secondary" />
          <span className="text-[11px] font-bold tracking-wide uppercase">Zero Setup Fees • Cancel Anytime</span>
        </div>
      </div>

      {/* Sticky Bottom Cart & Checkout Bar */}
      <div className="fixed bottom-4 left-4 right-4 lg:left-80 lg:right-8 z-40">
        <div className="p-4 sm:p-6 rounded-2xl bg-surface-container-high/95 backdrop-blur-xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-surface-container-highest/50">
          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
            <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-primary-container text-on-primary-container shrink-0">
              <ShoppingBag className="w-6 h-6" />
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-bold flex items-center justify-center">
                {cartCount}
              </span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-on-surface font-semibold">Active Cart Allocation:</span>
                <span className="text-[11px] text-tertiary font-bold uppercase">{cartCount} items selected</span>
              </div>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-[12px] text-on-surface-variant">Subtotal:</span>
                <span className="text-xl font-bold text-on-surface">{cartTotal.toLocaleString()}</span>
                <span className="text-[12px] text-primary font-bold">VND</span>
                <span className="text-[11px] text-on-surface-variant hidden md:inline ml-1">(15% Member Rebate Calculated)</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button 
              onClick={clearCart}
              className="hidden md:flex items-center gap-1 px-4 py-3 rounded-xl bg-surface-container text-on-surface-variant hover:text-on-surface text-[13px] font-semibold transition-all"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear</span>
            </button>
            <button 
              onClick={() => navigate('/member/cart')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-primary-container hover:bg-inverse-primary text-on-primary-container hover:text-surface text-[14px] font-bold transition-all shadow-lg shadow-primary-container/20 active:scale-95"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      <div className={`fixed top-24 right-8 z-50 transform transition-all duration-300 flex items-center gap-3 p-4 rounded-xl bg-surface-container-highest shadow-2xl border border-surface-container-highest/50 ${
        toastVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'
      }`}>
        <div className="w-8 h-8 rounded-full bg-tertiary/20 text-tertiary flex items-center justify-center">
          <Check className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-[13px] text-on-surface font-bold">{toastName}</span>
          <span className="text-[12px] text-on-surface-variant">Added to active lab cart.</span>
        </div>
      </div>
    </div>
  );
};

export default PackageStore;
