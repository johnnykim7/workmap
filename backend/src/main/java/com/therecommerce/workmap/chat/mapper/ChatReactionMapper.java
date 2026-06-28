package com.therecommerce.workmap.chat.mapper;

import com.therecommerce.workmap.chat.domain.ChatReaction;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ChatReactionMapper {

    void insert(ChatReaction reaction);

    ChatReaction findByMessageUserEmoji(@Param("messageId") Long messageId,
                                        @Param("userId") Long userId,
                                        @Param("emoji") String emoji);

    ChatReaction findByReplyUserEmoji(@Param("replyId") Long replyId,
                                      @Param("userId") Long userId,
                                      @Param("emoji") String emoji);

    int deleteById(@Param("id") Long id);

    /** 메시지 리액션 raw 행(message_id, emoji, user_id). */
    List<ChatReaction> findByMessageId(@Param("messageId") Long messageId);

    /** 답글 리액션 raw 행. */
    List<ChatReaction> findByReplyId(@Param("replyId") Long replyId);

    /** 메시지 ID 배치 조회(목록 화면 리액션 요약 N+1 방지). */
    List<ChatReaction> findByMessageIds(@Param("messageIds") List<Long> messageIds);

    /** 답글 ID 배치 조회. */
    List<ChatReaction> findByReplyIds(@Param("replyIds") List<Long> replyIds);
}
