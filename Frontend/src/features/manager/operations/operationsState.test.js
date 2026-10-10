import test from 'node:test';
import assert from 'node:assert/strict';
import {readOperationsState,normalizeOperationsQuery,patchOperationsQuery,matchingClasses,pageItems,visibleSchedules,operationCounts} from './operationsState.js';
test('separate subject/room tabs preserve legacy links, independent searches and unrelated filters',()=>{
  const legacy=new URLSearchParams('view=operations&tab=catalog&catalog=rooms&catalogPage=3&catalogQuery=Yoga&from=2026-10-05&cCoach=7');
  const next=normalizeOperationsQuery(legacy);
  assert.equal(next.get('tab'),'rooms');assert.equal(next.get('roomsPage'),'3');assert.equal(next.get('roomsQuery'),'Yoga');
  assert.equal(next.get('from'),'2026-10-05');assert.equal(next.get('cCoach'),'7');assert.equal(next.has('catalog'),false);assert.equal(next.has('catalogPage'),false);
  assert.deepEqual(readOperationsState(legacy).resource,{page:3,search:'Yoga'});
  assert.equal(normalizeOperationsQuery(next).toString(),next.toString());
  const subjects=patchOperationsQuery(next,{tab:'subjects',subjectsQuery:'Bơi',subjectsPage:2});
  assert.deepEqual(readOperationsState(subjects).resource,{page:2,search:'Bơi'});
  assert.deepEqual(readOperationsState(patchOperationsQuery(subjects,{tab:'rooms'})).resource,{page:3,search:'Yoga'});
  assert.equal(readOperationsState(new URLSearchParams('tab=catalog')).tab,'subjects');
  assert.equal(readOperationsState(new URLSearchParams('tab=classes&catalog=rooms')).tab,'classes');
  assert.equal(normalizeOperationsQuery(new URLSearchParams('tab=catalog&catalog=rooms&catalogQuery=old&roomsQuery=new')).get('roomsQuery'),'new');
});
test('URL state validates input, preserves overview links and takes priority over preference and width',()=>{
  const query=new URLSearchParams('view=operations&tab=classes&cPage=3&cSize=50&cSort=price&cDir=desc&cStatus=ALL&cCoach=7&scheduleView=calendar&from=2026-10-07&to=2026-10-14&lowRegistration=true&editSchedule=4');
  const state=readOperationsState(query,true,'list');assert.equal(state.view,'calendar');assert.equal(state.classes.page,3);assert.equal(state.classes.status,'ALL');
  const next=patchOperationsQuery(query,{cQuery:'Yoga',cPage:1});assert.equal(next.get('editSchedule'),'4');assert.equal(next.get('from'),'2026-10-07');assert.equal(readOperationsState(next).classes.search,'Yoga');
  assert.equal(readOperationsState(new URLSearchParams(),true).view,'list');assert.equal(readOperationsState(new URLSearchParams(),true,'calendar').view,'calendar');
  assert.equal(readOperationsState(new URLSearchParams('cSize=999&cPage=-2')).classes.size,20);
});
test('matching totals are before pagination and schedules count includes cancelled when selected',()=>{
  const classes=Array.from({length:300},(_,i)=>({classId:i,className:'Class '+i,coachName:'Coach',subjectId:1,roomId:1,coachId:7,status:i%2?'INACTIVE':'ACTIVE',price:i,maxSlots:25}));
  const state=readOperationsState(new URLSearchParams('cCoach=7&cSort=price&cDir=desc'));
  const matches=matchingClasses(classes,state.classes);assert.equal(matches.length,150);const page=pageItems(matches,2,20);assert.equal(page.start,21);assert.equal(page.end,40);assert.equal(page.total,150);assert.equal(page.items.length,20);
  const sessions=[{scheduleId:1,classId:0,coachId:7,roomId:1,status:'CANCELLED',startTime:'2026-10-07T19:00:00'},{scheduleId:2,classId:0,coachId:7,roomId:1,status:'SCHEDULED',startTime:'2026-10-15T19:00:00'}];
  const rows=visibleSchedules(sessions,classes,state,{from:'2026-10-05',to:'2026-10-11'},new URLSearchParams());assert.equal(operationCounts(rows,matches).schedules,1);assert.equal(operationCounts(rows,matches).classes,150);assert.equal(pageItems([],999,20).start,0);
});
