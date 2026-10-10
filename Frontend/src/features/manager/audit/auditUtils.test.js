import test from 'node:test';
import assert from 'node:assert/strict';
import { filterLogs, changeFields } from './auditUtils.js';

test('audit search accepts unaccented names, resource aliases, dates and newest ordering', () => {
  const logs = [
    {auditId:1,actorEmail:'admin@sport.com',action:'UPDATE',entityType:'PACKAGE',details:'Bơi Lội',createdAt:'2026-10-08T09:00:00'},
    {auditId:3,actorEmail:'staff@sport.com',action:'CREATE',entityType:'PACKAGES',details:'Bơi Lội',createdAt:'2026-10-09T10:00:00'},
    {auditId:2,actorEmail:'admin@sport.com',action:'UPDATE',entityType:'ROOM',details:'Hồ số 2',createdAt:'2026-10-09T09:00:00'},
  ];
  assert.deepEqual(filterLogs(logs,{keyword:'boi loi',entity:'PACKAGE'}).map(row=>row.auditId),[3,1]);
  assert.deepEqual(filterLogs(logs,{keyword:'admin',action:'UPDATE',from:'2026-10-09',to:'2026-10-09'}).map(row=>row.auditId),[2]);
  assert.equal(filterLogs(logs,{keyword:'không tồn tại'}).length,0);
});
test('audit snapshots tolerate missing or malformed legacy records', () => {
  for(const changesJson of [null,'invalid JSON','{"fields":[]}','{"version":1}']) assert.deepEqual(changeFields({changesJson}),[]);
  assert.deepEqual(changeFields({changesJson:'{"fields":{"price":{"before":0,"after":99000},"image":{"changed":true}}}'}).map(([key])=>key),['price','image']);
});
