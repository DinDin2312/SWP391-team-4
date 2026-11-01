import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

test('BodyTransformationModal and MemberAssessmentsModal render safely without runtime reference errors', async () => {
  const server = await createServer({
    server: { middlewareMode: true, ws: false },
    appType: 'custom',
    logLevel: 'error'
  });

  try {
    const { default: BodyTransformationModal } = await server.ssrLoadModule('/src/features/member/components/BodyTransformationModal.jsx');
    const { default: MemberAssessmentsModal } = await server.ssrLoadModule('/src/features/member/components/MemberAssessmentsModal.jsx');
    const { setLanguage } = await server.ssrLoadModule('/src/i18n/languageStore.js');
    setLanguage('vi');

    // 1. Direct render from Dashboard (onBack = null)
    assert.doesNotThrow(() => {
      const html = renderToStaticMarkup(
        React.createElement(BodyTransformationModal, {
          isOpen: true,
          onClose: () => {},
          trainee: { fullName: 'Trần Bùi Thái', userId: 99 },
          isCoachView: false,
          initialAssessments: []
        })
      );
      assert.ok(html.includes('Biểu Đồ Tiến Trình Thể Trạng'));
      assert.ok(html.includes('Trần Bùi Thái'));
    });

    // 2. Render with seamless switch back button (onBack provided) & sample metrics
    assert.doesNotThrow(() => {
      const html = renderToStaticMarkup(
        React.createElement(BodyTransformationModal, {
          isOpen: true,
          onClose: () => {},
          onBack: () => {},
          trainee: { fullName: 'Học Viên VIP', userId: 101 },
          isCoachView: false,
          initialAssessments: [
            {
              assessmentId: 1,
              weight: 65,
              bodyFatPercentage: 15,
              muscleMass: 30,
              createdAt: '2026-10-25T10:00:00Z'
            },
            {
              assessmentId: 2,
              weight: 63,
              bodyFatPercentage: 12,
              muscleMass: 31,
              createdAt: '2026-10-31T10:00:00Z'
            }
          ]
        })
      );
      assert.ok(html.includes('Quay lại đánh giá'));
      assert.ok(html.includes('FPS'));
      assert.ok(html.includes('63 kg'));
      assert.ok(html.includes('svg-chart-svg'));
    });

    // 3. MemberAssessmentsModal initial render
    assert.doesNotThrow(() => {
      const html = renderToStaticMarkup(
        React.createElement(MemberAssessmentsModal, {
          isOpen: true,
          onClose: () => {},
          initialClassId: 'ALL'
        })
      );
      assert.ok(html.includes('Biểu Đồ Thể Trạng') || html.includes('FPS'));
    });
  } finally {
    await server.close();
  }
});
