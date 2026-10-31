import test from 'node:test';
import assert from 'node:assert/strict';
import { getLanguage, setLanguage, subscribeLanguage, t, locale, localizedCopy } from './languageStore.js';
test('overview composed copy switches without translating names or breaking compact booking labels', () => {
  setLanguage('vi');
  assert.equal(t('Empty'),'Trống');
  assert.equal(t('Low'),'Thấp');
  assert.equal(t('{0}/{1} booked',[0,25]),'0/25 đã đặt');
  assert.equal(t('Membership for {0}',['Đinh Thị Thu']),'Gói hội viên của Đinh Thị Thu');
  assert.equal(t('in {0}h {1}m',[8,2]),'Sau 8 giờ 2 phút');
  assert.equal(t('{0} activities · latest {1}',[8,t('17d ago')]),'8 hoạt động · gần nhất 17 ngày trước');
  assert.deepEqual(['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day=>t(day)),['T2','T3','T4','T5','T6','T7','CN']);
  setLanguage('en');
  assert.equal(t('Low'),'Low');
  assert.equal(t('{0} activities · latest {1}',[8,t('17d ago')]),'8 activities · latest 17d ago');
  assert.equal(t('Today through 7 days'),'Within the next 7 days');
});
test('language change persists and notifies without touching authentication', () => {
  const values=new Map([['token','existing-token']]);
  globalThis.localStorage={ getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value) };
  const seen=[];const unsubscribe=subscribeLanguage(value=>seen.push(value));
  setLanguage('vi');assert.equal(getLanguage(),'vi');assert.equal(values.get('nexusLanguage'),'vi');assert.equal(values.get('token'),'existing-token');
  setLanguage('fr');assert.equal(getLanguage(),'vi');assert.deepEqual(seen,['vi']);unsubscribe();setLanguage('en');
});
test('all role labels and templates translate without changing interpolated data', () => {
  setLanguage('vi');
  for(const key of ['Overview','My Schedule','Teaching Schedule','Register New Member','Sign in','Payment Method'])assert.notEqual(t(key),key);
  assert.equal(t('Actions for {0}, {1}',['Zumba Dance','19:00']),'Thao tác cho Zumba Dance, 19:00');
  assert.equal(t('Payment #3'),'Thanh toán #3');assert.equal(t('Page 2 of 10'),'Trang 2 trên 10');
  assert.equal(t('Nguyễn Văn An'),'Nguyễn Văn An');assert.equal(t('SCHEDULED'),'SCHEDULED');assert.equal(t('constructor'),'constructor');
  assert.equal(locale(),'vi-VN');setLanguage('en');assert.equal(t('Đăng xuất'),'Log out');
});
test('cached copy and messages follow language changes and retain non-string values', () => {
  const copy=localizedCopy({ title:'Account details',nested:{label:'Status'},count:7});
  setLanguage('en');assert.equal(copy.title,'Account details');setLanguage('vi');assert.equal(copy.title,'Chi tiết tài khoản');assert.equal(copy.nested.label,'Trạng thái');assert.equal(copy.count,7);
  const object={fullName:'John'};assert.equal(t(object),object);assert.equal(t(null),null);assert.equal(t(4),4);
  assert.equal(t('Trang 2 trên 10'),'Trang 2 trên 10');setLanguage('en');assert.equal(t('Trang 2 trên 10'),'Page 2 of 10');
});
test('VietQR payment and checkout strings translate correctly for EN and VI without inversion', () => {
  setLanguage('vi');
  assert.equal(t('VietQR Bank Transfer Payment'), 'Thanh toán Chuyển khoản VietQR');
  assert.equal(t('Beneficiary Transfer Information'), 'Thông tin chuyển khoản thụ hưởng');
  assert.equal(t('Cancel / Back to Cart'), 'Hủy / Quay lại giỏ hàng');
  assert.equal(t('I have successfully transferred'), 'Tôi đã chuyển khoản thành công');
  assert.equal(t('Account Number'), 'Số tài khoản');
  assert.equal(t('Transfer Amount'), 'Số tiền cần chuyển');
  assert.equal(t('Transfer Content (Required)'), 'Nội dung chuyển khoản (bắt buộc)');
  assert.equal(t('Expires in:'), 'Hết hạn sau:');
  assert.equal(t('Confirming payment with system...'), 'Đang xác nhận với hệ thống...');
  assert.equal(t('Pending Checkout Session'), 'Phiên thanh toán đang chờ xử lý');

  setLanguage('en');
  assert.equal(t('VietQR Bank Transfer Payment'), 'VietQR Bank Transfer Payment');
  assert.equal(t('Beneficiary Transfer Information'), 'Beneficiary Transfer Information');
  assert.equal(t('Cancel / Back to Cart'), 'Cancel / Back to Cart');
  assert.equal(t('I have successfully transferred'), 'I have successfully transferred');
  assert.equal(t('Account Number'), 'Account Number');
  assert.equal(t('Transfer Amount'), 'Transfer Amount');
  assert.equal(t('Transfer Content (Required)'), 'Transfer Content (Required)');
  assert.equal(t('Expires in:'), 'Expires in:');
  assert.equal(t('Confirming payment with system...'), 'Confirming payment with system...');
  assert.equal(t('Pending Checkout Session'), 'Pending Checkout Session');

  // Verify reverse lookup: passing Vietnamese string while language is 'en' returns English
  assert.equal(t('Thanh toán Chuyển khoản VietQR'), 'VietQR Bank Transfer Payment');
  assert.equal(t('Thông tin chuyển khoản thụ hưởng'), 'Beneficiary Transfer Information');
  assert.equal(t('Phiên thanh toán đang chờ xử lý'), 'Pending Checkout Session');
});

test('Body transformation visualizer strings translate correctly for EN and VI without inversion', () => {
  setLanguage('vi');
  assert.equal(t('Biểu Đồ Tiến Trình Thể Trạng & Điểm FPS'), 'Biểu Đồ Tiến Trình Thể Trạng & Điểm FPS');
  assert.equal(t('Body Transformation Visualizer & FPS Score'), 'Biểu Đồ Tiến Trình Thể Trạng & Điểm FPS');
  assert.equal(t('Body Progress (FPS)'), 'Biểu đồ thể trạng (FPS)');
  assert.equal(t('View Chart'), 'Xem Biểu Đồ');
  assert.equal(t('Progress'), 'Tiến độ');

  setLanguage('en');
  assert.equal(t('Biểu Đồ Tiến Trình Thể Trạng & Điểm FPS'), 'Body Transformation Visualizer & FPS Score');
  assert.equal(t('Body Transformation Visualizer & FPS Score'), 'Body Transformation Visualizer & FPS Score');
  assert.equal(t('Biểu đồ thể trạng (FPS)'), 'Body Progress (FPS)');
  assert.equal(t('Xem Biểu Đồ'), 'View Chart');
  assert.equal(t('Tiến độ'), 'Progress');
});

