FROM eclipse-temurin:21-jre AS java

FROM node:24-slim

COPY --from=java /opt/java/openjdk /opt/java/openjdk
ENV JAVA_HOME=/opt/java/openjdk
ENV PATH="${JAVA_HOME}/bin:${PATH}"

RUN npm install --global firebase-tools@15.33.0 \
  && firebase setup:emulators:firestore \
  && firebase setup:emulators:ui

WORKDIR /emulator
COPY firebase.json firestore.rules ./

EXPOSE 4000 4400 8080 9150

CMD ["firebase", "emulators:start", "--project", "demo-auto-company"]
