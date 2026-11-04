package com.team4.sportscenter.modules.member.services;

import com.team4.sportscenter.modules.coach.dtos.request.SubmitWorkoutRequest;
import com.team4.sportscenter.modules.coach.dtos.response.TraineeAssessmentResponse;
import com.team4.sportscenter.modules.coach.dtos.response.WorkoutSubmissionResponse;
import com.team4.sportscenter.modules.member.dtos.request.CreateSelfAssessmentRequest;
import com.team4.sportscenter.modules.member.dtos.response.*;

import java.util.List;

public interface MemberService {
    MemberMembershipResponse getMyActiveMembership(String email);
    List<UpcomingBookingResponse> getMyUpcomingBookings(String email);
    long getTotalCheckIns(String email);
    List<RecentActivityResponse> getRecentActivities(String email);

    List<CalendarBookingResponse> getAllCalendarBookings(String email);
    List<AvailableClassResponse> getAvailableClasses();
    void bookClass(String email, Integer classId);
    void bookClassUsingPackage(String email, Integer classId, Integer membershipId);
    void cancelClass(String email, Integer classId);
    void addPackageToCart(String email, Integer packageId);
    List<PackageResponse> getAllPackages();
    List<MemberPackageResponse> getMyPackages(String email);

    List<EnrolledClassResponse> getEnrolledClasses(String email);
    List<MemberWorkoutPlanResponse> getWorkoutsByClass(String email, Integer classId);
    List<MemberWorkoutPlanResponse> getMyWorkouts(String email);
    List<TraineeAssessmentResponse> getMyAssessments(String email, Integer classId);
    List<TraineeAssessmentResponse> getAssessmentsByClass(String email, Integer classId);
    TraineeAssessmentResponse createSelfAssessment(String email, CreateSelfAssessmentRequest request);

    WorkoutSubmissionResponse submitWorkout(String email, Integer planId, SubmitWorkoutRequest request);
    List<WorkoutSubmissionResponse> getMySubmissionsByPlan(String email, Integer planId);
}
