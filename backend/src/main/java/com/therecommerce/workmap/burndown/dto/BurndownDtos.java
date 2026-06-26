package com.therecommerce.workmap.burndown.dto;

import com.therecommerce.workmap.burndown.domain.BurndownSnapshot;

import java.time.LocalDate;
import java.util.List;

/**
 * 번다운/번업·벨로시티 응답 DTO(WMP-AGL-006, CR-012). 조회 전용(적재 DTO 없음 — 이벤트/배치가 적재).
 */
public final class BurndownDtos {

    private BurndownDtos() {}

    /** 일자별 한 점(잔여=번다운 라인, 누적완료=번업 라인). */
    public record Point(
            LocalDate date,
            int remainingPoints,
            int completedPoints,
            int totalPoints,
            String snapshotType
    ) {
        public static Point from(BurndownSnapshot s) {
            return new Point(s.getSnapshotDate(),
                    nz(s.getRemainingPoints()), nz(s.getCompletedPoints()), nz(s.getTotalPoints()),
                    s.getSnapshotType());
        }
    }

    /** 스프린트 번다운 응답: 기준선(total) + 일자별 추이. */
    public record BurndownResponse(
            Long sprintId,
            int totalPoints,
            List<Point> points
    ) {}

    /** 벨로시티 한 스프린트(완료 시점 COMPLETE 스냅샷 기준). */
    public record VelocityItem(
            Long sprintId,
            LocalDate completedDate,
            int completedPoints
    ) {
        public static VelocityItem from(BurndownSnapshot s) {
            return new VelocityItem(s.getSprintId(), s.getSnapshotDate(), nz(s.getCompletedPoints()));
        }
    }

    /** 프로젝트 벨로시티 응답: 완료 스프린트별 완료포인트 + 평균. */
    public record VelocityResponse(
            Long projectId,
            List<VelocityItem> sprints,
            double averageVelocity
    ) {}

    private static int nz(Integer v) {
        return v == null ? 0 : v;
    }
}
