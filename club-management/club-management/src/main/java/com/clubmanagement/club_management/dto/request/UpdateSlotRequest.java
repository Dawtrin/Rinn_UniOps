package com.clubmanagement.club_management.dto.request;

import lombok.Data;

import java.time.LocalTime;

@Data
public class UpdateSlotRequest {
    private String title;
    private Integer dayOfWeek;
    private LocalTime startTime;
    private LocalTime endTime;
    private String location;
    private String type;
    private String color;
    private String notes;
}
