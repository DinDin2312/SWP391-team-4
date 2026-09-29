import managerEn from '../i18n/en';

function StaffSkeleton() {
  return <div className="manager-staff-skeleton" role="status" aria-label={managerEn.staff.feedback.loading}>
    <div className="manager-skeleton-title" />
    <div className="manager-stat-grid">{[0, 1, 2, 3].map((item) => <div className="manager-stat manager-skeleton" key={item} />)}</div>
    <div className="manager-skeleton-filter manager-skeleton" />
    <div className="manager-skeleton-table manager-skeleton">{[0, 1, 2, 3, 4, 5].map((item) => <i key={item} />)}</div>
  </div>;
}

export default StaffSkeleton;
