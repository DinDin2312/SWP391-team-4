import { t, useLanguage } from '../../i18n/useLanguage';

export default function PackageBenefits({benefits=[],remaining=false}) {
  useLanguage();
  if(!benefits?.length)return null;
  return <ul style={{paddingLeft:18,margin:'12px 0',fontSize:13,overflowWrap:'anywhere'}}>{benefits.map(benefit=><li key={benefit.subjectId}>{benefit.subjectName}: {remaining?t('{0} / {1} sessions available',[benefit.remainingSessions,benefit.sessionLimit]):t('{0} sessions',[benefit.sessionLimit])}<span style={{display:'block',color:'var(--text-muted,#64748b)'}}>{t('Applicable locations')}: {benefit.rooms?.length?benefit.rooms.map(room=>room.roomName).join(', '):t('All locations')}</span></li>)}</ul>;
}
