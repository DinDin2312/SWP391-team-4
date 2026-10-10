import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { MemoryRouter } from 'react-router-dom';

test('ledger keeps invoice and payment dates/statuses explicit in both languages', async () => {
  const server = await createServer({ server: { middlewareMode: true, ws: false }, appType: 'custom' });
  try {
    const { default: Page, Status } = await server.ssrLoadModule('/src/features/manager/transactions/TransactionsPage.jsx');
    const { setLanguage } = await server.ssrLoadModule('/src/i18n/languageStore.js');
    const { LanguageContext } = await server.ssrLoadModule('/src/i18n/useLanguage.js');
    for (const language of ['en','vi']) {
      setLanguage(language);
      const render = mode => renderToStaticMarkup(React.createElement(LanguageContext.Provider, { value: language }, React.createElement(MemoryRouter, { initialEntries: [`/?view=transactions&mode=${mode}&from=2026-10-01&to=2026-10-11`] }, React.createElement(Page))));
      assert.ok(render('payments').includes(language === 'vi' ? 'Mỗi dòng là một lần thanh toán' : 'Each row is one payment attempt'));
      assert.ok(render('invoices').includes(language === 'vi' ? 'Lọc theo ngày tạo hóa đơn' : 'Dates filter invoice creation'));
      const review = renderToStaticMarkup(React.createElement(LanguageContext.Provider, { value: language }, React.createElement(Status, { value: 'REVIEW' })));
      assert.ok(review.includes(language === 'vi' ? 'Cần đối soát' : 'REVIEW'));
    }
  } finally { await server.close(); }
});
