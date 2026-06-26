package com.therecommerce.workmap.workitem.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.Map;

/**
 * work_item_links 도메인(T3-1, WMP-WI-013, BIZ-109). 이슈 링크는 양방향으로 자동 생성한다 —
 * source→target(BLOCKS)면 역방향(target→source, BLOCKED_BY)도 저장. 자기참조 금지.
 *
 * <p>링크 유형(BIZ-109): blocks/blocked by/relates to/duplicates. 역방향 짝은 INVERSE 매핑 참조.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkItemLink {

    /** 링크 유형 코드. */
    public static final String BLOCKS = "BLOCKS";
    public static final String BLOCKED_BY = "BLOCKED_BY";
    public static final String RELATES_TO = "RELATES_TO";
    public static final String DUPLICATES = "DUPLICATES";
    public static final String DUPLICATED_BY = "DUPLICATED_BY";

    /**
     * 정방향 유형 → 역방향(짝) 유형. 양방향 자동 생성 시 역방향 행에 사용한다(BIZ-109).
     * RELATES_TO는 대칭이라 자기 자신이 짝.
     */
    public static final Map<String, String> INVERSE = Map.of(
            BLOCKS, BLOCKED_BY,
            BLOCKED_BY, BLOCKS,
            RELATES_TO, RELATES_TO,
            DUPLICATES, DUPLICATED_BY,
            DUPLICATED_BY, DUPLICATES);

    /** 사용자가 직접 지정 가능한 입력 유형(역방향 자동 생성은 INVERSE로 파생). */
    public static boolean isCreatable(String type) {
        return BLOCKS.equals(type) || BLOCKED_BY.equals(type)
                || RELATES_TO.equals(type) || DUPLICATES.equals(type);
    }

    private Long id;
    private Long sourceId;
    private Long targetId;
    private String linkType;
    private OffsetDateTime createdAt;
}
