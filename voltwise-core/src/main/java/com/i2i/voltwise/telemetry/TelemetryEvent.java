package com.i2i.voltwise.telemetry; import java.time.Instant; import java.util.UUID; public record TelemetryEvent(UUID homeId,UUID applianceId,double watts,Instant capturedAt){}
