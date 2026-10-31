package com.team4.sportscenter.modules.member.health;

import com.team4.sportscenter.modules.auth.entities.User;
import com.team4.sportscenter.modules.auth.repositories.UserRepository;
import com.team4.sportscenter.modules.member.entities.MemberHealthProfile;
import com.team4.sportscenter.modules.member.repositories.MemberHealthProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MemberHealthService {

    private final UserRepository userRepository;
    private final MemberHealthProfileRepository healthProfileRepository;

    public static int ageOn(LocalDate dob, LocalDate today) {
        if (dob == null || today == null) return 0;
        return Period.between(dob, today).getYears();
    }

    @Transactional(readOnly = true)
    public MemberHealthProfileResponse get(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Optional<MemberHealthProfile> profileOpt = healthProfileRepository.findById(user.getUserId());
        LocalDate today = LocalDate.now();
        Integer age = user.getDateOfBirth() != null ? ageOn(user.getDateOfBirth(), today) : null;

        if (profileOpt.isEmpty()) {
            return MemberHealthProfileResponse.builder()
                    .gender(user.getGender())
                    .dateOfBirth(user.getDateOfBirth() != null ? user.getDateOfBirth().toString() : null)
                    .age(age)
                    .parq(null)
                    .conditions(Collections.emptyList())
                    .notes(null)
                    .clearanceRecommended(false)
                    .completed(false)
                    .build();
        }

        MemberHealthProfile profile = profileOpt.get();
        List<Boolean> parqList = parseParqAnswers(profile.getParqAnswers());
        List<String> conditionsList = parseConditions(profile.getConditions());
        boolean clearance = parqList != null && parqList.contains(Boolean.TRUE);
        boolean completed = user.getGender() != null && user.getDateOfBirth() != null && profile.getParqAnswers() != null;

        return MemberHealthProfileResponse.builder()
                .gender(user.getGender())
                .dateOfBirth(user.getDateOfBirth() != null ? user.getDateOfBirth().toString() : null)
                .age(age)
                .parq(parqList)
                .conditions(conditionsList)
                .notes(profile.getNotes())
                .clearanceRecommended(clearance)
                .completed(completed)
                .consentAt(profile.getConsentAt())
                .updatedAt(profile.getUpdatedAt())
                .build();
    }

    @Transactional
    public MemberHealthProfileResponse save(String email, MemberHealthProfileRequest req) {
        if (req == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required");
        }

        // 1. Consent check
        if (!Boolean.TRUE.equals(req.getConsent())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Consent to health data processing is required");
        }

        // 2. Gender validation
        String gender = req.getGender() != null ? req.getGender().trim().toUpperCase() : null;
        if (gender == null || (!gender.equals("MALE") && !gender.equals("FEMALE") && !gender.equals("OTHER"))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Gender must be MALE, FEMALE, or OTHER");
        }

        // 3. Date of birth & Age validation
        if (req.getDateOfBirth() == null || req.getDateOfBirth().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Date of birth is required");
        }
        LocalDate dob;
        try {
            dob = LocalDate.parse(req.getDateOfBirth().trim());
        } catch (DateTimeParseException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid date of birth format. Expected yyyy-MM-dd");
        }

        LocalDate today = LocalDate.now();
        if (dob.isAfter(today)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Date of birth cannot be in the future");
        }
        int age = ageOn(dob, today);
        if (age < 12 || age > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Age must be between 12 and 100 years old");
        }

        // 4. PAR-Q validation (exactly 7 boolean questions)
        List<Boolean> parq = req.getParq();
        if (parq == null || parq.size() != 7 || parq.stream().anyMatch(Objects::isNull)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "PAR-Q questionnaire must contain exactly 7 answers");
        }
        StringBuilder parqBuilder = new StringBuilder();
        boolean clearanceRecommended = false;
        for (Boolean ans : parq) {
            if (Boolean.TRUE.equals(ans)) {
                parqBuilder.append('1');
                clearanceRecommended = true;
            } else {
                parqBuilder.append('0');
            }
        }
        String parqAnswersStr = parqBuilder.toString();

        // 5. Conditions validation
        List<String> conditions = req.getConditions();
        String conditionsStr = null;
        List<String> cleanedConditions = new ArrayList<>();
        if (conditions != null && !conditions.isEmpty()) {
            for (String cond : conditions) {
                if (cond == null || cond.trim().isEmpty()) continue;
                String normalized = cond.trim().toUpperCase();
                if (!HealthCondition.isValid(normalized)) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown health condition: " + cond);
                }
                if (gender.equals("MALE") && normalized.equals("PREGNANCY")) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "PREGNANCY condition is not valid for male users");
                }
                if (!cleanedConditions.contains(normalized)) {
                    cleanedConditions.add(normalized);
                }
            }
            if (!cleanedConditions.isEmpty()) {
                conditionsStr = String.join(",", cleanedConditions);
            }
        }

        // 6. Notes validation
        String notes = req.getNotes() != null ? req.getNotes().trim() : null;
        if (notes != null && notes.isEmpty()) {
            notes = null;
        }
        if (notes != null && notes.length() > 500) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Health notes cannot exceed 500 characters");
        }

        // 7. Persist User gender & dob
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        user.setGender(gender);
        user.setDateOfBirth(dob);
        userRepository.save(user);

        // 8. Persist MemberHealthProfile
        LocalDateTime now = LocalDateTime.now();
        Optional<MemberHealthProfile> existingOpt = healthProfileRepository.findById(user.getUserId());
        LocalDateTime consentAt = existingOpt.map(MemberHealthProfile::getConsentAt).orElse(now);

        MemberHealthProfile profile = MemberHealthProfile.builder()
                .userId(user.getUserId())
                .parqAnswers(parqAnswersStr)
                .conditions(conditionsStr)
                .notes(notes)
                .consentAt(consentAt)
                .updatedAt(now)
                .build();
        healthProfileRepository.save(profile);

        return MemberHealthProfileResponse.builder()
                .gender(gender)
                .dateOfBirth(dob.toString())
                .age(age)
                .parq(parq)
                .conditions(cleanedConditions)
                .notes(notes)
                .clearanceRecommended(clearanceRecommended)
                .completed(true)
                .consentAt(consentAt)
                .updatedAt(now)
                .build();
    }

    @Transactional
    public void withdraw(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        healthProfileRepository.deleteById(user.getUserId());
    }

    @Transactional(readOnly = true)
    public MemberHealthSummary summaryFor(User user) {
        if (user == null || user.getUserId() == null) {
            return MemberHealthSummary.empty();
        }

        LocalDate today = LocalDate.now();
        Integer age = user.getDateOfBirth() != null ? ageOn(user.getDateOfBirth(), today) : null;
        Optional<MemberHealthProfile> profileOpt = healthProfileRepository.findById(user.getUserId());

        if (profileOpt.isEmpty()) {
            return new MemberHealthSummary(
                    user.getGender(),
                    age,
                    Collections.emptyList(),
                    null,
                    false,
                    false
            );
        }

        MemberHealthProfile p = profileOpt.get();
        List<String> conditions = parseConditions(p.getConditions());
        boolean clearance = p.getParqAnswers() != null && p.getParqAnswers().contains("1");
        boolean completed = user.getGender() != null && user.getDateOfBirth() != null && p.getParqAnswers() != null;

        return new MemberHealthSummary(
                user.getGender(),
                age,
                conditions,
                p.getNotes(),
                clearance,
                completed
        );
    }

    private List<Boolean> parseParqAnswers(String parqStr) {
        if (parqStr == null || parqStr.length() != 7) return null;
        List<Boolean> list = new ArrayList<>(7);
        for (int i = 0; i < 7; i++) {
            list.add(parqStr.charAt(i) == '1');
        }
        return list;
    }

    private List<String> parseConditions(String conditionsStr) {
        if (conditionsStr == null || conditionsStr.trim().isEmpty()) {
            return Collections.emptyList();
        }
        return Arrays.stream(conditionsStr.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }
}
