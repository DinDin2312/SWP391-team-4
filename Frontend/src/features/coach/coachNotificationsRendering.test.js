import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { MemoryRouter } from 'react-router-dom';

test('CoachNotifications renders safely without crashing across languages', async () => {
  const server = await createServer({
    server: { middlewareMode: true, ws: false },
    appType: 'custom',
    logLevel: 'error'
  });

  try {
    const { default: CoachNotifications } = await server.ssrLoadModule('/src/features/coach/pages/CoachNotifications.jsx');
    const { setLanguage } = await server.ssrLoadModule('/src/i18n/languageStore.js');

    // 1. Vietnamese render
    setLanguage('vi');
    assert.doesNotThrow(() => {
      const html = renderToStaticMarkup(
        React.createElement(
          MemoryRouter,
          null,
          React.createElement(CoachNotifications)
        )
      );
      assert.ok(html.includes('Tổng quan thông báo HLV') || html.includes('Thông báo'));
      assert.ok(html.includes('Cài đặt cảnh báo HLV'));
    });

    // 2. English render
    setLanguage('en');
    assert.doesNotThrow(() => {
      const html = renderToStaticMarkup(
        React.createElement(
          MemoryRouter,
          null,
          React.createElement(CoachNotifications)
        )
      );
      assert.ok(html.includes('Coach Notification Center Digest') || html.includes('Notifications'));
      assert.ok(html.includes('Coach Alert Preferences'));
    });
  } finally {
    await server.close();
  }
});
