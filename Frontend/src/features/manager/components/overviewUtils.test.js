import test from 'node:test';
import assert from 'node:assert/strict';
import { lowRegistrationBreakdown, sessionDisplayStatus, relativeActivityTime, sessionCountdown } from './overviewUtils.js';
const now = new Date('2026-10-07T23:00:00+07:00');
test('activity switches to center date beyond thirty days and countdown never becomes negative', () => {
  assert.equal(relativeActivityTime('2026-09-07T23:00:00', now), '30d ago');
  assert.equal(relativeActivityTime('2026-09-07T22:59:00', now), '07/09/2026');
  assert.equal(relativeActivityTime('2026-09-01T00:30:00', now), '01/09/2026');
  assert.deepEqual(sessionCountdown('2026-10-08T07:36:00', now), {hours:8,minutes:36});
  assert.deepEqual(sessionCountdown('2026-10-07T22:00:00', now), {hours:0,minutes:0});
});
const session = (id, start, status = 'SCHEDULED') => ({ scheduleId:id, startTime:start, endTime:'2026-10-08T02:00:00', status, booked:1, maxSlots:5 });
test('exclusive breakdown includes urgent after midnight without duplicates or gaps', () => {
  const urgentToday = session(1,'2026-10-07T23:30:00');
  const urgentTomorrow = session(2,'2026-10-08T01:00:00');
  const normalToday = session(3,'2026-10-07T23:50:00');
  const data = {todaySessions:[urgentToday,normalToday],urgentSessions:[urgentToday,urgentTomorrow],attentionPage:{total:10,items:[]},lowRegistrationSessions:13};
  assert.deepEqual(lowRegistrationBreakdown(data,now),{urgent:2,today:1,upcoming:10});
  assert.equal(lowRegistrationBreakdown({...data,lowRegistrationSessions:14},now),null);
});
test('heavy complete totals are independent of capped attention page', () => {
  const today = Array.from({length:10},(_,i)=>session(i,'2026-10-07T23:30:00'));
  const data = {todaySessions:today,urgentSessions:today.slice(0,8),attentionPage:{total:12,items:[{}, {}, {}, {}, {}, {}]},lowRegistrationSessions:22};
  assert.deepEqual(lowRegistrationBreakdown(data,now),{urgent:8,today:2,upcoming:12});
  assert.deepEqual(lowRegistrationBreakdown({todaySessions:[],urgentSessions:[],attentionPage:{total:0},lowRegistrationSessions:0},now),{urgent:0,today:0,upcoming:0});
  assert.equal(lowRegistrationBreakdown({},now),null);
});
test('status respects persisted values and exact ongoing time boundaries', () => {
  const row = {...session(1,'2026-10-07T22:00:00'),endTime:'2026-10-07T23:30:00'};
  assert.equal(sessionDisplayStatus(row,now),'Ongoing');
  assert.equal(sessionDisplayStatus(row,new Date('2026-10-07T23:30:00+07:00')),null);
  assert.equal(sessionDisplayStatus(session(2,'2026-10-08T01:00:00'),now),null);
  assert.equal(sessionDisplayStatus({...row,status:'COMPLETED'},now),'Completed');
  assert.equal(sessionDisplayStatus({...row,status:'CANCELLED'},now),'Cancelled');
});

import { fillPercent, splitTodaySchedule, decisionLink } from './overviewUtils.js';
test('overview v2: fill, schedule split with now marker, and decision links', () => {
  assert.equal(fillPercent({ bookedSeatsToday: 9, totalSeatsToday: 36 }), 25);
  assert.equal(fillPercent({ bookedSeatsToday: 3, totalSeatsToday: 0 }), 0);
  const rows = [
    { scheduleId: 3, status: 'SCHEDULED', startTime: '2026-11-05T18:00:00', endTime: '2026-11-05T19:00:00' },
    { scheduleId: 1, status: 'COMPLETED', startTime: '2026-11-05T07:00:00', endTime: '2026-11-05T08:00:00' },
    { scheduleId: 2, status: 'SCHEDULED', startTime: '2026-11-05T09:30:00', endTime: '2026-11-05T10:30:00' },
    { scheduleId: 4, status: 'CANCELLED', startTime: '2026-11-05T11:00:00', endTime: '2026-11-05T12:00:00' },
  ];
  const now = new Date('2026-11-05T10:00:00+07:00');
  const split = splitTodaySchedule(rows, now);
  assert.deepEqual(split.done.map(r => r.scheduleId), [1]);
  assert.deepEqual(split.live.map(r => r.scheduleId), [2, 3]);
  assert.equal(split.nowIndex, 1);
  assert.equal(splitTodaySchedule(rows, new Date('2026-11-05T20:00:00+07:00')).nowIndex, 0);
  assert.equal(splitTodaySchedule(null, now).live.length, 0);
  assert.equal(decisionLink({ type: 'RESCHEDULE' }), '/admin/dashboard?view=reschedule');
  assert.equal(decisionLink({ type: 'ESCALATION' }), '/admin/dashboard?view=support');
  assert.match(decisionLink({ type: 'PAYMENT_REVIEW' }), /status=REVIEW/);
  assert.match(decisionLink({ type: 'LOW_FILL', dueAt: '2026-11-06T06:00:00' }, '2026-11-05'), /from=2026-11-06&to=2026-11-06&lowRegistration=true/);
  assert.match(decisionLink({ type: 'LOW_FILL' }, '2026-11-05'), /from=2026-11-05/);
});
