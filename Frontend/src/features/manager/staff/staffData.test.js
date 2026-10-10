import test from 'node:test';
import assert from 'node:assert/strict';
import {enrichStaffUser,isCurrentMonth} from './staffData.js';
test('missing account metadata never produces fake new members, plans or login activity',()=>{
 const user=enrichStaffUser({userId:5,roleName:'Member'});
 assert.equal(user.joinedAt,null);assert.equal(isCurrentMonth(user.joinedAt),false);
 assert.equal(user.lastLoginAt,null);assert.equal(user.currentPlan,'');
 assert.deepEqual(user.planHistory,[]);assert.deepEqual(user.activity,[]);
 const recorded=enrichStaffUser({userId:5,joinedAt:new Date().toISOString(),planHistory:[{name:'Actual plan'}]});
 assert.equal(isCurrentMonth(recorded.joinedAt),true);assert.equal(recorded.planHistory[0].name,'Actual plan');
});
