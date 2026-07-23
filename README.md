# WattFlex

WattFlex is a real-time IoT energy analytics and budget-auditing platform. It contains a React SPA, a modular Spring Boot core, an independent Kafka sensor simulator, Apache Ignite live state, PostgreSQL history, and a resilient Gemini/email alert pipeline.

The competition dashboard includes dark, light and system themes; live portfolio monitoring; predictive analytics; home rankings; device distribution; goals, streaks and badges; a notification center; carbon-impact tracking; and a Gemini-backed conversational energy advisor with an offline fallback.

## Quick start

1. Copy `.env.example` to `.env` and optionally set Gemini and SMTP values.
2. Run `docker compose up --build`.
3. Open the dashboard at `http://localhost:3000` and Swagger at `http://localhost:8080/swagger-ui.html`.
4. Register a home from Swagger or the dashboard. The sensor service discovers it through Kafka and starts publishing telemetry.

Without Gemini or SMTP credentials, the core uses a Turkish fallback recommendation and records email delivery as `SKIPPED`; telemetry and the dashboard continue working.

## Local development

- Backend: `mvn -pl voltwise-core spring-boot:run`
- Sensors: `mvn -pl voltwise-sensors spring-boot:run`
- Frontend: `cd voltwise-web && npm install && npm run dev`

Required infrastructure can be started with `docker compose up postgres kafka ignite`.

## REST API

- `POST /api/homes` — register a home and appliances
- `GET /api/homes/status` — live Ignite-backed dashboard state
- `GET /api/homes/{id}/status` — a single live home profile
- `GET /api/homes/{id}/history?days=7` — PostgreSQL daily trend data

## Architecture

Registration flows Core → PostgreSQL → Kafka → Sensors. Telemetry flows Sensors → Kafka → Core → Ignite, followed by transactional PostgreSQL snapshots/audit logs. Dashboard polling reads only Ignite; charts read only PostgreSQL.
