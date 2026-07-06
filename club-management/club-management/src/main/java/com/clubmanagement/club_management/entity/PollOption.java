package com.clubmanagement.club_management.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "poll_options")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PollOption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "poll_id", nullable = false)
    @JsonIgnore
    private Poll poll;

    @Column(name = "option_text", nullable = false, length = 255)
    private String optionText;
}
