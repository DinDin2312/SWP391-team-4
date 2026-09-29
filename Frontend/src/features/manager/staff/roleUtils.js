import managerEn from '../i18n/en';

export const roleLabel = (roleName) => managerEn.staff.roles[roleName] || roleName;

export const roleTone = (roleName) => ({
  Administrator: 'admin',
  'Center Manager': 'manager',
  Receptionist: 'staff',
  Coach: 'trainer',
  Member: 'member',
}[roleName] || 'member');
