import PackageDetailDialog from '../../../components/resource-images/PackageDetailDialog';
import PackageBenefits from '../../../components/resource-images/PackageBenefits';
import { t, codeLabel, useLanguage } from '../../../i18n/useLanguage';
import { formatDate } from '../../../utils/displayFormat';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  CreditCard, Shield, Activity, Calendar, Snowflake, Dumbbell, Clock, Receipt, Lock,
  FileCheck, ShieldCheck, Tag, Building2, AlertCircle, RefreshCw
} from 'lucide-react';

const loadOwnedDetail=id=>axios.get(`http://localhost:8080/api/v1/member/my-packages/${id}`,{headers:{Authorization:`Bearer ${localStorage.getItem('token')}`}});
const Memberships = () => {
  useLanguage();
  const [detailId,setDetailId]=useState(null);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMyPackages();
  }, []);

  const fetchMyPackages = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8080/api/v1/member/my-packages', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPackages(response.data || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load your packages. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const getPackageIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'membership': return <Dumbbell className="w-8 h-8" />;
      case 'combo': return <Activity className="w-8 h-8" />;
      case 'amenity': return <Snowflake className="w-8 h-8" />;
      default: return <Shield className="w-8 h-8" />;
    }
  };

  const activePackages = packages.filter(p => p.status === 'ACTIVE');
  const pastPackages = packages.filter(p => p.status === 'EXPIRED');

  return (
    <div className="flex flex-col w-full pb-32">
      {detailId&&<PackageDetailDialog id={detailId} load={loadOwnedDetail} onClose={()=>setDetailId(null)}/>}
      {/* Top Banner */}
      <div className="relative w-full overflow-hidden rounded-2xl bg-surface-container-low mb-8">
        <div className="absolute -top-24 -left-20 w-96 h-96 rounded-full bg-primary-container/15 blur-[100px] pointer-events-none"></div>
        <div className="absolute top-0 right-1/4 w-80 h-80 rounded-full bg-tertiary/10 blur-[90px] pointer-events-none"></div>

        <div className="relative z-10 p-8 lg:p-10 flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-tertiary animate-pulse"></span>
              <span className="text-[11px] font-semibold tracking-widest text-tertiary uppercase">{t("Active Vault")}</span>
              <span className="text-on-surface-variant mx-1">{t("&bull;")}</span>
              <span className="text-[11px] font-semibold text-on-surface-variant uppercase">{t("ID: #NX-88071-VN")}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-surface-container-high text-on-surface text-[12px] font-semibold">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span>{t("NEXUS SECURE")}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <h1 className="text-4xl lg:text-5xl font-extrabold text-on-surface tracking-tight">{t("My Packages")}</h1>
              <p className="text-base lg:text-lg text-on-surface-variant mt-2 leading-relaxed">{t("Manage your purchased membership benefits, specialized combos, and bio-tech lab privileges.")}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest transition-all text-on-surface font-semibold text-sm">
                <Receipt className="w-4 h-4 text-tertiary" />
                <span>{t("Billing History")}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col justify-center items-center py-20 text-on-surface-variant">
          <RefreshCw className="w-10 h-10 animate-spin mb-4 text-primary" />
          <span className="text-sm font-semibold">{t("Loading your packages...")}</span>
        </div>
      ) : error ? (
        <div className="flex flex-col justify-center items-center py-20 text-error">
          <AlertCircle className="w-10 h-10 mb-4" />
          <span className="text-sm font-semibold">{t(error)}</span>
        </div>
      ) : (
        <>
          <h2 className="text-2xl font-bold text-on-surface mb-6">{t("Active Packages")}</h2>
          {activePackages.length === 0 ? (
            <div className="w-full bg-surface-container-low rounded-2xl p-10 flex flex-col items-center justify-center border border-surface-container-highest text-center mb-10">
              <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-on-surface-variant" />
              </div>
              <h3 className="text-lg font-bold text-on-surface mb-2">{t("No Active Packages")}</h3>
              <p className="text-sm text-on-surface-variant max-w-md">{t("You don't have any active packages or memberships right now. Head over to the Package Store to explore our options.")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-10">
              {activePackages.map(pkg => {
                const daysLeft = Math.max(0, Math.ceil((new Date(pkg.endDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)));

                return (
                  <div key={pkg.membershipId} className="bg-surface-container-low rounded-2xl p-6 border border-primary/20 shadow-[var(--shadow)] relative overflow-hidden group hover:border-primary/50 transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full pointer-events-none group-hover:bg-primary/10 transition-colors"></div>

                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-primary-container text-primary flex items-center justify-center">
                          {getPackageIcon(pkg.packageType)}
                        </div>
                        <div>
                          <div className="text-[10px] font-bold tracking-widest text-primary uppercase mb-1">{pkg.packageTypeName?t(pkg.packageTypeName):codeLabel(pkg.packageType)}</div>
                          <h3 className="text-xl font-bold text-on-surface leading-tight">{pkg.packageName}</h3>
                        </div>
                      </div>
                      <div className="px-3 py-1 rounded-full bg-[var(--success-soft)] border border-[var(--success-soft)] text-[var(--success-text)] text-xs font-bold uppercase tracking-wide">{t("Active")}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-surface-container p-4 rounded-xl">
                        <div className="text-xs text-on-surface-variant mb-1 font-semibold flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />{t("Start Date")}</div>
                        <div className="text-sm font-bold text-on-surface">{formatDate(pkg.startDate)}</div>
                      </div>
                      <div className="bg-surface-container p-4 rounded-xl">
                        <div className="text-xs text-on-surface-variant mb-1 font-semibold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />{t("End Date")}</div>
                        <div className="text-sm font-bold text-on-surface">{formatDate(pkg.endDate)}</div>
                      </div>
                    </div>

                    <button type="button" className="text-sm underline mb-4" onClick={()=>setDetailId(pkg.membershipId)}>{t("Package details")}</button><PackageBenefits benefits={pkg.benefits} remaining/><div className="mb-4">
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-xs font-semibold text-on-surface-variant">{t("Time Remaining")}</span>
                        <span className="text-sm font-bold text-primary">{daysLeft}{' '}{t("Days")}</span>
                      </div>
                      <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-1000"
                          style={{ width: `${Math.min(100, Math.max(0, (daysLeft / pkg.durationDays) * 100))}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {pastPackages.length > 0 && (
            <>
              <h2 className="text-xl font-bold text-on-surface mb-6">{t("Past Packages")}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pastPackages.map(pkg => (
                  <div key={pkg.membershipId} className="bg-surface-container-highest/30 rounded-2xl p-5 border border-surface-container flex items-center justify-between opacity-80 hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-surface-container-high text-on-surface-variant flex items-center justify-center">
                        {getPackageIcon(pkg.packageType)}
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-on-surface">{pkg.packageName}</h4>
                        <div className="text-xs text-on-surface-variant mt-0.5">{t("Expired on")}{' '}{formatDate(pkg.endDate)}
                        </div>
                        <button type="button" className="text-sm underline mt-2" onClick={()=>setDetailId(pkg.membershipId)}>{t("Package details")}</button>
                      </div>
                    </div>
                    <div className="px-3 py-1 rounded text-xs font-semibold bg-surface-container-high text-on-surface-variant">{t("Expired")}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Memberships;
