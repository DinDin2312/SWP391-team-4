import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

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
