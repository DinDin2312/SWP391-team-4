import { t, useLanguage } from '../../../i18n/useLanguage';
function ManagerPageHeader({ title, description, actions }) {
  useLanguage();
  return <header className="manager-page-header">
    <div className="manager-page-heading">
      <h1>{t(title)}</h1>
      {description && <p>{t(description)}</p>}
    </div>
    {actions && <div className="manager-header-actions">{actions}</div>}
  </header>;
}

export default ManagerPageHeader;
