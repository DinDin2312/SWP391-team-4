import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

test('CoachToast renders safely and handles variants and actions across languages', async () => {
  const server = await createServer({
    server: { middlewareMode: true, ws: false },
    appType: 'custom',
    logLevel: 'error'
  });

  try {
    const { default: CoachToast } = await server.ssrLoadModule('/src/features/coach/components/CoachToast.jsx');
    const { setLanguage } = await server.ssrLoadModule('/src/i18n/languageStore.js');

    // 1. Closed state renders nothing
    const closedHtml = renderToStaticMarkup(
      React.createElement(CoachToast, {
        isOpen: false,
        title: 'Hidden',
        message: 'Hidden message'
      })
    );
    assert.strictEqual(closedHtml, '');

    // 2. Success variant in Vietnamese with action button
    setLanguage('vi');
    const successHtml = renderToStaticMarkup(
      React.createElement(CoachToast, {
        isOpen: true,
        type: 'reschedule',
        title: 'Đã gửi yêu cầu dời ca dạy bù!',
        message: 'Đơn đề xuất ca dạy bù đã được chuyển đến Ban Quản lý chờ thẩm định phòng tập và phê duyệt.',
        actionLabel: 'Xem tiến độ duyệt',
        onAction: () => {}
      })
    );
    assert.ok(successHtml.includes('Đã gửi yêu cầu dời ca dạy bù!'));
    assert.ok(successHtml.includes('Xem tiến độ duyệt'));
    assert.ok(successHtml.includes('Pending Approval') || successHtml.includes('Chờ phê duyệt'));

    // 3. Error variant in English
    setLanguage('en');
    const errorHtml = renderToStaticMarkup(
      React.createElement(CoachToast, {
        isOpen: true,
        type: 'error',
        title: 'Operation Failed',
        message: 'Could not connect to the server.'
      })
    );
    assert.ok(errorHtml.includes('Operation Failed'));
    assert.ok(errorHtml.includes('Could not connect to the server.'));

    // 4. Info variant with default title
    const infoHtml = renderToStaticMarkup(
      React.createElement(CoachToast, {
        isOpen: true,
        type: 'info',
        message: 'Class notification broadcasted successfully.'
      })
    );
    assert.ok(infoHtml.includes('Class notification broadcasted successfully.'));
  } finally {
    await server.close();
  }
});
