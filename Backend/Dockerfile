# Build the Spring Boot jar, then run it on a small JRE image.
FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /workspace
COPY mvnw pom.xml ./
COPY .mvn .mvn
RUN chmod +x mvnw && ./mvnw -B -q dependency:go-offline
COPY src src
RUN ./mvnw -B -q -DskipTests package

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN apk add --no-cache curl tzdata \
 && addgroup -S app && adduser -S app -G app \
 && mkdir -p /app/uploads/avatars /app/uploads/resource-images \
 && chown -R app:app /app
ENV TZ=Asia/Ho_Chi_Minh \
    AVATAR_UPLOAD_DIR=/app/uploads/avatars \
    RESOURCE_IMAGE_UPLOAD_DIR=/app/uploads/resource-images
COPY --from=build --chown=app:app /workspace/target/*.jar /app/app.jar
USER app
EXPOSE 8080
HEALTHCHECK --interval=20s --timeout=5s --start-period=90s --retries=5 \
  CMD curl -fsS -o /dev/null http://127.0.0.1:8080/api/guest/packages || exit 1
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
