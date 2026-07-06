package com.clubmanagement.club_management.service;

import com.clubmanagement.club_management.entity.Poll;
import com.clubmanagement.club_management.entity.PollOption;
import com.clubmanagement.club_management.entity.PollVote;
import com.clubmanagement.club_management.entity.User;
import com.clubmanagement.club_management.repository.PollOptionRepository;
import com.clubmanagement.club_management.repository.PollRepository;
import com.clubmanagement.club_management.repository.PollVoteRepository;
import com.clubmanagement.club_management.repository.UserRepository;
import com.clubmanagement.club_management.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PollService {

    private final PollRepository pollRepository;
    private final PollOptionRepository pollOptionRepository;
    private final PollVoteRepository pollVoteRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final AuditLogService auditLogService;

    public List<Poll> getAllPolls(String username) {
        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Poll> polls = pollRepository.findAllByOrderByCreatedAtDesc();
        LocalDateTime now = LocalDateTime.now();

        return polls.stream()
                .filter(poll -> {
                    if (!poll.getIsClosed() && poll.getExpiresAt() != null && poll.getExpiresAt().isBefore(now)) {
                        poll.setIsClosed(true);
                        pollRepository.save(poll);
                    }

                    if (user.getRole() == User.Role.ADMIN) {
                        return true;
                    }

                    return poll.getDepartment() == null ||
                           (user.getDepartment() != null && poll.getDepartment().getId().equals(user.getDepartment().getId()));
                })
                .collect(Collectors.toList());
    }

    public Poll getPollById(Long id) {
        return pollRepository.findById(id).orElseThrow(() -> new RuntimeException("Poll not found"));
    }

    @Transactional
    public Poll createPoll(String title, String description, List<String> optionTexts, Boolean allowMultiple, LocalDateTime expiresAt, String username, Long departmentId) {
        User creator = userRepository.findByEmail(username)
                .orElseThrow(() -> new RuntimeException("Creator user not found"));

        com.clubmanagement.club_management.entity.Department department = null;
        if (departmentId != null) {
            department = departmentRepository.findById(departmentId)
                    .orElseThrow(() -> new RuntimeException("Department not found"));
        }

        Poll poll = Poll.builder()
                .title(title)
                .description(description)
                .allowMultiple(allowMultiple != null ? allowMultiple : false)
                .expiresAt(expiresAt)
                .createdBy(creator)
                .department(department)
                .isClosed(false)
                .build();

        Poll savedPoll = pollRepository.save(poll);

        List<PollOption> options = optionTexts.stream()
                .map(text -> PollOption.builder().poll(savedPoll).optionText(text).build())
                .collect(Collectors.toList());

        pollOptionRepository.saveAll(options);
        savedPoll.setOptions(options);

        auditLogService.log("CREATE_POLL", "Poll", savedPoll.getId(), username, "Tạo cuộc biểu quyết mới: " + title);
        return savedPoll;
    }

    @Transactional
    public void vote(Long pollId, List<Long> optionIds, String username) {
        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Poll poll = getPollById(pollId);

        if (poll.getIsClosed() || (poll.getExpiresAt() != null && poll.getExpiresAt().isBefore(LocalDateTime.now()))) {
            throw new RuntimeException("Cuộc biểu quyết này đã kết thúc hoặc hết hạn!");
        }

        if (optionIds == null || optionIds.isEmpty()) {
            throw new RuntimeException("Vui lòng chọn ít nhất một phương án bình chọn!");
        }

        if (!poll.getAllowMultiple() && optionIds.size() > 1) {
            throw new RuntimeException("Cuộc biểu quyết này chỉ cho phép chọn duy nhất 1 phương án!");
        }

        // Lọc trùng các optionId được gửi lên
        List<Long> uniqueOptionIds = optionIds.stream().distinct().collect(Collectors.toList());

        // Xóa tất cả các lượt vote cũ của user này trong cuộc biểu quyết này để cho phép vote lại
        List<PollVote> oldVotes = pollVoteRepository.findByPollIdAndUserId(pollId, user.getId());
        if (!oldVotes.isEmpty()) {
            pollVoteRepository.deleteAll(oldVotes);
            pollVoteRepository.flush(); // Đồng bộ lệnh xóa xuống DB lập tức để tránh lỗi trùng khóa của Hibernate ActionQueue
        }

        // Lưu lượt vote mới
        for (Long optionId : uniqueOptionIds) {
            PollOption option = pollOptionRepository.findById(optionId)
                    .orElseThrow(() -> new RuntimeException("Option not found with id: " + optionId));
            if (!option.getPoll().getId().equals(pollId)) {
                throw new RuntimeException("Phương án không thuộc cuộc biểu quyết này!");
            }

            PollVote vote = PollVote.builder()
                    .poll(poll)
                    .option(option)
                    .user(user)
                    .build();
            pollVoteRepository.save(vote);
        }

        auditLogService.log("CAST_VOTE", "Poll", pollId, username, "Thực hiện bình chọn trong cuộc biểu quyết: " + poll.getTitle());
    }

    @Transactional
    public Poll closePoll(Long id, String username) {
        Poll poll = getPollById(id);
        poll.setIsClosed(true);
        Poll saved = pollRepository.save(poll);
        auditLogService.log("CLOSE_POLL", "Poll", id, username, "Đóng cuộc biểu quyết sớm: " + poll.getTitle());
        return saved;
    }

    @Transactional
    public void deletePoll(Long id, String username) {
        Poll poll = getPollById(id);
        pollVoteRepository.deleteByPollId(id);
        pollRepository.delete(poll);
        auditLogService.log("DELETE_POLL", "Poll", id, username, "Xóa cuộc biểu quyết: " + poll.getTitle());
    }

    // --- Helper to aggregate results ---
    public List<com.clubmanagement.club_management.dto.response.PollResultResponse> getPollResults(Long pollId) {
        Poll poll = getPollById(pollId);
        List<PollOption> options = poll.getOptions();
        
        return options.stream().map(opt -> {
            long count = pollVoteRepository.countByOptionId(opt.getId());
            return new com.clubmanagement.club_management.dto.response.PollResultResponse(opt.getId(), opt.getOptionText(), count);
        }).collect(Collectors.toList());
    }

    public List<Long> getMyVotes(Long pollId, String username) {
        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return pollVoteRepository.findByPollIdAndUserId(pollId, user.getId()).stream()
                .map(vote -> vote.getOption().getId())
                .collect(Collectors.toList());
    }

    @Transactional
    public void retractVote(Long pollId, String username) {
        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Poll poll = getPollById(pollId);

        if (poll.getIsClosed() || (poll.getExpiresAt() != null && poll.getExpiresAt().isBefore(LocalDateTime.now()))) {
            throw new RuntimeException("Cuộc biểu quyết này đã kết thúc hoặc hết hạn!");
        }

        List<PollVote> oldVotes = pollVoteRepository.findByPollIdAndUserId(pollId, user.getId());
        if (!oldVotes.isEmpty()) {
            pollVoteRepository.deleteAll(oldVotes);
            pollVoteRepository.flush();
        } else {
            throw new RuntimeException("Bạn chưa thực hiện bình chọn cho cuộc biểu quyết này!");
        }

        auditLogService.log("RETRACT_VOTE", "Poll", pollId, username, "Hủy bình chọn trong cuộc biểu quyết: " + poll.getTitle());
    }
}
