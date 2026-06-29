// FE-BE 계약 테스트 (G-4) — 실 BE 계약(T3-2 §A~E)대로 동작하는지.
// MSW 핸들러가 실 BE 계약 대역. BE 기동 후 동일 테스트가 실 BE 회귀로 전환된다.
import { beforeEach, describe, expect, it } from 'vitest';
import { authApi } from '@/features/auth/api';
import { projectApi } from './api';
import { memberApi } from '@/features/members/api';
import { useAuthStore } from '@/store/auth-store';

async function loginAs(email: string, password: string) {
  const res = await authApi.login({ email, password });
  useAuthStore.getState().setSession({
    user: res.user, accessToken: res.accessToken, refreshToken: res.refreshToken,
  });
  return res;
}

describe('인증 계약 (T3-2 §A)', () => {
  beforeEach(() => useAuthStore.getState().clear());

  it('로그인_정상자격_토큰과유저반환', async () => {
    const res = await loginAs('admin@workmap.com', 'admin1234');
    expect(res.accessToken).toBeTruthy();
    expect(res.user.role).toBe('ADMIN');
    expect(res.user).not.toHaveProperty('password');
  });

  it('로그인_잘못된비번_401에러', async () => {
    await expect(authApi.login({ email: 'admin@workmap.com', password: 'wrong' }))
      .rejects.toMatchObject({ status: 401 });
  });
});

describe('프로젝트 목록 계약 (T3-2 §D)', () => {
  beforeEach(async () => {
    useAuthStore.getState().clear();
    await loginAs('admin@workmap.com', 'admin1234');
  });

  it('필터없음_배열반환_보관제외', async () => {
    const list = await projectApi.list({});
    expect(Array.isArray(list)).toBe(true);
    expect(list.every((p) => p.status !== 'ARCHIVED')).toBe(true);
    // BE Response 필드 확인
    expect(list[0]).toHaveProperty('templateId');
    expect(list[0]).toHaveProperty('visibility');
  });

  it('templateId필터_OPS(2)만반환', async () => {
    const list = await projectApi.list({ templateId: 2 });
    expect(list.length).toBeGreaterThan(0);
    expect(list.every((p) => p.templateId === 2)).toBe(true);
  });

  it('BIZ108_비공개프로젝트_비멤버목록제외', async () => {
    // PLN(id3, PRIVATE, createdBy=2). dev(id3)는 멤버 아님 → 목록에서 빠짐.
    await loginAs('dev@workmap.com', 'dev1234');
    const list = await projectApi.list({});
    expect(list.some((p) => p.key === 'PLN')).toBe(false);
  });
});

describe('프로젝트 생성 계약 (T3-2 §D)', () => {
  beforeEach(() => useAuthStore.getState().clear());

  it('Manager_생성성공_201과PLANNING', async () => {
    await loginAs('manager@workmap.com', 'manager1234');
    const p = await projectApi.create({
      name: '신규 테스트', key: 'TST', workspaceId: 1, templateId: 1, visibility: 'PUBLIC',
    });
    expect(p.key).toBe('TST');
    expect(p.templateId).toBe(1);
    expect(p.status).toBe('PLANNING');
  });

  it('중복키_409거부', async () => {
    await loginAs('manager@workmap.com', 'manager1234');
    await expect(projectApi.create({
      name: '중복', key: 'WMS', workspaceId: 1, templateId: 1, visibility: 'PUBLIC',
    })).rejects.toMatchObject({ status: 409 });
  });

  it('잘못된키형식_400거부', async () => {
    await loginAs('manager@workmap.com', 'manager1234');
    await expect(projectApi.create({
      name: '나쁜키', key: 'bad-key', workspaceId: 1, templateId: 1, visibility: 'PUBLIC',
    })).rejects.toMatchObject({ status: 400 });
  });

  it('Member권한_생성403거부', async () => {
    await loginAs('dev@workmap.com', 'dev1234');
    await expect(projectApi.create({
      name: '권한없음', key: 'NOPE', workspaceId: 1, templateId: 1, visibility: 'PUBLIC',
    })).rejects.toMatchObject({ status: 403 });
  });
});

describe('멤버 계약 (T3-2 §E)', () => {
  beforeEach(async () => {
    useAuthStore.getState().clear();
    await loginAs('manager@workmap.com', 'manager1234');
  });

  it('멤버목록_userId와role포함', async () => {
    const members = await memberApi.list(1); // WMS
    expect(members.length).toBeGreaterThan(0);
    expect(members[0]).toHaveProperty('userId');
    expect(members[0]).toHaveProperty('role');
  });

  it('초대후목록증가_중복초대409', async () => {
    const before = await memberApi.list(1);
    await memberApi.invite(1, { userId: 4, role: 'MEMBER' });
    const after = await memberApi.list(1);
    expect(after.length).toBe(before.length + 1);

    await expect(memberApi.invite(1, { userId: 4, role: 'MEMBER' }))
      .rejects.toMatchObject({ status: 409 });
  });

  it('멤버제거_목록감소', async () => {
    const before = await memberApi.list(1);
    await memberApi.remove(1, before[0].userId);
    const after = await memberApi.list(1);
    expect(after.length).toBe(before.length - 1);
  });
});
