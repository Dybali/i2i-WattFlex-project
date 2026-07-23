FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /src
COPY pom.xml .
COPY voltwise-core/pom.xml voltwise-core/pom.xml
COPY voltwise-sensors/pom.xml voltwise-sensors/pom.xml
COPY voltwise-sensors/src voltwise-sensors/src
RUN mvn -pl voltwise-sensors -am -DskipTests package
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /src/voltwise-sensors/target/voltwise-sensors-1.0.0.jar app.jar
COPY voltwise-sensors/render-entrypoint.sh /app/render-entrypoint.sh
RUN chmod +x /app/render-entrypoint.sh
ENTRYPOINT ["/app/render-entrypoint.sh"]
