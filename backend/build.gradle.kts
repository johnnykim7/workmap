plugins {
    java
    id("org.springframework.boot") version "3.4.2"
    id("io.spring.dependency-management") version "1.1.7"
}

group = "com.therecommerce"
version = "0.1.0"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(17)
    }
}

repositories {
    mavenCentral()
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

dependencies {
    // 공통 라이브러리 (응답/예외/페이징/JWT/검색)
    implementation("com.therecommerce:bp-common-lib:0.1.0")

    // Spring Boot
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("org.springframework.boot:spring-boot-starter-security")

    // 영속성: MyBatis (JPA/Hibernate 금지 — 조직 표준)
    implementation("org.mybatis.spring.boot:mybatis-spring-boot-starter:3.0.4")

    // DB / 마이그레이션
    runtimeOnly("org.postgresql:postgresql")
    implementation("org.flywaydb:flyway-core")
    implementation("org.flywaydb:flyway-database-postgresql")

    // JWT (bp-common-lib JwtTokenProvider/JwtFilter 확장에 필요)
    implementation("io.jsonwebtoken:jjwt-api:0.12.6")
    runtimeOnly("io.jsonwebtoken:jjwt-impl:0.12.6")
    runtimeOnly("io.jsonwebtoken:jjwt-jackson:0.12.6")

    compileOnly("org.projectlombok:lombok")
    annotationProcessor("org.projectlombok:lombok")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.security:spring-security-test")
    testImplementation("org.mybatis.spring.boot:mybatis-spring-boot-starter-test:3.0.4")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

tasks.withType<Test> {
    useJUnitPlatform()
}

tasks.named<org.springframework.boot.gradle.tasks.bundling.BootJar>("bootJar") {
    archiveFileName.set("workmap.jar")
}
