package com.therecommerce.workmap.common.mybatis.scalar;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.ibatis.type.BaseTypeHandler;
import org.apache.ibatis.type.JdbcType;

import java.sql.CallableStatement;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

/**
 * JSONB(숫자 배열) ↔ {@code List<Long>} TypeHandler. comments.mentioned_user_ids 에 사용.
 * String 리스트용 {@link com.therecommerce.workmap.common.mybatis.StringListJsonTypeHandler}와 동일 전략
 * (JDBC URL stringtype=unspecified).
 *
 * <p><b>패키지 분리 이유(CR-008)</b>: 본 핸들러는 {@code common.mybatis.scalar}에 두어
 * {@code type-handlers-package: common.mybatis} 자동 스캔에서 제외한다. 자동 스캔되면 raw {@code List}
 * 키로 {@code StringListJsonTypeHandler}(@MappedTypes(List))와 충돌해 active_tabs 등 String 리스트 컬럼을
 * 가로채기 때문이다. 본 핸들러는 매퍼 XML에서 명시 지정으로만 사용한다(CommentMapper.xml).
 */
public class LongListJsonTypeHandler extends BaseTypeHandler<List<Long>> {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final TypeReference<List<Long>> LIST_TYPE = new TypeReference<>() {};

    @Override
    public void setNonNullParameter(PreparedStatement ps, int i, List<Long> parameter, JdbcType jdbcType)
            throws SQLException {
        try {
            ps.setString(i, MAPPER.writeValueAsString(parameter));
        } catch (Exception e) {
            throw new SQLException("JSONB 직렬화 실패", e);
        }
    }

    @Override
    public List<Long> getNullableResult(ResultSet rs, String columnName) throws SQLException {
        return parse(rs.getString(columnName));
    }

    @Override
    public List<Long> getNullableResult(ResultSet rs, int columnIndex) throws SQLException {
        return parse(rs.getString(columnIndex));
    }

    @Override
    public List<Long> getNullableResult(CallableStatement cs, int columnIndex) throws SQLException {
        return parse(cs.getString(columnIndex));
    }

    private List<Long> parse(String json) throws SQLException {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            return MAPPER.readValue(json, LIST_TYPE);
        } catch (Exception e) {
            throw new SQLException("JSONB 역직렬화 실패: " + json, e);
        }
    }
}
