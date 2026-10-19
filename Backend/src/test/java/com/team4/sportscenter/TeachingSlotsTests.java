package com.team4.sportscenter;

import com.team4.sportscenter.modules.manager.services.TeachingSlots;
import org.junit.jupiter.api.Test;
import java.time.*;
import static org.junit.jupiter.api.Assertions.*;

class TeachingSlotsTests {
    @Test void subjectsSupportDifferentDurationsAndExplicitStartTimes() {
        var date=LocalDate.of(2040,6,1);
        var longSlot=new TeachingSlots.Policy(LocalTime.of(7,0),LocalTime.of(22,0),15,135,java.util.List.of(LocalTime.of(7,0),LocalTime.of(10,0)));
        assertEquals(2,longSlot.starts().size());
        assertDoesNotThrow(()->longSlot.validate(date.atTime(7,0),date.atTime(9,15)));
        assertThrows(IllegalArgumentException.class,()->longSlot.validate(date.atTime(7,0),date.atTime(8,30)));
        var shortSlot=new TeachingSlots.Policy(LocalTime.of(7,0),LocalTime.of(22,0),15,60,java.util.List.of());
        assertEquals(LocalTime.of(8,15),shortSlot.starts().get(1));
        assertThrows(IllegalArgumentException.class,()->new TeachingSlots.Policy(LocalTime.of(7,0),LocalTime.of(22,0),15,135,java.util.List.of(LocalTime.of(7,0),LocalTime.of(9,0))));
        assertThrows(IllegalArgumentException.class,()->new TeachingSlots.Policy(LocalTime.of(7,0),LocalTime.of(22,0),15,135,java.util.List.of(LocalTime.of(21,0))));
    }
    @Test void sevenAmOpeningHasEightCompleteSlots() {
        var p=new TeachingSlots.Policy(LocalTime.of(7,0),LocalTime.of(22,0),15);
        assertEquals(8,p.starts().size());
        assertEquals(LocalTime.of(7,0),p.starts().get(0));
        assertEquals(LocalTime.of(8,45),p.starts().get(1));
        assertEquals(LocalTime.of(19,15),p.starts().get(7));
    }
    @Test void slotsIncludeChangeoverAndFitInsideOpeningHours() {
        var p=new TeachingSlots.Policy(LocalTime.of(6,0),LocalTime.of(22,0),15);
        assertEquals(LocalTime.of(7,45),p.starts().get(1));
        assertEquals(9,p.starts().size());
        var date=LocalDate.of(2040,6,1);
        assertDoesNotThrow(()->p.validate(date.atTime(7,45),date.atTime(9,15)));
        assertThrows(IllegalArgumentException.class,()->p.validate(date.atTime(7,30),date.atTime(9,0)));
        assertThrows(IllegalArgumentException.class,()->p.validate(date.atTime(6,0),date.atTime(7,0)));
        assertThrows(IllegalArgumentException.class,()->new TeachingSlots.Policy(LocalTime.NOON,LocalTime.of(13,0),15));
        assertThrows(IllegalArgumentException.class,()->new TeachingSlots.Policy(LocalTime.of(6,0),LocalTime.of(22,0),-1));
    }
}
