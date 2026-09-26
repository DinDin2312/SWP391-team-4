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
  }
};

export default receptionistService;

/**
 * Đăng ký thành viên mới tại quầy
 * @param {Object} memberData - { fullName, email, phone, defaultPassword }
 */
registerMember: async (memberData) => {
  return await axiosClient.post('/receptionist/members/register', memberData);
}
