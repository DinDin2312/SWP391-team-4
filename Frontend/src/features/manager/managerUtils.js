export const isoDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export function localDateTime(value) {
  if (!value) return '';
  // A JDBC LocalDateTime is wall-clock time; only convert values that explicitly carry a timezone.
  if (!/(Z|[+-]\d{2}:\d{2})$/.test(value)) return value.replace(' ', 'T').slice(0, 16);
  const date = new Date(value);
  return `${isoDate(date)}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function initialForm(type, item = {}) {
  return {
    status: type === 'schedule' ? 'SCHEDULED' : 'ACTIVE', packageType: 'GYM_ACCESS',
    occurrences: 4, intervalWeeks: 1, repeat: false, ...item, password: '',
    startTime: localDateTime(item.startTime), endTime: localDateTime(item.endTime),
  };
}

export function apiError(error, fallback = 'Không thể lưu thay đổi.') {
  const response = error.response?.data;
  const labels = { fullName: 'Họ tên', email: 'Email', password: 'Mật khẩu', price: 'Giá',
    status: 'Trạng thái', classId: 'Lớp', roleId: 'Vai trò', capacity: 'Sức chứa',
    startTime: 'Bắt đầu', endTime: 'Kết thúc', packageType: 'Loại gói' };
  if (response?.errors) return Object.entries(response.errors).map(([key, value]) => `${labels[key] || key}: ${value}`).join('; ');
  return response?.message || fallback;
}

export function reportCsv(data) {
  const cell = (value) => {
    let text = String(value ?? '');
    if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  };
  const rows = [
    ['Chỉ tiêu', 'Giá trị'], ['Doanh thu (VND)', data.summary?.revenue || 0],
    ['Giao dịch thành công', data.summary?.successfulPayments || 0],
    ['Hóa đơn chờ', data.summary?.pendingInvoices || 0], ['Lượt đăng ký', data.summary?.confirmedBookings || 0],
    [], ['Ngày', 'Doanh thu (VND)'], ...(data.revenueByDay || []).map((row) => [row.label, row.value]),
    [], ['Lớp', 'Lượt đặt', 'Tổng chỗ của các buổi'], ...(data.classOccupancy || []).map((row) => [row.label, row.value, row.capacity]),
  ];
  return '\uFEFF' + rows.map((row) => row.map(cell).join(',')).join('\r\n');
}
