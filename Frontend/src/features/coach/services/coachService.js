import axiosClient from '../../../services/axiosClient';

export const coachService = {
  getProfile: async () => {
    return await axiosClient.get('/v1/coach/profile');
  },

  updateProfile: async (payload) => {
    return await axiosClient.put('/v1/coach/profile', payload);
  },

  getSubjects: async () => {
    return await axiosClient.get('/v1/coach/subjects');
  },

  getSchedules: async () => {
    return await axiosClient.get('/v1/coach/schedules');
  },

  getScheduleStudents: async (scheduleId) => {
    return await axiosClient.get(`/v1/coach/schedules/${scheduleId}/students`);
  },

  updateAttendance: async (scheduleId, payload) => {
    return await axiosClient.put(`/v1/coach/schedules/${scheduleId}/attendance`, payload);
  },

  getStudents: async () => {
    return await axiosClient.get('/v1/coach/students');
  },

  getClasses: async () => {
    return await axiosClient.get('/v1/coach/classes');
  },

  getStudentsByClassId: async (classId) => {
    return await axiosClient.get(`/v1/coach/classes/${classId}/students`);
  },

  sendNotification: async (payload) => {
    return await axiosClient.post('/v1/coach/notifications/send', payload);
  },

  getExercises: async () => {
    return await axiosClient.get('/v1/coach/exercises');
  },

  createExercise: async (payload) => {
    return await axiosClient.post('/v1/coach/exercises', payload);
  },

  getWorkoutPlans: async (studentUserId) => {
    const params = studentUserId ? { studentUserId } : {};
    return await axiosClient.get('/v1/coach/workouts', { params });
  },

  getWorkoutPlanById: async (planId) => {
    return await axiosClient.get(`/v1/coach/workouts/${planId}`);
  },

  assignWorkoutPlan: async (payload) => {
    return await axiosClient.post('/v1/coach/workouts/assign', payload);
  },

  deleteWorkoutPlan: async (planId) => {
    return await axiosClient.delete(`/v1/coach/workouts/${planId}`);
  },

  getAssessments: async (studentUserId) => {
    const params = studentUserId ? { studentUserId } : {};
    return await axiosClient.get('/v1/coach/assessments', { params });
  },

  getStudentAssessmentHistory: async (studentUserId) => {
    return await axiosClient.get(`/v1/coach/assessments/student/${studentUserId}`);
  },

  createAssessment: async (payload) => {
    return await axiosClient.post('/v1/coach/assessments', payload);
  },

  deleteAssessment: async (assessmentId) => {
    return await axiosClient.delete(`/v1/coach/assessments/${assessmentId}`);
  },
};

export default coachService;
