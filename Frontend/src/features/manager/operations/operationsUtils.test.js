import test from "node:test";
import assert from "node:assert/strict";
import {
  addDays,
  eligibleClasses,
  filterSchedules,
  isOngoing,
  operationPayload,
  scheduleMetrics,
  weekRange,
} from "./operationsUtils.js";

test("weeks start on Monday and cross month, year and leap-day boundaries", () => {
  assert.deepEqual(weekRange("2026-10-03"), {
    from: "2026-09-28",
    to: "2026-10-04",
  });
  assert.deepEqual(weekRange("2027-01-01"), {
    from: "2026-12-28",
    to: "2027-01-03",
  });
  assert.equal(addDays("2024-02-28", 1), "2024-02-29");
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
});

test("occupancy includes API booked seats, excludes cancelled sessions and uses strict low threshold", () => {
  const rows = [
    {
      startTime: "2026-10-03T09:00:00",
      status: "SCHEDULED",
      booked: 2,
      maxSlots: 10,
    },
    {
      startTime: "2026-10-03T10:00:00",
      status: "SCHEDULED",
      booked: 5,
      maxSlots: 20,
    },
    {
      startTime: "2026-10-02T09:00:00",
      status: "COMPLETED",
      booked: 8,
      maxSlots: 10,
    },
    {
      startTime: "2026-10-03T11:00:00",
      status: "CANCELLED",
      booked: 10,
      maxSlots: 10,
    },
  ];
  assert.deepEqual(scheduleMetrics(rows, "2026-10-03"), {
    today: 2,
    sessions: 3,
    booked: 15,
    capacity: 40,
    occupancy: 0.375,
    low: 1,
  });
  assert.equal(scheduleMetrics([]).occupancy, 0);
});

test("subject join and all filters retain adjacent sessions in chronological order", () => {
  const classes = [
    { classId: 1, subjectId: 3 },
    { classId: 2, subjectId: 4 },
  ];
  const session = { classId: 1, roomId: 2, coachId: 5, status: "SCHEDULED" };
  const rows = [
    { ...session, scheduleId: 2, startTime: "2026-10-04T10:00:00" },
    { ...session, scheduleId: 1, startTime: "2026-10-04T09:00:00" },
    { ...session, scheduleId: 3, classId: 2, startTime: "2026-10-04T11:00:00" },
  ];
  assert.deepEqual(
    filterSchedules(rows, classes, {
      subject: "3",
      room: "2",
      coach: "5",
      status: "SCHEDULED",
    }).map((row) => row.scheduleId),
    [1, 2],
  );
  assert.equal(rows[0].scheduleId, 2, "input order is preserved");
});

test("empty calendar cell only offers active classes assigned to the selected resource", () => {
  const classes = [
    { classId: 1, status: "ACTIVE", roomId: 2, coachId: 3, subjectId: 4 },
    { classId: 2, status: "ACTIVE", roomId: 5, coachId: 3, subjectId: 4 },
    { classId: 3, status: "INACTIVE", roomId: 2, coachId: 3, subjectId: 4 },
  ];
  assert.deepEqual(
    eligibleClasses(classes, { roomId: 2 }, { coach: "3", subject: "4" }).map(
      (row) => row.classId,
    ),
    [1],
  );
  assert.deepEqual(
    eligibleClasses(classes, { coachId: 3 }, { room: "5" }).map(
      (row) => row.classId,
    ),
    [2],
  );
});

test("schedule payload omits room, coach, presentation status and repeat metadata", () => {
  const form = {
    classId: "2",
    startTime: "2026-10-04T18:00",
    endTime: "2026-10-04T19:30",
    roomId: 8,
    coachId: 5,
    status: "ONGOING",
    occurrences: "4",
    intervalWeeks: "2",
  };
  assert.deepEqual(operationPayload("schedule", form), {
    classId: 2,
    startTime: form.startTime,
    endTime: form.endTime,
    scheduleId: undefined,
    status: "SCHEDULED",
  });
  assert.deepEqual(operationPayload("series", form), {
    classId: 2,
    startTime: form.startTime,
    endTime: form.endTime,
    occurrences: 4,
    intervalWeeks: 2,
  });
});

test("ongoing is derived only for scheduled sessions, with an exclusive end boundary", () => {
  const row = {
    status: "SCHEDULED",
    startTime: "2026-10-04T18:00:00",
    endTime: "2026-10-04T19:00:00",
  };
  assert.equal(isOngoing(row, new Date("2026-10-04T18:00:00")), true);
  assert.equal(isOngoing(row, new Date("2026-10-04T19:00:00")), false);
  assert.equal(
    isOngoing({ ...row, status: "CANCELLED" }, new Date("2026-10-04T18:30:00")),
    false,
  );
});
