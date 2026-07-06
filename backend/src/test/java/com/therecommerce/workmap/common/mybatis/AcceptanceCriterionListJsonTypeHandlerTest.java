package com.therecommerce.workmap.common.mybatis;

import com.therecommerce.workmap.workitem.domain.AcceptanceCriterion;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

/**
 * 인수조건 JSONB TypeHandler 직렬화 테스트 (CR-049).
 * checkedAt(OffsetDateTime) 직렬화가 실제로 동작하는지 검증 — Mock 서비스 테스트가 못 잡던
 * "Java 8 date/time not supported" 500 회귀 방지(운영에서 발견, findAndRegisterModules로 수정).
 */
class AcceptanceCriterionListJsonTypeHandlerTest {

    private final AcceptanceCriterionListJsonTypeHandler handler = new AcceptanceCriterionListJsonTypeHandler();

    @Test
    @DisplayName("checkedAt(OffsetDateTime) 포함 직렬화 성공 — JSR-310 모듈 등록 확인")
    void 직렬화_시각포함_성공() throws Exception {
        OffsetDateTime now = OffsetDateTime.of(2026, 7, 6, 10, 0, 0, 0, ZoneOffset.UTC);
        List<AcceptanceCriterion> list = List.of(
                AcceptanceCriterion.builder().text("토큰 발급").checked(true).checkedBy(99L).checkedAt(now).build(),
                AcceptanceCriterion.builder().text("만료 갱신").checked(false).build());

        PreparedStatement ps = mock(PreparedStatement.class);
        handler.setNonNullParameter(ps, 1, list, null);   // 여기서 직렬화 — 예외 없어야 함

        ArgumentCaptor<String> json = ArgumentCaptor.forClass(String.class);
        verify(ps).setString(eq(1), json.capture());
        assertThat(json.getValue()).contains("토큰 발급").contains("\"checked\":true").contains("2026-07-06");
    }

    @Test
    @DisplayName("역직렬화 왕복 — text/checked/checkedBy 복원")
    void 역직렬화_왕복() throws Exception {
        String stored = "[{\"text\":\"a\",\"checked\":true,\"checkedBy\":7,\"checkedAt\":\"2026-07-06T10:00:00Z\"}]";
        ResultSet rs = mock(ResultSet.class);
        when(rs.getString("acceptance_criteria")).thenReturn(stored);

        List<AcceptanceCriterion> result = handler.getNullableResult(rs, "acceptance_criteria");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getText()).isEqualTo("a");
        assertThat(result.get(0).isChecked()).isTrue();
        assertThat(result.get(0).getCheckedBy()).isEqualTo(7L);
    }
}
