import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { MemoryRouter } from 'react-router-dom';

test('CoachWorkoutPlans renders safely without crashing across languages', async () => {
  const server = await createServer({
    server: { middlewareMode: true, ws: false },
    appType: 'custom',
    logLevel: 'error'
  });

  try {
    const { default: CoachWorkoutPlans } = await server.ssrLoadModule('/src/features/coach/pages/CoachWorkoutPlans.jsx');
    const { setLanguage } = await server.ssrLoadModule('/src/i18n/languageStore.js');

    // 1. Vietnamese render
    setLanguage('vi');
    assert.doesNotThrow(() => {
      const html = renderToStaticMarkup(
        React.createElement(
          MemoryRouter,
          null,
          React.createElement(CoachWorkoutPlans)
        )
      );
      assert.ok(html.includes('Quản Lý Giáo Án') || html.includes('Thêm Động Tác Vào Thư Viện'));
    });

    // 2. English render
    setLanguage('en');
    assert.doesNotThrow(() => {
      const html = renderToStaticMarkup(
        React.createElement(
          MemoryRouter,
          null,
          React.createElement(CoachWorkoutPlans)
        )
      );
      assert.ok(html.includes('Exercise') || html.includes('Workout'));
    });
  } finally {
    await server.close();
  }
});
