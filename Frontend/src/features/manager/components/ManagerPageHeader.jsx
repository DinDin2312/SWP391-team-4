function ManagerPageHeader({ title, description, actions }) {
  return <header className="manager-page-header">
    <div className="manager-page-heading">
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </div>
    {actions && <div className="manager-header-actions">{actions}</div>}
  </header>;
}

export default ManagerPageHeader;
