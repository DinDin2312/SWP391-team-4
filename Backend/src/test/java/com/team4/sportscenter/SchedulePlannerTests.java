package com.team4.sportscenter;

import com.team4.sportscenter.modules.manager.dtos.request.ManagerRequests.*;
import com.team4.sportscenter.modules.manager.services.SchedulePlanner;
import com.team4.sportscenter.modules.manager.services.SchedulePlanner.BusyPeriod;
import org.junit.jupiter.api.Test;
import java.time.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

class SchedulePlannerTests {
    LocalDate first=LocalDate.of(2040,6,1);
    LocalDateTime now=LocalDateTime.of(2039,1,1,0,0);
    SchedulePlanRequest rules(int count, LocalDate until, List<LocalDate> excluded) {
        return new SchedulePlanRequest(1,first,until,count,60,List.of(1,2,3,4,5,6,7),LocalTime.of(9,0),LocalTime.of(12,0),LocalTime.of(10,0),15,excluded);
    }
    @Test void prefersTimeAvoidsConflictsAndKeepsBreak() {
        var plan=SchedulePlanner.propose(rules(2,first.plusDays(5),List.of()),List.of(new BusyPeriod(first.atTime(9,0),first.atTime(10,0))),now);
        assertEquals(first.atTime(10,15),plan.sessions().get(0).startTime());
        assertEquals(first.plusDays(1).atTime(10,0),plan.sessions().get(1).startTime());
        assertEquals(0,plan.missing());
    }
    @Test void skipsHolidaysAndFullDaysReportsShortage() {
        var plan=SchedulePlanner.propose(rules(3,first.plusDays(2),List.of(first.plusDays(1))),List.of(new BusyPeriod(first.atTime(8,0),first.atTime(13,0))),now);
        assertEquals(2,plan.missing()); assertEquals(1,plan.sessions().size()); assertEquals(2,plan.skipped().size());
        assertEquals(first.plusDays(2),plan.sessions().get(0).startTime().toLocalDate());
    }
    @Test void editedSessionsMustRespectRulesAndDuration() {
        var r=rules(1,first.plusDays(1),List.of(first.plusDays(1)));
        assertThrows(IllegalArgumentException.class,()->SchedulePlanner.validateSession(r,new PlannedSession(first.atTime(8,0),first.atTime(9,0)),now));
        assertThrows(IllegalArgumentException.class,()->SchedulePlanner.validateSession(r,new PlannedSession(first.atTime(10,0),first.atTime(10,30)),now));
        assertThrows(IllegalArgumentException.class,()->SchedulePlanner.validateSession(r,new PlannedSession(first.plusDays(1).atTime(10,0),first.plusDays(1).atTime(11,0)),now));
        assertDoesNotThrow(()->SchedulePlanner.validateSession(r,new PlannedSession(first.atTime(10,0),first.atTime(11,0)),now));
    }
    @Test void adjacentAllowedOnlyWithoutRestAndInvalidRangeRejected() {
        var s=new PlannedSession(first.atTime(10,0),first.atTime(11,0));
        var busy=List.of(new BusyPeriod(first.atTime(9,0),first.atTime(10,0)));
        assertTrue(SchedulePlanner.free(s,busy,0)); assertFalse(SchedulePlanner.free(s,busy,15));
        assertThrows(IllegalArgumentException.class,()->SchedulePlanner.propose(rules(1,first.plusDays(366),List.of()),List.of(),now));
    }
}
