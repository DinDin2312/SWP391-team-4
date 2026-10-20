import { t, useLanguage } from '../../../i18n/useLanguage';
import { useEffect, useId, useRef, useState } from "react";
import { AlertTriangle, CalendarDays, MapPin, Users, X } from "lucide-react";
import managerService from "../services/managerService";
import { useTeachingSlots, slotEnd, slotLabel } from './teachingSlots';
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
import ResourcePhoto from '../../../components/resource-images/ResourcePhoto';
import StaffAvatar from '../staff/StaffAvatar';
import OperationPhotoField from './OperationPhotoField';
import SubjectSlotFields from './SubjectSlotFields';

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
          'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), summary, [tabindex="0"]',
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

export function Drawer({ title, subtitle, onClose, busy = false, children, className = '' }) {
  useLanguage();
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
        className={`ops-drawer ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        tabIndex={-1}
      >
        <header>
          <div>
            <h2 id={id}>{t(title)}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button
            className="manager-icon-button"
            aria-label={t("Close drawer")}
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

export function ClassDrawer({ row, upcomingInRange, onClose, edit, recurring, supplementary }) {
  useLanguage();
  return <Drawer title={row.className} subtitle={row.subjectName} onClose={onClose}><div className="ops-drawer-body"><ResourcePhoto imagePath={row.imagePath} name={row.className} variant="hero"/><div className="ops-session-facts"><div className="ops-coach-identity"><StaffAvatar user={{fullName:row.coachName,avatarPath:row.coachAvatarPath}} className="ops-coach-avatar"/>{t('Coach')}: {row.coachName}</div><p>{t('Room')}: {row.roomName}</p><p>{t('Capacity')}: {row.maxSlots}</p><p>{t('Tuition / class registration')}: {formatMoney(row.price)}</p><OperationStatus status={row.status}/></div>{upcomingInRange > 0 && <p className="ops-warning">{t('{0} upcoming sessions in the loaded range. Cancel these before deactivating.',[upcomingInRange])}</p>}<p className="ops-note">{t('Classes with future sessions cannot be deactivated; cancel those sessions first.')}</p><div className="ops-detail-actions"><button className="manager-secondary" onClick={edit}>{t('Edit')}</button><button className="manager-secondary" disabled={row.status!=='ACTIVE'} onClick={recurring}>{t('Schedule course')}</button><button className="manager-secondary" disabled={row.status!=='ACTIVE'} onClick={supplementary}>{t('Add supplementary session')}</button></div></div><footer><button className="manager-secondary" onClick={onClose}>{t('Close')}</button></footer></Drawer>;
}

export function RoomDrawer({ row, onClose, edit }) {
  useLanguage();
  return <Drawer title={row.roomName} subtitle={t('Room details')} onClose={onClose}><div className="ops-drawer-body"><ResourcePhoto imagePath={row.imagePath} name={row.roomName} variant="hero"/><div className="ops-session-facts"><p>{t('Capacity')}: {row.capacity}</p><p>{t('Classes')}: {row.classCount || 0}</p></div><div className="ops-detail-actions"><button className="manager-secondary" onClick={edit}>{t('Edit')}</button></div></div><footer><button className="manager-secondary" onClick={onClose}>{t('Close')}</button></footer></Drawer>;
}
export function SessionGroupDrawer({ cell, onClose, open }) {
  useLanguage();
  const [limit,setLimit]=useState(20);
  return <Drawer title={cell.title} subtitle={formatDate(cell.day)} onClose={onClose}><div className="ops-drawer-body"><p>{t('{0} sessions',[cell.rows.length])}</p>{cell.rows.slice(0,limit).map(row=><button key={row.scheduleId} className="ops-cell-detail" onClick={()=>open(row)}><strong>{row.className}</strong><span>{formatDateTime(row.startTime)} – {formatDateTime(row.endTime)}</span></button>)}{limit<cell.rows.length && <button className="manager-secondary" onClick={()=>setLimit(n=>n+20)}>{t('Show next 20 sessions')}</button>}</div></Drawer>;
}

function Field({ label, name, error, children, help }) {
  useLanguage();
  const id = useId();
  return (
    <div className="ops-field">
      <label htmlFor={id}>{t(label)}</label>
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
          {t(error || help)}
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
  if(type==='subject' && (!Number.isInteger(Number(form.durationMinutes ?? 90)) || Number(form.durationMinutes ?? 90)<15 || Number(form.durationMinutes ?? 90)>240))errors.durationMinutes='Choose a duration from 15 to 240 minutes.';
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
  useLanguage();
  const { type } = config;
  const [form, setForm] = useState(() => ({
    ...initialForm(type, config.item),
    ...config.initial,
  }));
  const {policy,error:policyError}=useTeachingSlots(['schedule','series'].includes(type)?(form.classId || undefined):undefined);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const editing = Boolean(config.item);
  const [photo,setPhoto]=useState({file:null,remove:false});
  const [photoError,setPhotoError]=useState('');
  useEffect(()=>{
    if(!policy || editing || !['schedule','series'].includes(type))return;
    setForm(current=>{if(!current.startTime)return current;
      const time=policy.starts.find(t=>t.slice(0,5)>=current.startTime.slice(11,16)) || policy.starts[0];
      const start=current.startTime.slice(0,10)+'T'+time.slice(0,5);
      return {...current,startTime:start,endTime:slotEnd(start,policy.durationMinutes)};
    });
  },[policy,editing,type]);
  const title = config.supplementary ? "Add supplementary session" : `${editing ? "Edit" : "Create"} ${type === "series" ? "repeating sessions" : type === "schedule" ? "session" : type}`;
  const set = (key, value) => {
    setForm((current) => ({ ...current, [key]: value, ...(type==='class' && key==='subjectId'?{coachId:''}:{}), ...(['schedule','series'].includes(type) && key==='classId'?{startTime:'',endTime:''}:{}), ...((type==='schedule' || type==='series') && key==='startTime'?{endTime:slotEnd(value,policy?.durationMinutes || 90)}:{}) }));
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
  const coaches = data.coaches.filter(coach=>(coach.subjectIds || []).map(Number).includes(Number(form.subjectId)));
  const input = (key, label, attrs = {}, help) => (
    <Field key={key} name={key} label={t(label)} error={errors[key]} help={help}>
      {(id, aria) => (
        <input
          id={id}
          {...aria}
          {...attrs}
          value={form[key] ?? ""}
          onInput={(event) => set(key, event.target.value)}
          onChange={(event) => set(key, event.target.value)}
        />
      )}
    </Field>
  );
  const select = (key, label, options, disabled = false, help) => (
    <Field key={key} name={key} label={t(label)} error={errors[key]} help={help}>
      {(id, aria) => (
        <select
          id={id}
          {...aria}
          value={form[key] || ""}
          disabled={disabled}
          onChange={(event) => set(key, event.target.value)}
        >
          <option value="">{t("Select")}{' '}{t(label).toLocaleLowerCase()}</option>
          {options.map(([value, name]) => (
            <option key={value} value={value}>
              {key === 'status' ? t(name) : name}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
  const submit = async (event) => {
    event.preventDefault();
    if (saving || photoError) return;
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
      await managerService[methods[type]](operationPayload(type, form),photo);
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
      className={`ops-editor-dialog ops-editor-${type}`}
      title={t(title)}
      subtitle={
        t(editing
          ? "Existing bookings and resource conflicts are checked when saving."
          : "Use the existing center resources.")
      }
      onClose={onClose}
      busy={saving}
    >
      <form onSubmit={submit} noValidate>
        <div className="ops-drawer-body">
          {error && (
            <div className="manager-alert" role="alert">
              {t(error)}
            </div>
          )}
          <fieldset className="ops-editor-fields" disabled={saving}>
            {['subject','room','class'].includes(type) && <OperationPhotoField imagePath={config.item?.imagePath} name={form[`${type}Name`]} value={photo} onChange={setPhoto} onError={setPhotoError}/> }
            {type === "subject" && (
              <>
                {input("subjectName", "Subject name", { maxLength: 255 })}
                <SubjectSlotFields form={form} set={set} policy={policy}/>
                {errors.durationMinutes && <p role="alert" className="manager-field-error">{t(errors.durationMinutes)}</p>}
                <Field
                  name="description"
                  label={t("Description")}
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
                {form.subjectId && <p className="ops-note">{t('Inherited subject timetable')}: {t('{0} minutes per session',[data.subjects.find(subject=>String(subject.subjectId)===String(form.subjectId))?.durationMinutes || 90])}</p>}
                {form.subjectId && !coaches.length && <p className="ops-warning" role="status">{t('No coaches are assigned to this subject. Assign teaching subjects in Staff & Roles first.')}</p>}
                {form.coachId && !coaches.some(c=>String(c.userId)===String(form.coachId)) && <p className="ops-warning" role="alert">{t('The selected coach is not assigned to this subject.')}</p>}
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
                    `${row.roomName} · ${t('{0} seats',[row.capacity])}`,
                  ]),
                )}
                {input(
                  "maxSlots",
                  "Capacity per session",
                  { type: "number", min: 1, step: 1 },
                  selectedRoom
                    ? t('Room capacity: {0}. Cannot be below existing booked/held seats.',[selectedRoom.capacity])
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
                  <AlertTriangle size={18} />{t("Changing a class’s room, coach or capacity affects all its sessions.")}</p>
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
                  <p className="ops-warning">{t("No active class matches. Create or activate a class with the required resource first.")}</p>
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
                      {selectedClass.maxSlots}{' '}{t("seats ·")}{' '}{t(" ")}
                      {formatMoney(selectedClass.price)}{' '}{t("/ class")}</span>
                  </div>
                )}
                <p className="ops-note">{t('{0} minutes per session',[policy?.durationMinutes || '—'])}</p>
                {policyError && <p role="alert">{t(policyError)}</p>}
                <label className="ops-field">{t('Date')}<input required type="date" value={form.startTime?.slice(0,10) || ''} onInput={e=>set('startTime',e.target.value+'T'+(form.startTime?.slice(11,16)||policy?.starts[0]?.slice(0,5)||'07:00'))} onChange={e=>set('startTime',e.target.value+'T'+(form.startTime?.slice(11,16)||policy?.starts[0]?.slice(0,5)||'07:00'))}/></label>
                <label className="ops-field">{t('Teaching slot')}<select required disabled={!policy} value={form.startTime?.slice(11,16)||''} onChange={e=>set('startTime',(form.startTime?.slice(0,10)||'')+'T'+e.target.value)}>
                  <option value="">{t('Select')}</option>
                  {editing && form.startTime===initialForm(type,config.item).startTime && !policy?.starts.some(time=>time.slice(0,5)===form.startTime?.slice(11,16)) && <option value={form.startTime?.slice(11,16)}>{t('Existing session')} · {form.startTime?.slice(11,16)}</option>}
                  {policy?.starts.map((time,index)=><option key={time} value={time.slice(0,5)}>{slotLabel(time,index,policy.durationMinutes)}</option>)}
                </select></label>
                {input("endTime", "End time", {
                  type: "datetime-local",
                  readOnly: true,
                })}
                {editing && (
                  <p className="ops-note">{t("Moving the session sends a notification to its booked members. The backend also checks their timetable.")}</p>
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
                      <p className="ops-note">{t("Same weekday and time. Last start date:")}{' '}{t(" ")}
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
                      <AlertTriangle size={18} />{t("Existing class members are not automatically booked into newly created sessions. One conflict rejects the entire series.")}</p>
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
          >{t("Cancel")}</button>
          <button
            className="manager-primary"
            disabled={
              saving || Boolean(photoError) ||
              ((type === "series" || type === "schedule") &&
                !editing &&
                !candidates.length)
            }
          >
            {t(saving
              ? t("Saving…")
              : type === "series"
                ? t("Create series")
                : t("Save changes"))}
          </button>
        </footer>
      </form>
    </Drawer>
  );
}

export function SessionDrawer({ schedule, onClose, edit, confirm }) {
  useLanguage();
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
      title={t(schedule.className)}
      subtitle={t("Session #{0}",[schedule.scheduleId])}
      onClose={onClose}
    >
      <div className="ops-drawer-body">
        <OperationStatus status={schedule.status} row={schedule} />
        <div className="ops-session-facts">
          <p>
            <CalendarDays size={18} />
            {formatDateTime(schedule.startTime)} →{t(" ")}
            {formatDateTime(schedule.endTime)}
          </p>
          <div className="ops-coach-identity">
            <StaffAvatar user={{fullName:schedule.coachName,avatarPath:schedule.coachAvatarPath}} className="ops-coach-avatar"/>
            {schedule.coachName}
          </div>
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
          >{t("Change time")}</button>
          <button
            className="manager-secondary"
            disabled={!canComplete}
            title={
              t(canComplete
                ? "Mark this ended session completed"
                : "Only scheduled sessions that have ended can be completed.")
            }
            onClick={() => confirm("complete", schedule)}
          >{t("Complete")}</button>
          <button
            className="ops-text-danger"
            disabled={!scheduled}
            onClick={() => confirm("cancel", schedule)}
          >{t("Cancel session")}</button>
        </div>
        {!scheduled && (
          <p className="ops-note">{t("Completed and cancelled sessions cannot be edited or reopened.")}</p>
        )}
        <h3>{t("Roster · read only")}</h3>
        <p className="ops-note">{t("Only the assigned coach can record attendance. Enrolled members are confirmed upon payment.")}</p>
        {error ? (
          <div className="manager-alert" role="alert">
            <span>{t(error)}</span>
            <button
              onClick={() => {
                setError("");
                setRows(null);
                setRetry((value) => value + 1);
              }}
            >{t("Retry")}</button>
          </div>
        ) : !rows ? (
          <p role="status">{t("Loading roster…")}</p>
        ) : !rows.length ? (
          <div className="ops-empty">
            <Users size={24} />
            <p>{t("No bookings for this session.")}</p>
          </div>
        ) : (
          <div className="ops-roster-list">
            {rows.map((row) => (
              <article key={row.bookingId}>
                <strong>{row.fullName}</strong>
                <span>{row.email}</span>
                <span>{t(row.phone || "No phone number")}</span>
                <div>
                  <span>
                    {t(row.status === "CONFIRMED"
                      ? t("Confirmed")
                      : row.status === "PENDING"
                        ? t("Pending")
                        : t("Cancelled"))}
                  </span>
                  <span>
                    {t(attendance[row.attendanceStatus] || "Not marked")}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
      <footer>
        <button className="manager-secondary" onClick={onClose}>{t("Close")}</button>
      </footer>
    </Drawer>
  );
}

export function OperationConfirmation({ config, onClose, onSaved }) {
  useLanguage();
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
        <h2 id={id}>{t(action)}?</h2>
        <strong>{config.item.className}</strong>
        {deactivate && config.upcomingInRange > 0 && <p className="ops-warning">{t('{0} upcoming sessions in the loaded range. Cancel these before deactivating.',[config.upcomingInRange])}</p>}
        <p>
          {t(cancel
            ? t("All bookings for this session will be cancelled and members will receive a notification. The session cannot be reopened. This action does not issue a refund; contact reception about tuition.")
            : deactivate
              ? t("The backend will reject this change if the class has any future sessions. Cancel them first. Room and coach assignments are kept.")
              : t("This ended session will be marked completed and can no longer be edited."))}
        </p>
        {error && (
          <div className="manager-alert" role="alert">
            {t(error)}
          </div>
        )}
        <footer>
          <button
            className="manager-secondary"
            disabled={saving}
            onClick={onClose}
          >{t("Back")}</button>
          <button
            className={
              cancel || deactivate ? "ops-danger-button" : "manager-primary"
            }
            disabled={saving}
            onClick={save}
          >
            {t(saving ? t("Saving…") : action)}
          </button>
        </footer>
      </section>
    </div>
  );
}
