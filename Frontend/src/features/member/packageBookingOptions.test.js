import test from 'node:test';
import assert from 'node:assert/strict';
import { packageBookingOptions } from './packageBookingOptions.js';

test('only paid active packages covering subject, all dates and the whole course quota are offered',()=>{
 const course={subjectId:2,totalSessions:4,nextSessionTime:'2026-10-10T08:00:00',lastSessionTime:'2026-10-20T09:00:00'};
 const valid={membershipId:1,packageName:'Yoga + swim',status:'ACTIVE',startDate:'2026-10-01',endDate:'2026-10-20',benefits:[{subjectId:2,remainingSessions:4}]};
 const invalid=[{...valid,status:'PENDING'},{...valid,startDate:'2026-10-10'},{...valid,endDate:'2026-10-19'},{...valid,benefits:[{subjectId:3,remainingSessions:12}]},{...valid,benefits:[{subjectId:2,remainingSessions:3}]}];
 assert.deepEqual(packageBookingOptions([valid,...invalid],course,'2026-10-09'),[{membershipId:1,packageName:'Yoga + swim',remainingSessions:4}]);
 assert.deepEqual(packageBookingOptions([valid],course,'2026-10-21'),[]);
 assert.deepEqual(packageBookingOptions([valid],{...course,totalSessions:0},'2026-10-09'),[]);
});

test('a swimming package for one pool cannot be used at another pool',()=>{
 const course={subjectId:2,roomId:11,totalSessions:2,nextSessionTime:'2026-10-12T08:00:00',lastSessionTime:'2026-10-15T09:00:00'};
 const pkg={membershipId:1,packageName:'Pool A',status:'ACTIVE',startDate:'2026-10-01',endDate:'2026-10-30',benefits:[{subjectId:2,remainingSessions:8,roomIds:[11]}]};
 assert.equal(packageBookingOptions([pkg],course,'2026-10-10').length,1);
 assert.deepEqual(packageBookingOptions([pkg],{...course,roomId:12},'2026-10-10'),[]);
 assert.equal(packageBookingOptions([{...pkg,benefits:[{...pkg.benefits[0],roomIds:[11,12]}]}],{...course,roomId:12},'2026-10-10').length,1);
 assert.equal(packageBookingOptions([{...pkg,benefits:[{...pkg.benefits[0],roomIds:[]}]}],{...course,roomId:12},'2026-10-10').length,1);
});
