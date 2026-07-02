// 초대 + 인증 OTP API 계약(경로·메서드·바디) 단위 테스트 (CR-027, WMP-AUTH-004/006/007/008).
// fetch 스텁으로 요청 URL/메서드/바디가 BE InvitationController·AuthController 계약과 일치하는지 검증.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { invitationApi } from './api';
import { signupRequestApi } from './signup-api';
import { authApi } from '@/features/auth/api';
import { useAuthStore } from '@/store/auth-store';

interface Captured {
  url: string;
  method: string;
  body: unknown;
}

let captured: Captured[];

function ok<T>(data: T) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ success: true, data, error: null }),
  } as Response;
}

beforeEach(() => {
  captured = [];
  useAuthStore.getState().setSession({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    user: { id: 1, name: 'admin', email: 'a@b.com', role: 'ADMIN' } as any,
    accessToken: 'test-token',
    refreshToken: 'r',
  });
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    captured.push({
      url: String(input),
      method: init?.method ?? 'GET',
      body: init?.body ? JSON.parse(init.body as string) : undefined,
    });
    return ok({});
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
  useAuthStore.getState().clear();
});

const last = () => captured[captured.length - 1];

describe('초대 API 계약 (WMP-AUTH-004)', () => {
  it('초대_POST_/invitations', async () => {
    await invitationApi.invite({ email: 'new@b.com', name: '홍길동', role: 'MEMBER', departmentId: null });
    expect(last().method).toBe('POST');
    expect(last().url).toMatch(/\/invitations$/);
    expect(last().body).toMatchObject({ email: 'new@b.com', name: '홍길동', role: 'MEMBER' });
  });

  it('초대목록_GET_status쿼리', async () => {
    await invitationApi.list('PENDING');
    expect(last().method).toBe('GET');
    expect(last().url).toMatch(/\/invitations\?status=PENDING$/);
  });

  it('재발송_POST_/invitations/{id}/resend', async () => {
    await invitationApi.resend(9);
    expect(last().method).toBe('POST');
    expect(last().url).toMatch(/\/invitations\/9\/resend$/);
  });

  it('취소_DELETE_/invitations/{id}', async () => {
    await invitationApi.revoke(9);
    expect(last().method).toBe('DELETE');
    expect(last().url).toMatch(/\/invitations\/9$/);
  });
});

describe('인증 토큰 API 계약 (WMP-AUTH-006/007/008, 토큰 보정)', () => {
  it('초대미리보기_GET_/auth/invitations/{token}', async () => {
    await authApi.previewInvitation('raw-token-abc');
    expect(last().method).toBe('GET');
    expect(last().url).toMatch(/\/auth\/invitations\/raw-token-abc$/);
  });

  it('초대수락_POST_/auth/invitations/accept (토큰+비번)', async () => {
    await authApi.acceptInvitation({ token: 'raw-token-abc', password: 'pw12345678' });
    expect(last().method).toBe('POST');
    expect(last().url).toMatch(/\/auth\/invitations\/accept$/);
    expect(last().body).toMatchObject({ token: 'raw-token-abc' });
  });

  it('비번분실_POST_/auth/password/forgot', async () => {
    await authApi.forgotPassword({ email: 'a@b.com' });
    expect(last().method).toBe('POST');
    expect(last().url).toMatch(/\/auth\/password\/forgot$/);
  });

  it('비번재설정_POST_/auth/password/reset (토큰+비번)', async () => {
    await authApi.resetPassword({ token: 'raw-token-xyz', password: 'pw12345678' });
    expect(last().url).toMatch(/\/auth\/password\/reset$/);
    expect(last().body).toMatchObject({ token: 'raw-token-xyz' });
  });

  it('변경인증번호발송_POST_/auth/password/change/request-otp', async () => {
    await authApi.requestChangeOtp();
    expect(last().method).toBe('POST');
    expect(last().url).toMatch(/\/auth\/password\/change\/request-otp$/);
  });

  it('비번변경_POST_/auth/password/change', async () => {
    await authApi.changePassword({ currentPassword: 'cur12345', code: '123456', newPassword: 'new12345' });
    expect(last().url).toMatch(/\/auth\/password\/change$/);
    expect(last().body).toMatchObject({ currentPassword: 'cur12345', code: '123456', newPassword: 'new12345' });
  });
});

describe('가입 요청 API 계약 (WMP-AUTH-010, CR-032)', () => {
  it('가입요청_POST_/auth/signup-requests (공개)', async () => {
    await authApi.requestSignup({ email: 'x@y.com', name: '홍길동', reason: '합류' });
    expect(last().method).toBe('POST');
    expect(last().url).toMatch(/\/auth\/signup-requests$/);
    expect(last().body).toMatchObject({ email: 'x@y.com', name: '홍길동' });
  });

  it('신청목록_GET_/signup-requests?status', async () => {
    await signupRequestApi.list('PENDING');
    expect(last().method).toBe('GET');
    expect(last().url).toMatch(/\/signup-requests\?status=PENDING$/);
  });

  it('승인_POST_/signup-requests/{id}/approve (역할+WS, CR-033)', async () => {
    await signupRequestApi.approve(9, 'MANAGER', 3);
    expect(last().method).toBe('POST');
    expect(last().url).toMatch(/\/signup-requests\/9\/approve$/);
    expect(last().body).toMatchObject({ role: 'MANAGER', workspaceId: 3 });
  });

  it('거절_POST_/signup-requests/{id}/reject', async () => {
    await signupRequestApi.reject(9, '권한 없음');
    expect(last().url).toMatch(/\/signup-requests\/9\/reject$/);
    expect(last().body).toMatchObject({ reason: '권한 없음' });
  });
});
