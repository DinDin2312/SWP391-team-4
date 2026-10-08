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
