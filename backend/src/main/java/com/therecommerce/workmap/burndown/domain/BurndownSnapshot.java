package com.therecommerce.workmap.burndown.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.OffsetDateTime;

/**
 * 번다운/번업 스냅샷(WMP-AGL-006, CR-012). 스프린트 기간 내 각 일자의 잔여/누적완료 포인트.
 *
 * <p>적재 출처(snapshotType): START(시작 기준선) / DAILY(일별 배치) / COMPLETE(완료 시점).
 * UNIQUE(sprint_id, snapshot_date)로 같은 일자 재적재는 UPSERT(멱등) — {@code BurndownMapper.upsert}.
 * MyBatis setter 매핑을 위해 @NoArgsConstructor + setter 보유(CR-008 규칙).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BurndownSnapshot {

    private Long id;
    private Long sprintId;
    private LocalDate snapshotDate;
    private Integer remainingPoints;
    private Integer completedPoints;
    private Integer totalPoints;
    private String snapshotType;   // START / DAILY / COMPLETE
    private OffsetDateTime createdAt;
}
