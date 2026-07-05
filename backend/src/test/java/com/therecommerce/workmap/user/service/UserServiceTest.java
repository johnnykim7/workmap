package com.therecommerce.workmap.user.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import com.therecommerce.workmap.user.domain.User;
import com.therecommerce.workmap.user.dto.CreateUserRequest;
import com.therecommerce.workmap.user.dto.UserDetailResponse;
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

    @Test
    @DisplayName("USR-4: 프로필상세_존재_부서명포함반환(CR-047)")
    void 프로필상세_존재_반환() {
        UserDetailResponse detail = new UserDetailResponse(
                5L, "u@b.com", "이몽룡", "MEMBER", 3L, "물류팀",
                "/files/serve/x.png", true, null);
        when(userMapper.findDetailById(5L)).thenReturn(detail);

        UserDetailResponse res = userService.getDetail(5L);

        assertThat(res.id()).isEqualTo(5L);
        assertThat(res.departmentName()).isEqualTo("물류팀");
        assertThat(res.avatarUrl()).isEqualTo("/files/serve/x.png");
    }

    @Test
    @DisplayName("USR-5: 프로필상세_없는id_USER_NOT_FOUND(CR-047)")
    void 프로필상세_없는id_거부() {
        when(userMapper.findDetailById(999L)).thenReturn(null);

        assertThatThrownBy(() -> userService.getDetail(999L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(WmpErrorCode.USER_NOT_FOUND);
    }

    @Test
    @DisplayName("USR-6: 본인아바타저장_URL갱신(CR-047)")
    void 본인아바타_저장() {
        User existing = User.builder().id(2L).email("me@b.com").isActive(true).build();
        User updated = User.builder().id(2L).email("me@b.com").isActive(true)
                .avatarUrl("/files/serve/new.png").build();
        when(userMapper.findById(2L)).thenReturn(existing, updated);

        UserResponse res = userService.updateMyAvatar(2L, "/files/serve/new.png");

        verify(userMapper).updateAvatar(2L, "/files/serve/new.png");
        assertThat(res.avatarUrl()).isEqualTo("/files/serve/new.png");
    }

    @Test
    @DisplayName("USR-7: 아바타제거_null저장(CR-047)")
    void 아바타_제거() {
        User existing = User.builder().id(2L).email("me@b.com").isActive(true)
                .avatarUrl("/files/serve/old.png").build();
        User cleared = User.builder().id(2L).email("me@b.com").isActive(true).build();
        when(userMapper.findById(2L)).thenReturn(existing, cleared);

        UserResponse res = userService.updateMyAvatar(2L, null);

        verify(userMapper).updateAvatar(2L, null);
        assertThat(res.avatarUrl()).isNull();
    }
}
