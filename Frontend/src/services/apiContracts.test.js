import assert from 'node:assert/strict';
import test from 'node:test';
import axiosClient from './axiosClient.js';
import authService from '../features/auth/services/authService.js';
import coachService from '../features/coach/services/coachService.js';
import memberService from '../features/member/services/memberService.js';
import receptionistService from '../features/receptionist/services/receptionistService.js';
import managerService from '../features/manager/services/managerService.js';

function withMockedAxios(fn) {
  const calls = [];
  const originals = {
    get: axiosClient.get,
    post: axiosClient.post,
    put: axiosClient.put,
    patch: axiosClient.patch,
    delete: axiosClient.delete,
  };
  for (const method of Object.keys(originals)) {
    axiosClient[method] = async (...args) => {
      calls.push({ method, args });
      return { ok: true, method, args };
    };
  }
  return Promise.resolve()
    .then(() => fn(calls))
    .finally(() => {
      Object.assign(axiosClient, originals);
    });
}

test('axiosClient request & response interceptors handle JWT token and payload unwrapping', async () => {
  const reqHandlers = axiosClient.interceptors.request.handlers;
  const resHandlers = axiosClient.interceptors.response.handlers;
  assert.ok(reqHandlers.length >= 1);
  assert.ok(resHandlers.length >= 1);

  const store = new Map();
  globalThis.localStorage = {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, val) => store.set(key, String(val)),
  };

  // Without token
  const cfgNoToken = reqHandlers[0].fulfilled({ headers: {} });
  assert.equal(cfgNoToken.headers.Authorization, undefined);

  // With token
  store.set('token', 'jwt-token-xyz');
  const cfgWithToken = reqHandlers[0].fulfilled({ headers: {} });
  assert.equal(cfgWithToken.headers.Authorization, 'Bearer jwt-token-xyz');

  // Request error rejected
  await assert.rejects(
    () => reqHandlers[0].rejected(new Error('req-fail')),
    /req-fail/
  );

  // Response unwraps .data when present, returns raw when undefined
  assert.deepEqual(resHandlers[0].fulfilled({ data: { id: 1 } }), { id: 1 });
  assert.deepEqual(resHandlers[0].fulfilled({ status: 204 }), { status: 204 });
  assert.equal(resHandlers[0].fulfilled(null), null);

  // Response error rethrows
  assert.throws(
    () => resHandlers[0].rejected(new Error('res-fail')),
    /res-fail/
  );
});

test('authService contracts cover all authentication and OTP flows', async () => {
  await withMockedAxios(async (calls) => {
    await authService.login({ email: 'a@b.com', password: '123' });
    await authService.googleLogin('google-id-token');
    await authService.register({ fullName: 'User A', email: 'a@b.com' });
    await authService.verifyOtp('a@b.com', '123456');
    await authService.resendOtp('a@b.com');
    await authService.sendForgotPasswordOtp('a@b.com');
    await authService.verifyForgotPasswordOtp({ email: 'a@b.com', otp: '654321' });
    await authService.resetPassword({ email: 'a@b.com', newPassword: 'new' });

    assert.equal(calls.length, 8);
    assert.deepEqual(calls[0], { method: 'post', args: ['/v1/auth/login', { email: 'a@b.com', password: '123' }] });
    assert.deepEqual(calls[1], { method: 'post', args: ['/v1/auth/google', { token: 'google-id-token' }] });
    assert.deepEqual(calls[3], { method: 'post', args: ['/v1/auth/verify-otp', null, { params: { email: 'a@b.com', otp: '123456' } }] });
    assert.deepEqual(calls[7], { method: 'post', args: ['/v1/auth/forgot-password/reset', { email: 'a@b.com', newPassword: 'new' }] });
  });
});

test('coachService contracts cover schedules, attendance, workouts, and assessments', async () => {
  await withMockedAxios(async (calls) => {
    await coachService.getProfile();
    await coachService.updateProfile({ bio: 'Senior Coach' });
    await coachService.getSubjects();
    await coachService.getSchedules();
    await coachService.getScheduleStudents(10);
    await coachService.updateAttendance(10, [{ bookingId: 1, status: 'ATTENDED' }]);
    await coachService.getStudents();
    await coachService.getClasses();
    await coachService.getStudentsByClassId(5);
    await coachService.sendNotification({ title: 'Notice', message: 'Body' });
    await coachService.getExercises();
    await coachService.createExercise({ name: 'Squat' });
    await coachService.getWorkoutPlans();
    await coachService.getWorkoutPlans(99);
    await coachService.getWorkoutPlanById(7);
    await coachService.assignWorkoutPlan({ title: 'Leg Day' });
    await coachService.deleteWorkoutPlan(7);
    await coachService.getAssessments();
    await coachService.getAssessments(99);
    await coachService.getStudentAssessmentHistory(99);
    await coachService.createAssessment({ weightKg: 70 });
    await coachService.deleteAssessment(12);

    assert.equal(calls.length, 22);
    assert.deepEqual(calls[4], { method: 'get', args: ['/v1/coach/schedules/10/students'] });
    assert.deepEqual(calls[12], { method: 'get', args: ['/v1/coach/workouts', { params: {} }] });
    assert.deepEqual(calls[13], { method: 'get', args: ['/v1/coach/workouts', { params: { studentUserId: 99 } }] });
    assert.deepEqual(calls[17], { method: 'get', args: ['/v1/coach/assessments', { params: {} }] });
    assert.deepEqual(calls[18], { method: 'get', args: ['/v1/coach/assessments', { params: { studentUserId: 99 } }] });
  });
});

test('memberService contracts cover bookings, packages, cart, notifications, and support requests', async () => {
  await withMockedAxios(async (calls) => {
    await memberService.getMyMembership();
    await memberService.getUpcomingBookings();
    await memberService.getTotalCheckIns();
    await memberService.getRecentActivities();
    await memberService.getCalendarBookings();
    await memberService.getAvailableClasses();
    await memberService.bookClass(11);
    await memberService.cancelClass(11);
    await memberService.getPackages();
    await memberService.getPackageDetail(3);
    await memberService.getMyPackages();
    await memberService.getPurchasedPackageDetail(8);
    await memberService.addPackageToCart(3);
    await memberService.getEnrolledClasses();
    await memberService.getMyWorkouts();
    await memberService.getWorkoutsByClass(11);
    await memberService.createSelfAssessment({ weightKg: 65 });
    await memberService.getAssessments();
    await memberService.getAssessmentsByClass(11);
    await memberService.sendAiChat('Hello AI');
    await memberService.getUserProfile();
    await memberService.updateUserProfile({ fullName: 'Updated' });
    await memberService.getInvoices();
    await memberService.getCart();
    await memberService.checkout('SEPAY');
    await memberService.removeFromCart(11);
    await memberService.removePackageFromCart(3);
    await memberService.getNotifications();
    await memberService.markNotificationRead(4);
    await memberService.markAllNotificationsRead();
    await memberService.deleteNotification(4);
    await memberService.deleteAllNotifications();
    await memberService.getCancelClassPreview(11);
    await memberService.cancelClassDirectly(11);
    await memberService.getTransferClassPreview(11);
    await memberService.transferClassDirectly(11, 12);
    await memberService.createSupportRequest({ category: 'REFUND' });
    await memberService.getMySupportRequests();
    await memberService.getMyCredits();
    await memberService.withdrawSupportRequest(21);

    assert.equal(calls.length, 40);
    assert.deepEqual(calls[6], { method: 'post', args: ['/v1/member/book-class/11', {}] });
    assert.deepEqual(calls[24], { method: 'post', args: ['/v1/payment/checkout', { paymentMethod: 'SEPAY' }] });
    assert.deepEqual(calls[35], { method: 'post', args: ['/v1/member/support/classes/11/transfer-to/12', {}] });
    assert.deepEqual(calls[39], { method: 'put', args: ['/v1/member/support/requests/21/withdraw'] });
  });
});

test('receptionistService contracts cover search filter normalization, check-ins, and support desk', async () => {
  await withMockedAxios(async (calls) => {
    await receptionistService.searchMembers();
    await receptionistService.searchMembers({ keyword: '  an ', status: 'ACTIVE', membershipFilter: 'HAS_PACKAGE' });
    await receptionistService.getMemberDetail(5);
    await receptionistService.getMemberMemberships(5);
    await receptionistService.registerMember({ fullName: 'New Member' });
    await receptionistService.suggestNextClassRenewal(5, 100);
    await receptionistService.confirmClassRenewal({ userId: 5 });
    await receptionistService.getAllPackages();
    await receptionistService.subscribePackage({ userId: 5, packageId: 2 });
    await receptionistService.getFacilityRooms();
    await receptionistService.getCheckInHistory();
    await receptionistService.getCheckInHistory({ date: '2026-04-20', keyword: ' minh ', status: 'CHECKED_IN' });
    await receptionistService.checkInMember({ userId: 5 });
    await receptionistService.checkOutMember(77);
    await receptionistService.getCoachSchedules();
    await receptionistService.getCoachSchedules({ date: '2026-04-20', keyword: ' tuan ', status: 'SCHEDULED' });
    await receptionistService.checkInCoach({ scheduleId: 9 });
    await receptionistService.checkOutCoach(88);
    await receptionistService.getAvailableClassesForMember(5);
    await receptionistService.enrollMemberToClass({ userId: 5, classId: 3 });
    await receptionistService.cancelBookingForMember({ bookingId: 10 });
    await receptionistService.cancelCourseForMember({ userId: 5, classId: 3 });
    await receptionistService.getInvoiceReceipt(42);
    await receptionistService.getMemberInvoices(5);
    await receptionistService.getAllInvoices();
    await receptionistService.getSupportRequests();
    await receptionistService.getSupportRequests({ status: 'PENDING', category: 'REFUND', keyword: ' cash ', page: 1, size: 20 });
    await receptionistService.getSupportStats();
    await receptionistService.respondSupportRequest(15, { status: 'APPROVED' });
    await receptionistService.revokeSupportRequest(15, { reason: 'Mistake' });
    await receptionistService.createSupportOnBehalf(5, { category: 'CLASS_CHANGE' });

    assert.equal(calls.length, 31);
    assert.deepEqual(calls[0], { method: 'get', args: ['/receptionist/members/search', { params: {} }] });
    assert.deepEqual(calls[1], {
      method: 'get',
      args: ['/receptionist/members/search', { params: { keyword: 'an', status: 'ACTIVE', membershipFilter: 'HAS_PACKAGE' } }],
    });
    assert.deepEqual(calls[11], {
      method: 'get',
      args: ['/receptionist/checkin/history', { params: { date: '2026-04-20', keyword: 'minh', status: 'CHECKED_IN' } }],
    });
    assert.deepEqual(calls[26], {
      method: 'get',
      args: ['/receptionist/support/requests', { params: { page: 1, size: 20, status: 'PENDING', category: 'REFUND', keyword: 'cash' } }],
    });
  });
});

test('managerService contracts cover JSON and multipart endpoints across operations, packages, and staff', async () => {
  await withMockedAxios(async (calls) => {
    await managerService.schedulePolicy();
    await managerService.schedulePolicy(12);
    await managerService.saveSchedulePolicy({ maxWeeks: 8 });
    await managerService.uploadResourceImage('rooms', 3, new Blob(['img'], { type: 'image/png' }));
    await managerService.removeResourceImage('rooms', 3);
    await managerService.dashboard();
    await managerService.transactions({ page: 0 });
    await managerService.transactionDetail(99);
    await managerService.overviewPage('revenue', 2);
    await managerService.users();
    await managerService.roles();
    await managerService.createUser({ email: 'staff@gym.vn' });
    await managerService.updateUser(4, { fullName: 'Staff' });
    await managerService.updateUserAvatar(4, new Blob(['av'], { type: 'image/png' }));
    await managerService.updateUserStatus(4, 'LOCKED');
    await managerService.deleteUser(4);
    await managerService.subjects();
    await managerService.saveSubject({ subjectName: 'Yoga' });
    await managerService.saveSubject({ subjectId: 2, subjectName: 'Yoga' });
    await managerService.saveSubject({ subjectName: 'Yoga' }, { file: new Blob(['f']) });
    await managerService.saveSubject({ subjectId: 2, subjectName: 'Yoga' }, { remove: true });
    await managerService.rooms();
    await managerService.saveRoom({ roomName: 'R1' });
    await managerService.classes();
    await managerService.saveClass({ className: 'C1' });
    await managerService.schedules('2026-04-01', '2026-04-30');
    await managerService.scheduleBookings(8);
    await managerService.createScheduleSeries({ classId: 1 });
    await managerService.previewSchedulePlan({ classId: 1 });
    await managerService.scheduleAvailability({ classId: 1 });
    await managerService.commitSchedulePlan({ classId: 1 });
    await managerService.saveSchedule({ classId: 1 });
    await managerService.saveSchedule({ scheduleId: 10, classId: 1 });
    await managerService.packageDetail(5);
    await managerService.packageHistory(5);
    await managerService.packageSelling(5, 'ACTIVE');
    await managerService.packages();
    await managerService.packageTypes();
    await managerService.savePackageType({ name: 'New Type' });
    await managerService.savePackageType({ typeCode: 'VIP', name: 'VIP Type' });
    await managerService.savePackage({ packageName: 'Starter' });
    await managerService.savePackage({ packageId: 6, packageName: 'Starter' });
    await managerService.savePackage({ packageName: 'Starter' }, { file: new Blob(['p']) });
    await managerService.savePackage({ packageId: 6, packageName: 'Starter' }, { remove: true });
    await managerService.reports('2026-04-01', '2026-04-30');
    await managerService.auditLogs();

    assert.equal(calls.length, 46);
    assert.deepEqual(calls[0], { method: 'get', args: ['/manager/schedule-policy'] });
    assert.deepEqual(calls[1], { method: 'get', args: ['/manager/classes/12/schedule-policy'] });
    assert.equal(calls[19].args[0], '/manager/subjects/with-image');
    assert.equal(calls[20].args[0], '/manager/subjects/2/with-image');
    assert.equal(calls[42].args[0], '/manager/packages/with-image');
    assert.equal(calls[43].args[0], '/manager/packages/6/with-image');
  });
});
