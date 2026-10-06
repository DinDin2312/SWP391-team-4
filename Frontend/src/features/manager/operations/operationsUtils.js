import { isoDate, localDateTime } from "../managerUtils.js";

export const LOW_OCCUPANCY_THRESHOLD = 0.25;
export const NEAR_FULL_THRESHOLD = 0.8;
// Presentation only. No subject colour is stored or sent to the API.
const SUBJECT_TONES = ["blue", "violet", "cyan", "orange", "green", "rose"];
export const subjectTone = (id) =>
  SUBJECT_TONES[Math.abs(Number(id) || 0) % SUBJECT_TONES.length];

export function addDays(value, days) {
  const date =
    value instanceof Date ? new Date(value) : new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + days);
  return isoDate(date);
}

export function weekRange(value = new Date()) {
  const date =
    value instanceof Date ? new Date(value) : new Date(`${value}T12:00:00`);
  const from = addDays(date, -((date.getDay() + 6) % 7));
  return { from, to: addDays(from, 6) };
}

export const sessionDay = (value) => localDateTime(value).slice(0, 10);
export const isOngoing = (row, now = new Date()) =>
  row.status === "SCHEDULED" &&
  new Date(row.startTime) <= now &&
  new Date(row.endTime) > now;

export function filterSchedules(rows, classes, filters) {
  const subjects = new Map(
    classes.map((row) => [String(row.classId), String(row.subjectId)]),
  );
  return rows
    .filter(
      (row) =>
        (!filters.subject ||
          subjects.get(String(row.classId)) === filters.subject) &&
        (!filters.coach || String(row.coachId) === filters.coach) &&
        (!filters.room || String(row.roomId) === filters.room) &&
        (!filters.status || row.status === filters.status),
    )
    .sort(
      (a, b) =>
        a.startTime.localeCompare(b.startTime) ||
        Number(a.scheduleId) - Number(b.scheduleId),
    );
}

export function scheduleMetrics(rows, today = isoDate(new Date())) {
  const available = rows.filter((row) => row.status !== "CANCELLED");
  const booked = available.reduce(
    (sum, row) => sum + Number(row.booked || 0),
    0,
  );
  const capacity = available.reduce(
    (sum, row) => sum + Number(row.maxSlots || 0),
    0,
  );
  return {
    today: available.filter((row) => sessionDay(row.startTime) === today)
      .length,
    sessions: available.length,
    booked,
    capacity,
    occupancy: capacity ? booked / capacity : 0,
    low: available.filter(
      (row) =>
        row.status === "SCHEDULED" &&
        Number(row.maxSlots) > 0 &&
        Number(row.booked || 0) / Number(row.maxSlots) <
          LOW_OCCUPANCY_THRESHOLD,
    ).length,
  };
}

export function eligibleClasses(classes, resource = {}, filters = {}) {
  return classes.filter(
    (row) =>
      row.status === "ACTIVE" &&
      (!resource.roomId || String(row.roomId) === String(resource.roomId)) &&
      (!resource.coachId || String(row.coachId) === String(resource.coachId)) &&
      (!filters.subject || String(row.subjectId) === filters.subject) &&
      (!filters.room || String(row.roomId) === filters.room) &&
      (!filters.coach || String(row.coachId) === filters.coach),
  );
}

export function operationPayload(type, form) {
  if (type === "subject")
    return {
      subjectId: form.subjectId,
      subjectName: form.subjectName.trim(),
      description: form.description || "",
    };
  if (type === "room")
    return {
      roomId: form.roomId,
      roomName: form.roomName.trim(),
      capacity: Number(form.capacity),
    };
  if (type === "class")
    return {
      classId: form.classId,
      className: form.className.trim(),
      subjectId: Number(form.subjectId),
      coachId: Number(form.coachId),
      roomId: Number(form.roomId),
      maxSlots: Number(form.maxSlots),
      price: Number(form.price),
      status: form.status,
    };
  const session = {
    classId: Number(form.classId),
    startTime: form.startTime,
    endTime: form.endTime,
  };
  return type === "series"
    ? {
        ...session,
        occurrences: Number(form.occurrences),
        intervalWeeks: Number(form.intervalWeeks),
      }
    : { ...session, scheduleId: form.scheduleId, status: "SCHEDULED" };
}
