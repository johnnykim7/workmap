package com.therecommerce.workmap.user.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import com.therecommerce.workmap.user.domain.User;
import com.therecommerce.workmap.user.dto.CreateUserRequest;
import com.therecommerce.workmap.user.dto.UserResponse;
import com.therecommerce.workmap.user.mapper.UserMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

/**
 * UserService 단위테스트 (T3-5 USR-1~3). Mapper Mock, 실제 BCryptPasswordEncoder.
 */
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    UserMapper userMapper;

    @Spy
    PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @InjectMocks
    UserService userService;

    @Test
    @DisplayName("USR-1: 신규이메일_사용자생성_해시저장(평문 미저장)")
    void 신규이메일_사용자생성_해시저장() {
        CreateUserRequest req = new CreateUserRequest("new@therecommerce.com", "rawPassword123", "홍길동", null, null);
        when(userMapper.existsByEmail(req.email())).thenReturn(false);

        UserResponse res = userService.create(req);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userMapper).insert(captor.capture());
        User saved = captor.getValue();
        // 평문이 저장되지 않고 bcrypt 해시로 저장
        assertThat(saved.getPasswordHash()).isNotEqualTo("rawPassword123");
        assertThat(saved.getPasswordHash()).startsWith("$2");
        assertThat(passwordEncoder.matches("rawPassword123", saved.getPasswordHash())).isTrue();
        assertThat(saved.getRole()).isEqualTo("MEMBER"); // 기본 역할
        assertThat(saved.isActive()).isTrue();
        assertThat(res.email()).isEqualTo("new@therecommerce.com");
    }

    @Test
    @DisplayName("USR-2: 이메일중복_생성_거부")
    void 이메일중복_생성_거부() {
        CreateUserRequest req = new CreateUserRequest("dup@therecommerce.com", "rawPassword123", "중복", null, null);
        when(userMapper.existsByEmail(req.email())).thenReturn(true);

        assertThatThrownBy(() -> userService.create(req))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.EMAIL_DUPLICATED);
        verify(userMapper, never()).insert(any());
    }

    @Test
    @DisplayName("USR-3: 비활성화_isActive false(물리 삭제 아님)")
    void 비활성화_소프트삭제() {
        User existing = User.builder().id(7L).email("a@b.com").isActive(true).build();
        when(userMapper.findById(7L)).thenReturn(existing);

        userService.deactivate(7L);

        verify(userMapper).deactivate(7L);
        verify(userMapper, never()).update(any());
    }
}
