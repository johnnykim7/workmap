package com.therecommerce.workmap.chat.service;

import com.therecommerce.workmap.chat.domain.ChatReaction;
import com.therecommerce.workmap.chat.dto.ChatDtos.ReactionSummary;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 리액션 raw 행 → 이모지별 요약({emoji,count,userIds}) 변환 유틸 (CR-025).
 * 메시지/답글 공통.
 */
final class ChatReactionSummaryHelper {

    private ChatReactionSummaryHelper() {}

    /** 단일 대상의 raw 리액션 → 이모지별 요약 리스트(첫 등장 순). */
    static List<ReactionSummary> summarize(List<ChatReaction> rows) {
        Map<String, List<Long>> byEmoji = new LinkedHashMap<>();
        for (ChatReaction r : rows) {
            byEmoji.computeIfAbsent(r.getEmoji(), k -> new ArrayList<>()).add(r.getUserId());
        }
        List<ReactionSummary> out = new ArrayList<>();
        byEmoji.forEach((emoji, userIds) -> out.add(new ReactionSummary(emoji, userIds.size(), userIds)));
        return out;
    }

    /**
     * 배치 raw 리액션(여러 대상) → 대상ID별 요약 맵.
     * keyOf 로 각 행에서 대상 ID(message_id 또는 reply_id)를 뽑는다.
     */
    static Map<Long, List<ReactionSummary>> summarizeBatch(List<ChatReaction> rows,
                                                           java.util.function.Function<ChatReaction, Long> keyOf) {
        Map<Long, List<ChatReaction>> grouped = new LinkedHashMap<>();
        for (ChatReaction r : rows) {
            Long key = keyOf.apply(r);
            if (key == null) continue;
            grouped.computeIfAbsent(key, k -> new ArrayList<>()).add(r);
        }
        Map<Long, List<ReactionSummary>> out = new LinkedHashMap<>();
        grouped.forEach((key, list) -> out.put(key, summarize(list)));
        return out;
    }
}
