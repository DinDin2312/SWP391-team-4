import { formatMoney } from '../../utils/displayFormat';
import { t } from '../../i18n/useLanguage';
export function auditValue(field,value){
  if(value==null)return '—';
  if(field==='price')return formatMoney(value);
  if(Array.isArray(value))return value.map(b=>`${b.subjectName||b.subjectId}: ${b.sessionLimit} (${b.rooms?.length?b.rooms.map(room=>room.roomName).join(', '):t('All locations')})`).join('; ')||'—';
  return String(value);
}
