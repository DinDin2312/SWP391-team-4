package com.team4.sportscenter.modules.manager.services;

import com.team4.sportscenter.modules.manager.dtos.request.ManagerRequests.*;
import java.time.*;
import java.util.*;

/** One session per eligible day, with preferred time tried before other 15-minute slots. */
public final class SchedulePlanner {
    private SchedulePlanner() { }
    public record BusyPeriod(LocalDateTime start, LocalDateTime end) { }
    public record SkippedDay(LocalDate date, String reason) { }
    public record Plan(List<PlannedSession> sessions, int missing, List<SkippedDay> skipped) { }

    public static void validateRules(SchedulePlanRequest r, LocalDateTime now) {
        if (r == null || r.classId() == null || r.fromDate() == null || r.toDate() == null
                || r.sessions() == null || r.durationMinutes() == null || r.breakMinutes() == null
                || r.weekdays() == null || r.availableFrom() == null || r.availableTo() == null
                || r.preferredTime() == null || r.excludedDates() == null)
            throw new IllegalArgumentException("Complete the scheduling rules.");
        if (r.fromDate().isBefore(now.toLocalDate()) || r.toDate().isBefore(r.fromDate())
                || r.toDate().isAfter(r.fromDate().plusDays(365)))
            throw new IllegalArgumentException("Choose a future date range of at most 366 days.");
        if (r.sessions()<1 || r.sessions()>52 || r.durationMinutes()<15 || r.durationMinutes()>240
                || r.breakMinutes()<0 || r.breakMinutes()>120 || r.weekdays().isEmpty()
                || r.weekdays().size()>7 || r.weekdays().stream().anyMatch(d->d==null || d<1 || d>7)
                || new HashSet<>(r.weekdays()).size()!=r.weekdays().size()
                || r.excludedDates().size()>366 || r.excludedDates().stream().anyMatch(Objects::isNull))
            throw new IllegalArgumentException("Invalid scheduling rules.");
        if (!r.availableTo().isAfter(r.availableFrom()) || r.availableTo().toSecondOfDay()-r.availableFrom().toSecondOfDay()<r.durationMinutes()*60
                || r.preferredTime().isBefore(r.availableFrom())
                || r.preferredTime().toSecondOfDay()+r.durationMinutes()*60>r.availableTo().toSecondOfDay()
                || r.availableFrom().getSecond()!=0 || r.availableTo().getSecond()!=0 || r.preferredTime().getSecond()!=0)
            throw new IllegalArgumentException("The session must fit inside the confirmed availability window.");
    }

    public static boolean free(PlannedSession s, List<BusyPeriod> busy, int breakMinutes) {
        return busy.stream().noneMatch(b->s.startTime().isBefore(b.end().plusMinutes(breakMinutes))
                && s.endTime().isAfter(b.start().minusMinutes(breakMinutes)));
    }

    public static void validateSession(SchedulePlanRequest r, PlannedSession s, LocalDateTime now) {
        if (s==null || s.startTime()==null || s.endTime()==null || !s.startTime().isAfter(now)
                || s.startTime().getSecond()!=0 || s.startTime().getNano()!=0
                || !s.endTime().equals(s.startTime().plusMinutes(r.durationMinutes()))
                || !s.startTime().toLocalDate().equals(s.endTime().toLocalDate())
                || s.startTime().toLocalDate().isBefore(r.fromDate()) || s.startTime().toLocalDate().isAfter(r.toDate())
                || !r.weekdays().contains(s.startTime().getDayOfWeek().getValue())
                || r.excludedDates().contains(s.startTime().toLocalDate())
                || s.startTime().toLocalTime().isBefore(r.availableFrom()) || s.endTime().toLocalTime().isAfter(r.availableTo()))
            throw new IllegalArgumentException("Each session must respect the date, weekday, duration and availability rules.");
    }

    public static Plan propose(SchedulePlanRequest r, List<BusyPeriod> occupied, LocalDateTime now) {
        validateRules(r,now);
        List<PlannedSession> sessions=new ArrayList<>(); List<SkippedDay> skipped=new ArrayList<>();
        List<BusyPeriod> busy=new ArrayList<>(occupied);
        List<LocalTime> times=new ArrayList<>(); times.add(r.preferredTime());
        int last=r.availableTo().toSecondOfDay()-r.durationMinutes()*60;
        for(int minute=r.availableFrom().toSecondOfDay()/60; minute*60<=last; minute+=15) {
            LocalTime time=LocalTime.ofSecondOfDay(minute*60L); if(!times.contains(time)) times.add(time);
        }
        times.sort(Comparator.comparingInt(time->Math.abs(time.toSecondOfDay()-r.preferredTime().toSecondOfDay())));
        for(LocalDate day=r.fromDate(); !day.isAfter(r.toDate()) && sessions.size()<r.sessions(); day=day.plusDays(1)) {
            if(!r.weekdays().contains(day.getDayOfWeek().getValue())) continue;
            if(r.excludedDates().contains(day)) { skipped.add(new SkippedDay(day,"Excluded date")); continue; }
            boolean found=false;
            for(LocalTime time:times) {
                var s=new PlannedSession(day.atTime(time),day.atTime(time).plusMinutes(r.durationMinutes()));
                if(s.startTime().isAfter(now) && free(s,busy,r.breakMinutes())) {
                    sessions.add(s); busy.add(new BusyPeriod(s.startTime(),s.endTime())); found=true; break;
                }
            }
            if(!found) skipped.add(new SkippedDay(day,"No available slot"));
        }
        return new Plan(List.copyOf(sessions),r.sessions()-sessions.size(),List.copyOf(skipped));
    }
}
