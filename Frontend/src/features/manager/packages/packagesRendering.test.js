import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { createServer } from 'vite';

test('package detail history and catalogue preserve response contract after axiosClient unwraps data', async () => {
  const server = await createServer({ server: { middlewareMode: true, ws: false }, appType: 'custom' });
  try {
    const { default: client } = await server.ssrLoadModule('/src/services/axiosClient.js');
    const { default: service } = await server.ssrLoadModule('/src/features/manager/services/managerService.js');
    const payload = { packageId: 5, purchaseLimitPerMember: 1 };
    const original = { get: client.get, post: client.post, put: client.put };
    try {
      client.get = client.post = client.put = async () => payload;
      for (const result of [await service.packageDetail(5), await service.packageHistory(5), await service.packageTypes(), await service.savePackageType({ typeName: 'Yoga' }), await service.savePackageType({ typeCode: 'YOGA', typeName: 'Yoga' })]) {
        assert.deepEqual(result, { data: payload });
      }
    } finally { Object.assign(client, original); }
  } finally { await server.close(); }
});

test('package list and form render localized labels, free prices and unknown type fallback without enum leakage', async () => {
  const server = await createServer({ server: { middlewareMode: true, ws: false }, appType: 'custom' });
  try {
    const { default: Page } = await server.ssrLoadModule('/src/features/manager/packages/PackagesPage.jsx');
    const { default: Editor } = await server.ssrLoadModule('/src/features/manager/packages/PackageEditor.jsx');
    const { default: Detail } = await server.ssrLoadModule('/src/components/resource-images/PackageDetailDialog.jsx');
    const { setLanguage } = await server.ssrLoadModule('/src/i18n/languageStore.js');
    const { LanguageContext } = await server.ssrLoadModule('/src/i18n/useLanguage.js');
    const wrap = (component, language, query = '?view=packages&pkgView=table') => renderToStaticMarkup(React.createElement(LanguageContext.Provider, { value: language }, React.createElement(MemoryRouter, { initialEntries: [query] }, component)));
    const data = [{ packageId: 1, packageName: 'Tên gói giữ nguyên', packageType: 'LEGACY', price: 0, durationDays: 30, activeSubscribers: 1240 }];
    for (const language of ['en', 'vi']) {
      setLanguage(language);
      const html = wrap(React.createElement(Page, { data, loading: false }), language);
      assert.ok(html.includes('Tên gói giữ nguyên'));
      assert.ok(html.includes('1.240'));
      assert.ok(html.includes(language === 'vi' ? 'Miễn phí' : 'Free'));
      assert.ok(html.includes(language === 'vi' ? 'Loại gói khác' : 'Other package type'));
      assert.ok(html.includes(language === 'vi' ? 'Đăng ký còn hiệu lực' : 'Active registrations'));
      assert.ok(!html.replaceAll(/value="[^"]*"/g,'').includes('LEGACY'));
      assert.ok(html.includes(language==='vi'?'<th scope="col">Thao tác</th>':'<th scope="col">Actions</th>'));
      assert.ok(html.includes('overview-menu-opener has-label'));
      assert.equal((html.match(/<h1/g) || []).length, 1);
      const create = wrap(React.createElement(Editor, { onClose() {}, onSave() {}, onSaved() {} }), language);
      assert.ok(create.indexOf('pkg-photo-field')<create.indexOf('manager-form-grid'));
      assert.ok(create.includes(language === 'vi' ? 'Tạo gói hội viên' : 'Create membership package'));
      assert.ok(!create.includes('manager-edit-note'));
      const edit = wrap(React.createElement(Editor, { item: data[0], onClose() {}, onSave() {}, onSaved() {} }), language);
      assert.ok(edit.includes(language === 'vi' ? 'Sửa gói hội viên' : 'Edit membership package'));
      assert.ok(edit.includes('pkg-edit-note'));
      assert.ok(!edit.includes('only applies to new'));
      const detail=wrap(React.createElement(Detail,{id:1,load:async()=>({data:{}}),onClose(){}}),language);
      assert.ok(detail.includes(language==='vi'?'Đang tải chi tiết gói':'Loading package details'));
      assert.ok(detail.includes('role="dialog"'));assert.ok(detail.includes('aria-modal="true"'));
    }
  } finally { await server.close(); }
});
