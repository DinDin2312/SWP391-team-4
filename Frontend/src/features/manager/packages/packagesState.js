export const PACKAGE_SIZES = [10, 20, 50, 100];
export const PACKAGE_SORTS = ['packageName', 'price', 'durationDays', 'activeSubscribers'];
const positive = value => /^\d+$/.test(value || '') && Number.isSafeInteger(Number(value)) && Number(value) > 0 ? Number(value) : 1;

export function readPackagesState(query, preferredView = 'table') {
  return {
    display: ['table', 'cards'].includes(query.get('pkgView')) ? query.get('pkgView') : preferredView === 'cards' ? 'cards' : 'table',
    search: query.get('pkgSearch') || '',
    selling: ['SELLING','STOPPED'].includes(query.get('pkgSelling'))?query.get('pkgSelling'):'',
    type: /^[A-Za-z0-9_-]{1,100}$/.test(query.get('pkgType')||'') ? query.get('pkgType') : '',
    sort: PACKAGE_SORTS.includes(query.get('pkgSort')) ? query.get('pkgSort') : 'packageName',
    direction: query.get('pkgDir') === 'desc' ? 'desc' : 'asc',
    page: positive(query.get('pkgPage')),
    size: PACKAGE_SIZES.includes(Number(query.get('pkgSize'))) ? Number(query.get('pkgSize')) : 20,
  };
}

export function patchPackagesQuery(query, values) {
  const next = new URLSearchParams(query);
  const keys = { display: 'pkgView', search: 'pkgSearch', type: 'pkgType', selling:'pkgSelling', sort: 'pkgSort', direction: 'pkgDir', page: 'pkgPage', size: 'pkgSize' };
  for (const [key, value] of Object.entries(values)) {
    if (!keys[key]) continue;
    if (value === '' || value == null) next.delete(keys[key]);
    else next.set(keys[key], String(value));
  }
  next.set('view', 'packages');
  return next;
}

export function searchText(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase().trim();
}

// Interim: the API returns the entire array. Client paging reduces DOM work only,
// not the response size or database work; server filtering/paging remains needed.
export function selectPackages(records, state, language = 'en') {
  const keyword = searchText(state.search);
  const matchingSearch = records.filter(row => searchText(row.packageName).includes(keyword)&&(!state.selling||(row.sellingStatus||'SELLING')===state.selling));
  const counts = Object.fromEntries([...new Set(records.map(row=>row.packageType))].map(type=>[type,0]));
  for (const row of matchingSearch) counts[row.packageType]++;
  const collator = new Intl.Collator(language === 'vi' ? 'vi' : 'en', { numeric: true, sensitivity: 'base' });
  const filtered = matchingSearch.filter(row => !state.type || row.packageType === state.type).sort((a, b) => {
    const difference = state.sort === 'packageName' ? collator.compare(a.packageName || '', b.packageName || '') : Number(a[state.sort] || 0) - Number(b[state.sort] || 0);
    return (state.direction === 'desc' ? -difference : difference) || Number(a.packageId) - Number(b.packageId);
  });
  const size = state.display === 'cards' ? 12 : state.size;
  const pages = Math.max(1, Math.ceil(filtered.length / size));
  const page = Math.min(state.page, pages);
  return { counts, allCount: matchingSearch.length, total: filtered.length, page, pages, size,
    start: filtered.length ? (page - 1) * size + 1 : 0, end: Math.min(page * size, filtered.length),
    items: filtered.slice((page - 1) * size, page * size) };
}

export function packageForm(item = {}) {
  return { description:item.description||'',terms:item.terms||'',purchaseLimitPerMember:String(item.purchaseLimitPerMember??''),packageName: item.packageName || '', packageType: item.packageType || 'GYM_ACCESS',
    durationDays: String(item.durationDays ?? ''), price: String(item.price ?? ''),
    benefits: (item.benefits || []).map(row=>({subjectId:Number(row.subjectId),subjectName:row.subjectName,sessionLimit:String(row.sessionLimit),roomIds:[...(row.roomIds||[])]})) };
}

export function validatePackage(form,types=null) {
  // Mirrors PackageRequest: NotBlank/Size(255), enum Pattern, Integer/Min(1),
  // DecimalMin(0), Digits(integer=8,fraction=2). No duplicate-name assumption.
  const errors = {};
  if((form.description||'').length>1000)errors.description='Description must be at most 1,000 characters.';
  if((form.terms||'').length>10000)errors.terms='Terms must be at most 10,000 characters.';
  if(form.purchaseLimitPerMember&&!/^[1-9]\d*$/.test(form.purchaseLimitPerMember)||Number(form.purchaseLimitPerMember)>2147483647)errors.purchaseLimitPerMember='Enter a positive whole number or leave blank for unlimited.';
  if(types?.find(type=>type.typeCode===form.packageType)?.requiresSubjects && !form.benefits?.length) errors.benefits='Select at least one subject for a subject package.';
  const benefits=form.benefits||[];
  if(benefits.length>100 || new Set(benefits.map(row=>row.subjectId)).size!==benefits.length || benefits.some(row=>!Number.isInteger(Number(row.subjectId)) || Number(row.subjectId)<1 || !/^\d+$/.test(String(row.sessionLimit)) || Number(row.sessionLimit)<1 || Number(row.sessionLimit)>10000)) errors.benefits='Each subject needs a unique selection and 1 to 10,000 sessions.';
  if (!form.packageName.trim()) errors.packageName = 'Package name is required.';
  else if (form.packageName.length > 255) errors.packageName = 'Package name must be at most 255 characters.';
  if(!form.packageType || form.packageType.length>100 || (types && !types.some(type=>type.typeCode===form.packageType))) errors.packageType='Select a valid package type.';
  if (!/^\d+$/.test(form.durationDays) || Number(form.durationDays) < 1 || Number(form.durationDays) > 2147483647) errors.durationDays = 'Enter a whole number of days from 1 to 2,147,483,647.';
  if (!/^\d+(?:\.\d{1,2})?$/.test(form.price) || form.price.split('.')[0].replace(/^0+/, '').length > 8) errors.price = 'Enter a price from 0 to 99,999,999.99 with up to two decimal places.';
  if(benefits.some(row=>row.roomIds?.length>100 || new Set(row.roomIds||[]).size!==(row.roomIds||[]).length)) errors.benefits='Select at most 100 unique locations per subject.';
  return errors;
}

export function priceInput(value) {
  const [whole, fraction] = String(value).split('.');
  return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}${fraction === undefined ? '' : ',' + fraction}`;
}
export function parsePriceInput(value) { return value.replaceAll('.', '').replace(',', '.'); }

export function duplicatePackage(item, suffix) {
  return { ...packageForm(item), packageName: `${item.packageName.slice(0, Math.max(0, 254 - suffix.length))} ${suffix}` };
}
