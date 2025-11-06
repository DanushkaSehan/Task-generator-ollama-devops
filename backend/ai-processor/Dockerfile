# Build-stage not needed if you push built jar from CI; this uses a simple runtime image.
FROM eclipse-temurin:17-jre-jammy

ARG JAR_FILE=target/*.jar
WORKDIR /app

# copy the fat jar produced by Maven build
COPY ${JAR_FILE} ai_app.jar

EXPOSE 8080
# If ai-processor listens on 8090, override the port on container or create another Dockerfile with EXPOSE 8090
ENTRYPOINT ["java","-Xms256m","-Xmx512m","-jar","/app/ai_app.jar"]
