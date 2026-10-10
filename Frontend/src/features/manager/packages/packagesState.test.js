import test from 'node:test';
import assert from 'node:assert/strict';
import { duplicatePackage, packageForm, parsePriceInput, patchPackagesQuery, priceInput, readPackagesState, searchText, selectPackages, validatePackage } from './packagesState.js';

const records = [
  { packageId: 3, packageName: 'Thẻ Gym Đặc Biệt', packageType: 'GYM_ACCESS', price: 500000, durationDays: 30, activeSubscribers: 12 },
  { packageId: 1, packageName: 'Thẻ Gym Miễn Phí', packageType: 'PREMIUM', price: 0, durationDays: 7, activeSubscribers: 1240 },
  { packageId: 2, packageName: 'AI 90 ngày', packageType: 'AI_ACCESS', price: 100000, durationDays: 90, activeSubscribers: 4 },
  { packageId: 4, packageName: 'Combo', packageType: 'COMBO', price: 900000, durationDays: 365, activeSubscribers: 0 },
  { packageId: 5, packageName: 'Gói cũ', packageType: 'LEGACY', price: 50000, durationDays: 30, activeSubscribers: 0 },
];
const state = readPackagesState(new URLSearchParams());

test('editing and duplicating a package preserves independent location scopes per subject',()=>{
 const form=packageForm({...records[0],benefits:[{subjectId:2,subjectName:'Bơi',sessionLimit:8,roomIds:[11,12]}]});
 const copy=duplicatePackage(form,'(copy)');
 assert.deepEqual(copy.benefits[0].roomIds,[11,12]);
 copy.benefits[0].roomIds.push(13);
 assert.deepEqual(form.benefits[0].roomIds,[11,12]);
 assert.equal(validatePackage({...form,benefits:[{...form.benefits[0],roomIds:[11,11]}]}).benefits,'Select at most 100 unique locations per subject.');
});

test('selling status roundtrips and filters before pagination, preserving legacy selling packages',()=>{
  const query=patchPackagesQuery(new URLSearchParams('pkg=3'),{selling:'STOPPED'});
  assert.equal(query.get('pkg'),'3');assert.equal(readPackagesState(query).selling,'STOPPED');
  const rows=records.map(row=>({...row,sellingStatus:row.packageId===3?'STOPPED':'SELLING'}));
  assert.deepEqual(selectPackages(rows,{...state,selling:'STOPPED'}).items.map(row=>row.packageId),[3]);
  assert.equal(selectPackages(records,{...state,selling:'SELLING'}).total,records.length);
});

test('description terms and purchase limits validate and duplicate without losing plain text',()=>{
  const form=packageForm({packageName:'Trial',packageType:'GYM_ACCESS',durationDays:7,price:0,description:'<b>Plain</b>',terms:'First\nSecond',purchaseLimitPerMember:1});
  assert.deepEqual(validatePackage(form),{});
  assert.equal(validatePackage({...form,description:'a'.repeat(1001)}).description,'Description must be at most 1,000 characters.');
  assert.ok(validatePackage({...form,terms:'a'.repeat(10001)}).terms);
  for(const limit of ['0','-1','1.5','2147483648'])assert.ok(validatePackage({...form,purchaseLimitPerMember:limit}).purchaseLimitPerMember);
  assert.deepEqual(validatePackage({...form,purchaseLimitPerMember:''}),{});
  const duplicate=duplicatePackage({...form,packageId:1},'(copy)');assert.equal(duplicate.terms,'First\nSecond');assert.equal(duplicate.purchaseLimitPerMember,'1');assert.equal(duplicate.packageId,undefined);
});

test('URL roundtrip preserves role view and unrelated parameters; invalid values get safe defaults', () => {
  const query = patchPackagesQuery(new URLSearchParams('view=operations&from=2026-10-08'), { display: 'cards', search: 'thẻ gym', selling:'', type: 'PREMIUM', sort: 'price', direction: 'desc', page: 5, size: 50 });
  assert.equal(query.get('view'), 'packages');
  assert.equal(query.get('from'), '2026-10-08');
  assert.deepEqual(readPackagesState(new URLSearchParams(query.toString())), { display: 'cards', search: 'thẻ gym', selling:'', type: 'PREMIUM', sort: 'price', direction: 'desc', page: 5, size: 50 });
  assert.deepEqual(readPackagesState(new URLSearchParams('pkgView=bad&pkgSize=12&pkgSort=bad&pkgType=invalid%20type&pkgPage=-2&pkgDir=bad')), state);
  assert.equal(readPackagesState(new URLSearchParams(), 'cards').display, 'cards');
  assert.equal(readPackagesState(new URLSearchParams('pkgView=table'), 'cards').display, 'table');
  assert.equal(patchPackagesQuery(query, { search: '', type: '', page: 1 }).has('pkgSearch'), false);
});

test('Vietnamese search ignores accents, Đ, case and surrounding spaces', () => {
  assert.equal(searchText(' ĐẶC biệt '), 'dac biet');
  assert.deepEqual(selectPackages(records, { ...state, search: 'THE GYM' }).items.map(row => row.packageId), [3, 1]);
  assert.equal(selectPackages(records, { ...state, search: 'dac biet' }).total, 1);
});

test('type counts apply search but exclude selected type, including unknown types in all total', () => {
  const result = selectPackages(records, { ...state, search: 'the gym', type: 'PREMIUM' });
  assert.equal(result.total, 1);
  assert.equal(result.allCount, 2);
  assert.deepEqual(result.counts, { GYM_ACCESS: 1, AI_ACCESS: 0, PREMIUM: 1, COMBO: 0, LEGACY: 0 });
  assert.equal(selectPackages(records, state).allCount, 5);
  assert.equal(selectPackages(records, { ...state, search: 'missing' }).total, 0);
});

test('numeric ordering and pagination operate on filtered results, clamp pages and cap cards at 12', () => {
  assert.deepEqual(selectPackages(records, { ...state, sort: 'activeSubscribers', direction: 'desc' }).items.map(row => row.packageId), [1, 3, 2, 4, 5]);
  const many = Array.from({ length: 57 }, (_, index) => ({ ...records[index % records.length], packageId: index + 1 }));
  const last = selectPackages(many, { ...state, page: 999, size: 20 });
  assert.equal(last.page, 3); assert.equal(last.start, 41); assert.equal(last.end, 57); assert.equal(last.items.length, 17);
  assert.equal(selectPackages(many, { ...state, display: 'cards', size: 100 }).items.length, 12);
  const empty = selectPackages([], state); assert.equal(empty.start, 0); assert.equal(empty.end, 0); assert.equal(empty.pages, 1);
});

test('form validates DTO boundaries and permits free and fractional prices without truncation', () => {
  const valid = { packageName: 'Gói mới', packageType: 'COMBO', durationDays: '30', price: '0' };
  assert.deepEqual(validatePackage(valid), {});
  assert.deepEqual(validatePackage({ ...valid, price: '99999999.99', packageName: 'x'.repeat(255) }), {});
  assert.deepEqual(validatePackage({ ...valid, price: '0000000001.00' }), {});
  for (const price of ['', '-1', '100000000', '1.234', 'Infinity']) assert.ok(validatePackage({ ...valid, price }).price);
  for (const durationDays of ['0', '-3', '1.5', '2147483648', '']) assert.ok(validatePackage({ ...valid, durationDays }).durationDays);
  assert.ok(validatePackage({ ...valid, packageName: ' ' }).packageName);
  assert.ok(validatePackage({ ...valid, packageName: 'x'.repeat(256) }).packageName);
  assert.ok(validatePackage({ ...valid, packageType: 'LEGACY' },[{typeCode:'COMBO'}]).packageType);
  assert.equal(parsePriceInput(priceInput('1234567.50')), '1234567.50');
  assert.equal(priceInput('0'), '0');
});

test('duplicate drops id and counts, preserves editable values and keeps name within DTO limit', () => {
  const copy = duplicatePackage({ ...records[0], packageName: 'x'.repeat(255) }, '(bản sao)');
  assert.equal(copy.packageName.length, 255);
  assert.equal(copy.packageId, undefined);
  assert.equal(copy.activeSubscribers, undefined);
  assert.ok(copy.packageName.endsWith(' (bản sao)'));
  assert.equal(copy.price, '500000');
  assert.equal(packageForm({ price: 0 }).price, '0');
});

test('subject packages require unique subjects and bounded per-subject quotas, preserved when duplicated',()=>{
  const form=packageForm({packageName:'Yoga + Swim',packageType:'SUBJECT_ACCESS',durationDays:60,price:1200000,benefits:[{subjectId:1,subjectName:'Yoga',sessionLimit:8},{subjectId:2,subjectName:'Swim',sessionLimit:4}]});
  assert.deepEqual(validatePackage(form),{});
  assert.ok(validatePackage({...form,benefits:[]},[{typeCode:'SUBJECT_ACCESS',requiresSubjects:true}]).benefits);
  assert.ok(validatePackage({...form,benefits:[form.benefits[0],form.benefits[0]]}).benefits);
  for(const quota of ['0','1.5','10001','']) assert.ok(validatePackage({...form,benefits:[{subjectId:1,sessionLimit:quota}]}).benefits);
  const copy=duplicatePackage(form,'(copy)');
  assert.deepEqual(copy.benefits,form.benefits);
  copy.benefits[0].sessionLimit='3';
  assert.equal(form.benefits[0].sessionLimit,'8');
});

test('a database-defined type is accepted, counted and survives filter URLs without a frontend enum',()=>{
 const type='CUSTOM_qa-123',catalog=[{typeCode:type,typeName:'Swimming',requiresSubjects:true}];
 const form=packageForm({packageName:'Swim 8 sessions',packageType:type,durationDays:30,price:500000,benefits:[{subjectId:1,sessionLimit:8}]});
 assert.deepEqual(validatePackage(form,catalog),{});
 assert.ok(validatePackage({...form,benefits:[]},catalog).benefits);
 assert.ok(validatePackage({...form,packageType:'UNKNOWN'},catalog).packageType);
 const query=patchPackagesQuery(new URLSearchParams(),{type});
 assert.equal(readPackagesState(query).type,type);
 const block=selectPackages([{...form,packageId:1}],readPackagesState(query));
 assert.equal(block.total,1);assert.equal(block.counts[type],1);
});
