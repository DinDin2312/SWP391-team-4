import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

test('class editor only offers coaches assigned to the chosen subject',async()=>{
  const server=await createServer({server:{middlewareMode:true,ws:false},appType:'custom'});
  try {
    const {OperationEditor}=await server.ssrLoadModule('/src/features/manager/operations/OperationsDrawers.jsx');
    const data={classes:[],subjects:[{subjectId:1,subjectName:'Swimming'},{subjectId:2,subjectName:'Yoga'}],rooms:[],coaches:[{userId:10,fullName:'Swim coach',subjectIds:[1]},{userId:11,fullName:'Yoga coach',subjectIds:[2]}]};
    const render=subjectId=>renderToStaticMarkup(React.createElement(OperationEditor,{config:{type:'class',initial:{subjectId}},data,onClose:()=>{},onSaved:()=>{}}));
    assert.ok(render(1).includes('Swim coach'));assert.ok(!render(1).includes('Yoga coach'));
    assert.ok(render(2).includes('Yoga coach'));assert.ok(!render(2).includes('Swim coach'));
    assert.ok(!render('').includes('Swim coach'));
  } finally {await server.close();}
});

test('subject room and class create/edit forms include photos in the same form', async()=>{
  const server=await createServer({server:{middlewareMode:true,ws:false},appType:'custom'});
  try {
    const {OperationEditor}=await server.ssrLoadModule('/src/features/manager/operations/OperationsDrawers.jsx');
    const {setLanguage}=await server.ssrLoadModule('/src/i18n/languageStore.js');
    setLanguage('vi');
    const data={classes:[],rooms:[],subjects:[],coaches:[]};
    for(const type of ['subject','room','class'])for(const editing of [false,true]) {
      const item=editing?{[`${type}Id`]:1,[`${type}Name`]:'Existing',imagePath:'existing.jpg'}:undefined;
      const html=renderToStaticMarkup(React.createElement(OperationEditor,{config:{type,item},data,onClose:()=>{},onSaved:()=>{}}));
      assert.ok(html.includes('ops-editor-photo'));
      assert.ok(html.includes('type="file"'));
      assert.ok(html.includes(editing?'Thay ảnh':'Chọn ảnh'));
      assert.ok(html.includes('Lưu thay đổi'));
      assert.ok(!html.includes('Quản lý ảnh'));
    }
  } finally {await server.close();}
});

test('course review groups actual make-up dates by week and labels conflicts and holidays in EN/VI', async()=>{
  const server=await createServer({server:{middlewareMode:true,ws:false},appType:'custom'});
  try {
    const {default:Preview}=await server.ssrLoadModule('/src/features/manager/operations/CourseSchedulePreview.jsx');
    const {setLanguage}=await server.ssrLoadModule('/src/i18n/languageStore.js');
    const {courseWeeks}=await server.ssrLoadModule('/src/features/manager/operations/courseReviewUtils.js');
    const session=date=>({startTime:`${date}T07:00:00`,endTime:`${date}T08:30:00`});
    const plan={sessions:[session('2026-10-20'),session('2026-10-30')],requestedSessions:[session('2026-10-20'),session('2026-10-27'),session('2026-10-30')],missing:1,conflicts:[{originalDate:'2026-10-27',startTime:'2026-10-27T07:00:00',reason:'Selected slot conflicts with the coach or room.',alternatives:[]}]};
    const form={sessions:3,weekdays:[2,4],weekdaySlots:{2:'07:00',4:'07:00'},excludedDates:['2026-10-22'],overrides:{'2026-10-29':'2026-10-30T07:00:00'}};
    const weeks=courseWeeks(plan,form.excludedDates);
    assert.equal(weeks.length,2);assert.equal(weeks[0].start,'2026-10-19');
    assert.ok(weeks[0].sessions.some(s=>s.excluded && s.date==='2026-10-22'));
    assert.ok(weeks[1].sessions.some(s=>s.conflict && s.startTime==='2026-10-27T07:00:00'));
    const firstHoliday=courseWeeks(plan,['2026-10-15'],'2026-10-15');
    assert.ok(firstHoliday[0].sessions.some(s=>s.excluded && s.date==='2026-10-15'));
    for(const language of ['en','vi']) {
      setLanguage(language);
      const html=renderToStaticMarkup(React.createElement(Preview,{plan,form,selected:{className:'<script>class</script>',coachName:'Coach',roomName:'Pool'},labelFor:()=> 'Slot 1 (7h–8h30)',onAlternative:()=>{}}));
      assert.ok(html.includes('&lt;script&gt;class&lt;/script&gt;'));
      assert.ok(html.includes(language==='vi'?'Trùng lịch':'Conflict'));
      assert.ok(html.includes(language==='vi'?'Học bù cho ngày':'Make-up for'));
      assert.ok(html.includes(language==='vi'?'Nghỉ':'Day off'));
      assert.ok(html.includes('role="table"'));
    }
  } finally {await server.close();}
});

test('operations retains active status, safe resource names and loading states across EN/VI and calendar views', async()=>{
  const server=await createServer({server:{middlewareMode:true,ws:false},appType:'custom'});
  try {
    const {default:Page}=await server.ssrLoadModule('/src/features/manager/operations/OperationsPage.jsx');
    const {LanguageContext}=await server.ssrLoadModule('/src/i18n/useLanguage.js');
    const {setLanguage}=await server.ssrLoadModule('/src/i18n/languageStore.js');
    const data={schedules:[],classes:[{classId:1,className:'<script>class</script>',subjectName:'Swimming',subjectId:1,coachId:1,coachName:'Coach',roomId:1,roomName:'Pool',maxSlots:10,price:100,status:'ACTIVE'}],subjects:[{subjectId:1,subjectName:'Swimming'}],rooms:[{roomId:1,roomName:'Pool',capacity:10}],coaches:[]};
    const props={data,page:{title:'Center Operations'},filters:{from:'2026-10-12',to:'2026-10-18'},appliedFilters:{from:'2026-10-12',to:'2026-10-18'},setFilters:()=>{},reload:()=>{},refresh:()=>{}};
    for(const language of ['en','vi']) {
      setLanguage(language);
      const render=(tab,extra={})=>renderToStaticMarkup(React.createElement(LanguageContext.Provider,{value:language},React.createElement(MemoryRouter,{initialEntries:[`/admin/dashboard?view=operations&tab=${tab}&scheduleView=calendar`]},React.createElement(Page,{...props,...extra}))));
      const classes=render('classes');
      assert.ok(classes.includes('&lt;script&gt;class&lt;/script&gt;'));
      assert.ok(classes.includes(language==='vi'?'Đang hoạt động':'Active'));
      assert.ok(!render('classes',{loading:true}).includes('&lt;script&gt;class'));
      assert.ok(!render('classes',{loadError:'failed'}).includes('&lt;script&gt;class'));
      assert.ok(render('schedules').includes('ops-calendar-heading'));
      assert.ok(render('rooms').includes('Pool'));
    }
  } finally {await server.close();}
});
