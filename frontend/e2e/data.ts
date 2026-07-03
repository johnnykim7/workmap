// 카페24 연동 프로젝트 등록 트리 (scratchpad/cafe24-work-tree.md 기반).
// 담당: dev1/dev2=BE, dev3=FE·비개발, pm=관리. 근거=bp-channel 네이버 대비 카페24 갭 + 카페24 개발자센터 API 규격.

export type IssueType = 'EPIC' | 'STORY' | 'TASK' | 'SUBTASK' | 'BUG' | 'DOC';
export type Assignee = '개발자1' | '개발자2' | '개발자3' | 'PM' | null;

export interface Node {
  type: IssueType;
  title: string;
  assignee?: Assignee;
  priority?: 'HIGHEST' | 'HIGH' | 'MEDIUM' | 'LOW' | 'LOWEST';
  labels?: string[];
  epic?: string;      // 부모 EPIC의 title(연결용)
  parent?: string;    // SUBTASK 부모 업무 title(상세 화면에서 하위작업으로 추가)
  attach?: boolean;   // 첨부파일 케이스
  desc?: boolean;     // 리치에디터 설명 케이스
}

// EPIC 14개 (E1~E14)
export const EPICS: Node[] = [
  { type: 'EPIC', title: 'E1. OAuth 인증·토큰 연동', assignee: '개발자2', priority: 'HIGH', labels: ['cafe24', 'be', 'auth'], desc: true },
  { type: 'EPIC', title: 'E2. 주문(Order) 연동', assignee: '개발자1', priority: 'HIGH', labels: ['cafe24', 'be', 'order'], desc: true },
  { type: 'EPIC', title: 'E3. 상품(Product) 연동', assignee: '개발자1', priority: 'HIGH', labels: ['cafe24', 'be', 'product'] },
  { type: 'EPIC', title: 'E4. 클레임(취소·교환·반품) 연동', assignee: '개발자1', priority: 'MEDIUM', labels: ['cafe24', 'be', 'claim'] },
  { type: 'EPIC', title: 'E5. 카테고리 매핑', assignee: '개발자2', priority: 'MEDIUM', labels: ['cafe24', 'be', 'category'] },
  { type: 'EPIC', title: 'E6. 웹훅·Rate Limit·공통 인프라', assignee: '개발자2', priority: 'HIGH', labels: ['cafe24', 'be', 'infra'] },
  { type: 'EPIC', title: 'E7. 셀러 앱 UI·연동 화면', assignee: '개발자3', priority: 'HIGH', labels: ['cafe24', 'fe'] },
  { type: 'EPIC', title: 'E8. QA·통합테스트·배포', assignee: 'PM', priority: 'MEDIUM', labels: ['cafe24', 'qa'] },
  { type: 'EPIC', title: 'E9. 디자인 (아이콘·스크린샷·UI 시안)', assignee: '개발자3', priority: 'MEDIUM', labels: ['design'] },
  { type: 'EPIC', title: 'E10. 법무·컴플라이언스', assignee: '개발자3', priority: 'HIGH', labels: ['legal'] },
  { type: 'EPIC', title: 'E11. 앱스토어 등록·심사 대응', assignee: '개발자3', priority: 'HIGH', labels: ['appstore'] },
  { type: 'EPIC', title: 'E12. 요금제·정산 설정', assignee: 'PM', priority: 'MEDIUM', labels: ['billing'] },
  { type: 'EPIC', title: 'E13. 마케팅·GTM·셀러 온보딩', assignee: '개발자3', priority: 'LOW', labels: ['marketing'] },
  { type: 'EPIC', title: 'E14. CS·운영·모니터링', assignee: '개발자3', priority: 'MEDIUM', labels: ['cs', 'ops'] },
];

// STORY / TASK / SUBTASK / BUG / DOC (epic = 부모 EPIC title)
const E1 = 'E1. OAuth 인증·토큰 연동';
const E2 = 'E2. 주문(Order) 연동';
const E3 = 'E3. 상품(Product) 연동';
const E4 = 'E4. 클레임(취소·교환·반품) 연동';
const E5 = 'E5. 카테고리 매핑';
const E6 = 'E6. 웹훅·Rate Limit·공통 인프라';
const E7 = 'E7. 셀러 앱 UI·연동 화면';
const E8 = 'E8. QA·통합테스트·배포';
const E9 = 'E9. 디자인 (아이콘·스크린샷·UI 시안)';
const E10 = 'E10. 법무·컴플라이언스';
const E11 = 'E11. 앱스토어 등록·심사 대응';
const E12 = 'E12. 요금제·정산 설정';
const E13 = 'E13. 마케팅·GTM·셀러 온보딩';
const E14 = 'E14. CS·운영·모니터링';

export const CHILDREN: Node[] = [
  // E1 OAuth
  { type: 'STORY', title: 'OAuth 앱 등록 및 인증 플로우 설계', epic: E1, assignee: '개발자2', labels: ['auth'] },
  { type: 'TASK', title: '카페24 개발자센터 앱 생성·redirect_uri 등록', epic: E1, assignee: '개발자2', labels: ['auth'] },
  { type: 'TASK', title: 'authorize→token 교환 클라이언트 구현 (Cafe24TokenClient)', epic: E1, assignee: '개발자2', priority: 'HIGH', labels: ['auth', 'be'] },
  { type: 'SUBTASK', title: '토큰 교환 단위테스트 작성', epic: E1, parent: 'authorize→token 교환 클라이언트 구현 (Cafe24TokenClient)', assignee: '개발자2', labels: ['test'] },
  { type: 'STORY', title: '토큰 저장·갱신 스케줄러', epic: E1, assignee: '개발자2', labels: ['auth'] },
  { type: 'TASK', title: 'access(2h)/refresh(2주) 저장 스키마 + 암호화', epic: E1, assignee: '개발자1', labels: ['auth', 'be'] },
  { type: 'TASK', title: 'refresh 만료 전 갱신 스케줄러(cron) 구현', epic: E1, assignee: '개발자2', labels: ['auth', 'be'] },
  { type: 'BUG', title: '토큰 갱신 3회 실패 시 CHANNEL_LINK_FAILED 이벤트 미발행', epic: E1, assignee: '개발자2', priority: 'HIGH', labels: ['bug', 'auth'] },
  { type: 'TASK', title: '[문서] 카페24 OAuth 연동 규격서', epic: E1, assignee: '개발자2', labels: ['doc'], attach: true },

  // E2 주문
  { type: 'STORY', title: '주문 조회·정규화 (Pull)', epic: E2, assignee: '개발자1', labels: ['order'] },
  { type: 'TASK', title: 'GET /admin/orders 목록·상세 클라이언트', epic: E2, assignee: '개발자1', labels: ['order', 'be'] },
  { type: 'TASK', title: 'NormalizedOrder 매핑 (Cafe24OrderAdapter 실구현)', epic: E2, assignee: '개발자1', priority: 'HIGH', labels: ['order', 'be'] },
  { type: 'SUBTASK', title: '결제수단·배송지 필드 매핑 검증', epic: E2, parent: 'NormalizedOrder 매핑 (Cafe24OrderAdapter 실구현)', assignee: '개발자1', labels: ['test'] },
  { type: 'TASK', title: '변경분 수집→channel.order.collected 이벤트 발행', epic: E2, assignee: '개발자1', labels: ['order', 'event'] },
  { type: 'STORY', title: '배송처리 (Push)', epic: E2, assignee: '개발자1', labels: ['order'] },
  { type: 'TASK', title: 'shipments POST(송장 등록) 프록시', epic: E2, assignee: '개발자1', labels: ['order', 'be'] },
  { type: 'TASK', title: '주문 상태변경 PUT 프록시', epic: E2, assignee: '개발자1', labels: ['order', 'be'] },

  // E3 상품
  { type: 'STORY', title: '상품 등록·수정', epic: E3, assignee: '개발자1', labels: ['product'] },
  { type: 'TASK', title: 'products POST/PUT 클라이언트', epic: E3, assignee: '개발자1', labels: ['product', 'be'] },
  { type: 'TASK', title: '옵션·품목(variants) 매핑', epic: E3, assignee: '개발자1', labels: ['product', 'be'] },
  { type: 'TASK', title: '상품 이미지 업로드 연동', epic: E3, assignee: '개발자3', labels: ['product'] },
  { type: 'STORY', title: '재고 동기화', epic: E3, assignee: '개발자1', labels: ['product'] },
  { type: 'TASK', title: 'variants 재고 PUT 연동', epic: E3, assignee: '개발자1', labels: ['product', 'be'] },
  { type: 'BUG', title: '재고 0 상품 동기화 시 품절 처리 누락', epic: E3, assignee: '개발자1', labels: ['bug', 'product'] },

  // E4 클레임
  { type: 'STORY', title: '클레임 수집·정규화', epic: E4, assignee: '개발자1', labels: ['claim'] },
  { type: 'TASK', title: 'cancellation/exchange/return 조회 클라이언트', epic: E4, assignee: '개발자1', labels: ['claim', 'be'] },
  { type: 'TASK', title: '정규화 + channel.claim.collected 이벤트', epic: E4, assignee: '개발자1', labels: ['claim', 'event'] },

  // E5 카테고리
  { type: 'STORY', title: '카테고리 조회·내부 매핑', epic: E5, assignee: '개발자2', labels: ['category'] },
  { type: 'TASK', title: 'GET /admin/categories 조회', epic: E5, assignee: '개발자2', labels: ['category', 'be'] },
  { type: 'TASK', title: '내부 카테고리↔카페24 매핑 어댑터', epic: E5, assignee: '개발자2', labels: ['category', 'be'] },

  // E6 웹훅·RateLimit
  { type: 'STORY', title: '웹훅 수신', epic: E6, assignee: '개발자2', labels: ['infra'] },
  { type: 'TASK', title: 'webhooks/setting 등록 + 수신 엔드포인트', epic: E6, assignee: '개발자2', labels: ['infra', 'be'] },
  { type: 'STORY', title: 'Rate Limit 대응', epic: E6, assignee: '개발자2', labels: ['infra'] },
  { type: 'TASK', title: 'Leaky Bucket 429 재시도 (Cafe24ApiRateLimiter 확장)', epic: E6, assignee: '개발자2', priority: 'HIGH', labels: ['infra', 'be'] },
  { type: 'TASK', title: 'X-Api-Call-Limit 헤더 모니터링', epic: E6, assignee: '개발자2', labels: ['infra'] },
  { type: 'TASK', title: '멀티몰 shop_no 파라미터 처리', epic: E6, assignee: '개발자2', labels: ['infra', 'be'] },

  // E7 셀러 앱 UI (FE)
  { type: 'STORY', title: '셀러 연동 설정 화면', epic: E7, assignee: '개발자3', labels: ['fe'] },
  { type: 'TASK', title: '카페24 계정 연결 버튼·OAuth 리다이렉트', epic: E7, assignee: '개발자3', labels: ['fe'] },
  { type: 'TASK', title: '연동 상태 대시보드', epic: E7, assignee: '개발자3', labels: ['fe'] },
  { type: 'STORY', title: '셀러 앱 온보딩 UI', epic: E7, assignee: '개발자3', labels: ['fe'] },
  { type: 'TASK', title: '최초 연동 마법사 화면', epic: E7, assignee: '개발자3', labels: ['fe'] },

  // E8 QA
  { type: 'STORY', title: '통합테스트', epic: E8, assignee: 'PM', labels: ['qa'] },
  { type: 'TASK', title: '주문→클레임 E2E 시나리오 테스트', epic: E8, assignee: '개발자1', labels: ['qa', 'test'] },
  { type: 'TASK', title: '스테이징 검증', epic: E8, assignee: 'PM', labels: ['qa'] },
  { type: 'STORY', title: '운영 배포', epic: E8, assignee: 'PM', labels: ['deploy'] },
  { type: 'TASK', title: '운영 배포 및 롤백 플랜', epic: E8, assignee: 'PM', labels: ['deploy'] },

  // E9 디자인
  { type: 'STORY', title: '앱 비주얼 에셋', epic: E9, assignee: '개발자3', labels: ['design'] },
  { type: 'TASK', title: '앱 아이콘 제작', epic: E9, assignee: '개발자3', labels: ['design'] },
  { type: 'TASK', title: '앱스토어 스크린샷·그래픽 이미지', epic: E9, assignee: '개발자3', labels: ['design'], attach: true },
  { type: 'TASK', title: '셀러 앱 UI 시안', epic: E9, assignee: '개발자3', labels: ['design'] },

  // E10 법무
  { type: 'STORY', title: '필수 법적 문서', epic: E10, assignee: '개발자3', priority: 'HIGH', labels: ['legal'] },
  { type: 'TASK', title: '[문서] 개인정보처리방침 초안 (없으면 앱 출시 불가)', epic: E10, assignee: '개발자3', priority: 'HIGHEST', labels: ['legal', 'doc'], attach: true },
  { type: 'TASK', title: '[문서] 서비스 이용약관', epic: E10, assignee: '개발자3', labels: ['legal', 'doc'], attach: true },
  { type: 'TASK', title: '개인정보 수집·이용 동의 항목 정의', epic: E10, assignee: '개발자3', labels: ['legal'] },

  // E11 앱스토어
  { type: 'STORY', title: '카페24 앱스토어 등록', epic: E11, assignee: '개발자3', labels: ['appstore'] },
  { type: 'TASK', title: '앱 소개 문구·상세페이지 작성', epic: E11, assignee: '개발자3', labels: ['appstore'] },
  { type: 'TASK', title: '앱스토어 등록 신청', epic: E11, assignee: '개발자3', labels: ['appstore'] },
  { type: 'TASK', title: '제작팀 검수 대응(영업일 6~12일)', epic: E11, assignee: '개발자3', labels: ['appstore'] },
  { type: 'BUG', title: '검수 반려 — 권한 스코프 과다 요청 수정', epic: E11, assignee: '개발자3', labels: ['bug', 'appstore'] },
  { type: 'STORY', title: '개발자 계정 등록', epic: E11, assignee: 'PM', labels: ['appstore'] },
  { type: 'TASK', title: '구글 개발자 계정 등록($25 1회)', epic: E11, assignee: 'PM', labels: ['appstore'] },
  { type: 'TASK', title: '애플 개발자 계정 등록($99/년, 심사 최대 3주)', epic: E11, assignee: 'PM', labels: ['appstore'] },

  // E12 요금
  { type: 'STORY', title: '앱 요금 정책', epic: E12, assignee: 'PM', labels: ['billing'] },
  { type: 'TASK', title: '요금제 설계(무료/유료/구독)', epic: E12, assignee: 'PM', labels: ['billing'] },
  { type: 'TASK', title: '정산·수수료·세금계산서 정책', epic: E12, assignee: 'PM', labels: ['billing'] },

  // E13 마케팅
  { type: 'STORY', title: '런칭 마케팅', epic: E13, assignee: '개발자3', labels: ['marketing'] },
  { type: 'TASK', title: '런칭 홍보 콘텐츠 제작', epic: E13, assignee: '개발자3', labels: ['marketing'] },
  { type: 'TASK', title: '[문서] 셀러 온보딩 가이드', epic: E13, assignee: '개발자3', labels: ['marketing', 'doc'], attach: true },
  { type: 'TASK', title: '런칭 이벤트·프로모션 기획', epic: E13, assignee: '개발자3', labels: ['marketing'] },

  // E14 CS
  { type: 'STORY', title: '셀러 지원 체계', epic: E14, assignee: '개발자3', labels: ['cs'] },
  { type: 'TASK', title: '셀러 문의 대응 채널 구축', epic: E14, assignee: '개발자3', labels: ['cs'] },
  { type: 'TASK', title: '[문서] FAQ·운영 매뉴얼', epic: E14, assignee: '개발자3', labels: ['cs', 'doc'], attach: true },
  { type: 'TASK', title: '장애·오류 접수 프로세스', epic: E14, assignee: '개발자3', labels: ['cs', 'ops'] },
];

export const ISSUE_TYPE_LABEL: Record<IssueType, string> = {
  EPIC: '에픽', STORY: '스토리', TASK: '태스크', SUBTASK: '하위작업', BUG: '버그', DOC: '문서',
};
