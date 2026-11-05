import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

test('audit entries escape recorded values and translate in EN/VI', async () => {
  const server = await createServer({ server: { middlewareMode: true, ws: false }, appType: 'custom' });
  try {
    const { AuditEntry } = await server.ssrLoadModule('/src/features/manager/audit/AuditPage.jsx');
    const { setLanguage } = await server.ssrLoadModule('/src/i18n/languageStore.js');
    const { LanguageContext } = await server.ssrLoadModule('/src/i18n/useLanguage.js');
    const entry = { id: 1, at: '2026-11-06T10:05:00', actorEmail: 'a@x.test', actorName: 'An', action: 'DELETE', entityType: 'PACKAGES', targetName: 'Gói VIP', details: '<script>alert(1)</script>' };
    for (const language of ['en', 'vi']) {
      setLanguage(language);
      const html = renderToStaticMarkup(React.createElement(LanguageContext.Provider, { value: language }, React.createElement(AuditEntry, { entry })));
      assert.ok(html.includes('10:05') && html.includes('An') && html.includes('Gói VIP'));
      assert.ok(!html.includes('<script>') && html.includes('&lt;script&gt;'));
      assert.ok(html.includes(language === 'vi' ? 'đã xóa gói' : 'deleted package'));
    }
  } finally { await server.close(); }
});
