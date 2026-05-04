# Build stage
FROM eclipse-temurin:17-jdk-jammy AS build

WORKDIR /workspace

# Copy Gradle wrapper and build scripts first (better layer caching)
COPY gradlew gradlew
COPY gradlew.bat gradlew.bat
COPY gradle/ gradle/
COPY build.gradle build.gradle
COPY settings.gradle settings.gradle

# Copy sources
COPY src/ src/

# Build the Spring Boot fat jar
RUN chmod +x ./gradlew \
    && ./gradlew --no-daemon bootJar -x test


# Runtime stage
FROM eclipse-temurin:17-jre-jammy

WORKDIR /app

# Copy jar from build stage
COPY --from=build /workspace/build/libs/*.jar /app/app.jar

EXPOSE 8080

ENV JAVA_OPTS=""

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
