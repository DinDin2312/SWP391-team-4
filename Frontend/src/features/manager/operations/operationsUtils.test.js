import test from "node:test";
import assert from "node:assert/strict";
import {
  addDays,
  eligibleClasses,
  filterSchedules,
  isOngoing,
  operationPayload,
  scheduleMetrics,
  subjectTone,
  weekRange,
} from "./operationsUtils.js";

test("weeks start on Monday and cross month, year and leap-day boundaries", () => {
  assert.deepEqual(weekRange("2026-10-03"), {
    from: "2026-09-28",
    to: "2026-10-04",
  });
  assert.deepEqual(weekRange(new Date(2026, 9, 3)), {
    from: "2026-09-28",
    to: "2026-10-04",
  });
  assert.deepEqual(weekRange("2027-01-01"), {
    from: "2026-12-28",
    to: "2027-01-03",
  });
  assert.equal(addDays("2024-02-28", 1), "2024-02-29");
  assert.equal(addDays(new Date(2024, 1, 28), 1), "2024-02-29");
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(subjectTone(1), "violet");
  assert.equal(subjectTone(null), "blue");
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

test("operationPayload normalizes subject, room, class, schedule and series payloads", () => {
  assert.deepEqual(
    operationPayload("subject", {
      subjectId: 1,
      subjectName: " Yoga ",
      description: "",
      durationMinutes: "60",
      slotStarts: ["07:00"],
    }),
    {
      subjectId: 1,
      subjectName: "Yoga",
      description: "",
      durationMinutes: 60,
      slotStarts: ["07:00"],
    },
  );
  assert.deepEqual(
    operationPayload("room", { roomId: 2, roomName: " Room A ", capacity: "30" }),
    { roomId: 2, roomName: "Room A", capacity: 30 },
  );
  assert.deepEqual(
    operationPayload("class", {
      classId: 3,
      className: " Morning Yoga ",
      subjectId: "1",
      coachId: "4",
      roomId: "2",
      maxSlots: "20",
      price: "650000",
      status: "ACTIVE",
    }),
    {
      classId: 3,
      className: "Morning Yoga",
      subjectId: 1,
      coachId: 4,
      roomId: 2,
      maxSlots: 20,
      price: 650000,
      status: "ACTIVE",
    },
  );

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

test('cascading filters narrow coaches and rooms to the selected subject and coach', async () => {
  const { cascadeFilterOptions, cascadeFilterPatch } = await import('./operationsUtils.js');
  const data = {
    subjects: [{ subjectId: 1, subjectName: 'Bơi' }, { subjectId: 2, subjectName: 'Yoga' }],
    coaches: [{ userId: 5, fullName: 'Hoàng', subjectIds: [1] }, { userId: 4, fullName: 'Mai Anh', subjectIds: [2] }, { userId: 9, fullName: 'Mới', subjectIds: [1] }],
    rooms: [{ roomId: 4, roomName: 'Bể bơi' }, { roomId: 2, roomName: 'Studio Yoga' }, { roomId: 7, roomName: 'Bể trẻ em' }],
    classes: [
      { classId: 1, subjectId: 1, coachId: 5, roomId: 4, status: 'ACTIVE', coachName: 'Hoàng' },
      { classId: 2, subjectId: 2, coachId: 4, roomId: 2, status: 'ACTIVE', coachName: 'Mai Anh' },
      { classId: 3, subjectId: 1, coachId: 5, roomId: 7, status: 'ACTIVE', coachName: 'Hoàng' },
      { classId: 4, subjectId: 1, coachId: 4, roomId: 2, status: 'INACTIVE', coachName: 'Mai Anh' },
    ],
  };
  const all = cascadeFilterOptions(data, {});
  assert.equal(all.coach.length, 3);
  assert.equal(all.room.length, 3);
  assert.deepEqual(all.subject, [['1', 'Bơi', 2], ['2', 'Yoga', 1]]);
  const swim = cascadeFilterOptions(data, { subject: '1' });
  assert.deepEqual(swim.coach, [['5', 'Hoàng', 2], ['9', 'Mới', 0]]);
  assert.deepEqual(swim.room.map(([id]) => id), ['4', '7']);
  assert.deepEqual(cascadeFilterOptions(data, { coach: '4' }).room.map(([id]) => id), ['2']);
  assert.deepEqual(cascadeFilterPatch(data, { subject: '', coach: '4', room: '2' }, 'subject', '1'), { coach: true, room: true });
  assert.deepEqual(cascadeFilterPatch(data, { subject: '1', coach: '5', room: '4' }, 'coach', '5'), {});
  assert.deepEqual(cascadeFilterOptions({}, {}), { subject: [], coach: [], room: [] });
});
