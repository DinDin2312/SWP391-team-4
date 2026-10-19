package com.team4.sportscenter;

import com.team4.sportscenter.modules.manager.services.*;
import com.team4.sportscenter.modules.manager.dtos.request.ManagerRequests.*;
import org.junit.jupiter.api.Test;
import java.time.*;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

class CourseSchedulePlannerTests {
    @Test void coursePreviewAndAvailabilityUseSubjectDuration() {
        var policy=new TeachingSlots.Policy(LocalTime.of(7,0),LocalTime.of(22,0),15,135,List.of(LocalTime.of(7,0),LocalTime.of(9,30)));
        var request=new SchedulePlanRequest(1,monday,monday.plusDays(30),4,135,List.of(1,3),policy.opensAt(),policy.closesAt(),LocalTime.of(7,0),15,List.of(),Map.of(1,LocalTime.of(7,0),3,LocalTime.of(9,30)),Map.of());
        var plan=CourseSchedulePlanner.propose(request,List.of(),now,policy);
        assertEquals(0,plan.missing());assertEquals(monday.atTime(9,15),plan.sessions().get(0).endTime());
        assertEquals(monday.plusDays(2).atTime(11,45),plan.sessions().get(1).endTime());
        assertTrue(CourseSchedulePlanner.availability(request,List.of(),now,policy).stream().allMatch(s->s.conflictDates().isEmpty()));
    }
    LocalDate monday=LocalDate.of(2040,6,1).with(TemporalAdjusters.nextOrSame(DayOfWeek.MONDAY));
    LocalDateTime now=LocalDateTime.of(2039,1,1,0,0);
    TeachingSlots.Policy policy=new TeachingSlots.Policy(LocalTime.of(7,0),LocalTime.of(22,0),15);
    SchedulePlanRequest rules(List<LocalDate> excluded,Map<LocalDate,LocalDateTime> overrides) {
        return new SchedulePlanRequest(1,monday,monday.plusDays(100),4,90,List.of(1,3),policy.opensAt(),policy.closesAt(),LocalTime.of(7,0),15,excluded,Map.of(1,LocalTime.of(7,0),3,LocalTime.of(8,45)),overrides);
    }
    @Test void keepsOneSlotPerWeekdayAndCalculatesTheLastLesson() {
        var p=CourseSchedulePlanner.propose(rules(List.of(),Map.of()),List.of(),now,policy);
        assertEquals(0,p.missing());assertEquals(4,p.sessions().size());
        assertEquals(monday.atTime(7,0),p.sessions().get(0).startTime());
        assertEquals(monday.plusDays(2).atTime(8,45),p.sessions().get(1).startTime());
        assertEquals(monday.plusDays(9).atTime(8,45),p.sessions().get(3).startTime());
    }
    @Test void reportsCollisionWithoutMovingTheLessonOrExtendingTheCourse() {
        var busy=List.of(new SchedulePlanner.BusyPeriod(monday.atTime(7,0),monday.atTime(8,45)));
        var p=CourseSchedulePlanner.propose(rules(List.of(),Map.of()),busy,now,policy);
        assertEquals(1,p.missing());assertEquals(1,p.conflicts().size());
        assertEquals(monday.atTime(7,0),p.requestedSessions().get(0).startTime());
        assertEquals(monday.plusDays(9).atTime(8,45),p.sessions().get(2).startTime());
        var alternative=p.conflicts().get(0).alternatives().get(0);
        var repaired=CourseSchedulePlanner.propose(rules(List.of(),Map.of(monday,alternative.startTime())),busy,now,policy);
        assertEquals(0,repaired.missing());assertTrue(repaired.sessions().contains(alternative));
        assertEquals(p.sessions(),repaired.sessions().stream().filter(s->!s.equals(alternative)).toList());
    }
    @Test void holidaysExtendTheCourseButInvalidOverridesAreRejected() {
        var p=CourseSchedulePlanner.propose(rules(List.of(monday),Map.of()),List.of(),now,policy);
        assertEquals(0,p.missing());assertEquals(monday.plusDays(14).atTime(7,0),p.sessions().get(3).startTime());
        assertThrows(IllegalArgumentException.class,()->CourseSchedulePlanner.propose(rules(List.of(),Map.of(monday,monday.atTime(7,15))),List.of(),now,policy));
        assertThrows(IllegalArgumentException.class,()->CourseSchedulePlanner.propose(rules(List.of(),Map.of(monday.plusDays(1),monday.atTime(8,45))),List.of(),now,policy));
    }
    @Test void duplicateMakeUpDatesCannotProduceACompletePlan() {
        var p=CourseSchedulePlanner.propose(rules(List.of(),Map.of(monday,monday.plusDays(2).atTime(7,0))),List.of(),now,policy);
        assertEquals(2,p.missing());assertEquals(2,p.conflicts().size());
    }
    @Test void availabilityChecksLaterWeeksAndDistinguishesPartialFromFullyOccupied() {
        var busy=List.of(new SchedulePlanner.BusyPeriod(monday.plusDays(7).atTime(7,0),monday.plusDays(7).atTime(8,45)),
            new SchedulePlanner.BusyPeriod(monday.atTime(8,45),monday.atTime(10,30)),
            new SchedulePlanner.BusyPeriod(monday.plusDays(7).atTime(8,45),monday.plusDays(7).atTime(10,30)));
        var slots=CourseSchedulePlanner.availability(rules(List.of(),Map.of()),busy,now,policy);
        var partial=slots.stream().filter(s->s.weekday()==1 && s.time().equals(LocalTime.of(7,0))).findFirst().orElseThrow();
        assertEquals(2,partial.total());assertEquals(List.of(monday.plusDays(7)),partial.conflictDates());
        var full=slots.stream().filter(s->s.weekday()==1 && s.time().equals(LocalTime.of(8,45))).findFirst().orElseThrow();
        assertEquals(full.total(),full.conflictDates().size());
        assertTrue(slots.stream().filter(s->s.weekday()==3).allMatch(s->s.conflictDates().isEmpty()));
    }
    @Test void availabilityRespectsExcludedDaysAndChangeover() {
        var busy=List.of(new SchedulePlanner.BusyPeriod(monday.atTime(8,35),monday.atTime(10,30)));
        var slots=CourseSchedulePlanner.availability(rules(List.of(),Map.of()),busy,now,policy);
        assertEquals(List.of(monday),slots.get(0).conflictDates());
        var holiday=CourseSchedulePlanner.availability(rules(List.of(monday),Map.of()),busy,now,policy);
        assertTrue(holiday.get(0).conflictDates().isEmpty());assertEquals(2,holiday.get(0).total());
    }
}
