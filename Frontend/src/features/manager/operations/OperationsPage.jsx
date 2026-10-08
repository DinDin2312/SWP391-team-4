import { t, useLanguage } from '../../../i18n/useLanguage';
import { useState, useSyncExternalStore } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  List,
  Plus,
  Search,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import ManagerPageHeader from "../components/ManagerPageHeader";
import {
  formatDate,
  formatMoney,
  formatTime,
} from "../../../utils/displayFormat";
import { isoDate, localDateTime } from "../managerUtils";
import {
  addDays,
  eligibleClasses,
  filterSchedules,
  scheduleMetrics,
  sessionDay,
  subjectTone,
  weekRange,
} from "./operationsUtils";
import {
  OperationEditor,
  SessionDrawer,
  OperationConfirmation,
} from "./OperationsDrawers";
import { Occupancy, OperationStatus } from "./OperationsUI";
import "./operations.css";

const listenMobile = (listener) => {
  const query = window.matchMedia("(max-width: 767px)");
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
};
const mobileSnapshot = () => window.matchMedia("(max-width: 767px)").matches;
const emptyData = {
  schedules: [],
  classes: [],
  subjects: [],
  rooms: [],
  coaches: [],
};

export function OperationsSkeleton() {
  useLanguage();
  return (
    <div
      className="ops-skeleton"
      aria-label={t("Loading Center Operations")}
      aria-busy="true"
    >
      <div />
      <div className="ops-stat-grid">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} />
        ))}
      </div>
      <div />
      <div />
    </div>
  );
}

function Empty({ children }) {
  useLanguage();
  return (
    <div className="ops-empty">
      <CalendarDays size={28} />
      <strong>{t("No matching results")}</strong>
      <p>{t(children)}</p>
    </div>
  );
}

export default function OperationsPage({
  data = emptyData,
  page,
  filters,
  appliedFilters,
  setFilters,
  reload,
  refresh,
  loading,
  loadError,
  notify,
}) {
  useLanguage();
  const records = data || emptyData;
  const [tab, setTab] = useState("schedules");
  const [view, setView] = useState("calendar");
  const mobile = useSyncExternalStore(listenMobile, mobileSnapshot);
  const listView = mobile || view === "list";
  const [group, setGroup] = useState("room");
  const [selection, setSelection] = useState({
    subject: "",
    coach: "",
    room: "",
    status: "",
  });
  const [search, setSearch] = useState("");
  const [classStatus, setClassStatus] = useState("");
  const [editor, setEditor] = useState(null);
  const [detail, setDetail] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const rows = filterSchedules(records.schedules, records.classes, selection);
  const metrics = scheduleMetrics(rows);
  const displayedRange = appliedFilters;
  const selectedWeek = weekRange(displayedRange.from);
  const isWholeWeek =
    displayedRange.from === selectedWeek.from &&
    displayedRange.to === selectedWeek.to;
  const classes = records.classes.filter(
    (row) =>
      (!classStatus || row.status === classStatus) &&
      `${row.className} ${row.subjectName} ${row.coachName} ${row.roomName}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const coachOptions = [
    ...new Map([
      ...records.classes.map((row) => [
        row.coachId,
        { userId: row.coachId, fullName: row.coachName },
      ]),
      ...records.coaches.map((row) => [row.userId, row]),
    ]).values(),
  ];

  const changeRange = (range) => {
    const next = { ...filters, ...range };
    setFilters(next);
    reload(next);
  };
  const moveWeek = (offset) =>
    changeRange(weekRange(addDays(selectedWeek.from, offset * 7)));
  const createSession = (day, resource = {}) => {
    const candidates = eligibleClasses(records.classes, resource, selection);
    const nextHour = new Date();
    nextHour.setMinutes(0, 0, 0);
    nextHour.setHours(nextHour.getHours() + 1);
    const endHour = new Date(nextHour);
    endHour.setHours(endHour.getHours() + 1);
    setEditor({
      type: "schedule",
      resource,
      candidates,
      initial: {
        classId: candidates.length === 1 ? candidates[0].classId : "",
        startTime: day ? `${day}T09:00` : localDateTime(nextHour.toISOString()),
        endTime: day ? `${day}T10:00` : localDateTime(endHour.toISOString()),
      },
    });
  };
  const saved = async (message) => {
    setEditor(null);
    setConfirmation(null);
    setDetail(null);
    notify(message);
    await refresh();
  };
  const actions =
    tab === "catalog" ? (
      <>
        <button
          className="manager-secondary"
          disabled={loading || Boolean(loadError)}
          onClick={() => setEditor({ type: "subject" })}
        >
          <Plus size={16} />
          {t("Add subject")}
        </button>
        <button
          className="manager-primary"
          disabled={loading || Boolean(loadError)}
          onClick={() => setEditor({ type: "room" })}
        >
          <Plus size={16} />
          {t("Add room")}
        </button>
      </>
    ) : (
      <button
        className="manager-primary"
        disabled={loading || Boolean(loadError)}
        onClick={() =>
          tab === "classes" ? setEditor({ type: "class" }) : createSession()
        }
      >
        <Plus size={16} />
        {tab === "classes" ? t("Create class") : t("Create session")}
      </button>
    );

  return (
    <div className="ops-page" aria-busy={loading}>
      <ManagerPageHeader
        title={page.title}
        description={t("Plan the week, manage classes and keep resources coordinated.")}
        actions={actions}
      />
      <div
        className="manager-tabs"
        role="tablist"
        aria-label={t("Operations sections")}
      >
        {[
          ["schedules", "Schedules", records.schedules.length],
          ["classes", "Classes", records.classes.length],
          [
            "catalog",
            "Catalog",
            records.subjects.length + records.rooms.length,
          ],
        ].map(([id, name, count]) => (
          <button
            key={id}
            id={`ops-tab-${id}`}
            role="tab"
            aria-controls={`ops-panel-${id}`}
            aria-selected={tab === id}
            tabIndex={tab === id ? 0 : -1}
            className={tab === id ? "active" : ""}
            onClick={() => setTab(id)}
            onKeyDown={(event) => {
              const ids = ["schedules", "classes", "catalog"];
              if (
                ["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
              ) {
                event.preventDefault();
                const next =
                  event.key === "Home"
                    ? 0
                    : event.key === "End"
                      ? 2
                      : (ids.indexOf(tab) +
                          (event.key === "ArrowRight" ? 1 : 2)) %
                        3;
                setTab(ids[next]);
                document.getElementById(`ops-tab-${ids[next]}`)?.focus();
              }
            }}
          >
            {t(name)}
            <span>{count}</span>
          </button>
        ))}
      </div>
      <section
        id={`ops-panel-${tab}`}
        role="tabpanel"
        aria-labelledby={`ops-tab-${tab}`}
      >
        {loadError ? (
          <div className="ops-empty">
            <p>
              {t("Operations data could not be loaded. Retry using the error message above.")}
            </p>
            <button className="manager-secondary" onClick={() => changeRange(weekRange())}>{t("Return to this week")}</button>
          </div>
        ) : (
          tab === "schedules" && (
            <>
              <div className="ops-stat-grid">
                <Metric
                  label={t("Sessions today")}
                  value={metrics.today}
                  description={t("Non-cancelled sessions starting today within the current filters.")}
                />
                <Metric
                  label={t("Sessions in range")}
                  value={metrics.sessions}
                  description={t("Scheduled and completed sessions within the current filters.")}
                />
                <Metric
                  label={t("Seat occupancy")}
                  value={`${Math.round(metrics.occupancy * 100)}%`}
                  description={`CONFIRMED + PENDING bookings / capacity of non-cancelled sessions (${metrics.booked}/${metrics.capacity}).`}
                />
                <Metric
                  label={t("Low registrations")}
                  value={metrics.low}
                  description={t("Scheduled sessions with less than 25% of seats booked. Completed and cancelled sessions are excluded.")}
                />
              </div>
              <div className="ops-toolbar">
                <div className="ops-week-nav">
                  <button
                    className="manager-icon-button"
                    aria-label={t("Previous week")}
                    disabled={loading}
                    onClick={() => moveWeek(-1)}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    className="manager-secondary"
                    disabled={loading}
                    onClick={() => changeRange(weekRange())}
                  >
                    {t("Today")}
                  </button>
                  <button
                    className="manager-icon-button"
                    aria-label={t("Next week")}
                    disabled={loading}
                    onClick={() => moveWeek(1)}
                  >
                    <ChevronRight size={18} />
                  </button>
                  <strong>
                    {formatDate(displayedRange.from)} {t("–")}{" "}
                    {formatDate(displayedRange.to)}
                  </strong>
                </div>
                <div className="ops-view-controls">
                  <label>
                    {t("Group by")}
                    <select
                      value={group}
                      onChange={(e) => setGroup(e.target.value)}
                    >
                      <option value="room">{t("Room")}</option>
                      <option value="coach">{t("Coach")}</option>
                    </select>
                  </label>
                  {!mobile && (
                    <div className="ops-segment" aria-label={t("Schedule view")}>
                      <button
                        aria-pressed={!listView}
                        onClick={() => {
                          setView("calendar");
                          if (!isWholeWeek) changeRange(selectedWeek);
                        }}
                      >
                        <CalendarDays size={16} />
                        {t("Week")}
                      </button>
                      <button
                        aria-pressed={listView}
                        onClick={() => setView("list")}
                      >
                        <List size={16} />
                        {t("List")}
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <details className="ops-filters" open>
                <summary>
                  <SlidersHorizontal size={16} />
                  {t("Filters")} <span>{rows.length} {t("sessions")}</span>
                </summary>
                <div className="ops-filter-grid">
                  <label>
                    {t("From")}
                    <input
                      type="date"
                      value={filters.from}
                      onChange={(e) =>
                        setFilters({ ...filters, from: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    {t("To")}
                    <input
                      type="date"
                      value={filters.to}
                      onChange={(e) =>
                        setFilters({ ...filters, to: e.target.value })
                      }
                    />
                  </label>
                  <Filter
                    label={t("Subject")}
                    value={selection.subject}
                    options={records.subjects.map((row) => [
                      row.subjectId,
                      row.subjectName,
                    ])}
                    onChange={(value) =>
                      setSelection({ ...selection, subject: value })
                    }
                  />
                  <Filter
                    label={t("Coach")}
                    value={selection.coach}
                    options={coachOptions.map((row) => [
                      row.userId,
                      row.fullName,
                    ])}
                    onChange={(value) =>
                      setSelection({ ...selection, coach: value })
                    }
                  />
                  <Filter
                    label={t("Room")}
                    value={selection.room}
                    options={records.rooms.map((row) => [
                      row.roomId,
                      row.roomName,
                    ])}
                    onChange={(value) =>
                      setSelection({ ...selection, room: value })
                    }
                  />
                  <Filter
                    label={t("Status")}
                    value={selection.status}
                    options={["SCHEDULED", "COMPLETED", "CANCELLED"].map(
                      (status) => [
                        status,
                        status.charAt(0) + status.slice(1).toLowerCase(),
                      ],
                    )}
                    onChange={(value) =>
                      setSelection({ ...selection, status: value })
                    }
                  />
                  <button
                    className="manager-secondary"
                    disabled={
                      loading ||
                      !filters.from ||
                      !filters.to ||
                      filters.from > filters.to
                    }
                    onClick={() => {
                      setView("list");
                      changeRange({ from: filters.from, to: filters.to });
                    }}
                  >
                    {t("Apply dates")}
                  </button>
                  <button
                    className="manager-secondary"
                    onClick={() =>
                      setSelection({
                        subject: "",
                        coach: "",
                        room: "",
                        status: "",
                      })
                    }
                  >
                    {t("Clear filters")}
                  </button>
                </div>
                {filters.from > filters.to && (
                  <p className="manager-field-error" role="alert">
                    {t("The start date must be before the end date.")}
                  </p>
                )}
              </details>
              {loading ? (
                <OperationsSkeleton />
              ) : listView || !isWholeWeek ? (
                <ScheduleList rows={rows} group={group} open={setDetail} />
              ) : (
                <WeekCalendar
                  rows={rows}
                  data={records}
                  week={selectedWeek}
                  group={group}
                  selection={selection}
                  open={setDetail}
                  create={createSession}
                />
              )}
              <p className="ops-note">
                {t("Seat counts include confirmed bookings and pending holds. Colours identify subjects; “Ongoing” is derived from time. Select a session to view its roster or change its time.")}
              </p>
            </>
          )
        )}
        {!loadError && tab === "classes" && (
          <>
            <div className="ops-toolbar">
              <label className="ops-search">
                <Search size={16} />
                <input
                  aria-label={t("Search classes")}
                  placeholder={t("Search class, subject, coach or room…")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
              <Filter
                label={t("Status")}
                value={classStatus}
                options={[
                  ["ACTIVE", "Active"],
                  ["INACTIVE", "Inactive"],
                ]}
                onChange={setClassStatus}
              />
            </div>
            <div className="manager-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{t("Class / subject")}</th>
                    <th>{t("Coach / room")}</th>
                    <th>{t("Capacity / session")}</th>
                    <th>{t("Class tuition")}</th>
                    <th>{t("Status")}</th>
                    <th>{t("Actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map((row) => (
                    <tr key={row.classId}>
                      <td>
                        <strong>{row.className}</strong>
                        <small className="manager-cell-sub">
                          {row.subjectName}
                        </small>
                      </td>
                      <td>
                        {row.coachName}
                        <small className="manager-cell-sub">
                          {row.roomName}
                        </small>
                      </td>
                      <td>
                        {row.maxSlots} {t("seats")}
                        <small
                          className="manager-cell-sub"
                          title={t("Highest confirmed + pending booking count of any non-cancelled session.")}
                        >
                          {t("Peak booked:")} {row.enrolled || 0}
                        </small>
                      </td>
                      <td>
                        {formatMoney(row.price)}
                        <small className="manager-cell-sub">
                          {t("per class registration")}
                        </small>
                      </td>
                      <td>
                        <OperationStatus status={row.status} />
                      </td>
                      <td>
                        <div className="ops-table-actions">
                          <button
                            className="manager-secondary"
                            onClick={() =>
                              setEditor({ type: "class", item: row })
                            }
                          >
                            {t("Edit")}
                          </button>
                          <button
                            className="manager-secondary"
                            disabled={row.status !== "ACTIVE"}
                            onClick={() =>
                              setEditor({
                                type: "series",
                                initial: { classId: row.classId },
                              })
                            }
                          >
                            {t("Repeat sessions")}
                          </button>
                          <button
                            className="ops-text-danger"
                            disabled={row.status !== "ACTIVE"}
                            onClick={() =>
                              setConfirmation({ type: "deactivate", item: row })
                            }
                          >
                            {t("Deactivate")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!classes.length && (
                <Empty>
                  {t("Create a class or adjust the search and status filter.")}
                </Empty>
              )}
            </div>
            <p className="ops-note">
              {t("A class owns its coach, room and capacity for every session. Classes with future sessions cannot be deactivated; cancel those sessions first.")}
            </p>
          </>
        )}
        {!loadError && tab === "catalog" && (
          <div className="ops-catalog">
            {["subject", "room"].map((type) => (
              <Catalog
                key={type}
                type={type}
                rows={records[`${type}s`]}
                edit={(item) => setEditor({ type, item })}
                create={() => setEditor({ type })}
              />
            ))}
          </div>
        )}
      </section>
      {editor && (
        <OperationEditor
          config={editor}
          data={records}
          onClose={() => setEditor(null)}
          onSaved={saved}
        />
      )}
      {detail && !editor && !confirmation && (
        <SessionDrawer
          schedule={
            records.schedules.find(
              (row) => row.scheduleId === detail.scheduleId,
            ) || detail
          }
          onClose={() => setDetail(null)}
          edit={(item) => setEditor({ type: "schedule", item })}
          confirm={(type, item) => setConfirmation({ type, item })}
        />
      )}
      {confirmation && (
        <OperationConfirmation
          config={confirmation}
          onClose={() => setConfirmation(null)}
          onSaved={saved}
        />
      )}
    </div>
  );
}

function Metric({ label, value, description }) {
  useLanguage();
  return (
    <article className="ops-stat" title={description}>
      <small>{t(label)}</small>
      <strong>{value}</strong>
      <p>{t(description)}</p>
    </article>
  );
}
function Filter({ label, value, options, onChange }) {
  useLanguage();
  return (
    <label>
      {t(label)}
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">
          {t("All")}{" "}
          {{ Coach: "coaches", Status: "statuses" }[label] ||
            label.toLowerCase() + "s"}
        </option>
        {options.map(([id, name]) => (
          <option key={id} value={id}>
            {name}
          </option>
        ))}
      </select>
    </label>
  );
}

function ScheduleList({ rows, group, open }) {
  useLanguage();
  if (!rows.length)
    return (
      <Empty>
        {t("Adjust your filters or create a session for this date range.")}
      </Empty>
    );
  const groups = [
    ...new Map(
      rows.map((row) => [row[`${group}Id`], row[`${group}Name`]]),
    ).entries(),
  ];
  return (
    <div className="ops-session-list">
      {groups.map(([id, name]) => (
        <section className="ops-list-group" key={id}>
          <h2>{name}</h2>
          {rows
            .filter((row) => row[`${group}Id`] === id)
            .map((row) => (
              <button
                className="ops-session-row"
                key={row.scheduleId}
                onClick={() => open(row)}
              >
                <div className="ops-session-time">
                  <strong>{formatDate(row.startTime)}</strong>
                  <span>
                    {formatTime(row.startTime)} {t("–")} {formatTime(row.endTime)}
                    {sessionDay(row.startTime) !== sessionDay(row.endTime)
                      ? ` (+ ${formatDate(row.endTime)})`
                      : ""}
                  </span>
                </div>
                <div>
                  <strong>{row.className}</strong>
                  <span>
                    {row.coachName} {t("·")} {row.roomName}
                  </span>
                </div>
                <Occupancy row={row} />
                <OperationStatus status={row.status} row={row} />
                <ChevronRight size={18} />
              </button>
            ))}
        </section>
      ))}
    </div>
  );
}

function WeekCalendar({ rows, data, week, group, selection, open, create }) {
  useLanguage();
  const days = Array.from({ length: 7 }, (_, i) => addDays(week.from, i));
  const resources =
    group === "room"
      ? data.rooms.map((row) => ({ id: row.roomId, name: row.roomName }))
      : [
          ...new Map(
            data.classes.map((row) => [
              row.coachId,
              { id: row.coachId, name: row.coachName },
            ]),
          ).values(),
        ];
  const groups = resources.filter(
    (resource) => !selection[group] || String(resource.id) === selection[group],
  );
  const subjectMap = new Map(
    data.classes.map((row) => [row.classId, row.subjectId]),
  );
  return (
    <>
      <div className="ops-legend">
        {data.subjects.map((row) => (
          <span
            className={`ops-tone-${subjectTone(row.subjectId)}`}
            key={row.subjectId}
          >
            <i />
            {row.subjectName}
          </span>
        ))}
      </div>
      <div
        className="ops-calendar-scroll"
        tabIndex={0}
        role="region"
        aria-label={t("Weekly schedule by resource")}
      >
        <div className="ops-calendar">
          <div className="ops-calendar-heading">
            <strong>{group === "room" ? t("Rooms") : t("Coaches")}</strong>
            {days.map((day) => (
              <div
                className={day === isoDate(new Date()) ? "is-today" : ""}
                key={day}
              >
                <span>
                  {new Intl.DateTimeFormat("en-GB", {
                    weekday: "short",
                  }).format(new Date(`${day}T12:00`))}
                </span>
                <strong>{formatDate(day)}</strong>
              </div>
            ))}
          </div>
          {groups.map((resource) => (
            <div className="ops-resource-row" key={resource.id}>
              <div className="ops-resource-label">
                <strong>{resource.name}</strong>
                <small>
                  {
                    rows.filter(
                      (row) =>
                        String(row[`${group}Id`]) === String(resource.id),
                    ).length
                  }{" "}
                  {t("sessions")}
                </small>
              </div>
              {days.map((day) => {
                const sessions = rows.filter(
                  (row) =>
                    String(row[`${group}Id`]) === String(resource.id) &&
                    sessionDay(row.startTime) === day,
                );
                const resourceFilter = { [`${group}Id`]: resource.id };
                const eligible = eligibleClasses(
                  data.classes,
                  resourceFilter,
                  selection,
                );
                return (
                  <div className="ops-day-cell" key={day}>
                    {sessions.map((row) => (
                      <button
                        className={`ops-calendar-session ops-tone-${subjectTone(subjectMap.get(row.classId))} ${row.status === "CANCELLED" ? "is-cancelled" : ""}`}
                        key={row.scheduleId}
                        onClick={() => open(row)}
                      >
                        <span>
                          {formatTime(row.startTime)} {t("–")}{" "}
                          {formatTime(row.endTime)}
                        </span>
                        {sessionDay(row.startTime) !== sessionDay(row.endTime) && <small>{t("Ends")} {formatDate(row.endTime)}</small>}
                        <strong>{row.className}</strong>
                        <small>{row.coachName}</small>
                        <small>{row.roomName}</small>
                        <Occupancy row={row} />
                        <OperationStatus status={row.status} row={row} />
                      </button>
                    ))}
                    <button
                      className="ops-cell-create"
                      disabled={!eligible.length}
                      title={
                        eligible.length
                          ? `Create a session for ${resource.name} at 09:00`
                          : "Assign an active class to this resource first."
                      }
                      aria-label={`Create session on ${formatDate(day)} at 09:00 for ${resource.name}`}
                      onClick={() => create(day, resourceFilter)}
                    >
                      <Plus size={14} />
                      {sessions.length ? t("Session") : t("09:00 · Session")}
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {!groups.length && (
        <Empty>
          {t("Add a resource and assign an active class to start scheduling.")}
        </Empty>
      )}
      <p className="ops-note">
        {t("Sessions are stacked in time order to keep dense schedules readable. Empty cells start at 09:00; choose the exact time in the drawer. Room and coach come from the selected class.")}
      </p>
    </>
  );
}

function Catalog({ type, rows, edit, create }) {
  useLanguage();
  const subject = type === "subject";
  return (
    <section className="manager-panel">
      <div className="ops-catalog-heading">
        <div>
          <h2>{subject ? t("Subjects") : t("Rooms")}</h2>
          <span>{rows.length} {t("entries")}</span>
        </div>
        <button className="manager-secondary" onClick={create}>
          <Plus size={16} />
          {t("Add")} {type}
        </button>
      </div>
      {!rows.length ? (
        <Empty>
          {subject
            ? t("Add a subject before creating a class.")
            : t("Add a room with its capacity, then assign a class.")}
        </Empty>
      ) : (
        <div className="ops-catalog-list">
          {rows.map((row) => (
            <article key={row[`${type}Id`]}>
              <div>
                <strong>{row[`${type}Name`]}</strong>
                <p>
                  {subject
                    ? row.description || t("No description")
                    : `${row.capacity} seats`}
                </p>
                <small>
                  <Users size={14} />
                  {row.classCount || 0} {t("classes")}
                </small>
              </div>
              <button
                className="manager-secondary"
                aria-label={`Edit ${row[`${type}Name`]}`}
                onClick={() => edit(row)}
              >
                {t("Edit")}
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
