package com.team4.sportscenter.modules.notification.services.impl;

import com.team4.sportscenter.modules.member.entities.Booking;
import com.team4.sportscenter.modules.member.entities.UserMembership;
import com.team4.sportscenter.modules.member.repositories.BookingRepository;
import com.team4.sportscenter.modules.member.repositories.UserMembershipRepository;
import com.team4.sportscenter.modules.notification.entities.Notification;
import com.team4.sportscenter.modules.notification.repositories.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SystemNotificationScheduler {

    private final UserMembershipRepository userMembershipRepository;
    private final BookingRepository bookingRepository;
    private final NotificationRepository notificationRepository;

    // Runs every day at 08:00 AM
    @Scheduled(cron = "0 0 8 * * ?")
    public void notifyExpiringMemberships() {
        log.info("Running scheduled task: Checking for expiring memberships...");
        LocalDate threeDaysFromNow = LocalDate.now().plusDays(3);
        
        List<UserMembership> expiringMemberships = userMembershipRepository.findMembershipsExpiringOn(threeDaysFromNow);
        
        for (UserMembership um : expiringMemberships) {
            Notification notification = Notification.builder()
                .user(um.getUser())
                .title("Membership Expiring Soon")
                .message("Your membership package '" + um.getAPackage().getPackageName() + "' will expire in 3 days (" + threeDaysFromNow + "). Please renew it to avoid interruption.")
                .type("SYSTEM")
                .isRead(false)
                .build();
            notificationRepository.save(notification);
            log.info("Sent expiry notification to user: {}", um.getUser().getEmail());
        }
        log.info("Finished expiring memberships check.");
    }

    // Runs every day at 19:00 (7 PM)
    @Scheduled(cron = "0 0 19 * * ?")
    public void notifyUpcomingClasses() {
        log.info("Running scheduled task: Checking for tomorrow's classes...");
        LocalDateTime startOfTomorrow = LocalDate.now().plusDays(1).atStartOfDay();
        LocalDateTime endOfTomorrow = startOfTomorrow.plusDays(1);
        
        List<Booking> tomorrowBookings = bookingRepository.findBookingsByDateRange(startOfTomorrow, endOfTomorrow);
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");

        for (Booking b : tomorrowBookings) {
            String startTime = b.getSchedule().getStartTime().format(timeFormatter);
            String className = b.getSchedule().getGymClass().getClassName();
            
            Notification notification = Notification.builder()
                .user(b.getUser())
                .title("Upcoming Class Reminder")
                .message("Reminder: You have a '" + className + "' class scheduled for tomorrow at " + startTime + ".")
                .type("SYSTEM")
                .isRead(false)
                .build();
            notificationRepository.save(notification);
            log.info("Sent upcoming class reminder to user: {}", b.getUser().getEmail());
        }
        log.info("Finished tomorrow's classes check.");
    }
}

