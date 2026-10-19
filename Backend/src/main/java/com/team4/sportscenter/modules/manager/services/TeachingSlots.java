package com.team4.sportscenter.modules.manager.services;

import java.time.*;
import java.util.*;

/** Subject-specific teaching slots constrained by centre operating hours. */
public final class TeachingSlots {
    private TeachingSlots() { }
    public record Policy(LocalTime opensAt, LocalTime closesAt, Integer breakMinutes, Integer durationMinutes, List<LocalTime> configuredStarts) {
        public Policy(LocalTime opensAt,LocalTime closesAt,Integer breakMinutes) {this(opensAt,closesAt,breakMinutes,90,List.of());}
        public Policy {
            durationMinutes=durationMinutes==null?90:durationMinutes;
            configuredStarts=configuredStarts==null?List.of():List.copyOf(configuredStarts);
            if (durationMinutes<15 || durationMinutes>240 || opensAt == null || closesAt == null || breakMinutes == null
                    || breakMinutes < 0 || breakMinutes > 120
                    || opensAt.getSecond() != 0 || closesAt.getSecond() != 0
                    || opensAt.getNano() != 0 || closesAt.getNano() != 0
                    || closesAt.toSecondOfDay() - opensAt.toSecondOfDay() < (durationMinutes + breakMinutes) * 60)
                throw new IllegalArgumentException("Invalid operating hours or changeover time.");
            var sorted=configuredStarts.stream().sorted().toList();
            for(int i=0;i<sorted.size();i++) {
                var time=sorted.get(i);
                if(time.getSecond()!=0 || time.getNano()!=0 || time.isBefore(opensAt)
                    || time.toSecondOfDay()/60+durationMinutes+breakMinutes>closesAt.toSecondOfDay()/60
                    || (i>0 && time.toSecondOfDay()-sorted.get(i-1).toSecondOfDay()<(durationMinutes+breakMinutes)*60))
                    throw new IllegalArgumentException("Subject slots must fit operating hours and cannot overlap, including changeover.");
            }
            configuredStarts=sorted;
        }
        public List<LocalTime> starts() {
            if(!configuredStarts.isEmpty())return configuredStarts;
            List<LocalTime> result = new ArrayList<>();
            for (int m = opensAt.toSecondOfDay()/60;
                    m + durationMinutes + breakMinutes <= closesAt.toSecondOfDay()/60;
                    m += durationMinutes + breakMinutes) result.add(LocalTime.of(m/60, m%60));
            return List.copyOf(result);
        }
        public void validate(LocalDateTime start, LocalDateTime end) {
            if (start == null || end == null || !end.equals(start.plusMinutes(durationMinutes))
                    || !starts().contains(start.toLocalTime()))
                throw new IllegalArgumentException("Choose a configured teaching slot for this subject.");
        }
    }
}
