package com.clubmanagement.club_management.repository;

import com.clubmanagement.club_management.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    
    List<User> findByDepartmentId(Long departmentId);
    
    List<User> findByRole(User.Role role);
    
    List<User> findByIsActiveTrue();
    
    List<User> findTop10ByIsActiveTrueOrderByXpDesc();
}
