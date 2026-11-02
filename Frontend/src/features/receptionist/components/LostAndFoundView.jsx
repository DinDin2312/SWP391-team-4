import React, { useState, useEffect, useCallback } from 'react';
import {
  PackageSearch, Plus, Search, RefreshCw, CheckCircle2,
  Clock, AlertTriangle, ShieldCheck, MapPin, Box,
  ChevronLeft, ChevronRight, Eye, Check, AlertCircle, LayoutGrid, Smartphone, Wallet, Watch, Shirt, Package, Lock
} from 'lucide-react';
import { t, useLanguage } from '../../../i18n/useLanguage';
import lostAndFoundService from '../services/lostAndFoundService';
import CreateLostItemModal from './CreateLostItemModal';
import ClaimItemModal from './ClaimItemModal';
import LostItemDetailModal from './LostItemDetailModal';
import DisposeItemModal from './DisposeItemModal';

const CATEGORY_TABS = [
  { key: 'ALL', label: 'Tất cả', icon: LayoutGrid },
  { key: 'ELECTRONICS', label: 'Thiết bị điện tử', icon: Smartphone },
  { key: 'DOCUMENTS_WALLET', label: 'Ví & Giấy tờ', icon: Wallet },
  { key: 'ACCESSORIES', label: 'Phụ kiện & Bình nước', icon: Watch },
  { key: 'CLOTHING_SHOES', label: 'Trang phục & Giày', icon: Shirt },
  { key: 'PERISHABLE', label: 'Đồ tươi (48h)', icon: Clock },
  { key: 'OTHER', label: 'Đồ dùng khác', icon: Package },
];

const STATUS_FILTERS = [
  { key: 'ALL', label: 'Tất cả trạng thái' },
  { key: 'STORED', label: 'Đang lưu kho' },
  { key: 'CLAIMED', label: 'Đã bàn giao khách' },
  { key: 'OVERDUE', label: 'Quá hạn lưu kho' },
  { key: 'DISPOSED', label: 'Đã thanh lý / tiêu hủy' },
];

const LostAndFoundView = ({ initialKeyword = '' }) => {
  useLanguage();

  const [stats, setStats] = useState({
    totalStored: 0,
    highValueStored: 0,
    totalClaimed: 0,
    totalOverdue: 0,
    expiringSoon: 0,
  });

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [_errorMsg, setErrorMsg] = useState('');

  // Filters & Search
  const [keyword, setKeyword] = useState(initialKeyword || '');

  useEffect(() => {
    if (initialKeyword !== undefined && initialKeyword !== null) {
      setKeyword(initialKeyword);
      setSelectedCategory('ALL');
      setSelectedStatus('ALL');
      setPage(0);
    }
  }, [initialKeyword]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedValuation, setSelectedValuation] = useState('ALL');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [disposeModalOpen, setDisposeModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState(null);

  // Toast notification
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: '', type: 'success' }), 4000);
  };

  const fetchStats = useCallback(async () => {
    try {
      const res = await lostAndFoundService.getStats();
      if (res) setStats(res);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await lostAndFoundService.searchItems({
        keyword,
        status: selectedStatus,
        category: selectedCategory,
        valuationType: selectedValuation,
        page,
        size: 9,
      });

      if (res && res.content) {
        setItems(res.content);
        setTotalPages(res.totalPages || 0);
        setTotalElements(res.totalElements || 0);
      } else if (Array.isArray(res)) {
        setItems(res);
        setTotalPages(1);
        setTotalElements(res.length);
      } else {
        setItems([]);
      }
    } catch (err) {
      console.error('Failed to fetch lost items:', err);
      setErrorMsg('Không thể tải danh sách đồ thất lạc. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [keyword, selectedStatus, selectedCategory, selectedValuation, page]);

  useEffect(() => {
    fetchStats();
    fetchItems();
  }, [fetchStats, fetchItems]);

  const handleOpenClaim = (item) => {
    setActiveItem(item);
    setClaimModalOpen(true);
  };

  const handleOpenDetail = (item) => {
    setActiveItem(item);
    setDetailModalOpen(true);
  };

  const handleOpenDispose = (item) => {
    setActiveItem(item);
    setDisposeModalOpen(true);
  };

  const handleDeleteItem = async (itemId) => {
    try {
      await lostAndFoundService.deleteItem(itemId);
      showToast('Đã xóa bản ghi món đồ thành công.');
      setDetailModalOpen(false);
      fetchStats();
      fetchItems();
    } catch (err) {
      console.error(err);
      showToast('Không thể xóa bản ghi.', 'error');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'STORED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            {t('Đang giữ')}
          </span>
        );
      case 'CLAIMED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <Check className="w-3 h-3" />
            {t('Đã trả')}
          </span>
        );
      case 'OVERDUE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <AlertTriangle className="w-3 h-3" />
            {t('Quá hạn')}
          </span>
        );
      case 'DISPOSED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
            {t('Đã thanh lý')}
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Toast Alert */}
      {toast.visible && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-semibold transition-all backdrop-blur-md border animate-in slide-in-from-bottom-5 ${
            toast.type === 'error'
              ? 'bg-rose-500/90 text-white border-rose-400'
              : 'bg-emerald-600/90 text-white border-emerald-400'
          }`}
        >
          {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-[var(--surface)] via-[var(--surface)] to-[var(--primary-soft)]/20 p-6 rounded-3xl border border-[var(--border)] shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
            <PackageSearch className="w-4 h-4" />
            {t('FRONT DESK ASSET MANAGEMENT')}
          </div>
          <h1 className="text-2xl font-extrabold text-[var(--text)] tracking-tight mt-1">
            {t('Quản lý Đồ thất lạc & Bỏ quên')}
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            {t('Theo dõi tài sản nhặt được, phân loại ngăn tủ/két sắt an toàn & đối chiếu bàn giao cho hội viên.')}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCreateModalOpen(true)}
          className="px-5 py-3 rounded-2xl bg-[#0071E3] hover:bg-[#0077ED] text-white active:scale-95 transition-all shadow-md font-semibold text-sm flex items-center justify-center gap-2.5 cursor-pointer shrink-0"
        >
          <Plus className="w-5 h-5" />
          <span>{t('Tiếp nhận món đồ mới')}</span>
        </button>
      </div>

      {/* Metrics Bar (Apple Style Bento Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs flex items-center justify-between hover:border-[var(--primary)]/30 transition-all">
          <div>
            <div className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              {t('Đang lưu kho')}
            </div>
            <div className="text-2xl font-black text-[var(--text)] mt-0.5">{stats.totalStored}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs flex items-center justify-between hover:border-amber-500/30 transition-all">
          <div>
            <div className="text-[11px] font-semibold text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>{t('Trong két an toàn')}</span>
            </div>
            <div className="text-2xl font-black text-amber-500 mt-0.5">{stats.highValueStored}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs flex items-center justify-between hover:border-blue-500/30 transition-all">
          <div>
            <div className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              {t('Đã trao trả khách')}
            </div>
            <div className="text-2xl font-black text-blue-500 mt-0.5">{stats.totalClaimed}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs flex items-center justify-between hover:border-rose-500/30 transition-all">
          <div>
            <div className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              {t('Quá hạn / Sắp hết hạn')}
            </div>
            <div className="text-2xl font-black text-rose-500 mt-0.5">
              {stats.totalOverdue}{' '}
              {stats.expiringSoon > 0 && (
                <span className="text-xs font-normal text-amber-500">
                  {t('(+{0} expiring)', [stats.expiringSoon])}
                </span>
              )}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Category Segmented Control (Apple Tabs) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORY_TABS.map((tab) => {
          const isSelected = selectedCategory === tab.key;
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setSelectedCategory(tab.key);
                setPage(0);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer active:scale-95 ${
                isSelected
                  ? 'bg-[#0071E3] text-white shadow-sm shadow-[#0071E3]/25 font-bold'
                  : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'
              }`}
            >
              <IconComponent className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-[var(--text-muted)]'}`} />
              <span>{t(tab.label)}</span>
            </button>
          );
        })}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-3.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs flex flex-col md:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder={t('Tìm kiếm theo tên món đồ, mã phiếu, vị trí cất, người nhặt, SĐT...')}
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setPage(0);
            }}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-muted)] text-xs focus:ring-2 focus:ring-[#0071E3]/30 focus:border-[#0071E3] outline-none transition-all"
          />
        </div>

        {/* Status Dropdown */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(0);
            }}
            className="px-3.5 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] text-xs outline-none focus:ring-2 focus:ring-[#0071E3]/30 focus:border-[#0071E3] cursor-pointer min-w-[155px] transition-all"
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s.key} value={s.key}>
                {t(s.label)}
              </option>
            ))}
          </select>

          {/* Valuation Dropdown */}
          <select
            value={selectedValuation}
            onChange={(e) => {
              setSelectedValuation(e.target.value);
              setPage(0);
            }}
            className="px-3.5 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] text-xs outline-none focus:ring-2 focus:ring-[#0071E3]/30 focus:border-[#0071E3] cursor-pointer min-w-[155px] transition-all"
          >
            <option value="ALL">{t('Tất cả phân loại')}</option>
            <option value="HIGH_VALUE">{t('Két sắt (Giá trị cao)')}</option>
            <option value="STANDARD">{t('Kho tiêu chuẩn')}</option>
            <option value="PERISHABLE">{t('Đồ tươi / Dễ hỏng (48h)')}</option>
          </select>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => {
              fetchStats();
              fetchItems();
            }}
            title={t('Tải lại dữ liệu')}
            className="p-2.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] border border-[var(--border)] transition-all cursor-pointer shrink-0 active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Grid Cards Container */}
      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center text-[var(--text-muted)]">
          <div className="w-8 h-8 border-3 border-[var(--primary)] border-t-transparent rounded-full animate-spin mb-3"></div>
          <span className="text-xs font-semibold">{t('Đang tải danh sách đồ thất lạc...')}</span>
        </div>
      ) : items.length === 0 ? (
        <div className="p-16 rounded-3xl bg-[var(--surface)] border border-dashed border-[var(--border)] text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-3xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center mb-3">
            <PackageSearch className="w-8 h-8 opacity-70" />
          </div>
          <h3 className="text-base font-bold text-[var(--text)]">{t('Không tìm thấy món đồ nào')}</h3>
          <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm">
            {keyword || selectedCategory !== 'ALL' || selectedStatus !== 'ALL'
              ? t('Không có kết quả nào khớp với bộ lọc tìm kiếm hiện tại.')
              : t('Hiện tại chưa có món đồ nào được ghi nhận thất lạc trong hệ thống.')}
          </p>
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--primary)] text-[color:var(--on-primary)] hover:opacity-90 shadow-sm"
          >
            + {t('Tiếp nhận đồ thất lạc mới')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div
              key={item.itemId}
              className="group relative rounded-3xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)]/50 shadow-xs hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col"
            >
              {/* Image Preview Banner */}
              <div
                className="relative w-full h-44 bg-black/10 overflow-hidden cursor-pointer"
                onClick={() => handleOpenDetail(item)}
              >
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.itemName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-[var(--surface-hover)]/50 text-[var(--text-muted)]">
                    <Box className="w-10 h-10 opacity-30 mb-1" />
                    <span className="text-[11px]">{t('Chưa có ảnh chụp')}</span>
                  </div>
                )}

                {/* Top Overlay Badges */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/60 text-white backdrop-blur-sm">
                    {item.itemCode}
                  </span>
                  {getStatusBadge(item.status)}
                </div>

                {item.valuationType === 'HIGH_VALUE' && (
                  <div className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 flex items-center gap-1 shadow-sm">
                    <Lock className="w-3 h-3" />
                    <span>{t('Két sắt an toàn')}</span>
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3
                    onClick={() => handleOpenDetail(item)}
                    className="font-bold text-base text-[var(--text)] group-hover:text-[var(--primary)] transition-colors cursor-pointer line-clamp-1"
                    title={item.itemName}
                  >
                    {item.itemName}
                  </h3>

                  {/* Storage Location Chip */}
                  <div className="mt-2 flex items-center gap-1.5 text-xs">
                    <span className="text-[var(--text-muted)] flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[var(--primary)]" />
                      <span>{t('Cất tại:')}</span>
                    </span>
                    <span className="font-semibold text-[var(--text)] bg-[var(--surface-hover)] px-2 py-0.5 rounded-lg border border-[var(--border)] truncate max-w-[200px]">
                      {item.storageLocation}
                    </span>
                  </div>

                  <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] truncate">
                    <Clock className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                    <span>{t('Nơi nhặt:')} {item.foundLocation}</span>
                  </div>

                  {item.publicDescription && (
                    <p className="mt-2 text-xs text-[var(--text-muted)] line-clamp-2 italic">
                      "{item.publicDescription}"
                    </p>
                  )}
                </div>

                {/* Card Action Footer */}
                <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenDetail(item)}
                    className="text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)] flex items-center gap-1 p-1.5 rounded-lg hover:bg-[var(--surface-hover)] transition-all cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {t('Chi tiết')}
                  </button>

                  {item.status === 'STORED' ? (
                    <button
                      type="button"
                      onClick={() => handleOpenClaim(item)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {t('Bàn giao')}
                    </button>
                  ) : item.status === 'CLAIMED' ? (
                    <span className="text-[11px] font-medium text-blue-500">
                      {t('✓ Returned to: {0}', [item.claimantName || ''])}
                    </span>
                  ) : item.status === 'OVERDUE' ? (
                    <button
                      type="button"
                      onClick={() => handleOpenDispose(item)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-600 hover:bg-amber-500/30 font-semibold text-xs border border-amber-500/30 flex items-center gap-1 cursor-pointer"
                    >
                      {t('Xử lý quá hạn')}
                    </button>
                  ) : (
                    <span className="text-[11px] text-[var(--text-muted)] italic">
                      {item.disposalReason || t('Đã thanh lý')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-between">
          <div className="text-xs text-[var(--text-muted)]">
            {t('Hiển thị trang')} <span className="font-bold text-[var(--text)]">{page + 1}</span> / {totalPages} ({totalElements} {t('món đồ')})
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="p-2 rounded-xl border border-[var(--border)] text-xs font-semibold disabled:opacity-40 hover:bg-[var(--surface-hover)] transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="p-2 rounded-xl border border-[var(--border)] text-xs font-semibold disabled:opacity-40 hover:bg-[var(--surface-hover)] transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateLostItemModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => {
          showToast('Tiếp nhận món đồ thất lạc thành công!');
          fetchStats();
          fetchItems();
        }}
      />

      <ClaimItemModal
        isOpen={claimModalOpen}
        item={activeItem}
        onClose={() => setClaimModalOpen(false)}
        onSuccess={() => {
          showToast('Đã xác nhận bàn giao món đồ cho người nhận thành công!');
          fetchStats();
          fetchItems();
        }}
      />

      <LostItemDetailModal
        isOpen={detailModalOpen}
        item={activeItem}
        onClose={() => setDetailModalOpen(false)}
        onOpenClaim={(item) => handleOpenClaim(item)}
        onOpenDispose={(item) => handleOpenDispose(item)}
        onDelete={(id) => handleDeleteItem(id)}
      />

      <DisposeItemModal
        isOpen={disposeModalOpen}
        item={activeItem}
        onClose={() => setDisposeModalOpen(false)}
        onSuccess={() => {
          showToast('Đã xử lý thanh lý / tiêu hủy thành công!');
          fetchStats();
          fetchItems();
        }}
      />
    </div>
  );
};

export default LostAndFoundView;

