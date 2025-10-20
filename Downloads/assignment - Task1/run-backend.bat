@echo off
echo Starting Spring Boot with minimal memory settings...
echo.

REM Set minimal JVM options
set MAVEN_OPTS=-Xmx128m -Xms64m -XX:+UseSerialGC -XX:+UseCompressedOops -XX:+UseCompressedClassPointers

REM Run Spring Boot
mvn spring-boot:run

pause
