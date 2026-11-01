import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { MemoryRouter } from 'react-router-dom';

test('ReceptionistNotifications renders safely without crashing across languages', async () => {
  const server = await createServer({
    server: { middlewareMode: true, ws: false },
    appType: 'custom',
    logLevel: 'error'
  });

  try {
    const { default: ReceptionistNotificationsView } = await server.ssrLoadModule('/src/features/receptionist/components/ReceptionistNotificationsView.jsx');
    const { setLanguage } = await server.ssrLoadModule('/src/i18n/languageStore.js');

    // 1. Vietnamese render
    setLanguage('vi');
    assert.doesNotThrow(() => {
      const html = renderToStaticMarkup(
        React.createElement(
          MemoryRouter,
          null,
          React.createElement(ReceptionistNotificationsView, { onNavigateFeature: () => {} })
        )
      );
      assert.ok(html.includes('Trung tâm thông báo') || html.includes('Thông báo lễ tân'));
      assert.ok(html.includes('Hỗ trợ &amp; Hủy gói') || html.includes('Hỗ trợ & Hủy gói') || html.includes('Hỗ trợ'));
    });

    // 2. English render
    setLanguage('en');
    assert.doesNotThrow(() => {
      const html = renderToStaticMarkup(
        React.createElement(
          MemoryRouter,
          null,
          React.createElement(ReceptionistNotificationsView, { onNavigateFeature: () => {} })
        )
      );
      assert.ok(html.includes('Notification Center') || html.includes('Front Desk Notifications'));
      assert.ok(html.includes('Support &amp; Cancellations') || html.includes('Support & Cancellations'));
    });
  } finally {
    await server.close();
  }
});
