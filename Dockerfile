# ---- build stage ----
FROM maven:3.9.6-eclipse-temurin-21-alpine AS build
WORKDIR /app
# Resolve dependencies first so they cache independently of source changes.
COPY backend/pom.xml .
RUN mvn -B -q dependency:go-offline
COPY backend/src ./src
RUN mvn -B clean package -DskipTests

# ---- runtime stage ----
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Run as an unprivileged user.
RUN addgroup -S app && adduser -S -G app app
COPY --from=build /app/target/*.jar app.jar
RUN chown app:app /app/app.jar
USER app

# The production profile is pinned here. Without it the application would fall
# back to whatever SPRING_PROFILES_ACTIVE happens to be, and the local profile
# enables development affordances such as the payment mock.
ENV SPRING_PROFILES_ACTIVE=prod
ENV JAVA_TOOL_OPTIONS="-XX:+UseSerialGC -XX:TieredStopAtLevel=1 -XX:MaxRAMPercentage=70.0"

# Cloud Run supplies PORT and routes only that one port.
EXPOSE 8080

# Ignored by Cloud Run (which uses its own probes) but correct for `docker run`.
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD wget -qO- "http://localhost:${PORT:-8080}/actuator/health/readiness" || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
