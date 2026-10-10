import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

test('reports hide stale totals during loading or failed refresh and preserve API names', async () => {
  const server = await createServer({ server: { middlewareMode: true, ws: false }, appType: 'custom' });
  try {
    const { default: Page } = await server.ssrLoadModule('/src/features/manager/reports/ReportsPage.jsx');
    const { setLanguage } = await server.ssrLoadModule('/src/i18n/languageStore.js');
    const { LanguageContext } = await server.ssrLoadModule('/src/i18n/useLanguage.js');
    const range = { from: '2026-10-01', to: '2026-10-11' };
    const props = { page: { title: 'Reports', description: '' }, filters: range, appliedFilters: range, setFilters() {}, reload() {}, data: {memberGrowth:{newMembers:17,unknownCreationDates:9},bookingStatuses:[{status:'PENDING',value:3},{status:'CONFIRMED',value:5},{status:'CANCELLED',value:2}], summary: { revenue: 12345678, successfulPayments: 42, pendingInvoices: 6, confirmedBookings: 10 }, revenueByDay: [{ label: '2026-10-02', value: 12345678 }], classOccupancy: [{ classId: 1, label: 'Class name from API', value: 0, capacity: 0 }], memberships: [{ label: 'Package name from API', value: 2 }] } };
    for (const language of ['en', 'vi']) {
      setLanguage(language);
      const render = extra => renderToStaticMarkup(React.createElement(LanguageContext.Provider, { value: language }, React.createElement(Page, { ...props, ...extra })));
      const normal = render({});
      assert.ok(normal.includes('12.345.678'));
      assert.ok(normal.includes('Class name from API'));
      assert.ok(normal.includes('Package name from API'));
      assert.ok(normal.includes(language==='vi'?'Hội viên mới':'New members'));
      assert.ok(normal.includes(language==='vi'?'9 tài khoản hội viên':'9 existing member accounts'));
      assert.ok(normal.includes(language==='vi'?'Trạng thái đăng ký lớp':'Booking status breakdown'));
      assert.ok(normal.includes('>17</strong>'));
      assert.ok(!normal.includes('NaN'));
      assert.ok(!normal.includes('Infinity'));
      for (const state of [{ loading: true }, { loadError: 'Unable to load data.' }]) {
        const html = render(state);
        assert.ok(!html.includes('12.345.678'));
        assert.ok(!html.includes('Class name from API'));
        assert.ok(!html.includes('>17</strong>'));
        assert.ok(!html.includes('9 existing member accounts'));
        assert.match(html, /disabled=""[^>]*>/);
      }
      const pending = render({ filters: { from: '2026-10-05', to: '2026-10-11' } });
      assert.ok(pending.includes(language === 'vi' ? 'Bấm Xem' : 'Apply the date range'));
      assert.ok(pending.includes('01/10/2026'));
    }
  } finally { await server.close(); }
});
