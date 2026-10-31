import React, { useState } from 'react';
import { X, UploadCloud, Image as ImageIcon, Sparkles, AlertCircle, ShieldAlert, Check } from 'lucide-react';
import { t, useLanguage } from '../../../i18n/useLanguage';
import lostAndFoundService from '../services/lostAndFoundService';

const CATEGORIES = [
  { value: 'ELECTRONICS', label: 'Điện tử (Tai nghe, Sạc, ĐH...)', defaultValuation: 'HIGH_VALUE' },
  { value: 'DOCUMENTS_WALLET', label: 'Giấy tờ, Thẻ, Ví tiền', defaultValuation: 'HIGH_VALUE' },
  { value: 'ACCESSORIES', label: 'Phụ kiện & Bình nước', defaultValuation: 'STANDARD' },
  { value: 'CLOTHING_SHOES', label: 'Quần áo & Giày dép', defaultValuation: 'STANDARD' },
  { value: 'PERISHABLE', label: 'Đồ tươi, Đồ uống dở', defaultValuation: 'PERISHABLE' },
  { value: 'OTHER', label: 'Khác', defaultValuation: 'STANDARD' },
];

const STORAGE_SUGGESTIONS = [
  'Két sắt an toàn #1 (Safe Box)',
  'Ngăn tủ A-01 (Khu vực Lễ tân)',
  'Ngăn tủ A-02 (Khu vực Lễ tân)',
  'Ngăn tủ A-03 (Khu vực Lễ tân)',
  'Kệ đồ thất lạc B (Tầng 1)',
  'Tủ bảo quản lạnh (Đồ dễ hỏng)',
];

const LOCATION_SUGGESTIONS = [
  'Máy chạy bộ (Tầng 2)',
  'Khu vực Tạ tự do (Free Weights)',
  'Phòng thay đồ Nam',
  'Phòng thay đồ Nữ',
  'Sàn tập Yoga / GroupX',
  'Hồ bơi bốn mùa',
  'Quầy nước / Nghỉ ngơi',
];

const CreateLostItemModal = ({ isOpen, onClose, onSuccess }) => {
  useLanguage();

  const [formData, setFormData] = useState({
    itemName: '',
    category: 'ACCESSORIES',
    valuationType: 'STANDARD',
    color: '',
    foundLocation: '',
    foundByName: '',
    storageLocation: 'Ngăn tủ A-01 (Khu vực Lễ tân)',
    publicDescription: '',
    secretDetails: '',
    imageUrl: '',
    customRetentionDays: '',
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleCategoryChange = (e) => {
    const selectedCat = e.target.value;
    const catObj = CATEGORIES.find((c) => c.value === selectedCat);
    setFormData((prev) => ({
      ...prev,
      category: selectedCat,
      valuationType: catObj ? catObj.defaultValuation : 'STANDARD',
    }));
  };

  const handleImageFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Vui lòng chọn tệp định dạng hình ảnh (PNG, JPG, JPEG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize down to max 1000px for speed & storage efficiency
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1000;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

        setImagePreview(dataUrl);
        setFormData((prev) => ({ ...prev, imageUrl: dataUrl }));
        setErrorMsg('');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.itemName.trim()) {
      setErrorMsg('Vui lòng nhập tên món đồ.');
      return;
    }
    if (!formData.foundLocation.trim()) {
      setErrorMsg('Vui lòng nhập khu vực nhặt được món đồ.');
      return;
    }
    if (!formData.storageLocation.trim()) {
      setErrorMsg('Vui lòng chọn hoặc nhập vị trí cất giữ món đồ.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        customRetentionDays: formData.customRetentionDays ? parseInt(formData.customRetentionDays, 10) : null,
      };
      await lostAndFoundService.createItem(payload);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || err.message || 'Không thể tạo bản ghi món đồ.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[var(--surface)] text-[var(--text)] rounded-3xl border border-[var(--border)] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface-hover)]/30">
          <div>
            <h2 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[var(--primary)]" />
              {t('Tiếp nhận Đồ thất lạc / Bỏ quên')}
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {t('Ghi nhận tài sản, phân loại, vị trí lưu kho & đặc điểm đối chiếu')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Image Upload Area */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
              {t('Hình ảnh món đồ')} <span className="text-[var(--primary)] font-normal">({t('Khuyên dùng để đối chiếu')})</span>
            </label>

            {imagePreview ? (
              <div className="relative w-full h-52 rounded-2xl overflow-hidden border border-[var(--border)] bg-black/10 group">
                <img
                  src={imagePreview}
                  alt="Lost Item Preview"
                  className="w-full h-full object-contain bg-black/20"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview(null);
                    setFormData((prev) => ({ ...prev, imageUrl: '' }));
                  }}
                  className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-rose-600 transition-all shadow-lg cursor-pointer"
                  title={t('Xóa ảnh')}
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-2 left-3 text-xs bg-black/60 text-white/90 px-2.5 py-1 rounded-full backdrop-blur-sm">
                  {t('✓ Đã tải ảnh')}
                </div>
              </div>
            ) : (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)] rounded-2xl p-6 text-center cursor-pointer transition-colors bg-[var(--surface-hover)]/20 hover:bg-[var(--surface-hover)]/40"
                onClick={() => document.getElementById('lost-item-file-input')?.click()}
              >
                <input
                  id="lost-item-file-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleImageFile(e.target.files[0])}
                />
                <div className="w-12 h-12 mx-auto rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center mb-2.5 shadow-sm">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-[var(--text)]">
                  {t('Nhấn để tải ảnh hoặc kéo thả vào đây')}
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  {t('Hỗ trợ JPG, PNG, WEBP (Tự động nén tối ưu)')}
                </p>
              </div>
            )}
          </div>

          {/* Basic Item Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                {t('Tên món đồ')} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder={t('VD: Bình giữ nhiệt Lock&Lock, AirPods Pro...')}
                value={formData.itemName}
                onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none text-sm transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                {t('Phân loại')} <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={handleCategoryChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none text-sm cursor-pointer transition-all"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                {t('Mức độ giá trị')}
              </label>
              <select
                value={formData.valuationType}
                onChange={(e) => setFormData({ ...formData, valuationType: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:border-[var(--primary)] outline-none text-sm cursor-pointer"
              >
                <option value="HIGH_VALUE">💎 {t('Giá trị cao (Giữ 90 ngày - Bắt buộc Két sắt)')}</option>
                <option value="STANDARD">📦 {t('Tiêu chuẩn (Giữ 30 ngày)')}</option>
                <option value="PERISHABLE">🥗 {t('Đồ dễ hỏng / Đồ ăn (Giữ 48h)')}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                {t('Màu sắc / Nhãn hiệu')}
              </label>
              <input
                type="text"
                placeholder={t('VD: Đen nhám, Xanh Navy, Bạc...')}
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:border-[var(--primary)] outline-none text-sm"
              />
            </div>
          </div>

          {/* Location & Found Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                {t('Khu vực nhặt được')} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                list="location-options"
                placeholder={t('VD: Máy chạy bộ Tầng 2, Phòng thay đồ...')}
                value={formData.foundLocation}
                onChange={(e) => setFormData({ ...formData, foundLocation: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:border-[var(--primary)] outline-none text-sm"
              />
              <datalist id="location-options">
                {LOCATION_SUGGESTIONS.map((loc) => (
                  <option key={loc} value={loc} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                {t('Người mang nộp / Người nhặt')}
              </label>
              <input
                type="text"
                placeholder={t('VD: Lao công cô Mai, HLV Tuấn, Hội viên...')}
                value={formData.foundByName}
                onChange={(e) => setFormData({ ...formData, foundByName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:border-[var(--primary)] outline-none text-sm"
              />
            </div>
          </div>

          {/* Storage Location */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
              {t('Vị trí cất giữ (Ngăn tủ / Két)')} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              list="storage-options"
              placeholder={t('VD: Két sắt an toàn #1, Ngăn tủ A-01...')}
              value={formData.storageLocation}
              onChange={(e) => setFormData({ ...formData, storageLocation: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:border-[var(--primary)] outline-none text-sm"
            />
            <datalist id="storage-options">
              {STORAGE_SUGGESTIONS.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>

          {/* Descriptions */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
              {t('Mô tả công khai')}
            </label>
            <textarea
              rows={2}
              placeholder={t('Đặc điểm dễ thấy: hình dáng bên ngoài, có dây đeo, nhãn hiệu...')}
              value={formData.publicDescription}
              onChange={(e) => setFormData({ ...formData, publicDescription: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:border-[var(--primary)] outline-none text-sm resize-none"
            />
          </div>

          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold text-amber-500 uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4" />
              {t('Đặc điểm nhận dạng bí mật (Chỉ nhân viên thấy)')}
            </label>
            <p className="text-xs text-[var(--text-muted)]">
              {t('Dùng để hỏi đối chiếu khi khách đến nhận nhằm chống mạo danh (VD: Hình nền điện thoại, vết trầy ở đáy, 4 số cuối thẻ...)')}
            </p>
            <textarea
              rows={2}
              placeholder={t('Nhập đặc điểm ẩn, số seri, hình nền, nội dung bên trong ví...')}
              value={formData.secretDetails}
              onChange={(e) => setFormData({ ...formData, secretDetails: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-amber-500/30 bg-[var(--surface)] text-[var(--text)] focus:border-amber-500 outline-none text-sm resize-none"
            />
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-end gap-3 bg-[var(--surface-hover)]/20">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-all cursor-pointer"
          >
            {t('Hủy')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-[var(--primary)] text-[color:var(--on-primary)] hover:opacity-90 transition-all shadow-md cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <Check className="w-4 h-4" />
            )}
            {t('Lưu phiếu tiếp nhận')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateLostItemModal;

