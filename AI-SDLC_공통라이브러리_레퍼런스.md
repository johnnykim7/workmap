# therecommerce 조직 컨텍스트
<!-- version: 0.1.0 | 이 파일은 bp-common-lib 버전과 함께 관리됩니다 -->

> **[정본 위치]** 이 파일의 최신 버전은 항상 `therecommerce-develop/bp-common-lib` 레포 루트에 있습니다.
> 서브 프로젝트에 복사 후 사용하며, bp-common-lib 버전이 올라가면 이 파일도 함께 업데이트됩니다.
> (WorkMap 복사본 — 구현 세션 시작 전 정본에서 최신본을 다시 복사할 것)

---

## 공통 라이브러리: bp-common-lib

**therecommerce 조직의 모든 백엔드 프로젝트에서 사용하는 공통 인프라 라이브러리입니다.**
아래 기능들은 라이브러리에서 제공하므로, **설계·구현 단계에서 직접 만들지 않습니다.**

### Gradle 설정

```kotlin
// settings.gradle.kts
dependencyResolutionManagement {
    repositories {
        maven {
            name = "GitHubPackages"
            url = uri("https://maven.pkg.github.com/therecommerce-develop/bp-common-lib")
            credentials {
                username = providers.gradleProperty("githubUsername").orNull
                    ?: System.getenv("GITHUB_USERNAME") ?: System.getenv("GITHUB_ACTOR")
                password = providers.gradleProperty("githubToken").orNull
                    ?: System.getenv("GITHUB_TOKEN")
            }
        }
    }
}
```

```kotlin
// build.gradle.kts
dependencies {
    implementation("com.therecommerce:bp-common-lib:0.1.0")
}
```

> 인증: `read:packages` 스코프 PAT 필요. `~/.gradle/gradle.properties`에 githubUsername/githubToken 설정(권장). 커밋 금지.

---

### 제공 기능 및 직접 구현 금지 목록

| 기능 영역 | 클래스 / 인터페이스 | 패키지 | 비고 |
|-----------|---------------------|--------|------|
| API 응답 래핑 | `ResponseDto`, `SuccessCode`(I), `CommonSuccessCode` | `com.therecommerce.common.response` | 응답 포맷 직접 정의 금지 |
| 예외 처리 | `BusinessException`, `ErrorCode`(I), `CommonErrorCode`, `GlobalExceptionHandler` | `com.therecommerce.common.exception` | 커스텀 Exception 신규 생성 금지 |
| 페이징 | `PageRequest`, `PageResponse`, `PagingRequestDto`, `SortOption`, `SortDirection` | `com.therecommerce.common.paging` | 페이징 DTO 직접 구현 금지 |
| JWT | `JwtTokenProvider`(추상), `JwtFilter`(추상), `TokenDto` | `com.therecommerce.common.security.jwt` | 상속하여 확장 |
| 인증 유저 | `@AuthUser`, `AuthUserInfo`, `BaseUserPrincipal` | `com.therecommerce.common.security.auth` | Principal 직접 구현 금지 |
| Security 설정 | `BaseSecurityConfig`, `SecurityWhitelist`(I) | `com.therecommerce.common.security` | `SecurityWhitelist` 구현체만 프로젝트 제공 |
| 로깅 | `RequestLoggingFilter`, `TraceIdFilter`, `LoggerUtil` | `com.therecommerce.common.logging` | 자동 등록됨 |
| 검색 | `SearchConditionRequest`, `SearchConditionUtil`, `SearchType`(I), `KeywordApplicable`(I) | `com.therecommerce.common.search` | 검색 조건 DTO 직접 구현 금지 |
| 유틸 | `DateTimeUtils`, `NumberUtils`, `CommonUtil`, `JsonTypeHandler`, `EnumStringCodeValidator` | `com.therecommerce.common.util` | |
| 설정 | `JwtProperties`, `PagingProperties`, `RequestLoggingProperties` | `com.therecommerce.common.config` | application.yml로 오버라이드 |

> (I) = interface, (추상) = abstract class

---

### 프로젝트에서 구현해야 하는 것 (확장 포인트)

| 항목 | 방법 | 예시 |
|------|------|------|
| 에러 코드 | `ErrorCode` 구현 | 코드 범위: **7700번대 이후** |
| JWT Provider | `JwtTokenProvider` 상속 | 클레임 커스터마이징(userId/role/deptId) |
| JWT Filter | `JwtFilter` 상속 | 토큰 검증 확장 |
| Security 화이트리스트 | `SecurityWhitelist` 구현 | 공개 경로(/auth/login, /actuator/health) |
| 성공 코드 | `SuccessCode` 구현 | 프로젝트 응답 코드 |

---

### application.yml 필수 설정

```yaml
jwt:
  secret: ${JWT_SECRET}
  access-expiration: 3600000
  refresh-expiration: 604800000
paging:
  default-size: 20
  max-size: 100
logging:
  request:
    include-body: false
    max-body-length: 1000
```

---

## 공통 기술 스택 (조직 표준)

| 항목 | 기술 |
|------|------|
| Language | Java 17 |
| Framework | Spring Boot 3.x |
| ORM | **MyBatis** (JPA/Hibernate 사용 금지) |
| DB | MySQL *(공통 표준. **WorkMap은 PostgreSQL 16 사용** — CR-001)* |
| Build | Gradle (Kotlin DSL) |
| 패키지 루트 | `com.therecommerce.{프로젝트명}` |
| 공통 라이브러리 | `com.therecommerce:bp-common-lib` (GitHub Packages) |
| CI/CD | GitHub Actions |

---

## 설계 시 주의사항

- DataSource, Mail, 외부 연동 Config는 bp-common-lib 범위 밖 → 프로젝트에서 직접 정의
- **JPA 관련 코드 일절 사용 금지** (Auditing, Repository 등)
- 도메인 에러 코드는 `ErrorCode` 구현체, **7700번대 이후** 사용
- bp-common-lib는 ORM 비의존(응답/예외/페이징/JWT/검색) → PostgreSQL+MyBatis 조합과 충돌 없음

## bp-common-lib 기여 후보 (구현 중 기록)

| 항목 | 설명 | 발견 위치 | 판단 근거 |
|------|------|-----------|----------|
| (구현 중 발견 시 추가) | | | |
