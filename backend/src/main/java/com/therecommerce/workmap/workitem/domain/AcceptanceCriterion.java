package com.therecommerce.workmap.workitem.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

/**
 * 인수조건 개별 항목(CR-049, WMP-WI-018, BIZ-115).
 * work_items.acceptance_criteria JSONB에 {@code [{text,checked,checkedBy,checkedAt}]}로 저장.
 * 충족/미충족(checked)은 자동 판정하지 않고 사람(WRITER)이 체크한다.
 * checked=true인 항목만 완료 강제(BIZ-116) 검사에서 "충족"으로 센다.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class AcceptanceCriterion {

    private String text;
    private boolean checked;
    private Long checkedBy;                 // 체크한 사용자 → users.id (미충족이면 null)
    private OffsetDateTime checkedAt;       // 체크 시각 (미충족이면 null)
}
