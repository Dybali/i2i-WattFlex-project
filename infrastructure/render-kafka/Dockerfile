FROM apache/kafka:3.9.2

USER root
COPY infrastructure/render-kafka/render-entrypoint.sh /opt/voltwise/render-entrypoint.sh
RUN chmod +x /opt/voltwise/render-entrypoint.sh
USER appuser

ENTRYPOINT ["/opt/voltwise/render-entrypoint.sh"]
