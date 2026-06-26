package com.therecommerce.workmap.agile.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.OffsetDateTime;

/**
 * 스프린트(T3-1 sprints). 상태 전이는 SprintService의 FSM 가드 경유(직접 status UPDATE 금지).
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Sprint {
    private Long id;
    private Long projectId;
    private String name;
    private String goal;
    private String status;          // SprintStatus
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer sortOrder;
    private OffsetDateTime startedAt;
    private OffsetDateTime completedAt;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
