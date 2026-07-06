package com.clubmanagement.club_management.service;

import com.clubmanagement.club_management.dto.request.ManagerEvaluationRequest;
import com.clubmanagement.club_management.dto.request.SelfEvaluationRequest;
import com.clubmanagement.club_management.dto.response.EvaluationResponse;
import com.clubmanagement.club_management.entity.ManagerEvaluation;
import com.clubmanagement.club_management.entity.Notification;
import com.clubmanagement.club_management.entity.SelfEvaluation;
import com.clubmanagement.club_management.entity.User;
import com.clubmanagement.club_management.exception.BadRequestException;
import com.clubmanagement.club_management.exception.ResourceNotFoundException;
import com.clubmanagement.club_management.repository.ManagerEvaluationRepository;
import com.clubmanagement.club_management.repository.SelfEvaluationRepository;
import com.clubmanagement.club_management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EvaluationService {

    private final SelfEvaluationRepository selfEvaluationRepository;
    private final ManagerEvaluationRepository managerEvaluationRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public List<EvaluationResponse> getEvaluationsByUserId(Long userId, String email) {
        User caller = userRepository.findByEmail(email).orElseThrow();
        if (caller.getRole() == User.Role.MANAGER) {
            User target = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Member not found"));
            if (caller.getDepartment() == null || target.getDepartment() == null ||
                !caller.getDepartment().getId().equals(target.getDepartment().getId())) {
                throw new BadRequestException("You can only view evaluations for members in your own department");
            }
        }
        return selfEvaluationRepository.findByUserId(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<EvaluationResponse> getEvaluationsByUserEmail(String email) {
        User user = userRepository.findByEmail(email).orElseThrow();
        return getEvaluationsByUserId(user.getId(), email);
    }

    public List<EvaluationResponse> getPendingEvaluationsForManager(String managerEmail) {
        User manager = userRepository.findByEmail(managerEmail).orElseThrow();
        Long departmentId = (manager.getRole() == User.Role.ADMIN) ? null : (manager.getDepartment() != null ? manager.getDepartment().getId() : null);

        return selfEvaluationRepository.findAll().stream()
                .filter(e -> manager.getRole() == User.Role.ADMIN || e.getStatus() == SelfEvaluation.EvalStatus.SUBMITTED || e.getStatus() == SelfEvaluation.EvalStatus.REVIEWED)
                .filter(e -> departmentId == null || (e.getUser().getDepartment() != null && e.getUser().getDepartment().getId().equals(departmentId)))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public EvaluationResponse submitSelfEvaluation(SelfEvaluationRequest request, String email) {
        User user = userRepository.findByEmail(email).orElseThrow();

        // Check existing SUBMITTED evaluation for same month
        Optional<SelfEvaluation> existing = selfEvaluationRepository.findByUserIdAndEvalMonth(user.getId(), request.getEvalMonth());
        if (existing.isPresent() && existing.get().getStatus() == SelfEvaluation.EvalStatus.SUBMITTED) {
            throw new BadRequestException("You have already submitted an evaluation for month " + request.getEvalMonth());
        }

        // If there is a DRAFT, update and submit it
        if (existing.isPresent() && existing.get().getStatus() == SelfEvaluation.EvalStatus.DRAFT) {
            SelfEvaluation draft = existing.get();
            draft.setContent(request.getContent());
            draft.setAchievements(request.getAchievements());
            draft.setImprovements(request.getImprovements());
            draft.setStatus(SelfEvaluation.EvalStatus.SUBMITTED);
            draft.setSubmittedAt(LocalDateTime.now());
            return mapToResponse(selfEvaluationRepository.save(draft));
        }

        SelfEvaluation evaluation = SelfEvaluation.builder()
                .user(user)
                .evalMonth(request.getEvalMonth())
                .content(request.getContent())
                .achievements(request.getAchievements())
                .improvements(request.getImprovements())
                .status(SelfEvaluation.EvalStatus.SUBMITTED)
                .submittedAt(LocalDateTime.now())
                .build();

        return mapToResponse(selfEvaluationRepository.save(evaluation));
    }

    /** #35 — Lưu nháp tự đánh giá, chưa nộp */
    public EvaluationResponse saveDraftEvaluation(SelfEvaluationRequest request, String email) {
        User user = userRepository.findByEmail(email).orElseThrow();

        Optional<SelfEvaluation> existing = selfEvaluationRepository.findByUserIdAndEvalMonth(user.getId(), request.getEvalMonth());
        if (existing.isPresent() && existing.get().getStatus() == SelfEvaluation.EvalStatus.SUBMITTED) {
            throw new BadRequestException("Cannot draft — evaluation already submitted for month " + request.getEvalMonth());
        }

        SelfEvaluation draft;
        if (existing.isPresent()) {
            draft = existing.get();
            draft.setContent(request.getContent());
            draft.setAchievements(request.getAchievements());
            draft.setImprovements(request.getImprovements());
        } else {
            draft = SelfEvaluation.builder()
                    .user(user)
                    .evalMonth(request.getEvalMonth())
                    .content(request.getContent())
                    .achievements(request.getAchievements())
                    .improvements(request.getImprovements())
                    .status(SelfEvaluation.EvalStatus.DRAFT)
                    .build();
        }
        return mapToResponse(selfEvaluationRepository.save(draft));
    }

    /** #35 — Nộp bản nháp đã lưu */
    public EvaluationResponse submitDraft(Long id, String email) {
        User user = userRepository.findByEmail(email).orElseThrow();
        SelfEvaluation draft = selfEvaluationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Evaluation not found"));
        if (!draft.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("Not your evaluation");
        }
        if (draft.getStatus() != SelfEvaluation.EvalStatus.DRAFT) {
            throw new BadRequestException("Only DRAFT evaluations can be submitted");
        }
        draft.setStatus(SelfEvaluation.EvalStatus.SUBMITTED);
        draft.setSubmittedAt(LocalDateTime.now());
        return mapToResponse(selfEvaluationRepository.save(draft));
    }

    public EvaluationResponse evaluateMember(Long evaluationId, ManagerEvaluationRequest request, String managerEmail) {
        User manager = userRepository.findByEmail(managerEmail).orElseThrow();
        SelfEvaluation selfEval = selfEvaluationRepository.findById(evaluationId)
                .orElseThrow(() -> new ResourceNotFoundException("Evaluation not found"));

        if (selfEval.getStatus() == SelfEvaluation.EvalStatus.REVIEWED) {
            throw new BadRequestException("This evaluation has already been reviewed");
        }

        if (manager.getRole() != User.Role.ADMIN) {
            if (manager.getDepartment() == null || selfEval.getUser().getDepartment() == null ||
                !manager.getDepartment().getId().equals(selfEval.getUser().getDepartment().getId())) {
                throw new BadRequestException("You can only evaluate members in your own department");
            }
        }

        // Calculate Final Score and Grade
        int finalScore = (int) (request.getAttendanceScore() * 0.3 + request.getTaskScore() * 0.5 + request.getAttitudeScore() * 0.2);

        ManagerEvaluation.Grade grade;
        if (finalScore >= 90) grade = ManagerEvaluation.Grade.EXCELLENT;
        else if (finalScore >= 75) grade = ManagerEvaluation.Grade.GOOD;
        else if (finalScore >= 50) grade = ManagerEvaluation.Grade.PASS;
        else grade = ManagerEvaluation.Grade.FAIL;

        ManagerEvaluation managerEval = ManagerEvaluation.builder()
                .selfEvaluation(selfEval)
                .manager(manager)
                .taskScore(request.getTaskScore())
                .attendanceScore(request.getAttendanceScore())
                .attitudeScore(request.getAttitudeScore())
                .finalScore(finalScore)
                .grade(grade)
                .comment(request.getComment())
                .evaluatedAt(LocalDateTime.now())
                .build();

        managerEvaluationRepository.save(managerEval);

        selfEval.setStatus(SelfEvaluation.EvalStatus.REVIEWED);
        selfEval.setManagerEvaluation(managerEval);
        SelfEvaluation updatedEval = selfEvaluationRepository.save(selfEval);

        // Notify member
        Notification notification = Notification.builder()
                .user(selfEval.getUser())
                .type(Notification.NotificationType.EVALUATION_DONE)
                .title("Evaluation Reviewed")
                .message("Your evaluation for month " + selfEval.getEvalMonth() + " has been reviewed. Grade: " + grade.name())
                .referenceId(selfEval.getId())
                .referenceType("EVALUATION")
                .build();
        notificationService.sendToUser(selfEval.getUser().getId(), notification);

        return mapToResponse(updatedEval);
    }

    private EvaluationResponse mapToResponse(SelfEvaluation selfEval) {
        EvaluationResponse.EvaluationResponseBuilder builder = EvaluationResponse.builder()
                .id(selfEval.getId())
                .userId(selfEval.getUser().getId())
                .userName(selfEval.getUser().getFullName())
                .evalMonth(selfEval.getEvalMonth())
                .content(selfEval.getContent())
                .achievements(selfEval.getAchievements())
                .improvements(selfEval.getImprovements())
                .status(selfEval.getStatus().name())
                .submittedAt(selfEval.getSubmittedAt());

        if (selfEval.getUser().getDepartment() != null) {
            builder.departmentId(selfEval.getUser().getDepartment().getId())
                    .departmentName(selfEval.getUser().getDepartment().getName());
        }

        if (selfEval.getManagerEvaluation() != null) {
            ManagerEvaluation me = selfEval.getManagerEvaluation();
            builder.managerId(me.getManager().getId())
                    .managerName(me.getManager().getFullName())
                    .taskScore(me.getTaskScore())
                    .attendanceScore(me.getAttendanceScore())
                    .attitudeScore(me.getAttitudeScore())
                    .finalScore(me.getFinalScore())
                    .grade(me.getGrade().name())
                    .managerComment(me.getComment())
                    .evaluatedAt(me.getEvaluatedAt());
        }

        return builder.build();
    }
}
