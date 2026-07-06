package com.therecommerce.workmap.common.mybatis;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.therecommerce.workmap.workitem.domain.AcceptanceCriterion;
import org.apache.ibatis.type.BaseTypeHandler;
import org.apache.ibatis.type.JdbcType;

import java.sql.CallableStatement;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

/**
 * JSONB ↔ {@code List<AcceptanceCriterion>} TypeHandler (CR-049).
 *
 * <p>StringListJsonTypeHandler가 {@code @MappedTypes(List.class)}로 raw List 키를 이미 점유하므로,
 * 이 핸들러는 {@code @MappedTypes}를 붙이지 않고 매퍼 XML에서 typeHandler로 명시 지정한다(CR-008 규칙).
 * JDBC URL의 stringtype=unspecified 로 String→jsonb 캐스팅이 동작한다.
 */
public class AcceptanceCriterionListJsonTypeHandler extends BaseTypeHandler<List<AcceptanceCriterion>> {

    // checkedAt이 OffsetDateTime이라 JSR-310 모듈 등록 필수(findAndRegisterModules로 클래스패스 모듈 자동 로드).
    // 미등록 시 "Java 8 date/time type not supported"로 직렬화 500(CR-049 운영에서 발견).
    // WRITE_DATES_AS_TIMESTAMPS 비활성 → 숫자 타임스탬프가 아니라 ISO-8601 문자열로 저장(FE 계약 = string).
    private static final ObjectMapper MAPPER = new ObjectMapper()
            .findAndRegisterModules()
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    private static final TypeReference<List<AcceptanceCriterion>> LIST_TYPE = new TypeReference<>() {};

    @Override
    public void setNonNullParameter(PreparedStatement ps, int i, List<AcceptanceCriterion> parameter, JdbcType jdbcType)
            throws SQLException {
        try {
            ps.setString(i, MAPPER.writeValueAsString(parameter));
        } catch (Exception e) {
            throw new SQLException("인수조건 JSONB 직렬화 실패", e);
        }
    }

    @Override
    public List<AcceptanceCriterion> getNullableResult(ResultSet rs, String columnName) throws SQLException {
        return parse(rs.getString(columnName));
    }

    @Override
    public List<AcceptanceCriterion> getNullableResult(ResultSet rs, int columnIndex) throws SQLException {
        return parse(rs.getString(columnIndex));
    }

    @Override
    public List<AcceptanceCriterion> getNullableResult(CallableStatement cs, int columnIndex) throws SQLException {
        return parse(cs.getString(columnIndex));
    }

    private List<AcceptanceCriterion> parse(String json) throws SQLException {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            return MAPPER.readValue(json, LIST_TYPE);
        } catch (Exception e) {
            throw new SQLException("인수조건 JSONB 역직렬화 실패: " + json, e);
        }
    }
}
