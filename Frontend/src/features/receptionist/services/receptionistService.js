import axiosClient from '../../../services/axiosClient';

export const receptionistService = {
  /**
   * Tìm kiếm thành viên với bộ lọc
   * @param {Object} params - { keyword, status, membershipFilter }
   */
  searchMembers: async ({ keyword = '', status = 'ALL', membershipFilter = 'ALL' } = {}) => {
    const params = {};
    if (keyword && keyword.trim()) params.keyword = keyword.trim();
    if (status && status !== 'ALL') params.status = status;
    if (membershipFilter && membershipFilter !== 'ALL') params.membershipFilter = membershipFilter;

    return await axiosClient.get('/receptionist/members/search', { params });
  },

  /**
   * Lấy chi tiết hồ sơ thành viên (thông tin cá nhân, các gói tập, lịch sử đặt lớp)
   * @param {number|string} userId
   */
  getMemberDetail: async (userId) => {
    return await axiosClient.get(`/receptionist/members/${userId}`);
  },

  /**
   * Lấy danh sách gói tập của thành viên
   * @param {number|string} userId
   */
  getMemberMemberships: async (userId) => {
    return await axiosClient.get(`/receptionist/members/${userId}/memberships`);
  },

  /**
   * Đăng ký thành viên mới tại quầy
   * @param {Object} memberData - { fullName, email, phone, defaultPassword }
   */
  registerMember: async (memberData) => {
    return await axiosClient.post('/receptionist/members/register', memberData);
  },
  suggestNextClassRenewal: async (userId, bookingId) => {
    return await axiosClient.get('/receptionist/classes/suggest-renewal', {
      params: { userId, bookingId }
    });
  },

  confirmClassRenewal: async (renewalData) => {
    return await axiosClient.post('/receptionist/classes/confirm-renewal', renewalData);
  },

  getAllPackages: async () => {
    return await axiosClient.get('/receptionist/packages');
  },

  subscribePackage: async (data) => {
    return await axiosClient.post('/receptionist/packages/subscribe', data);
  },

  getFacilityRooms: async () => {
    return await axiosClient.get('/receptionist/checkin/rooms');
  },

  getCheckInHistory: async ({ date = '', keyword = '', status = 'ALL' } = {}) => {
    const params = {};
    if (date) params.date = date;
    if (keyword && keyword.trim()) params.keyword = keyword.trim();
    if (status && status !== 'ALL') params.status = status;
    return await axiosClient.get('/receptionist/checkin/history', { params });
  },

  checkInMember: async (payload) => {
    return await axiosClient.post('/receptionist/checkin', payload);
  },

  checkOutMember: async (checkInId) => {
    return await axiosClient.post(`/receptionist/checkin/${checkInId}/checkout`);
  },

  getAvailableClassesForMember: async (userId) => {
    return await axiosClient.get('/receptionist/classes/available', {
      params: { userId }
    });
  },

  enrollMemberToClass: async (data) => {
    return await axiosClient.post('/receptionist/classes/enroll', data);
  },

  cancelBookingForMember: async (data) => {
    return await axiosClient.post('/receptionist/classes/cancel-booking', data);
  },

  cancelCourseForMember: async (data) => {
    return await axiosClient.post('/receptionist/classes/cancel-course', data);
  },

  getInvoiceReceipt: async (invoiceId) => {
    return await axiosClient.get(`/receptionist/invoices/${invoiceId}`);
  },

  getMemberInvoices: async (userId) => {
    return await axiosClient.get(`/receptionist/members/${userId}/invoices`);
  },

  getAllInvoices: async () => {
    return await axiosClient.get('/receptionist/invoices');
  },

  getSupportRequests: async ({ status, category, keyword, page = 0, size = 10 } = {}) => {
    const params = { page, size };
    if (status && status !== 'ALL') params.status = status;
    if (category && category !== 'ALL') params.category = category;
    if (keyword && keyword.trim()) params.keyword = keyword.trim();
    return await axiosClient.get('/receptionist/support/requests', { params });
  },

  getSupportStats: async () => {
    return await axiosClient.get('/receptionist/support/stats');
  },

  respondSupportRequest: async (requestId, payload) => {
    return await axiosClient.put(`/receptionist/support/requests/${requestId}/respond`, payload);
  },

  createSupportOnBehalf: async (memberUserId, payload) => {
    return await axiosClient.post(`/receptionist/support/requests/on-behalf/${memberUserId}`, payload);
  },
};

export default receptionistService;


