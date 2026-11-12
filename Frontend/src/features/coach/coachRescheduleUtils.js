export const REASON_CATEGORIES = [
  { value: 'UNAVAILABLE_NO_SUB', labelEn: 'No substitute coach available', labelVi: 'Không có HLV nào rảnh để dạy thay' },
  { value: 'SICK_LEAVE', labelEn: 'Sick leave / Medical', labelVi: 'Nghỉ ốm / Khám chữa bệnh' },
  { value: 'EMERGENCY_LEAVE', labelEn: 'Urgent family emergency', labelVi: 'Việc gia đình đột xuất' },
  { value: 'WORK_TRIP', labelEn: 'Business trip / Training', labelVi: 'Công tác / Tham gia tập huấn' },
  { value: 'ADMIN_OVERRIDE', labelEn: 'Direct manager assignment', labelVi: 'Quản lý chỉ định trực tiếp' },
  { value: 'OTHER', labelEn: 'Other reason', labelVi: 'Lý do khác' }
];

const LEGACY_REASON_LABELS = {
  NO_SUBSTITUTE_SICK: { labelEn: 'Sick leave (No substitute coach)', labelVi: 'Nghỉ ốm đột xuất (Không có HLV dạy thay)' },
  NO_SUBSTITUTE_EMERGENCY: { labelEn: 'Urgent emergency (No substitute coach)', labelVi: 'Việc khẩn cấp (Không có HLV dạy thay)' },
  NO_SUBSTITUTE_PERSONAL: { labelEn: 'Personal leave (No substitute coach)', labelVi: 'Việc cá nhân (Không có HLV dạy thay)' },
  NO_SUBSTITUTE_BUSINESS: { labelEn: 'Business trip (No substitute coach)', labelVi: 'Đi công tác (Không có HLV dạy thay)' },
  NO_SUBSTITUTE_OTHER: { labelEn: 'Other reason (No substitute coach)', labelVi: 'Lý do khác (Không có HLV dạy thay)' },
  BUSINESS_TRIP: { labelEn: 'Business trip / Training', labelVi: 'Công tác / Tham gia tập huấn' },
  FACILITY_ISSUE: { labelEn: 'Facility / Equipment issue', labelVi: 'Sự cố phòng tập / Thiết bị' }
};

/** Resolve an enum or legacy reason code into a localized label. */
export const getReasonLabel = (reasonKey, lang = 'vi') => {
  const normalized = String(reasonKey || '').trim().toUpperCase();
  const match = REASON_CATEGORIES.find(r => r.value === normalized) || LEGACY_REASON_LABELS[normalized];
  if (!match) return reasonKey || (lang === 'vi' ? 'Không rõ' : 'Unspecified');
  return lang === 'vi' ? match.labelVi : match.labelEn;
};

/** Extract localized reason label and any distinct coach explanation text. */
export const getRescheduleReasonDetail = (req, lang = 'vi') => {
  const reasonLabel = getReasonLabel(req?.reasonCategory, lang);
  const rawDetail = String(req?.reasonDetails || req?.reasonNote || '').trim();
  const isRedundantDefault =
    !rawDetail ||
    rawDetail === getReasonLabel(req?.reasonCategory, 'vi') ||
    rawDetail === getReasonLabel(req?.reasonCategory, 'en') ||
    rawDetail.toUpperCase() === String(req?.reasonCategory || '').trim().toUpperCase();
  const hasCustomDetail = !isRedundantDefault;
  return {
    reasonLabel,
    detailText: hasCustomDetail ? rawDetail : '',
    hasCustomDetail
  };
};

export const getStatusMeta = (status, lang = 'vi') => {
  switch (status) {
    case 'PENDING':
      return {
        label: lang === 'vi' ? 'Chờ thẩm định' : 'Pending Review',
        badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
      };
    case 'APPROVED':
      return {
        label: lang === 'vi' ? 'Đã phê duyệt' : 'Approved',
        badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
      };
    case 'REJECTED':
      return {
        label: lang === 'vi' ? 'Bị từ chối' : 'Rejected',
        badgeClass: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
      };
    case 'CANCELLED':
      return {
        label: lang === 'vi' ? 'Đã hủy' : 'Cancelled',
        badgeClass: 'bg-slate-500/15 text-slate-500 dark:text-slate-400 border-slate-500/30'
      };
    case 'COMPLETED':
      return {
        label: lang === 'vi' ? 'Hoàn tất' : 'Completed',
        badgeClass: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30'
      };
    default:
      return {
        label: status,
        badgeClass: 'bg-slate-500/15 text-slate-500 border-slate-500/30'
      };
  }
};

export const formatDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return '--';
  const d = new Date(dateTimeStr);
  if (isNaN(d.getTime())) return dateTimeStr;
  return d.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const formatScheduleSlot = (startTime, endTime, lang = 'vi') => {
  if (!startTime) return '--';
  const start = new Date(startTime);
  if (isNaN(start.getTime())) return startTime;
  const timeStart = start.toLocaleTimeString(lang === 'vi' ? 'vi-VN' : 'en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  let timeEnd = '';
  if (endTime) {
    const end = new Date(endTime);
    if (!isNaN(end.getTime())) {
      timeEnd = end.toLocaleTimeString(lang === 'vi' ? 'vi-VN' : 'en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
    }
  }
  const dateFormatted = start.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  return `${dateFormatted} • ${timeStart}${timeEnd ? ` - ${timeEnd}` : ''}`;
};

export const isDeadlineExpired = (deadlineStr) => {
  if (!deadlineStr) return false;
  return new Date(deadlineStr) < new Date();
};

export const isMakeupSession = (type) => {
  if (!type) return false;
  const upper = String(type).trim().toUpperCase();
  return upper === 'MAKEUP_SESSION' || upper === 'MAKE_UP_SESSION';
};

export const isSubstituteCoach = (type) => {
  if (!type) return false;
  const upper = String(type).trim().toUpperCase();
  return upper === 'SUBSTITUTE_COACH';
};
