import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

test('audit hides stale data on errors and escapes recorded values in EN/VI', async () => {
  const server=await createServer({server:{middlewareMode:true,ws:false},appType:'custom'});
  try {
    const {default:Page,AuditChanges}=await server.ssrLoadModule('/src/features/manager/audit/AuditPage.jsx');
    const {setLanguage}=await server.ssrLoadModule('/src/i18n/languageStore.js');
    const {LanguageContext}=await server.ssrLoadModule('/src/i18n/useLanguage.js');
    const log={auditId:1,actorEmail:'actor@example.test',action:'UPDATE',entityType:'PACKAGE',entityId:'4',details:'<script>alert(1)</script>',createdAt:'2026-10-11T10:00:00',changesJson:'{"fields":{"price":{"before":0,"after":99000}}}'};
    for(const language of ['en','vi']) {
      setLanguage(language);
      const render=(Component,props)=>renderToStaticMarkup(React.createElement(LanguageContext.Provider,{value:language},React.createElement(Component,props)));
      const props={page:{title:'System Audit Log'},data:[log]};
      const normal=render(Page,props);assert.ok(normal.includes('actor@example.test'));assert.ok(normal.includes(language==='vi'?'100 bản ghi':'100 latest'));assert.ok(!normal.includes('<script>'));
      for(const state of [{loading:true},{loadError:'failed'}])assert.ok(!render(Page,{...props,...state}).includes('actor@example.test'));
      const detail=render(AuditChanges,{log});assert.ok(detail.includes('99000'));assert.ok(detail.includes('&lt;script&gt;'));assert.ok(detail.includes(language==='vi'?'Trước thay đổi':'Before'));
      assert.ok(render(AuditChanges,{log:{...log,changesJson:'invalid'}}).includes(language==='vi'?'không lưu giá trị':'does not contain'));
    }
  }finally{await server.close();}
});
