import { t, useLanguage } from '../../../i18n/useLanguage';
import { Download, LockKeyhole, Trash2 } from 'lucide-react';
import managerEn from '../i18n/en';

function StaffBulkActions({ count, disabled, onLock, onExport, onDelete }) {
  useLanguage();
  if (!count) return null;
  const copy = managerEn.staff.bulk;
  return <div className="manager-bulkbar" role="toolbar" aria-label={t(copy.selected(count))}>
    <strong>{t(copy.selected(count))}</strong>
    <button type="button" disabled={disabled} onClick={onLock}><LockKeyhole size={15} />{t(copy.lock)}</button>
    <button type="button" disabled={disabled} onClick={onExport}><Download size={15} />{t(copy.exportCsv)}</button>
    <button className="is-danger" type="button" disabled={disabled} onClick={onDelete}><Trash2 size={15} />{t("Delete")}</button>
  </div>;
}

export default StaffBulkActions;
