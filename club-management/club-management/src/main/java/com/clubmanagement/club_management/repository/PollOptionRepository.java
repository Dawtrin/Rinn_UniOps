package com.clubmanagement.club_management.repository;

import com.clubmanagement.club_management.entity.PollOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PollOptionRepository extends JpaRepository<PollOption, Long> {
    List<PollOption> findByPollId(Long pollId);
}
