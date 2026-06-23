# WorkMap BE 런타임 이미지 — pre-built JAR 복사 (deploy.sh가 bootJar 후 전송)
# 빌드: ./gradlew bootJar → docker compose build api
FROM eclipse-temurin:17-jre
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends curl && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

RUN groupadd -r appuser && useradd -r -g appuser -m appuser

COPY build/libs/workmap.jar app.jar
RUN chown appuser:appuser app.jar

USER appuser
EXPOSE 8186

ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
