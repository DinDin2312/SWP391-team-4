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
      durationMinutes:Number(form.durationMinutes || 90),
      slotStarts:form.slotStarts || [],
    };
  if (type === "room")
    return {
      roomId: form.roomId,
      roomName: form.roomName.trim(),
      capacity: Number(form.capacity),
      subjectIds: (form.subjectIds || []).map(Number),
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

// Cascading filter options: Subject -> Coach -> Room. A coach belongs to a subject when they teach a class of it
// or list it as a specialty; a room belongs when a class of the selected subject/coach uses it. Each option carries
// the number of active classes it covers so managers can see where the work is.
export function cascadeFilterOptions({ subjects = [], coaches = [], rooms = [], classes = [] }, selection = {}) {
  const active = classes.filter((row) => row.status === "ACTIVE" || row.status == null);
  const bySubject = active.filter((row) => !selection.subject || String(row.subjectId) === String(selection.subject));
  const bySubjectCoach = bySubject.filter((row) => !selection.coach || String(row.coachId) === String(selection.coach));
  const countBy = (rows, key) => rows.reduce((map, row) => map.set(String(row[key]), (map.get(String(row[key])) || 0) + 1), new Map());
  const sortByName = (a, b) => String(a[1] ?? "").localeCompare(String(b[1] ?? ""), "vi");

  const subjectCounts = countBy(active, "subjectId");
  const subjectOptions = subjects.map((row) => [String(row.subjectId), row.subjectName, subjectCounts.get(String(row.subjectId)) || 0]).sort(sortByName);

  const coachCounts = countBy(bySubject, "coachId");
  const coachNames = new Map(active.map((row) => [String(row.coachId), row.coachName]));
  coaches.forEach((row) => coachNames.set(String(row.userId), row.fullName));
  const specialists = new Set(coaches.filter((row) => !selection.subject || (row.subjectIds || []).map(String).includes(String(selection.subject))).map((row) => String(row.userId)));
  const coachIds = new Set([...coachCounts.keys(), ...(selection.subject ? specialists : coachNames.keys())]);
  const coachOptions = [...coachIds].filter((id) => id !== "undefined" && id !== "null").map((id) => [id, coachNames.get(id) || id, coachCounts.get(id) || 0]).sort(sortByName);

  const roomCounts = countBy(bySubjectCoach, "roomId");
  const narrowedRooms = selection.subject || selection.coach;
  const roomOptions = rooms.filter((row) => !narrowedRooms || roomCounts.has(String(row.roomId)))
    .map((row) => [String(row.roomId), row.roomName, roomCounts.get(String(row.roomId)) || 0]).sort(sortByName);

  return { subject: subjectOptions, coach: coachOptions, room: roomOptions };
}

// When a parent filter changes, drop child selections that no longer belong to it.
export function cascadeFilterPatch(data, selection, key, value) {
  const next = { ...selection, [key]: value };
  const order = ["subject", "coach", "room"];
  const reset = {};
  for (const child of order.slice(order.indexOf(key) + 1)) {
    const options = cascadeFilterOptions(data, next)[child];
    if (next[child] && !options.some(([id]) => id === String(next[child]))) { next[child] = ""; reset[child] = true; }
  }
  return reset;
}

// Class form options: coaches who teach the subject; rooms set up for the subject first (group 0).
const linked = (row, subjectId) => (row.subjectIds || []).map(String).includes(String(subjectId));
export const roomFitsSubject = (rooms, roomId, subjectId) => Boolean(roomId) && linked(rooms.find(r => String(r.roomId) === String(roomId)) || {}, subjectId);
export const classCoachOptions = (data, subjectId) => (subjectId ? data.coaches.filter(coach => linked(coach, subjectId)) : [])
  .map(row => ({ value: row.userId, label: row.fullName, hint: row.email }));
export const classRoomOptions = (data, subjectId) => data.rooms
  .map(row => ({ value: row.roomId, label: row.roomName, hint: `${row.capacity}`, group: subjectId && linked(row, subjectId) ? 0 : 1 }))
  .sort((a, b) => a.group - b.group);
