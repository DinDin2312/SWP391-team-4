# ==============================================================================
# Stage 1: Build Spring Boot Backend Artifact
# ==============================================================================
FROM eclipse-temurin:17-jdk-alpine AS build

WORKDIR /workspace

COPY mvnw pom.xml ./
COPY .mvn .mvn
RUN chmod +x mvnw && ./mvnw --batch-mode --no-transfer-progress dependency:go-offline

COPY src src
RUN ./mvnw --batch-mode --no-transfer-progress -DskipTests clean package

# ==============================================================================
# Stage 2: Minimal Production Runtime Image (Non-Root User)
# ==============================================================================
FROM eclipse-temurin:17-jre-alpine AS runtime

WORKDIR /app

RUN apk add --no-cache curl tzdata && \
    addgroup -S sportscenter && \
    adduser -S sportscenter -G sportscenter && \
    mkdir -p /app/uploads/avatars /app/uploads/resource-images && \
    chown -R sportscenter:sportscenter /app

ENV TZ=Asia/Ho_Chi_Minh
ENV AVATAR_UPLOAD_DIR=/app/uploads/avatars
ENV RESOURCE_IMAGE_UPLOAD_DIR=/app/uploads/resource-images

COPY --from=build --chown=sportscenter:sportscenter /workspace/target/*.jar /app/app.jar

USER sportscenter

EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=5s --start-period=40s --retries=5 \
  CMD curl -fsS http://127.0.0.1:8080/api/guest/packages > /dev/null || exit 1

ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "/app/app.jar"]
