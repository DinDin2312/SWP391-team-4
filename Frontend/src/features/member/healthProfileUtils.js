import { vnToday } from '../../utils/vnTime.js';
export const HEALTH_CONDITIONS = [
  { code: 'CARDIOVASCULAR', vi: 'Tim mạch / Huyết áp cao', en: 'Heart disease / High blood pressure' },
  { code: 'DIABETES', vi: 'Tiểu đường', en: 'Diabetes' },
  { code: 'ASTHMA', vi: 'Hen suyễn / Hô hấp', en: 'Asthma / Respiratory' },
  { code: 'LOWER_BACK', vi: 'Cột sống / Thoát vị đĩa đệm', en: 'Spine / Herniated disc' },
  { code: 'KNEE', vi: 'Khớp gối / Dây chằng', en: 'Knee / Ligament' },
  { code: 'SHOULDER', vi: 'Khớp vai', en: 'Shoulder joint' },
  { code: 'OSTEOPOROSIS', vi: 'Loãng xương', en: 'Osteoporosis' },
  { code: 'PREGNANCY', vi: 'Đang mang thai', en: 'Pregnant' },
];

export const PARQ_QUESTIONS = [
  {
    index: 0,
    vi: 'Bác sĩ từng nói bạn có bệnh tim hoặc huyết áp cao?',
    en: 'Has a doctor ever said you have a heart condition or high blood pressure?',
  },
  {
    index: 1,
    vi: 'Bạn có đau ngực khi nghỉ ngơi, sinh hoạt hoặc khi vận động?',
    en: 'Do you feel chest pain at rest, during daily activities, or during physical activity?',
  },
  {
    index: 2,
    vi: 'Trong 12 tháng qua bạn có bị mất thăng bằng do chóng mặt hoặc ngất xỉu?',
    en: 'In the past 12 months, have you lost balance due to dizziness or lost consciousness?',
  },
  {
    index: 3,
    vi: 'Bạn từng được chẩn đoán bệnh mạn tính khác (ngoài tim mạch/huyết áp)?',
    en: 'Have you been diagnosed with another chronic medical condition?',
  },
  {
    index: 4,
    vi: 'Bạn đang dùng thuốc kê đơn cho bệnh mạn tính?',
    en: 'Are you currently taking prescribed medication for a chronic condition?',
  },
  {
    index: 5,
    vi: 'Bạn đang (hoặc trong 12 tháng qua) có vấn đề về xương, khớp, cơ có thể nặng hơn khi vận động?',
    en: 'Do you have (or had in the past 12 months) a bone, joint or soft-tissue problem that could worsen with more activity?',
  },
  {
    index: 6,
    vi: 'Bác sĩ từng khuyên bạn chỉ nên vận động dưới sự giám sát y tế?',
    en: 'Has a doctor ever said you should only do medically supervised physical activity?',
  },
];

export function calcAge(dobString, todayString = vnToday()) {
  if (!dobString || typeof dobString !== 'string') return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dobString.trim());
  if (!match) return null;
  const [year, month, day] = [parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10)];
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const todayMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(todayString.trim());
  if (!todayMatch) return null;
  const [tYear, tMonth, tDay] = [parseInt(todayMatch[1], 10), parseInt(todayMatch[2], 10), parseInt(todayMatch[3], 10)];

  let age = tYear - year;
  if (tMonth < month || (tMonth === month && tDay < day)) {
    age -= 1;
  }
  if (age < 0 || age > 130) return null;
  return age;
}

export function visibleConditions(gender) {
  if (gender === 'MALE') {
    return HEALTH_CONDITIONS.filter(c => c.code !== 'PREGNANCY');
  }
  return HEALTH_CONDITIONS;
}

export function exerciseConflicts(conditions, contraindications) {
  if (!Array.isArray(conditions) || !Array.isArray(contraindications)) {
    return [];
  }
  return conditions.filter(c => contraindications.includes(c));
}

export function formatContraindications(codes, lang = 'vi') {
  if (!Array.isArray(codes) || codes.length === 0) return '';
  const isEn = lang === 'en';
  return codes.map(code => {
    const found = HEALTH_CONDITIONS.find(c => c.code === code);
    return found ? (isEn ? found.en : found.vi) : code;
  }).join(', ');
}

export function formatContraTag(contraindications, lang = 'vi') {
  if (!contraindications || contraindications.length === 0) return '';
  const isEn = lang === 'en';
  const prefix = isEn ? 'Avoid' : 'Tránh';
  const translated = formatContraindications(contraindications, lang);
  return ` [${prefix}: ${translated}]`;
}

export function healthBadge(summary, lang = 'vi') {
  const isEn = lang === 'en';
  if (!summary || !summary.completed) {
    return {
      label: isEn ? 'Not declared' : 'Chưa khai báo',
      variant: 'neutral',
      tooltip: isEn ? 'Trainee has not completed health profile' : 'Học viên chưa hoàn tất khai báo hồ sơ sức khỏe',
    };
  }

  const genderLabel = isEn
    ? (summary.gender === 'MALE' ? 'Male' : summary.gender === 'FEMALE' ? 'Female' : 'Other')
    : (summary.gender === 'MALE' ? 'Nam' : summary.gender === 'FEMALE' ? 'Nữ' : 'Khác');
  const ageLabel = summary.age != null ? (isEn ? `${summary.age}y` : `${summary.age}t`) : '';
  const label = [genderLabel, ageLabel].filter(Boolean).join(' • ');

  let variant = 'success';
  if (summary.clearanceRecommended) {
    variant = 'danger';
  } else if (summary.conditions && summary.conditions.length > 0) {
    variant = 'warning';
  }

  const tooltipParts = [];
  if (summary.clearanceRecommended) {
    tooltipParts.push(isEn ? '⚠ PAR-Q: Medical clearance recommended' : '⚠ PAR-Q: Cần tham khảo ý kiến bác sĩ');
  }
  if (summary.conditions && summary.conditions.length > 0) {
    tooltipParts.push(isEn ? `Conditions: ${summary.conditions.join(', ')}` : `Bệnh lý: ${summary.conditions.join(', ')}`);
  }
  if (summary.notes) {
    tooltipParts.push(isEn ? `Notes: ${summary.notes}` : `Ghi chú: ${summary.notes}`);
  }

  return {
    label,
    variant,
    tooltip: tooltipParts.length > 0 ? tooltipParts.join('\n') : (isEn ? 'Stable health' : 'Sức khỏe ổn định'),
  };
}
