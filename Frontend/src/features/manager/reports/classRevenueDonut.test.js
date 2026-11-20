import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

test('revenue donut: shares add up to 100%, small items fold into Other, rows expand', async () => {
  const server = await createServer({ server: { middlewareMode: true, ws: false }, appType: 'custom' });
  try {
    const { exactShares, buildSlices, subjectItems, packageItems } = await server.ssrLoadModule('/src/features/manager/reports/classRevenue.js');
    assert.equal(Math.round(exactShares([1, 1, 1]).reduce((a, b) => a + b, 0) * 10), 1000);
    assert.deepEqual(exactShares([0, 0]), [0, 0]);
    const subjects = Array.from({ length: 8 }, (_, i) => ({ subjectId: i + 1, subject: `S${i + 1}`, revenue: (i + 1) * 1000, registrations: 1, classes: [] }));
    const slices = buildSlices(subjectItems(subjects));
    assert.equal(slices.length, 6);
    assert.equal(slices[0].label, 'S8');
    assert.equal(slices.at(-1).key, 'other');
    assert.equal(slices.at(-1).revenue, 6000);
    assert.equal(Math.round(slices.reduce((a, s) => a + s.share, 0) * 10), 1000);
    assert.equal(subjectItems([{ revenue: 5, classes: [] }])[0].key, 's-none');
    assert.deepEqual(subjectItems(undefined), []);
    assert.deepEqual(packageItems(undefined), []);

    const React = (await import('react')).default;
    const { renderToStaticMarkup } = await import('react-dom/server');
    const { default: Donut } = await server.ssrLoadModule('/src/features/manager/reports/RevenueDonut.jsx');
    const items = subjectItems([
      { subjectId: 1, subject: 'Yoga', revenue: 6000000, registrations: 4, classes: [{ classId: 9, label: 'YOGA-101', coach: 'Coach A', revenue: 6000000, registrations: 4 }] },
      ...subjects.map(s => ({ ...s, subjectId: s.subjectId + 10 })),
    ]);
    const props = { ariaLabel: 'Course revenue share by subject', centerLabel: 'Course revenue', otherLabel: 'Other subjects', emptyText: 'No course revenue in this period.', shareNote: 'Courses make up {0} of total revenue ({1}). The rest comes from packages and other payments.' };
    const html = renderToStaticMarkup(React.createElement(Donut, { ...props, items, totalRevenue: 9000000, initialOpen: 's-1' }));
    assert.ok(html.includes('YOGA-101'));
    assert.ok(html.includes('6.000.000'));
    assert.ok(html.includes('aria-expanded="true"'));
    const other = renderToStaticMarkup(React.createElement(Donut, { ...props, items, totalRevenue: 0, initialOpen: 'other' }));
    assert.ok(other.includes('S1'));
    const pkg = renderToStaticMarkup(React.createElement(Donut, { ...props, shareNote: undefined, items: packageItems([{ packageId: 1, label: 'Gym 1 year', revenue: 2000000, registrations: 3 }]), totalRevenue: 5000000 }));
    assert.ok(pkg.includes('Gym 1 year'));
    assert.ok(!pkg.includes('aria-expanded'));
    assert.ok(renderToStaticMarkup(React.createElement(Donut, { ...props, items: [] })).includes('reports-empty'));
  } finally { await server.close(); }
});
