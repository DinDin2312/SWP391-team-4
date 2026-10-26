import axiosClient from '../../../services/axiosClient.js';

export const authService = {
  login: async (credentials) => {
    return await axiosClient.post('/v1/auth/login', credentials);
  },

  googleLogin: async (token) => {
    return await axiosClient.post('/v1/auth/google', { token });
  },

  register: async (payload) => {
    return await axiosClient.post('/v1/auth/register', payload);
  },

  verifyOtp: async (email, otp) => {
    return await axiosClient.post('/v1/auth/verify-otp', null, {
      params: { email, otp },
    });
  },

  resendOtp: async (email) => {
    return await axiosClient.post('/v1/auth/resend-otp', null, {
      params: { email },
    });
  },

  sendForgotPasswordOtp: async (email) => {
    return await axiosClient.post('/v1/auth/forgot-password/send-otp', null, {
      params: { email },
    });
  },

  verifyForgotPasswordOtp: async (payload) => {
    return await axiosClient.post('/v1/auth/forgot-password/verify-otp', payload);
  },

  resetPassword: async (payload) => {
    return await axiosClient.post('/v1/auth/forgot-password/reset', payload);
  },
};

export default authService;
