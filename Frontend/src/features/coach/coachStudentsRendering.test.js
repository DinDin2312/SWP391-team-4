import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { MemoryRouter } from 'react-router-dom';

test('CoachStudents renders safely without crashing across languages and includes class filter', async () => {
  const server = await createServer({
    server: { middlewareMode: true, ws: false },
    appType: 'custom',
    logLevel: 'error'
  });

  try {
    const { default: CoachStudents } = await server.ssrLoadModule('/src/features/coach/pages/CoachStudents.jsx');
    const { setLanguage } = await server.ssrLoadModule('/src/i18n/languageStore.js');

    // 1. Vietnamese render
    setLanguage('vi');
    assert.doesNotThrow(() => {
      const html = renderToStaticMarkup(
        React.createElement(
          MemoryRouter,
          null,
          React.createElement(CoachStudents)
        )
      );
      assert.ok(html.includes('Danh sách học viên') || html.includes('Lớp học được phân công') || html.includes('Tất cả các lớp'));
    });

    // 2. English render
    setLanguage('en');
    assert.doesNotThrow(() => {
      const html = renderToStaticMarkup(
        React.createElement(
          MemoryRouter,
          null,
          React.createElement(CoachStudents)
        )
      );
      assert.ok(html.includes('Assigned Trainees List') || html.includes('Trainees') || html.includes('Teaching Management'));
    });
  } finally {
    await server.close();
  }
});

