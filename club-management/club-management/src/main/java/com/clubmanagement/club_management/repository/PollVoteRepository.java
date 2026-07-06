package com.clubmanagement.club_management.repository;

import com.clubmanagement.club_management.entity.PollVote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PollVoteRepository extends JpaRepository<PollVote, Long> {
    List<PollVote> findByPollId(Long pollId);
    List<PollVote> findByPollIdAndUserId(Long pollId, Long userId);
    long countByOptionId(Long optionId);
    void deleteByPollId(Long pollId);
}
