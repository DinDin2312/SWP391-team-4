import { t, useLanguage } from '../../../i18n/useLanguage';
import { Clock3, ShieldCheck, UserRoundCheck, Users } from 'lucide-react';
import managerEn from '../i18n/en';
import { isCurrentMonth } from './staffData';

function StaffStats({ users, activeFilter, onFilter }) {
  useLanguage();
  const cards = [
    ['ALL', managerEn.staff.stats.total, users.length, Users, 'blue'],
    ['ACTIVE', managerEn.staff.stats.active, users.filter((user) => user.status === 'ACTIVE').length, UserRoundCheck, 'green'],
    ['INACTIVE', managerEn.staff.stats.suspended, users.filter((user) => user.status === 'INACTIVE').length, ShieldCheck, 'amber'],
    ['NEW', managerEn.staff.stats.newThisMonth, users.filter((user) => isCurrentMonth(user.joinedAt)).length, Clock3, 'cyan'],
  ];

  return <div className="manager-stat-grid manager-staff-stats">{cards.map(([id, label, value, Icon, tone]) => (
    <button type="button" className={`manager-stat tone-${tone} ${activeFilter === id ? 'is-active' : ''}`} key={id} aria-pressed={activeFilter === id} onClick={() => onFilter(id)}>
      <span><Icon size={20} /></span><div><small>{t(label)}</small><strong>{value}</strong></div>
    </button>
  ))}</div>;
}

export default StaffStats;
