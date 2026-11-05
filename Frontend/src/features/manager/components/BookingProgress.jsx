import { t, useLanguage } from '../../../i18n/useLanguage';
import managerCopy from '../i18n/en';
import { LOW_REGISTRATION_THRESHOLD, parseCenterTime as parse } from './overviewUtils';

const LOW_HINT = 'Upcoming scheduled sessions below 25% capacity. Only confirmed paid bookings count as reserved seats.';

export function BookingProgress({ row, now }) {
  useLanguage();
  const ratio = Number(row.booked || 0) / Math.max(1, Number(row.maxSlots));
  const low = row.status === 'SCHEDULED' && parse(row.startTime) >= now && ratio < LOW_REGISTRATION_THRESHOLD;
  const empty = Number(row.booked || 0) === 0;
  const tone = low ? (empty || parse(row.startTime) - now < 24 * 3600000 ? 'danger' : 'warning') : 'neutral';
  return <div className={`overview-booking is-${tone}`}><div className="overview-booking-caption"><span title={t('{0}/{1} booked', [row.booked || 0, row.maxSlots])}>{row.booked || 0}/{row.maxSlots}</span>{low && <strong className="overview-booking-severity" title={empty ? managerCopy.overview.noBookings : t(LOW_HINT)}>{empty ? managerCopy.overview.empty : managerCopy.overview.low}</strong>}</div><meter min="0" max={Math.max(1, Number(row.maxSlots))} value={Number(row.booked || 0)} aria-label={t("{0} of {1} seats booked",[row.booked || 0,row.maxSlots])} /></div>;
}
