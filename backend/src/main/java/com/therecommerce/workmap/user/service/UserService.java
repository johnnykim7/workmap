package com.therecommerce.workmap.user.service;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.common.paging.PageRequest;
import com.therecommerce.common.paging.PageResponse;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import com.therecommerce.workmap.invitation.domain.Invitation;
import com.therecommerce.workmap.invitation.mapper.InvitationMapper;
import com.therecommerce.workmap.user.domain.User;
import com.therecommerce.workmap.user.dto.CreateUserRequest;
import com.therecommerce.workmap.user.dto.UpdateUserRequest;
import com.therecommerce.workmap.user.dto.UserDetailResponse;
import com.therecommerce.workmap.user.dto.UserResponse;
import com.therecommerce.workmap.user.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 사용자 관리 (WMP-AUTH-004/005). 비밀번호는 bcrypt 해시 저장(평문 미저장, USR-1),
 * 이메일 UNIQUE(USR-2), 비활성화는 소프트 삭제(is_active=false, USR-3).
 */
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserMapper userMapper;
    private final InvitationMapper invitationMapper;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public UserResponse create(CreateUserRequest req) {
        if (userMapper.existsByEmail(req.email())) {
            throw new BusinessException(WmpErrorCode.EMAIL_DUPLICATED);
        }
        User user = User.builder()
                .email(req.email())
                .passwordHash(passwordEncoder.encode(req.password()))
                .name(req.name())
                .role(req.roleOrDefault())
                .departmentId(req.departmentId())
                .isActive(true)
                .build();
        userMapper.insert(user);
        // CR-052: 직접 생성으로 유저가 만들어졌으니, 같은 이메일의 PENDING 초대(유령)를 REVOKED로 정리.
        // 정리하지 않으면 (1) 재초대 시 INVITATION_PENDING_DUPLICATED로 막히고
        // (2) 살아있는 초대 링크로 accept() 재호출 시 EMAIL_DUPLICATED가 난다.
        Invitation pending = invitationMapper.findPendingByEmail(req.email());
        if (pending != null) {
            invitationMapper.updateStatus(pending.getId(), "REVOKED");
        }
        return UserResponse.from(user);
    }

    @Transactional(readOnly = true)
    public PageResponse<UserResponse> search(String keyword, PageRequest page) {
        List<UserResponse> items = userMapper.search(keyword, page).stream()
                .map(UserResponse::from)
                .toList();
        long total = userMapper.countSearch(keyword);
        return PageResponse.of(items, total, page);
    }

    @Transactional(readOnly = true)
    public User getEntity(Long id) {
        User user = userMapper.findById(id);
        if (user == null) {
            throw new BusinessException(WmpErrorCode.USER_NOT_FOUND);
        }
        return user;
    }

    @Transactional(readOnly = true)
    public UserResponse get(Long id) {
        return UserResponse.from(getEntity(id));
    }

    /** 프로필 카드용 단건 상세 (부서명 포함, CR-047). 인증 사용자 누구나 조회. */
    @Transactional(readOnly = true)
    public UserDetailResponse getDetail(Long id) {
        UserDetailResponse detail = userMapper.findDetailById(id);
        if (detail == null) {
            throw new BusinessException(WmpErrorCode.USER_NOT_FOUND);
        }
        return detail;
    }

    /** 본인 프로필 사진 URL 저장 (CR-047). avatarUrl null이면 사진 제거. */
    @Transactional
    public UserResponse updateMyAvatar(Long userId, String avatarUrl) {
        getEntity(userId); // 존재 확인
        userMapper.updateAvatar(userId, avatarUrl);
        return UserResponse.from(getEntity(userId));
    }

    @Transactional
    public UserResponse update(Long id, UpdateUserRequest req) {
        User user = getEntity(id);
        if (req.name() != null) {
            user.setName(req.name());
        }
        if (req.role() != null && !req.role().isBlank()) {
            user.setRole(req.role());
        }
        user.setDepartmentId(req.departmentId() != null ? req.departmentId() : user.getDepartmentId());
        userMapper.update(user);
        return UserResponse.from(user);
    }

    @Transactional
    public void deactivate(Long id) {
        getEntity(id); // 존재 확인
        userMapper.deactivate(id);
    }
}
