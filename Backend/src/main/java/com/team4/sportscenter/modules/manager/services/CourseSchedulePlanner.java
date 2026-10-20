package com.team4.sportscenter.modules.manager.services;

import com.team4.sportscenter.modules.manager.dtos.request.ManagerRequests.*;
import java.time.*;
import java.util.*;

/** Fixed weekly slots; a collision never silently changes a lesson's date or time. */
public final class CourseSchedulePlanner {
    private CourseSchedulePlanner() { }
    public record SlotAvailability(int weekday, LocalTime time, int total, List<LocalDate> conflictDates) { }

    /** Evaluate every candidate against all occurrences, including holidays and changeover time. */
    public static List<SlotAvailability> availability(SchedulePlanRequest r,
            List<SchedulePlanner.BusyPeriod> occupied, LocalDateTime now, TeachingSlots.Policy policy) {
        // Validate once, using the same rules as preview and commit.
        propose(r, List.of(), now, policy);
        List<SlotAvailability> result=new ArrayList<>();
        for(int weekday:r.weekdays()) for(var time:policy.starts()) {
            var slots=new HashMap<>(r.weekdaySlots());slots.put(weekday,time);
            var candidate=new SchedulePlanRequest(r.classId(),r.fromDate(),r.toDate(),r.sessions(),
                r.durationMinutes(),r.weekdays(),r.availableFrom(),r.availableTo(),r.preferredTime(),
                r.breakMinutes(),r.excludedDates(),slots,Map.of());
            var intended=propose(candidate,List.of(),now,policy).requestedSessions().stream()
                .filter(s->s.startTime().getDayOfWeek().getValue()==weekday).toList();
            var conflicts=intended.stream().filter(s->!free(s,occupied,policy.breakMinutes()))
                .map(s->s.startTime().toLocalDate()).toList();
            result.add(new SlotAvailability(weekday,time,intended.size(),conflicts));
        }
        return List.copyOf(result);
    }
    public record Conflict(LocalDate originalDate, LocalDateTime startTime, String reason,
                           List<PlannedSession> alternatives) { }
    public record Plan(List<PlannedSession> sessions, int missing, List<SchedulePlanner.SkippedDay> skipped,
                       List<Conflict> conflicts, List<PlannedSession> requestedSessions) { }

    public static Plan propose(SchedulePlanRequest r, List<SchedulePlanner.BusyPeriod> occupied,
                               LocalDateTime now, TeachingSlots.Policy policy) {
        SchedulePlanner.validateRules(r,now);
        var slots=r.weekdaySlots();
        if(slots==null || !slots.keySet().equals(new HashSet<>(r.weekdays()))
                || slots.values().stream().anyMatch(t->t==null || !policy.starts().contains(t)))
            throw new IllegalArgumentException("Choose one configured slot for each selected weekday.");
        var overrides=r.overrides()==null?Map.<LocalDate,LocalDateTime>of():r.overrides();
        if(overrides.size()>52)throw new IllegalArgumentException("Too many session overrides.");
        Map<LocalDate,PlannedSession> requested=new LinkedHashMap<>();
        List<SchedulePlanner.SkippedDay> skipped=new ArrayList<>();
        for(var day=r.fromDate(); !day.isAfter(r.toDate()) && requested.size()<r.sessions(); day=day.plusDays(1)) {
            if(!slots.containsKey(day.getDayOfWeek().getValue()))continue;
            if(r.excludedDates().contains(day)){skipped.add(new SchedulePlanner.SkippedDay(day,"Excluded date"));continue;}
            var start=overrides.getOrDefault(day,day.atTime(slots.get(day.getDayOfWeek().getValue())));
            if(start==null || !start.isAfter(now) || start.toLocalDate().isBefore(r.fromDate())
                    || start.toLocalDate().isAfter(r.toDate()) || r.excludedDates().contains(start.toLocalDate()))
                throw new IllegalArgumentException("Make-up sessions must use a future non-excluded date inside the planning range.");
            policy.validate(start,start.plusMinutes(policy.durationMinutes()));
            requested.put(day,new PlannedSession(start,start.plusMinutes(policy.durationMinutes())));
        }
        if(!requested.keySet().containsAll(overrides.keySet()))
            throw new IllegalArgumentException("Only planned lessons can be overridden.");
        List<PlannedSession> result=new ArrayList<>();List<Conflict> conflicts=new ArrayList<>();
        for(var entry:requested.entrySet()) {
            var s=entry.getValue();
            boolean duplicate=requested.entrySet().stream().anyMatch(e->!e.getKey().equals(entry.getKey())
                && e.getValue().startTime().toLocalDate().equals(s.startTime().toLocalDate()));
            if(!duplicate && free(s,occupied,policy.breakMinutes()))result.add(s);
            else {
                List<PlannedSession> alternatives=new ArrayList<>();
                for(int offset=0;offset<=7 && alternatives.size()<12;offset++) {
                    var date=s.startTime().toLocalDate().plusDays(offset);
                    if(date.isAfter(r.toDate()) || r.excludedDates().contains(date))continue;
                    if(requested.entrySet().stream().anyMatch(e->!e.getKey().equals(entry.getKey())
                            && e.getValue().startTime().toLocalDate().equals(date)))continue;
                    for(var time:policy.starts()) {
                        var start=date.atTime(time);var candidate=new PlannedSession(start,start.plusMinutes(policy.durationMinutes()));
                        if(start.isAfter(now) && free(candidate,occupied,policy.breakMinutes()) && alternatives.size()<12)
                            alternatives.add(candidate);
                    }
                }
                conflicts.add(new Conflict(entry.getKey(),s.startTime(),duplicate
                    ?"Two lessons cannot share the same date.":"Selected slot conflicts with the coach or room.",List.copyOf(alternatives)));
            }
        }
        result.sort(Comparator.comparing(PlannedSession::startTime));
        return new Plan(List.copyOf(result),r.sessions()-result.size(),List.copyOf(skipped),List.copyOf(conflicts),List.copyOf(requested.values()));
    }
    private static boolean free(PlannedSession s,List<SchedulePlanner.BusyPeriod> occupied,int gap) {
        return SchedulePlanner.free(new PlannedSession(s.startTime(),s.endTime().plusMinutes(gap)),occupied,0);
    }
}
