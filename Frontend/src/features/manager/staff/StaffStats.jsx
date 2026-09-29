import { Clock3, ShieldCheck, UserRoundCheck, Users } from 'lucide-react';
import managerEn from '../i18n/en';
import { isCurrentMonth } from './staffData';

function StaffStats({ users }) {
  const cards = [
    [managerEn.staff.stats.total, users.length, Users, 'blue'],
    [managerEn.staff.stats.active, users.filter((user) => user.status === 'ACTIVE').length, UserRoundCheck, 'green'],
    [managerEn.staff.stats.suspended, users.filter((user) => user.status === 'INACTIVE').length, ShieldCheck, 'amber'],
    [managerEn.staff.stats.newThisMonth, users.filter((user) => isCurrentMonth(user.joinedAt)).length, Clock3, 'cyan'],
  ];

  return <div className="manager-stat-grid manager-staff-stats">{cards.map(([label, value, Icon, tone]) => (
    <article className={`manager-stat tone-${tone}`} key={label}>
      <span><Icon size={20} /></span><div><small>{label}</small><strong>{value}</strong></div>
    </article>
  ))}</div>;
}

export default StaffStats;
