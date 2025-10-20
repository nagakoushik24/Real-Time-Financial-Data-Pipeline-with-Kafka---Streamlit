@echo off
echo Starting Spring Boot with ULTRA minimal memory settings...
echo.

REM Set ultra minimal JVM options
set MAVEN_OPTS=-Xmx64m -Xms32m -XX:+UseSerialGC -XX:+UseCompressedOops -XX:+UseCompressedClassPointers -XX:MaxMetaspaceSize=64m

REM Run Spring Boot
mvn spring-boot:run

pause
