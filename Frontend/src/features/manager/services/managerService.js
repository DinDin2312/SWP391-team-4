import axiosClient from '../../../services/axiosClient';

function saveOperationResource(resource,id,payload,photo={}) {
  const path=`/manager/${resource}${id?`/${id}`:''}`;
  if(!photo.file && !photo.remove)return id?axiosClient.put(path,payload):axiosClient.post(path,payload);
  const body=new FormData();
  body.append('details',new Blob([JSON.stringify(payload)],{type:'application/json'}));
  if(photo.file)body.append('image',photo.file);
  body.append('removeImage',String(Boolean(photo.remove)));
  return id?axiosClient.put(`${path}/with-image`,body,{headers:{'Content-Type':'multipart/form-data'}}):axiosClient.post(`${path}/with-image`,body,{headers:{'Content-Type':'multipart/form-data'}});
}

const managerService = {
  schedulePolicy: classId => axiosClient.get(classId?`/manager/classes/${classId}/schedule-policy`:'/manager/schedule-policy'),
  saveSchedulePolicy: payload => axiosClient.put('/manager/schedule-policy',payload),
  uploadResourceImage: (resource, id, image) => {
    const body = new FormData();
    body.append('image', image);
    return axiosClient.post(`/manager/${resource}/${id}/image`, body, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  removeResourceImage: (resource, id) => axiosClient.delete(`/manager/${resource}/${id}/image`),
  dashboard: () => axiosClient.get('/manager/dashboard'),
  transactions: params => axiosClient.get('/manager/transactions', { params }),
  transactionDetail: id => axiosClient.get(`/manager/transactions/${id}`),
  overviewPage: (block, page) => axiosClient.get(`/manager/dashboard/${block}`, { params: { page, size: 6 } }),
  users: (params = {}) => axiosClient.get('/manager/users', { params }),
  roles: () => axiosClient.get('/manager/roles'),
  createUser: (payload) => axiosClient.post('/manager/users', payload),
  updateUser: (id, payload) => axiosClient.put(`/manager/users/${id}`, payload),
  updateUserAvatar: (id, avatar) => {
    const form = new FormData();
    form.append('avatar', avatar);
    return axiosClient.post(`/manager/users/${id}/avatar`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  updateUserStatus: (id, status, reason = '') => axiosClient.patch(`/manager/users/${id}/status`, { status, reason }),
  deleteUser: (id) => axiosClient.delete(`/manager/users/${id}`),

  subjects: () => axiosClient.get('/manager/subjects'),
  saveSubject: (payload,photo) => saveOperationResource('subjects',payload.subjectId,payload,photo),
  rooms: () => axiosClient.get('/manager/rooms'),
  saveRoom: (payload,photo) => saveOperationResource('rooms',payload.roomId,payload,photo),
  classes: () => axiosClient.get('/manager/classes'),
  saveClass: (payload,photo) => saveOperationResource('classes',payload.classId,payload,photo),
  schedules: (from, to, extra = {}) => axiosClient.get('/manager/schedules', { params: { from, to, ...extra } }),
  scheduleBookings: (id) => axiosClient.get(`/manager/schedules/${id}/bookings`),
  createScheduleSeries: (payload) => axiosClient.post('/manager/schedules/series', payload),
  previewSchedulePlan: (payload) => axiosClient.post('/manager/schedules/plan/preview', payload),
  scheduleAvailability: (payload) => axiosClient.post('/manager/schedules/plan/availability', payload),
  commitSchedulePlan: (payload) => axiosClient.post('/manager/schedules/plan', payload),
  saveSchedule: (payload) => payload.scheduleId
    ? axiosClient.put(`/manager/schedules/${payload.scheduleId}`, payload)
    : axiosClient.post('/manager/schedules', payload),

  packageDetail: id => axiosClient.get(`/manager/packages/${id}`).then(data=>({data})),
  packageHistory: (id,page=1) => axiosClient.get(`/manager/packages/${id}/history`,{params:{page}}).then(data=>({data})),
  packageSelling: (id,status) => axiosClient.patch(`/manager/packages/${id}/selling-status`,{status}),
  packages: () => axiosClient.get('/manager/packages'),
  packageTypes: () => axiosClient.get('/manager/package-types').then(data=>({data})),
  savePackageType: (type) => (type.typeCode?axiosClient.put(`/manager/package-types/${type.typeCode}`,type):axiosClient.post('/manager/package-types',type)).then(data=>({data})),
  savePackage: (payload, photo = {}) => {
    if(photo.file || photo.remove) {
      const body=new FormData();
      body.append('details',new Blob([JSON.stringify(payload)],{type:'application/json'}));
      if(photo.file) body.append('image',photo.file);
      body.append('removeImage',String(Boolean(photo.remove)));
      const config={headers:{'Content-Type':'multipart/form-data'}};
      return payload.packageId?axiosClient.put(`/manager/packages/${payload.packageId}/with-image`,body,config):axiosClient.post('/manager/packages/with-image',body,config);
    }
    return payload.packageId?axiosClient.put(`/manager/packages/${payload.packageId}`,payload):axiosClient.post('/manager/packages',payload);
  },
  reports: (from, to) => axiosClient.get('/manager/reports', { params: { from, to } }),
  auditLogs: () => axiosClient.get('/manager/audit-logs'),
};

export default managerService;
