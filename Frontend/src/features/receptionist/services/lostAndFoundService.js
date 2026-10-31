import axiosClient from '../../../services/axiosClient.js';

export const lostAndFoundService = {
  /**
   * Tìm kiếm đồ thất lạc với bộ lọc & phân trang
   * @param {Object} params - { keyword, status, category, valuationType, page, size }
   */
  searchItems: async ({ keyword = '', status = '', category = '', valuationType = '', page = 0, size = 12 } = {}) => {
    const params = { page, size };
    if (keyword && keyword.trim()) params.keyword = keyword.trim();
    if (status && status !== 'ALL') params.status = status;
    if (category && category !== 'ALL') params.category = category;
    if (valuationType && valuationType !== 'ALL') params.valuationType = valuationType;

    return await axiosClient.get('/receptionist/lost-and-found/items', { params });
  },

  /**
   * Lấy chi tiết món đồ theo ID
   * @param {number|string} id
   */
  getItemById: async (id) => {
    return await axiosClient.get(`/receptionist/lost-and-found/items/${id}`);
  },

  /**
   * Lấy số liệu thống kê (Metrics bar)
   */
  getStats: async () => {
    return await axiosClient.get('/receptionist/lost-and-found/stats');
  },

  /**
   * Tiếp nhận món đồ mới
   * @param {Object} payload
   */
  createItem: async (payload) => {
    return await axiosClient.post('/receptionist/lost-and-found/items', payload);
  },

  /**
   * Cập nhật thông tin món đồ
   * @param {number|string} id
   * @param {Object} payload
   */
  updateItem: async (id, payload) => {
    return await axiosClient.put(`/receptionist/lost-and-found/items/${id}`, payload);
  },

  /**
   * Bàn giao / trả đồ cho người nhận
   * @param {number|string} id
   * @param {Object} payload - { claimedByUserId, claimantName, claimantPhone, claimantIdCard, claimNotes }
   */
  claimItem: async (id, payload) => {
    return await axiosClient.post(`/receptionist/lost-and-found/items/${id}/claim`, payload);
  },

  /**
   * Xử lý thanh lý / tiêu hủy / quyên góp
   * @param {number|string} id
   * @param {Object} payload - { disposalReason, disposalNotes }
   */
  disposeItem: async (id, payload) => {
    return await axiosClient.post(`/receptionist/lost-and-found/items/${id}/dispose`, payload);
  },

  /**
   * Xóa bản ghi (nếu nhập nhầm)
   * @param {number|string} id
   */
  deleteItem: async (id) => {
    return await axiosClient.delete(`/receptionist/lost-and-found/items/${id}`);
  },
};

export default lostAndFoundService;

