package com.therecommerce.workmap.user.mapper;

import com.therecommerce.common.paging.PageRequest;
import com.therecommerce.workmap.user.domain.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * users 테이블 MyBatis 매퍼. SQL은 resources/mapper/UserMapper.xml.
 */
@Mapper
public interface UserMapper {

    void insert(User user);

    User findById(@Param("id") Long id);

    User findByEmail(@Param("email") String email);

    boolean existsByEmail(@Param("email") String email);

    List<User> search(@Param("keyword") String keyword, @Param("page") PageRequest page);

    long countSearch(@Param("keyword") String keyword);

    void update(User user);

    /** 비밀번호 해시 갱신 (CR-027 분실재설정·변경). */
    void updatePassword(@Param("id") Long id, @Param("passwordHash") String passwordHash);

    void deactivate(@Param("id") Long id);
}
