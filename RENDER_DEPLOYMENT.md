# WattFlex - Render deployment

1. Push this entire folder (including `render.yaml`) to a GitHub repository.
2. In Render, select **New > Blueprint** and connect the repository.
3. Render detects `render.yaml`. Enter `GEMINI_API_KEY` when prompted. Mail fields can be blank initially.
4. Select **Apply** and wait until every service is healthy.
5. Open the public URL of the `wattflex-web` service.

Kafka, Ignite, the sensor worker, and Kafka's persistent disk use paid Render resources. The web UI, core API, and PostgreSQL are configured for the free tier. All resources use Frankfurt so they can communicate over Render's private network.
