import { t, useLanguage } from '../../../i18n/useLanguage';
import { isOngoing, NEAR_FULL_THRESHOLD } from "./operationsUtils";

export function OperationStatus({ status, row }) {
  useLanguage();
  const ongoing = row && isOngoing(row);
  const label = ongoing
    ? "Ongoing"
    : {
        ACTIVE: "Active",
        INACTIVE: "Inactive",
        SCHEDULED: "Scheduled",
        COMPLETED: "Completed",
        CANCELLED: "Cancelled",
      }[status];
  return (
    <span
      className={`manager-status is-${ongoing ? "scheduled" : status.toLowerCase()}`}
    >
      {t(label || status)}
    </span>
  );
}

export function Occupancy({ row }) {
  useLanguage();
  const ratio =
    Number(row.booked || 0) / Math.max(Number(row.maxSlots || 0), 1);
  const tone = ratio >= 1 ? "full" : ratio >= NEAR_FULL_THRESHOLD ? "near" : "";
  return (
    <div className={`ops-occupancy ${tone}`}>
      <span>
        {row.booked || 0}/{row.maxSlots}{' '}{t("seats")}{' '}{t(" ")}
        {t(tone === "full" ? t("· Full") : tone === "near" ? t("· Near full") : t(""))}
      </span>
      <meter
        min="0"
        max={Math.max(Number(row.maxSlots || 0), 1)}
        value={row.booked || 0}
        aria-label={t("{0} of {1} seats booked",[row.booked || 0,row.maxSlots])}
      />
    </div>
  );
}
