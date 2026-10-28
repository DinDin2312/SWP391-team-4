import PackageDetailDialog from '../../../components/resource-images/PackageDetailDialog';
import { t, codeLabel, useLanguage } from '../../../i18n/useLanguage';
import { formatMoney } from '../../../utils/displayFormat';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Search, ShoppingBag, CreditCard, CalendarCheck, RefreshCw,
  Dumbbell, Bot, Crown, Flame, Trophy, Activity, Snowflake,
  Lock, QrCode, FileCheck, ArrowRight, CheckCircle2,
  Trash2, ShoppingCart, Check, ShieldCheck, Tag,
  DollarSign, BadgeCheck, AlertCircle
} from 'lucide-react';
import { Meteors } from '../../../components/ui/meteors';
import ResourcePhoto from '../../../components/resource-images/ResourcePhoto';
import { motion, AnimatePresence } from 'framer-motion';


const loadStoreDetail=id=>axios.get(`http://localhost:8080/api/v1/member/packages/${id}`,{headers:{Authorization:`Bearer ${localStorage.getItem('token')}`}});
const PackageStore = () => {
  useLanguage();
  const navigate = useNavigate();
  const [detailId,setDetailId]=useState(null);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('featured');

  // Fake cart context until Backend Cart API supports packages
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);

  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [addedItems, setAddedItems] = useState({});
  const [isCartHighlighted, setIsCartHighlighted] = useState(false);

  useEffect(() => {
    fetchPackages();
    fetchCart();

    let highlightTimer;
    const onCartUpdated = () => fetchCart();
    const onAiCartHighlight = () => {
      setIsCartHighlighted(false);
      requestAnimationFrame(() => setIsCartHighlighted(true));
      clearTimeout(highlightTimer);
      highlightTimer = setTimeout(() => setIsCartHighlighted(false), 8000);
    };

    window.addEventListener('cartUpdated', onCartUpdated);
    window.addEventListener('aiCartHighlight', onAiCartHighlight);
    return () => {
      window.removeEventListener('cartUpdated', onCartUpdated);
      window.removeEventListener('aiCartHighlight', onAiCartHighlight);
      clearTimeout(highlightTimer);
    };
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8080/api/v1/member/packages', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPackages(response.data || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load packages. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const getPackageIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'gym_access': return Dumbbell;
      case 'ai_access': return Bot;
      case 'premium': return Crown;
      case 'membership': return Dumbbell;
      case 'combo': return Trophy;
      case 'amenity': return Snowflake;
      case 'pt': return Activity;
      default: return BadgeCheck;
    }
  };

  const filteredPackages = packages
    .filter(p => {
      const matchCategory = activeCategory === 'all' || p.packageType?.toUpperCase() === activeCategory.toUpperCase();
      const matchSearch = p.packageName?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCategory && matchSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'low') return (a.price || 0) - (b.price || 0);
      if (sortBy === 'high') return (b.price || 0) - (a.price || 0);
      if (sortBy === 'duration') return (b.durationDays || 0) - (a.durationDays || 0);
      return 0;
    });

  const handleAddToCart = async (pkg) => {
    if (addedItems[pkg.packageId]||pkg.canPurchase===false) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:8080/api/v1/member/add-package-to-cart/${pkg.packageId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      window.dispatchEvent(new Event('cartUpdated'));

      setCartCount(prev => prev + 1);
      setCartTotal(prev => prev + pkg.price);

      setToast({ visible: true, message: `${pkg.packageName} added to your vault`, type: 'success' });
      setTimeout(() => {
        setToast({ visible: false, message: '', type: 'success' });
      }, 2800);

      fetchCart();
    } catch (err) {
      setToast({ visible: true, message: err.response?.data?.message || err.response?.data || 'Error adding to cart', type: 'error' });
      if (err.response?.data?.code) fetchPackages();
      setTimeout(() => {
        setToast({ visible: false, message: '', type: 'error' });
      }, 4000);
    }
  };

  const fetchCart = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8080/api/v1/payment/cart', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.items) {
        setCartCount(response.data.items.length);
        setCartTotal(response.data.totalPrice || 0);

        const cartPackageIds = {};
        response.data.items.forEach(item => {
          if (item.type === 'PACKAGE' && item.packageId) {
            cartPackageIds[item.packageId] = true;
          }
        });
        setAddedItems(cartPackageIds);
      } else {
        setCartCount(0);
        setCartTotal(0);
        setAddedItems({});
      }
    } catch (e) {
      console.error(e);
    }
  };

  const clearCart = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8080/api/v1/payment/cart/clear`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCartCount(0);
      setCartTotal(0);
      setAddedItems({});
      fetchCart();
      window.dispatchEvent(new Event('cartUpdated'));

      setToast({ visible: true, message: t('Cart cleared successfully'), type: 'success' });
      setTimeout(() => {
        setToast({ visible: false, message: '', type: 'success' });
      }, 2800);
    } catch (err) {
      setToast({ visible: true, message: t('Failed to clear cart'), type: 'error' });
      setTimeout(() => {
        setToast({ visible: false, message: '', type: 'error' });
      }, 3000);
    }
  };

  return (
    <div className="flex flex-col w-full pb-32">
      {detailId&&<PackageDetailDialog id={detailId} load={loadStoreDetail} onClose={()=>setDetailId(null)}/>}
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
              <span className="text-[11px] font-semibold tracking-widest text-tertiary uppercase">{t("Performance Protocol Access")}</span>
              <span className="text-on-surface-variant mx-1">{t("&bull;")}</span>
              <span className="text-[11px] font-semibold text-on-surface-variant uppercase">{t("Q3 Optimization Windows Open")}</span>
            </div>
            <div className="flex items-center gap-space-sm">
              <div className="flex items-center gap-1.5 px-space-sm py-1 rounded bg-surface-container-high text-on-surface text-[12px] font-semibold">
                <DollarSign className="w-4 h-4 text-tertiary" />
                <span>{t("STORE CURRENCY:")}</span>
                <span className="font-bold text-primary">{t("VND")}</span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 px-space-sm py-1 rounded bg-surface-container-high text-on-surface text-[12px] font-semibold">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span>{t("NEXUS LAB SECURE")}</span>
              </div>
            </div>
          </div>

          {/* Main Banner Headline & Controls */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-lg">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-space-xs px-space-sm py-1 rounded-full bg-primary-container/20 text-primary text-[11px] font-bold mb-space-sm">
                <Tag className="w-3.5 h-3.5" />
                <span>{t("DIGITAL CREDENTIAL STORE")}</span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-extrabold text-on-surface tracking-tight">{t("NEXUS Package Store")}</h1>
              <p className="text-base lg:text-lg text-on-surface-variant mt-2 leading-relaxed">{t("Upgrade your athletic journey with sports-science grade memberships, specialized recovery combos, and bio-tech lab privileges.")}</p>
            </div>

            {/* Header Actions: Search & Cart Button */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-space-sm">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t("Search packages by name...")}
                  className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 shadow-sm"
                />
              </div>
              <button
                onClick={() => {
                  setIsCartHighlighted(false);
                  navigate('/member/cart');
                }}
                className={`flex-shrink-0 flex items-center gap-space-sm px-space-md py-2.5 rounded-xl border transition-all group ${
                  isCartHighlighted
                    ? 'bg-gradient-to-r from-cyan-500/20 via-blue-600/25 to-purple-600/20 border-cyan-400 ring-2 ring-cyan-400 shadow-[0_0_22px_rgba(59,130,246,0.75)] scale-105'
                    : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 border-slate-200 dark:border-slate-800 shadow-sm'
                }`}
              >
                <div className="relative">
                  <ShoppingBag className="text-primary w-6 h-6 group-hover:scale-110 transition-transform" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 z-10 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--success-hover)] text-white text-[10px] flex items-center justify-center font-black border border-[var(--surface-hover)] shadow-sm">
                      {cartCount}
                    </span>
                  )}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[11px] font-semibold text-on-surface-variant uppercase leading-none">{t("Cart Vault")}</span>
                  <span className="text-[14px] text-on-surface leading-tight font-bold">
                    {formatMoney(cartTotal)}
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Perks Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center shrink-0">
                <CreditCard className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] text-slate-900 dark:text-white font-bold">{t("Secure Payment Gateway")}</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">{t("Instant processing with VNPay and MoMo")}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center shrink-0">
                <QrCode className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] text-slate-900 dark:text-white font-bold">{t("Fast QR Pass Check-in")}</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">{t("Seamless access at the turnstile gate")}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm sm:col-span-2 lg:col-span-1">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center shrink-0">
                <CalendarCheck className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] text-slate-900 dark:text-white font-bold">{t("Flexible Class Bookings")}</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">{t("Easy schedule enrollment and class switching")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Filter Bar & View Toggle */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md mb-space-lg">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto max-w-full">
          {[
            { id: 'all',        label: t('All Packages'),     count: packages.length },
            ...Array.from(new Set(packages.map(pkg=>pkg.packageType))).map(type=>({id:type.toLowerCase(),label:packages.find(pkg=>pkg.packageType===type)?.packageTypeName||codeLabel(type),count:packages.filter(pkg=>pkg.packageType===type).length})),
          ].map(tab => {
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={`flex items-center whitespace-nowrap gap-2 px-4 py-2 rounded-lg text-[13px] transition-all font-semibold ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{t(tab.label)}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Right Controls / Sort */}
        <div className="flex items-center gap-space-sm w-full md:w-auto justify-between md:justify-end">
          <span className="text-[13px] text-slate-500 dark:text-slate-400 hidden xl:inline">{t("Showing")}{' '}{filteredPackages.length}{' '}{t("verified packages")}</span>
          <div className="flex items-center gap-space-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-1.5 rounded-lg">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 px-2">{t("SORT:")}</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-slate-900 dark:text-white text-[12px] font-semibold focus:outline-none cursor-pointer pr-2 border-none"
            >
              <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="featured">{t("Featured Packages")}</option>
              <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="low">{t("Price: Low to High")}</option>
              <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="high">{t("Price: High to Low")}</option>
              <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="duration">{t("Validity Duration")}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Package Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex flex-col justify-center items-center py-20 text-on-surface-variant">
            <RefreshCw className="w-10 h-10 animate-spin mb-4 text-primary" />
            <span className="text-sm font-semibold">{t("Syncing packages from backend...")}</span>
          </div>
        ) : error ? (
          <div className="col-span-full flex flex-col justify-center items-center py-20 text-error">
            <AlertCircle className="w-10 h-10 mb-4" />
            <span className="text-sm font-semibold">{t(error)}</span>
          </div>
        ) : filteredPackages.length === 0 ? (
          <div className="col-span-full flex flex-col justify-center items-center py-20 text-on-surface-variant">
            <ShoppingBag className="w-10 h-10 mb-4 opacity-50" />
            <span className="text-sm font-semibold">{t("No packages available for this category.")}</span>
          </div>
        ) : filteredPackages.map((pkg) => {
          const Icon = getPackageIcon(pkg.packageType);
          const isPopular = pkg.price > 2000000;
          const isAdded = addedItems[pkg.packageId];

          return (
            <div 
              key={pkg.packageId} 
              id={`ai-package-${pkg.packageId}`}
              className={`flex flex-col justify-between rounded-2xl p-6 transition-all duration-300 group relative ${
                isPopular 
                  ? 'bg-white dark:bg-slate-900 border-2 border-blue-500 shadow-xl shadow-blue-500/10 dark:shadow-blue-500/20 ring-1 ring-blue-500/30 dark:ring-blue-400/30 hover:-translate-y-1'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 dark:hover:border-blue-400/50 shadow-md hover:shadow-xl hover:-translate-y-1'
              }`}
            >
              {isPopular && (
                <>
                  <Meteors number={8} />
                  <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-blue-500/10 to-teal-500/10 blur-xl pointer-events-none -z-0"></div>
                </>
              )}

              <div className="relative z-10">
                {/* Bento Cover Image with Ambient Glowing Light */}
                <div className="relative mb-5 rounded-2xl overflow-hidden aspect-[16/10] bg-gradient-to-br from-blue-50/70 via-slate-100/80 to-indigo-50/60 dark:from-slate-900/95 dark:via-slate-850 dark:to-slate-950 border border-slate-200/90 dark:border-white/10 flex items-center justify-center group-hover:border-primary/40 transition-all duration-300 shadow-sm dark:shadow-inner">
                  {/* Ambient Glow */}
                  <div className={`absolute inset-0 bg-radial-[at_50%_35%] ${isPopular ? 'from-blue-500/20 dark:from-blue-500/25 via-indigo-500/10' : 'from-primary/15 dark:from-primary/20 via-primary/5'} to-transparent pointer-events-none`} />

                  {isPopular && (
                    <div className="absolute top-3.5 left-3.5 z-20 px-3 py-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-extrabold tracking-wider uppercase shadow-md shadow-blue-500/30 border border-white/25 flex items-center gap-1.5 pointer-events-none backdrop-blur-md">
                      <Flame className="w-3.5 h-3.5 text-amber-300" />
                      <span>{t("Most Popular")}</span>
                    </div>
                  )}

                  {pkg.imagePath ? (
                    <ResourcePhoto imagePath={pkg.imagePath} name={pkg.packageName} variant="cover" />
                  ) : (
                    <div className="relative z-10 flex flex-col items-center justify-center gap-2 group-hover:scale-105 transition-transform duration-300">
                      <div className="w-16 h-16 rounded-2xl bg-white dark:bg-white/5 border border-slate-200/90 dark:border-white/10 flex items-center justify-center shadow-md dark:shadow-black/40">
                        <Icon className="w-8 h-8 text-blue-600 dark:text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.3)] dark:drop-shadow-[0_0_12px_rgba(59,130,246,0.6)]" />
                      </div>
                    </div>
                  )}

                  {/* Corner Duration Badge */}
                  <span className="absolute top-3.5 right-3.5 z-20 px-3 py-1 rounded-lg bg-white/95 dark:bg-slate-950/80 border border-slate-200/90 dark:border-white/15 text-[11px] font-black tracking-wider text-slate-800 dark:text-white uppercase shadow-sm">
                    {pkg.durationDays}{' '}{t("Days")}
                  </span>
                </div>

                <div className="mb-4">
                  {pkg.packageType && (
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-[11px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                        {pkg.packageTypeName ? t(pkg.packageTypeName) : codeLabel(pkg.packageType)}
                      </span>
                    </div>
                  )}
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-1.5 tracking-tight">
                    <button type="button" className="text-left hover:text-blue-600 dark:hover:text-blue-400 transition-colors" onClick={() => setDetailId(pkg.packageId)}>
                      {pkg.packageName}
                    </button>
                  </h3>
                  {pkg.canPurchase === false && <p className="text-sm mb-2 text-rose-500 font-semibold" role="status">{t(pkg.purchaseBlockReason)}</p>}
                  <button type="button" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline mb-2.5 inline-flex items-center gap-1" onClick={() => setDetailId(pkg.packageId)}>
                    <span>{t("Package details")}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                  <p className="text-xs text-slate-600 dark:text-slate-400 min-h-[38px] leading-relaxed line-clamp-2">
                    {pkg.description ? t(pkg.description) : t("Gain full access for {0} days. Upgrade your fitness routine today.", [pkg.durationDays])}
                  </p>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800/80 my-3.5" />

                <div className="mb-4">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">{t("Membership Fee")}</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-2xl font-black text-slate-900 dark:text-white">{formatMoney(pkg.price)}</span>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 ml-1">/ {pkg.durationDays}{' '}{t("days")}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 mb-6">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t("Included Privileges")}</span>
                  {(pkg.packageType === 'AI_ACCESS' || (pkg.packageName && pkg.packageName.toLowerCase().includes('ai'))
                    ? ['24/7 AI Coach Consultation', 'Personalized Workout & Meal Plans', 'Real-time Form & Metric Analysis']
                    : ['Full Sports Center & Equipment Access', 'Smart Locker & RFID Key Access', 'Hot Shower & Sauna Access']
                  ).map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-[13px] text-slate-700 dark:text-slate-300 font-medium leading-snug">{t(feature)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => handleAddToCart(pkg)}
                disabled={isAdded||pkg.canPurchase===false}
                className={`relative z-10 w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all active:scale-[0.99] ${
                  isAdded
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-500/30 cursor-not-allowed'
                    : isPopular
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25'
                      : 'bg-slate-100 hover:bg-blue-600 text-slate-800 hover:text-white border border-slate-200 hover:border-transparent dark:bg-slate-800 dark:hover:bg-blue-600 dark:text-white dark:border-slate-700 shadow-sm'
                }`}
              >
                {isAdded ? (
                  <>
                    <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-600 dark:text-emerald-400">{t("Added to Cart")}</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5" />
                    <span>{t(isPopular ? 'Claim Pro Access' : 'Add to Cart')}</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Trust Indicators Footing */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 py-4 px-2 text-center">
        <div className="flex items-center justify-center gap-2 text-on-surface-variant">
          <Lock className="w-5 h-5 text-tertiary" />
          <span className="text-[11px] font-bold tracking-wide uppercase">{t("256-Bit SSL Encrypted Checkout")}</span>
        </div>
        <div className="flex items-center justify-center gap-2 text-on-surface-variant">
          <QrCode className="w-5 h-5 text-primary" />
          <span className="text-[11px] font-bold tracking-wide uppercase">{t("Instant QR Pass Provisioning")}</span>
        </div>
        <div className="flex items-center justify-center gap-2 text-on-surface-variant">
          <FileCheck className="w-5 h-5 text-secondary" />
          <span className="text-[11px] font-bold tracking-wide uppercase">{t("Direct Member Support Desk")}</span>
        </div>
      </div>

      {/* Sticky Bottom Cart & Checkout Bar with Smooth Slide-Up Motion */}
      <AnimatePresence>
        {cartCount > 0 && (
          <motion.div
            initial={{ y: 150 }}
            animate={{ y: 0 }}
            exit={{ y: 150 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="fixed bottom-4 left-4 right-4 lg:left-80 lg:right-8 z-40"
          >
            <div className={`p-4 sm:p-6 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border flex flex-col sm:flex-row items-center justify-between gap-4 transition-[border-color,box-shadow] duration-300 shadow-2xl shadow-black/20 ${
              isCartHighlighted
                ? 'border-cyan-400 ring-2 ring-cyan-400/70 shadow-[0_0_28px_rgba(59,130,246,0.75)]'
                : 'border-slate-200 dark:border-slate-800'
            }`}>
              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
                <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white shrink-0 shadow-md shadow-blue-500/30">
                  <ShoppingBag className="w-6 h-6" />
                  <span className="absolute -top-2 -right-2 z-20 min-w-[22px] h-[22px] px-1 rounded-full bg-emerald-500 text-white text-[11px] font-black flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-md">
                    {cartCount}
                  </span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] text-slate-900 dark:text-white font-bold">{t("Active Cart Allocation:")}</span>
                    <span className="text-[11px] text-amber-500 font-extrabold uppercase">{cartCount}{' '}{t("items selected")}</span>
                  </div>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-[12px] text-slate-500 dark:text-slate-400">{t("Subtotal:")}</span>
                    <span className="text-xl font-black text-slate-900 dark:text-white">{formatMoney(cartTotal)}</span>
                    <span className="text-[12px] text-blue-600 dark:text-blue-400 font-bold">{t("VND")}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden md:inline ml-1">{t("(15% Member Rebate Calculated)")}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  onClick={clearCart}
                  className="hidden md:flex items-center gap-1 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-300 text-[13px] font-semibold transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{t("Clear")}</span>
                </button>
                <button
                  onClick={() => navigate('/member/cart')}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[14px] font-bold transition-all shadow-lg shadow-blue-500/25 active:scale-95"
                >
                  <span>{t("Proceed to Checkout")}</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Toast Notification */}
      <div className={`fixed bottom-32 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
        toast.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
      }`}>
        <div className={`flex items-center gap-3 px-5 py-3 rounded-full shadow-[var(--shadow)] ${
          toast.type === 'error' ? 'bg-[var(--danger)] text-[color:var(--on-primary)]' : 'bg-inverse-surface text-inverse-on-surface'
        }`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
            toast.type === 'error' ? 'bg-[var(--surface)]' : 'bg-primary'
          }`}>
            {toast.type === 'error' ? <AlertCircle className="w-4 h-4 text-[var(--text)]" /> : <Check className="w-4 h-4 text-on-primary" />}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-semibold">{t(toast.message)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackageStore;
