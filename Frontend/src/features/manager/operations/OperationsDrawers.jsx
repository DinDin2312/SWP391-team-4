import { useEffect, useId, useRef, useState } from "react";
import { AlertTriangle, CalendarDays, MapPin, Users, X } from "lucide-react";
import managerService from "../services/managerService";
import { initialForm } from "../managerUtils";
import {
  formatDate,
  formatDateTime,
  formatMoney,
} from "../../../utils/displayFormat";
import {
  addDays,
  eligibleClasses,
  operationPayload,
  sessionDay,
} from "./operationsUtils";
import { Occupancy, OperationStatus } from "./OperationsUI";

function useOperationDialog(onClose, busy) {
  const ref = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  useEffect(() => {
    const dialog = ref.current;
    const keydown = (event) => {
      if (event.key === "Escape" && !busy) {
        event.stopPropagation();
        onClose();
      }
      if (event.key !== "Tab") return;
      const controls = [
        ...dialog.querySelectorAll(
          'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]',
        ),
      ].filter((node) => node.getClientRects().length);
      if (!controls.length) {
        event.preventDefault();
        return;
      }
      if (
        event.shiftKey &&
        (document.activeElement === controls[0] ||
          document.activeElement === dialog)
      ) {
        event.preventDefault();
        controls.at(-1).focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === controls.at(-1) ||
          document.activeElement === dialog)
      ) {
        event.preventDefault();
        controls[0].focus();
      }
    };
    dialog?.addEventListener("keydown", keydown);
    return () => dialog?.removeEventListener("keydown", keydown);
  }, [onClose, busy]);
  return ref;
}

function Drawer({ title, subtitle, onClose, busy = false, children }) {
  const dialog = useOperationDialog(onClose, busy);
  const id = useId();
  return (
    <div
      className="ops-backdrop"
      onMouseDown={(event) =>
        !busy && event.target === event.currentTarget && onClose()
      }
    >
      <section
        ref={dialog}
        className="ops-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        tabIndex={-1}
      >
        <header>
          <div>
            <h2 id={id}>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button
            className="manager-icon-button"
            aria-label="Close drawer"
            disabled={busy}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

function Field({ label, name, error, children, help }) {
  const id = useId();
  return (
    <div className="ops-field">
      <label htmlFor={id}>{label}</label>
      {children(id, {
        name,
        "aria-invalid": Boolean(error),
        "aria-describedby": error || help ? `${id}-help` : undefined,
      })}
      {(error || help) && (
        <small
          id={`${id}-help`}
          className={error ? "manager-field-error" : "ops-field-help"}
        >
          {error || help}
        </small>
      )}
    </div>
  );
}

function validate(type, form) {
  const errors = {};
  const required =
    type === "subject"
      ? ["subjectName"]
      : type === "room"
        ? ["roomName", "capacity"]
        : type === "class"
          ? [
              "className",
              "subjectId",
              "coachId",
              "roomId",
              "price",
              "maxSlots",
              "status",
            ]
          : ["classId", "startTime", "endTime"];
  required.forEach((name) => {
    if (form[name] === undefined || String(form[name]).trim() === "")
      errors[name] = "This field is required.";
  });
  const name =
    type === "subject"
      ? "subjectName"
      : type === "room"
        ? "roomName"
        : "className";
  if (form[name]?.length > 255) errors[name] = "Use at most 255 characters.";
  if (form.description?.length > 10000)
    errors.description = "Use at most 10,000 characters.";
  for (const key of type === "class"
    ? ["maxSlots"]
    : type === "room"
      ? ["capacity"]
      : []) {
    if (!Number.isInteger(Number(form[key])) || Number(form[key]) < 1)
      errors[key] = "Enter a positive whole number.";
  }
  if (
    type === "class" &&
    (!Number.isFinite(Number(form.price)) ||
      Number(form.price) < 0 ||
      Number(form.price) >= 100000000 ||
      !/^\d+(\.\d{1,2})?$/.test(String(form.price)))
  )
    errors.price =
      "Enter a non-negative amount below 100,000,000, with at most 2 decimals.";
  if (type === "schedule" || type === "series") {
    if (form.startTime && form.endTime && form.endTime <= form.startTime)
      errors.endTime = "The end time must be after the start time.";
    if (
      !form.scheduleId &&
      form.startTime &&
      new Date(form.startTime) <= new Date()
    )
      errors.startTime = "The new start time must be in the future.";
  }
  if (type === "series") {
    if (
      !Number.isInteger(Number(form.occurrences)) ||
      Number(form.occurrences) < 2 ||
      Number(form.occurrences) > 52
    )
      errors.occurrences = "Enter 2–52 sessions.";
    if (
      !Number.isInteger(Number(form.intervalWeeks)) ||
      Number(form.intervalWeeks) < 1 ||
      Number(form.intervalWeeks) > 4
    )
      errors.intervalWeeks = "Enter 1–4 weeks.";
  }
  return errors;
}

export function OperationEditor({ config, data, onClose, onSaved }) {
  const { type } = config;
  const [form, setForm] = useState(() => ({
    ...initialForm(type, config.item),
    ...config.initial,
  }));
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const editing = Boolean(config.item);
  const title = `${editing ? "Edit" : "Create"} ${type === "series" ? "repeating sessions" : type === "schedule" ? "session" : type}`;
  const set = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };
  const candidates =
    config.candidates || eligibleClasses(data.classes, config.resource);
  const selectedClass = data.classes.find(
    (row) => String(row.classId) === String(form.classId),
  );
  const selectedRoom = data.rooms.find(
    (row) => String(row.roomId) === String(form.roomId),
  );
  const coaches = [...data.coaches];
  if (
    editing &&
    type === "class" &&
    !coaches.some((row) => row.userId === form.coachId)
  )
    coaches.push({
      userId: form.coachId,
      fullName: `${config.item.coachName} (inactive; reassign before saving)`,
    });
  const input = (key, label, attrs = {}, help) => (
    <Field key={key} name={key} label={label} error={errors[key]} help={help}>
      {(id, aria) => (
        <input
          id={id}
          {...aria}
          {...attrs}
          value={form[key] ?? ""}
          onChange={(event) => set(key, event.target.value)}
        />
      )}
    </Field>
  );
  const select = (key, label, options, disabled = false, help) => (
    <Field key={key} name={key} label={label} error={errors[key]} help={help}>
      {(id, aria) => (
        <select
          id={id}
          {...aria}
          value={form[key] || ""}
          disabled={disabled}
          onChange={(event) => set(key, event.target.value)}
        >
          <option value="">Select {label.toLowerCase()}</option>
          {options.map(([value, name]) => (
            <option key={value} value={value}>
              {name}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
  const submit = async (event) => {
    event.preventDefault();
    if (saving) return;
    const invalid = validate(type, form);
    setErrors(invalid);
    setError("");
    if (Object.keys(invalid).length) {
      event.currentTarget
        .querySelector(`[name="${Object.keys(invalid)[0]}"]`)
        ?.focus();
      return;
    }
    setSaving(true);
    try {
      const methods = {
        subject: "saveSubject",
        room: "saveRoom",
        class: "saveClass",
        schedule: "saveSchedule",
        series: "createScheduleSeries",
      };
      await managerService[methods[type]](operationPayload(type, form));
      await onSaved(
        type === "series"
          ? `${form.occurrences} sessions created. The last session starts on ${formatDate(addDays(sessionDay(form.startTime), (Number(form.occurrences) - 1) * Number(form.intervalWeeks) * 7))}. Change the date range to view it.`
          : "Changes saved.",
      );
    } catch (err) {
      setErrors(err.response?.data?.errors || {});
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to save. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <Drawer
      title={title}
      subtitle={
        editing
          ? "Existing bookings and resource conflicts are checked when saving."
          : "Use the existing center resources."
      }
      onClose={onClose}
      busy={saving}
    >
      <form onSubmit={submit} noValidate>
        <div className="ops-drawer-body">
          {error && (
            <div className="manager-alert" role="alert">
              {error}
            </div>
          )}
          <fieldset disabled={saving}>
            {type === "subject" && (
              <>
                {input("subjectName", "Subject name", { maxLength: 255 })}
                <Field
                  name="description"
                  label="Description"
                  error={errors.description}
                >
                  {(id, aria) => (
                    <textarea
                      id={id}
                      {...aria}
                      rows={5}
                      maxLength={10000}
                      value={form.description || ""}
                      onChange={(e) => set("description", e.target.value)}
                    />
                  )}
                </Field>
              </>
            )}
            {type === "room" && (
              <>
                {input("roomName", "Room name", { maxLength: 255 })}
                {input(
                  "capacity",
                  "Capacity (seats)",
                  { type: "number", min: 1, step: 1 },
                  "Must accommodate the largest class assigned to this room.",
                )}
              </>
            )}
            {type === "class" && (
              <>
                {input("className", "Class name", { maxLength: 255 })}
                {select(
                  "subjectId",
                  "Subject",
                  data.subjects.map((row) => [row.subjectId, row.subjectName]),
                )}
                {select(
                  "coachId",
                  "Coach",
                  coaches.map((row) => [row.userId, row.fullName]),
                )}
                {select(
                  "roomId",
                  "Room",
                  data.rooms.map((row) => [
                    row.roomId,
                    `${row.roomName} · ${row.capacity} seats`,
                  ]),
                )}
                {input(
                  "maxSlots",
                  "Capacity per session",
                  { type: "number", min: 1, step: 1 },
                  selectedRoom
                    ? `Room capacity: ${selectedRoom.capacity}. Cannot be below existing booked/held seats.`
                    : "Choose a room to see its capacity.",
                )}
                {input("price", "Tuition (VND / class registration)", {
                  type: "number",
                  min: 0,
                  max: 99999999.99,
                  step: 0.01,
                })}
                {select(
                  "status",
                  "Status",
                  [
                    ["ACTIVE", "Active"],
                    ["INACTIVE", "Inactive"],
                  ],
                  false,
                  "Cancel all future sessions before deactivating a class.",
                )}
                <p className="ops-warning">
                  <AlertTriangle size={18} />
                  Changing a class’s room, coach or capacity affects all its
                  sessions.
                </p>
              </>
            )}
            {(type === "schedule" || type === "series") && (
              <>
                {select(
                  "classId",
                  "Class",
                  (editing ? [config.item] : candidates).map((row) => [
                    row.classId,
                    row.className,
                  ]),
                  editing,
                  config.resource?.roomId || config.resource?.coachId
                    ? "Only active classes assigned to this resource are available."
                    : "Room and coach are inherited from the class.",
                )}
                {!editing && !candidates.length && (
                  <p className="ops-warning">
                    No active class matches. Create or activate a class with the
                    required resource first.
                  </p>
                )}
                {selectedClass && (
                  <div className="ops-assignment">
                    <span>
                      <Users size={16} />
                      {selectedClass.coachName}
                    </span>
                    <span>
                      <MapPin size={16} />
                      {selectedClass.roomName}
                    </span>
                    <span>
                      {selectedClass.maxSlots} seats ·{" "}
                      {formatMoney(selectedClass.price)} / class
                    </span>
                  </div>
                )}
                {input("startTime", "Start time", {
                  type: "datetime-local",
                  step: 60,
                })}
                {input("endTime", "End time", {
                  type: "datetime-local",
                  step: 60,
                })}
                {editing && (
                  <p className="ops-note">
                    Moving the session sends a notification to its booked
                    members. The backend also checks their timetable.
                  </p>
                )}
                {type === "series" && (
                  <>
                    {input(
                      "occurrences",
                      "Number of sessions (including the first)",
                      { type: "number", min: 2, max: 52, step: 1 },
                    )}
                    {input("intervalWeeks", "Repeat every (weeks)", {
                      type: "number",
                      min: 1,
                      max: 4,
                      step: 1,
                    })}
                    {form.startTime && (
                      <p className="ops-note">
                        Same weekday and time. Last start date:{" "}
                        {formatDate(
                          addDays(
                            sessionDay(form.startTime),
                            (Number(form.occurrences || 2) - 1) *
                              Number(form.intervalWeeks || 1) *
                              7,
                          ),
                        )}
                        .
                      </p>
                    )}
                    <p className="ops-warning">
                      <AlertTriangle size={18} />
                      Existing class members are not automatically booked into
                      newly created sessions. One conflict rejects the entire
                      series.
                    </p>
                  </>
                )}
              </>
            )}
          </fieldset>
        </div>
        <footer>
          <button
            className="manager-secondary"
            type="button"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            className="manager-primary"
            disabled={
              saving ||
              ((type === "series" || type === "schedule") &&
                !editing &&
                !candidates.length)
            }
          >
            {saving
              ? "Saving…"
              : type === "series"
                ? "Create series"
                : "Save changes"}
          </button>
        </footer>
      </form>
    </Drawer>
  );
}

export function SessionDrawer({ schedule, onClose, edit, confirm }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let current = true;
    managerService
      .scheduleBookings(schedule.scheduleId)
      .then((result) => {
        if (current) setRows(result);
      })
      .catch((err) => {
        if (current)
          setError(err.response?.data?.message || "Unable to load the roster.");
      });
    return () => {
      current = false;
    };
  }, [schedule.scheduleId, retry]);
  const scheduled = schedule.status === "SCHEDULED";
  const canComplete = scheduled && new Date(schedule.endTime) <= new Date();
  const attendance = {
    PRESENT: "Present",
    ABSENT: "Absent",
    NOT_YET: "Not marked",
  };
  return (
    <Drawer
      title={schedule.className}
      subtitle={`Session #${schedule.scheduleId}`}
      onClose={onClose}
    >
      <div className="ops-drawer-body">
        <OperationStatus status={schedule.status} row={schedule} />
        <div className="ops-session-facts">
          <p>
            <CalendarDays size={18} />
            {formatDateTime(schedule.startTime)} →{" "}
            {formatDateTime(schedule.endTime)}
          </p>
          <p>
            <Users size={18} />
            {schedule.coachName}
          </p>
          <p>
            <MapPin size={18} />
            {schedule.roomName}
          </p>
        </div>
        <Occupancy row={schedule} />
        <div className="ops-detail-actions">
          <button
            className="manager-secondary"
            disabled={!scheduled}
            onClick={() => edit(schedule)}
          >
            Change time
          </button>
          <button
            className="manager-secondary"
            disabled={!canComplete}
            title={
              canComplete
                ? "Mark this ended session completed"
                : "Only scheduled sessions that have ended can be completed."
            }
            onClick={() => confirm("complete", schedule)}
          >
            Complete
          </button>
          <button
            className="ops-text-danger"
            disabled={!scheduled}
            onClick={() => confirm("cancel", schedule)}
          >
            Cancel session
          </button>
        </div>
        {!scheduled && (
          <p className="ops-note">
            Completed and cancelled sessions cannot be edited or reopened.
          </p>
        )}
        <h3>Roster · read only</h3>
        <p className="ops-note">
          Only the assigned coach can record attendance. Pending bookings hold a
          seat.
        </p>
        {error ? (
          <div className="manager-alert" role="alert">
            <span>{error}</span>
            <button
              onClick={() => {
                setError("");
                setRows(null);
                setRetry((value) => value + 1);
              }}
            >
              Retry
            </button>
          </div>
        ) : !rows ? (
          <p role="status">Loading roster…</p>
        ) : !rows.length ? (
          <div className="ops-empty">
            <Users size={24} />
            <p>No bookings for this session.</p>
          </div>
        ) : (
          <div className="ops-roster-list">
            {rows.map((row) => (
              <article key={row.bookingId}>
                <strong>{row.fullName}</strong>
                <span>{row.email}</span>
                <span>{row.phone || "No phone number"}</span>
                <div>
                  <span>
                    {row.status === "CONFIRMED"
                      ? "Confirmed"
                      : row.status === "PENDING"
                        ? "Pending"
                        : "Cancelled"}
                  </span>
                  <span>
                    {attendance[row.attendanceStatus] || "Not marked"}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
      <footer>
        <button className="manager-secondary" onClick={onClose}>
          Close
        </button>
      </footer>
    </Drawer>
  );
}

export function OperationConfirmation({ config, onClose, onSaved }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const dialog = useOperationDialog(onClose, saving);
  const id = useId();
  const cancel = config.type === "cancel";
  const deactivate = config.type === "deactivate";
  const action = cancel
    ? "Cancel session"
    : deactivate
      ? "Deactivate class"
      : "Complete session";
  const save = async () => {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      if (deactivate)
        await managerService.saveClass({
          ...operationPayload("class", config.item),
          status: "INACTIVE",
        });
      else
        await managerService.saveSchedule({
          scheduleId: config.item.scheduleId,
          classId: config.item.classId,
          startTime: config.item.startTime,
          endTime: config.item.endTime,
          status: cancel ? "CANCELLED" : "COMPLETED",
        });
      await onSaved(
        cancel
          ? "Session cancelled. Its bookings were cancelled and members notified."
          : deactivate
            ? "Class deactivated."
            : "Session completed.",
      );
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save this change.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <div
      className="ops-backdrop ops-confirm-backdrop"
      onMouseDown={(event) =>
        !saving && event.target === event.currentTarget && onClose()
      }
    >
      <section
        className="ops-confirm"
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        tabIndex={-1}
      >
        <AlertTriangle size={26} />
        <h2 id={id}>{action}?</h2>
        <strong>{config.item.className}</strong>
        <p>
          {cancel
            ? "All bookings for this session will be cancelled and members will receive a notification. The session cannot be reopened. This action does not issue a refund; contact reception about tuition."
            : deactivate
              ? "The backend will reject this change if the class has any future sessions. Cancel them first. Room and coach assignments are kept."
              : "This ended session will be marked completed and can no longer be edited."}
        </p>
        {error && (
          <div className="manager-alert" role="alert">
            {error}
          </div>
        )}
        <footer>
          <button
            className="manager-secondary"
            disabled={saving}
            onClick={onClose}
          >
            Back
          </button>
          <button
            className={
              cancel || deactivate ? "ops-danger-button" : "manager-primary"
            }
            disabled={saving}
            onClick={save}
          >
            {saving ? "Saving…" : action}
          </button>
        </footer>
      </section>
    </div>
  );
}
