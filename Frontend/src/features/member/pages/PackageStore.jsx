import PackageDetailDialog from '../../../components/resource-images/PackageDetailDialog';
import PackageBenefits from '../../../components/resource-images/PackageBenefits';
import { t, codeLabel, useLanguage } from '../../../i18n/useLanguage';
import { formatMoney } from '../../../utils/displayFormat';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Search, ShoppingBag, Percent, Smartphone, RefreshCw,
  Dumbbell, Bot, Crown, Flame, Trophy, Shield, Gauge, Activity, Snowflake,
  Building2, Lock, QrCode, FileCheck, ArrowRight, CheckCircle2,
  Trash2, ShoppingCart, Check, ShieldCheck, Tag,
  CircleDollarSign, DollarSign, BadgeCheck, AlertCircle
} from 'lucide-react';
import { Meteors } from '../../../components/ui/meteors';
import ResourcePhoto from '../../../components/resource-images/ResourcePhoto';


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

  // Fake cart context until Backend Cart API supports packages
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);

  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [addedItems, setAddedItems] = useState({});

  useEffect(() => {
    fetchPackages();
    fetchCart();
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

  const filteredPackages = packages.filter(p => {
    const matchCategory = activeCategory === 'all' || p.packageType?.toUpperCase() === activeCategory.toUpperCase();
    const matchSearch = p.packageName?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
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
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t("Search tiers, cryo, passes...")}
                  className="w-full bg-surface-container-highest text-on-surface placeholder:text-on-surface-variant text-sm pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary border-none shadow-[var(--shadow)]"
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
                  <span className="text-[11px] font-semibold text-on-surface-variant uppercase leading-none">{t("Cart Vault")}</span>
                  <span className="text-[14px] text-on-surface leading-tight font-bold">
                    {formatMoney(cartTotal)}
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
                <span className="text-[12px] text-on-surface font-semibold">{t("Active Member Privilege")}</span>
                <span className="text-[11px] text-on-surface-variant">{t("Instant 15% discount applied at checkout")}</span>
              </div>
            </div>
            <div className="flex items-center gap-space-sm p-space-sm rounded-lg bg-surface-container-highest/50">
              <div className="w-8 h-8 rounded bg-tertiary/10 text-tertiary flex items-center justify-center">
                <Smartphone className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] text-on-surface font-semibold">{t("Instant NFC Band Sync")}</span>
                <span className="text-[11px] text-on-surface-variant">{t("Digital wristband credentials activate instantly")}</span>
              </div>
            </div>
            <div className="flex items-center gap-space-sm p-space-sm rounded-lg bg-surface-container-highest/50 sm:col-span-2 lg:col-span-1">
              <div className="w-8 h-8 rounded bg-secondary/10 text-secondary flex items-center justify-center">
                <RefreshCw className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] text-on-surface font-semibold">{t("Flexible Carry-Over")}</span>
                <span className="text-[11px] text-on-surface-variant">{t("Unused bio-lab sessions rollover up to 60 days")}</span>
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
                    ? 'bg-primary-container text-on-primary-container shadow-[var(--shadow)]'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                <span>{t(tab.label)}</span>
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
          <span className="text-[13px] text-on-surface-variant hidden xl:inline">{t("Showing")}{' '}{filteredPackages.length}{' '}{t("verified packages")}</span>
          <div className="flex items-center gap-space-xs bg-surface-container-low p-1 rounded-lg">
            <span className="text-[11px] font-semibold text-on-surface-variant px-2">{t("SORT:")}</span>
            <select className="bg-transparent text-on-surface text-[12px] font-semibold focus:outline-none cursor-pointer pr-2 border-none">
              <option className="bg-surface-container" value="featured">{t("Featured Lab Packs")}</option>
              <option className="bg-surface-container" value="low">{t("Price: Low to High")}</option>
              <option className="bg-surface-container" value="high">{t("Price: High to Low")}</option>
              <option className="bg-surface-container" value="duration">{t("Validity Duration")}</option>
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
              className={`flex flex-col justify-between rounded-2xl p-6 transition-all duration-300 group relative overflow-hidden ${
                isPopular 
                  ? 'bg-surface-container-high/90 shadow-xl shadow-primary-container/10 border border-blue-500/30'
                  : 'bg-surface-container-low hover:bg-surface-container shadow-md'
              }`}
            >
              {isPopular && (
                <>
                  <Meteors number={15} />
                  <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-blue-500/10 to-teal-500/10 blur-xl pointer-events-none -z-0"></div>
                  <div className="mb-3 px-4 py-1.5 rounded-full bg-primary-container text-on-primary-container text-[11px] font-bold tracking-widest uppercase shadow-md flex items-center gap-1 z-20 w-fit">
                    <Flame className="w-3.5 h-3.5" />
                    <span>{t("Most Popular")}</span>
                  </div>
                </>
              )}

              <div className="relative z-10">
                <div className="mb-4"><ResourcePhoto imagePath={pkg.imagePath} name={pkg.packageName} variant="cover" fallback={<Icon size={42} aria-hidden="true" />} /></div>
                <div className="flex items-start justify-between mb-4 pt-1">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors bg-surface-container-high group-hover:bg-primary-container/20 text-primary`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <span className={`px-2 py-1 rounded text-[11px] font-bold tracking-wider uppercase bg-surface-variant text-on-surface-variant`}>
                    {pkg.durationDays}{' '}{t("Days")}</span>
                </div>

                <div className="mb-4">
                  {pkg.packageType && (
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[11px] font-bold text-primary uppercase">{pkg.packageTypeName?t(pkg.packageTypeName):codeLabel(pkg.packageType)}</span>
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-on-surface mb-2"><button type="button" className="text-left hover:underline" onClick={()=>setDetailId(pkg.packageId)}>{pkg.packageName}</button></h3>
                    {pkg.canPurchase===false&&<p className="text-sm mb-2" role="status">{t(pkg.purchaseBlockReason)}</p>}
                    <button type="button" className="text-sm underline mb-3" onClick={()=>setDetailId(pkg.packageId)}>{t("Package details")}</button>
                  <p className="text-sm text-on-surface-variant min-h-[40px] leading-relaxed">
                    {t(pkg.description || ("Gain full access for " + pkg.durationDays + " days. Upgrade your fitness routine today."))}
                  </p>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[11px] font-bold tracking-wider uppercase ${isPopular ? t('text-primary') : t('text-on-surface-variant')}`}>{t("Membership Fee")}</span>
                </div>
                <div className="flex items-baseline gap-1 mt-0.5 mb-5">
                  <span className="text-2xl font-extrabold text-on-surface">{formatMoney(pkg.price)}</span>
                  <span className="text-[12px] text-on-surface-variant ml-1">/ {pkg.durationDays}{' '}{t("days")}</span>
                </div>

                <div className="flex flex-col gap-3 mb-6">
                  <span className={`text-[11px] uppercase tracking-wider font-semibold ${isPopular ? t('text-primary') : t('text-on-surface-variant')}`}>{t("Included Privileges")}</span>
                  {pkg.benefits?.length ? <PackageBenefits benefits={pkg.benefits}/> : ['Full facility access', 'Smart locker usage', 'App telemetry sync'].map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-tertiary shrink-0 mt-0.5" />
                      <span className="text-[14px] text-on-surface">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => handleAddToCart(pkg)}
                disabled={isAdded||pkg.canPurchase===false}
                className={`relative z-10 w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-semibold text-[14px] transition-all active:scale-[0.99] ${
                  isAdded
                    ? t('bg-surface-container-highest text-on-surface-variant cursor-not-allowed border border-surface-container-highest')
                    : isPopular
                      ? t('bg-primary-container hover:bg-inverse-primary text-on-primary-container hover:text-surface shadow-[var(--shadow)] shadow-primary-container/20')
                      : t('bg-surface-container-high hover:bg-primary text-on-surface hover:text-on-primary shadow-[var(--shadow)]')
                }`}
              >
                {isAdded ? (
                  <>
                    <Check className="w-5 h-5 text-tertiary" />
                    <span className="text-tertiary">{t("Added to Cart")}</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5" />
                    <span>{t(isPopular ? t('Claim Pro Access') : t('Add to Cart'))}</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Corporate Callout Banner */}
      <div className="mt-space-xl p-space-lg lg:p-space-xl rounded-2xl bg-surface-container-low flex flex-col md:flex-row items-center justify-between gap-space-lg shadow-[var(--shadow)] relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-primary/10 blur-3xl pointer-events-none"></div>
        <div className="flex items-center gap-space-md z-10">
          <div className="w-14 h-14 rounded-2xl bg-surface-container-high text-primary flex items-center justify-center shrink-0">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-[16px] font-bold text-on-surface">{t("Athletic Squads & Enterprise Corporate Plans")}</h3>
            <p className="text-[14px] text-on-surface-variant max-w-xl mt-1">{t("Equip your company or semi-pro sports franchise with pooled court access, biomechanical telemetry passes, and private training bookings.")}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 w-full md:w-auto z-10">
          <button className="w-full md:w-auto px-6 py-2.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-[13px] font-semibold transition-all">{t("Corporate Inquiry")}</button>
          <button className="w-full md:w-auto px-6 py-2.5 rounded-lg bg-primary text-on-primary text-[13px] font-bold hover:bg-primary-container transition-all">{t("Book Facility Tour")}</button>
        </div>
      </div>

      {/* Trust Indicators Footing */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 py-4 px-2 text-center">
        <div className="flex items-center justify-center gap-2 text-on-surface-variant">
          <Lock className="w-5 h-5 text-tertiary" />
          <span className="text-[11px] font-bold tracking-wide uppercase">{t("256-Bit SSL Encrypted Checkout")}</span>
        </div>
        <div className="flex items-center justify-center gap-2 text-on-surface-variant">
          <QrCode className="w-5 h-5 text-primary" />
          <span className="text-[11px] font-bold tracking-wide uppercase">{t("Instant NFC & QR Pass Provisioning")}</span>
        </div>
        <div className="flex items-center justify-center gap-2 text-on-surface-variant">
          <FileCheck className="w-5 h-5 text-secondary" />
          <span className="text-[11px] font-bold tracking-wide uppercase">{t("Zero Setup Fees &bull; Cancel Anytime")}</span>
        </div>
      </div>

      {/* Sticky Bottom Cart & Checkout Bar */}
      <div className="fixed bottom-4 left-4 right-4 lg:left-80 lg:right-8 z-40">
        <div className="p-4 sm:p-6 rounded-2xl bg-surface-container-high/95 backdrop-blur-xl shadow-[var(--shadow)] flex flex-col sm:flex-row items-center justify-between gap-4 border border-surface-container-highest/50">
          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
            <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-primary-container text-on-primary-container shrink-0">
              <ShoppingBag className="w-6 h-6" />
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-bold flex items-center justify-center">
                {cartCount}
              </span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-on-surface font-semibold">{t("Active Cart Allocation:")}</span>
                <span className="text-[11px] text-tertiary font-bold uppercase">{cartCount}{' '}{t("items selected")}</span>
              </div>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-[12px] text-on-surface-variant">{t("Subtotal:")}</span>
                <span className="text-xl font-bold text-on-surface">{formatMoney(cartTotal)}</span>
                <span className="text-[12px] text-primary font-bold">{t("VND")}</span>
                <span className="text-[11px] text-on-surface-variant hidden md:inline ml-1">{t("(15% Member Rebate Calculated)")}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={clearCart}
              className="hidden md:flex items-center gap-1 px-4 py-3 rounded-xl bg-surface-container text-on-surface-variant hover:text-on-surface text-[13px] font-semibold transition-all"
            >
              <Trash2 className="w-4 h-4" />
              <span>{t("Clear")}</span>
            </button>
            <button
              onClick={() => navigate('/member/cart')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-primary-container hover:bg-inverse-primary text-on-primary-container hover:text-surface text-[14px] font-bold transition-all shadow-[var(--shadow)] shadow-primary-container/20 active:scale-95"
            >
              <span>{t("Proceed to Checkout")}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

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
