import axiosClient from '../../../services/axiosClient';

export const memberService = {
  getMyMembership: async () => {
    return await axiosClient.get('/v1/member/my-membership');
  },

  getUpcomingBookings: async () => {
    return await axiosClient.get('/v1/member/upcoming-bookings');
  },

  getTotalCheckIns: async () => {
    return await axiosClient.get('/v1/member/total-checkins');
  },

  getRecentActivities: async () => {
    return await axiosClient.get('/v1/member/recent-activities');
  },

  getCalendarBookings: async () => {
    return await axiosClient.get('/v1/member/calendar-bookings');
  },

  getAvailableClasses: async () => {
    return await axiosClient.get('/v1/member/available-classes');
  },

  bookClass: async (classId) => {
    return await axiosClient.post(`/v1/member/book-class/${classId}`, {});
  },

  cancelClass: async (classId) => {
    return await axiosClient.post(`/v1/member/cancel-class/${classId}`, {});
  },

  getPackages: async () => {
    return await axiosClient.get('/v1/member/packages');
  },

  getPackageDetail: async (packageId) => {
    return await axiosClient.get(`/v1/member/packages/${packageId}`);
  },

  getMyPackages: async () => {
    return await axiosClient.get('/v1/member/my-packages');
  },

  getPurchasedPackageDetail: async (membershipId) => {
    return await axiosClient.get(`/v1/member/my-packages/${membershipId}`);
  },

  addPackageToCart: async (packageId) => {
    return await axiosClient.post(`/v1/member/add-package-to-cart/${packageId}`, {});
  },

  getEnrolledClasses: async () => {
    return await axiosClient.get('/v1/member/enrolled-classes');
  },

  getMyWorkouts: async () => {
    return await axiosClient.get('/v1/member/my-workouts');
  },

  getWorkoutsByClass: async (classId) => {
    return await axiosClient.get(`/v1/member/classes/${classId}/workouts`);
  },

  getAssessments: async () => {
    return await axiosClient.get('/v1/member/assessments');
  },

  getAssessmentsByClass: async (classId) => {
    return await axiosClient.get(`/v1/member/classes/${classId}/assessments`);
  },

  sendAiChat: async (message) => {
    return await axiosClient.post('/v1/member/ai/chat', { message });
  },

  getUserProfile: async () => {
    return await axiosClient.get('/v1/user/profile');
  },

  updateUserProfile: async (payload) => {
    return await axiosClient.put('/v1/user/profile', payload);
  },

  getInvoices: async () => {
    return await axiosClient.get('/v1/invoices');
  },

  getCart: async () => {
    return await axiosClient.get('/v1/payment/cart');
  },

  checkout: async (paymentMethod) => {
    return await axiosClient.post('/v1/payment/checkout', { paymentMethod });
  },

  removeFromCart: async (classId) => {
    return await axiosClient.delete(`/v1/payment/cart/${classId}`);
  },

  removePackageFromCart: async (packageId) => {
    return await axiosClient.delete(`/v1/payment/cart/package/${packageId}`);
  },

  getNotifications: async () => {
    return await axiosClient.get('/v1/notifications');
  },

  markNotificationRead: async (id) => {
    return await axiosClient.put(`/v1/notifications/${id}/read`, {});
  },

  markAllNotificationsRead: async () => {
    return await axiosClient.put('/v1/notifications/read-all', {});
  },

  deleteNotification: async (id) => {
    return await axiosClient.delete(`/v1/notifications/${id}`);
  },

  deleteAllNotifications: async () => {
    return await axiosClient.delete('/v1/notifications');
  },

  getCancelClassPreview: async (classId) => {
    return await axiosClient.get(`/v1/member/support/classes/${classId}/cancel-preview`);
  },

  cancelClassDirectly: async (classId) => {
    return await axiosClient.post(`/v1/member/support/classes/${classId}/cancel-direct`, {});
  },

  createSupportRequest: async (payload) => {
    return await axiosClient.post('/v1/member/support/requests', payload);
  },

  getMySupportRequests: async () => {
    return await axiosClient.get('/v1/member/support/requests');
  },

  getMyCredits: async () => {
    return await axiosClient.get('/v1/member/support/credits');
  },

  withdrawSupportRequest: async (requestId) => {
    return await axiosClient.put(`/v1/member/support/requests/${requestId}/withdraw`);
  },
};

export default memberService;
