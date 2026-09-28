import axiosClient from '../../../services/axiosClient';

const managerService = {
  dashboard: () => axiosClient.get('/manager/dashboard'),
  users: (params = {}) => axiosClient.get('/manager/users', { params }),
  roles: () => axiosClient.get('/manager/roles'),
  createUser: (payload) => axiosClient.post('/manager/users', payload),
  updateUser: (id, payload) => axiosClient.put(`/manager/users/${id}`, payload),
  updateUserStatus: (id, status) => axiosClient.patch(`/manager/users/${id}/status`, { status }),

  subjects: () => axiosClient.get('/manager/subjects'),
  saveSubject: (payload) => payload.subjectId
    ? axiosClient.put(`/manager/subjects/${payload.subjectId}`, payload)
    : axiosClient.post('/manager/subjects', payload),
  rooms: () => axiosClient.get('/manager/rooms'),
  saveRoom: (payload) => payload.roomId
    ? axiosClient.put(`/manager/rooms/${payload.roomId}`, payload)
    : axiosClient.post('/manager/rooms', payload),
  classes: () => axiosClient.get('/manager/classes'),
  saveClass: (payload) => payload.classId
    ? axiosClient.put(`/manager/classes/${payload.classId}`, payload)
    : axiosClient.post('/manager/classes', payload),
  schedules: (from, to) => axiosClient.get('/manager/schedules', { params: { from, to } }),
  saveSchedule: (payload) => payload.scheduleId
    ? axiosClient.put(`/manager/schedules/${payload.scheduleId}`, payload)
    : axiosClient.post('/manager/schedules', payload),

  packages: () => axiosClient.get('/manager/packages'),
  savePackage: (payload) => payload.packageId
    ? axiosClient.put(`/manager/packages/${payload.packageId}`, payload)
    : axiosClient.post('/manager/packages', payload),
  reports: (from, to) => axiosClient.get('/manager/reports', { params: { from, to } }),
  auditLogs: () => axiosClient.get('/manager/audit-logs'),
};

export default managerService;
