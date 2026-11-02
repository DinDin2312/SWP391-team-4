import test from 'node:test';
import assert from 'node:assert/strict';
import { fold, foldChar, highlightParts, searchClasses, splitCode, subjectOptions } from './classSearch.js';

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
