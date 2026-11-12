import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classLevelFromCode,
  fold,
  foldChar,
  formatClassNameWithCode,
  highlightParts,
  nextClassCode,
  searchClasses,
  splitCode,
  subjectCodePrefix,
  subjectOptions,
} from './classSearch.js';

const classes = [
  { classId: 1, className: '[SWIM-101] Lớp Học Bơi Sải', subjectId: 4, subjectName: 'Bơi Lội', coachName: 'HLV Phạm Minh Hoàng', roomName: '[P102] Bể Bơi' },
  { classId: 2, className: '[YOGA-101] Yoga Giãn Cơ', subjectId: 2, subjectName: 'Yoga Căn Bản', coachName: 'HLV Trần Mai Anh', roomName: '[P201] Studio Yoga' },
  { classId: 3, className: 'Bơi Lội Chuyên nghiệp', subjectId: 4, subjectName: 'Bơi Lội', coachName: 'HLV Đặng Thái', roomName: '[P104] Bể Bơi Thủy Trị Liệu' },
];

test('folding strips Vietnamese diacritics without changing length', () => {
  assert.equal(fold('Đặng Thái Bơi'), 'dang thai boi');
  assert.equal(fold('Đặng').length, 'Đặng'.length);
  assert.equal(foldChar('́'), '́');
  assert.equal(fold(null), '');
});

test('search matches every token across code, name, subject, coach and room', () => {
  assert.deepEqual(searchClasses(classes, 'boi loi').items.map(row => row.classId), [3, 1]);
  assert.deepEqual(searchClasses(classes, 'swim').items.map(row => row.classId), [1]);
  assert.deepEqual(searchClasses(classes, 'dang thai').items.map(row => row.classId), [3]);
  assert.deepEqual(searchClasses(classes, 'mai anh p201').items.map(row => row.classId), [2]);
  assert.equal(searchClasses(classes, 'pilates').total, 0);
  assert.deepEqual(searchClasses(classes, '', { subjectId: 2 }).items.map(row => row.classId), [2]);
});

test('search ranks code matches first and caps rendered results', () => {
  const many = Array.from({ length: 120 }, (_, index) => ({ classId: index + 10, className: `[GYM-${index}] Gym ${index}`, subjectId: 1, subjectName: 'Gym' }));
  const result = searchClasses([...classes, ...many], 'gym', { limit: 50 });
  assert.equal(result.total, 120);
  assert.equal(result.items.length, 50);
  assert.equal(searchClasses(classes, 'yoga').items[0].classId, 2);
});

test('code split, highlight and subject options', () => {
  assert.deepEqual(splitCode('[YOGA-101] Yoga Giãn Cơ'), { code: 'YOGA-101', name: 'Yoga Giãn Cơ' });
  assert.deepEqual(splitCode('Bơi Lội Chuyên nghiệp'), { code: '', name: 'Bơi Lội Chuyên nghiệp' });
  assert.deepEqual(splitCode(undefined), { code: '', name: '' });
  assert.deepEqual(highlightParts('Bơi Lội', 'loi'), [{ text: 'Bơi ', match: false }, { text: 'Lội', match: true }]);
  assert.deepEqual(highlightParts('Yoga', ''), [{ text: 'Yoga', match: false }]);
  assert.deepEqual(subjectOptions(classes).map(row => [row.subjectName, row.count]), [['Bơi Lội', 2], ['Yoga Căn Bản', 1]]);
});

import { searchOptions } from './classSearch.js';
test('searchOptions folds accents, keeps groups in order and caps results', () => {
  const rooms = [
    { value: 1, label: 'Phòng Gym', group: 1 },
    { value: 2, label: 'Bể Bơi Olympic', hint: '100 chỗ', group: 0 },
    { value: 3, label: 'Bể bơi trẻ em', group: 0 },
  ];
  assert.deepEqual(searchOptions(rooms, 'be boi').items.map(o => o.value), [2, 3]);
  assert.deepEqual(searchOptions(rooms, '100').items.map(o => o.value), [2]);
  assert.deepEqual(searchOptions(rooms, '').items.map(o => o.value), [1, 2, 3]);
  assert.deepEqual(searchOptions([...rooms, { value: 4, label: 'Gym 2', group: 0 }], 'gym').items.map(o => o.value), [4, 1]);
  const many = searchOptions(Array.from({ length: 80 }, (_, i) => ({ value: i, label: `Room ${i}` })), 'room', 50);
  assert.equal(many.items.length, 50); assert.equal(many.total, 80);
});

test('subjectCodePrefix, classLevelFromCode, nextClassCode and formatClassNameWithCode generate 1xx/2xx/3xx codes cleanly', () => {
  assert.equal(subjectCodePrefix('Thể Hình (Gym)'), 'GYM');
  assert.equal(subjectCodePrefix('Yoga Căn Bản'), 'YOGA');
  assert.equal(subjectCodePrefix('Đạp Xe (Spinning)'), 'SPIN');
  assert.equal(subjectCodePrefix('Vovinam Cổ Truyền'), 'VOVINAM');
  assert.equal(subjectCodePrefix(''), 'CLS');
  assert.equal(subjectCodePrefix('A'), 'A');

  assert.equal(classLevelFromCode('YOGA-101'), '1');
  assert.equal(classLevelFromCode('YOGA-205'), '2');
  assert.equal(classLevelFromCode('YOGA-302'), '3');
  assert.equal(classLevelFromCode('YOGA-401'), '');
  assert.equal(classLevelFromCode(''), '');

  const subjects = [
    { subjectId: 2, subjectName: 'Yoga Căn Bản' },
    { subjectId: 8, subjectName: 'Vovinam' },
  ];
  const existing = [
    { classId: 1, subjectId: 2, className: '[YOGA-101] Yoga Sáng', status: 'INACTIVE' },
    { classId: 2, subjectId: 2, className: '[YOGA-102] Yoga Chiều', status: 'ACTIVE' },
    { classId: 3, subjectId: 2, className: '[YOGA-201] Yoga Nâng Cao', status: 'ACTIVE' },
    { classId: 4, subjectId: 2, className: '[YOGA-abc] Bỏ qua số lỗi', status: 'ACTIVE' },
  ];
  assert.equal(nextClassCode(existing, subjects, '', 1), '');
  assert.equal(nextClassCode(existing, subjects, 2, 1), 'YOGA-103');
  assert.equal(nextClassCode(existing, subjects, 2, 2), 'YOGA-202');
  assert.equal(nextClassCode(existing, subjects, 2, 3), 'YOGA-301');
  assert.equal(nextClassCode(existing, subjects, 2, 99), 'YOGA-103');
  assert.equal(nextClassCode(existing, subjects, 8, 1), 'VOVINAM-101');

  const fullBand = [
    { classId: 10, className: '[YOGA-199] Lớp 199' },
    { classId: 11, className: '[YOGA-200] Lớp 200' },
  ];
  assert.equal(nextClassCode(fullBand, subjects, 2, 1), 'YOGA-201');

  assert.equal(formatClassNameWithCode('[yoga-104]', ' Yoga Buổi Sáng '), '[YOGA-104] Yoga Buổi Sáng');
  assert.equal(formatClassNameWithCode('YOGA-104', '[OLD-01] Yoga Buổi Sáng'), '[YOGA-104] Yoga Buổi Sáng');
  assert.equal(formatClassNameWithCode('', 'Yoga Tự Do'), 'Yoga Tự Do');
  assert.equal(formatClassNameWithCode('YOGA-104', ''), '[YOGA-104]');
});
