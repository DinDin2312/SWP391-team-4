import test from 'node:test';
import assert from 'node:assert/strict';
import {
  enrichStaffUser,
  isCurrentMonth,
  staffDate,
  staffInitials,
  displayStaffName,
  relativeDate,
  staffAvatarTone,
  staffAvatarUrl,
  validateAvatarFile,
  downloadStaffCsv,
} from './staffData.js';

test('missing account metadata never produces fake new members, plans or login activity', () => {
  const user = enrichStaffUser({ userId: 5, roleName: 'Member' });
  assert.equal(user.joinedAt, null);
  assert.equal(isCurrentMonth(user.joinedAt), false);
  assert.equal(user.lastLoginAt, null);
  assert.equal(user.currentPlan, '');
  assert.deepEqual(user.planHistory, []);
  assert.deepEqual(user.activity, []);
  const recorded = enrichStaffUser({ userId: 5, joinedAt: new Date().toISOString(), planHistory: [{ name: 'Actual plan' }] });
  assert.equal(isCurrentMonth(recorded.joinedAt), true);
  assert.equal(recorded.planHistory[0].name, 'Actual plan');
});

test('staff formatting helpers, avatar validation and CSV export handle edge cases safely', () => {
  assert.equal(staffInitials('HLV Nguyễn Văn Tuấn'), 'VT');
  assert.equal(staffInitials(''), '');
  assert.equal(displayStaffName('HLV Trần Mai Anh'), 'Trần Mai Anh');
  assert.equal(staffDate(null), '—');
  assert.ok(staffDate('2026-10-15').includes('2026'));

  assert.equal(relativeDate(null), 'Never');
  assert.ok(relativeDate(new Date(Date.now() - 3 * 86400000).toISOString()).length > 0);
  assert.ok(relativeDate(new Date(Date.now() - 2 * 3600000).toISOString()).length > 0);
  assert.ok(relativeDate(new Date(Date.now() - 5 * 60000).toISOString()).length > 0);
  assert.ok(relativeDate(new Date(Date.now() - 5000).toISOString()).length > 0);

  assert.ok(staffAvatarTone({ userId: 12 }) >= 0 && staffAvatarTone({ userId: 12 }) < 6);
  assert.ok(staffAvatarTone({ fullName: 'Mai Anh' }) >= 0 && staffAvatarTone({ fullName: 'Mai Anh' }) < 6);
  assert.equal(staffAvatarTone(), 0);

  assert.equal(staffAvatarUrl(''), '');
  assert.equal(staffAvatarUrl('https://cdn.example.com/a.png'), 'https://cdn.example.com/a.png');
  assert.equal(staffAvatarUrl('avatar1.png'), 'http://localhost:8080/api/avatars/avatar1.png');
  assert.equal(staffAvatarUrl('/api/avatars/avatar2.png'), 'http://localhost:8080/api/avatars/avatar2.png');

  assert.equal(validateAvatarFile(null), '');
  assert.equal(validateAvatarFile({ type: 'image/gif', size: 100 }), 'Choose a PNG or JPEG image.');
  assert.equal(validateAvatarFile({ type: 'image/png', size: 3 * 1024 * 1024 }), 'Avatar images must be 2 MB or smaller.');
  assert.equal(validateAvatarFile({ type: 'image/jpeg', size: 512 * 1024 }), '');

  let clickedFile = '';
  let revokedUrl = '';
  const origDoc = globalThis.document;
  const origWin = globalThis.window;
  const origCreateObj = URL.createObjectURL;
  const origRevokeObj = URL.revokeObjectURL;
  try {
    URL.createObjectURL = () => 'blob:staff-csv';
    URL.revokeObjectURL = (u) => { revokedUrl = u; };
    globalThis.document = {
      createElement: () => ({
        href: '',
        download: '',
        click() {
          clickedFile = this.download;
        },
      }),
    };
    globalThis.window = {
      setTimeout: (fn) => fn(),
    };
    downloadStaffCsv(
      [{ userId: 1, fullName: '=Admin', email: 'a@b.com', roleName: 'Center Manager', status: 'ACTIVE' }],
      'staff.csv'
    );
    assert.equal(clickedFile, 'staff.csv');
    assert.equal(revokedUrl, 'blob:staff-csv');
  } finally {
    globalThis.document = origDoc;
    globalThis.window = origWin;
    URL.createObjectURL = origCreateObj;
    URL.revokeObjectURL = origRevokeObj;
  }
});
