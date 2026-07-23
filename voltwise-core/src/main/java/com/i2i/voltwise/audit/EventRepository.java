package com.i2i.voltwise.audit; import org.springframework.data.jpa.repository.JpaRepository; public interface EventRepository extends JpaRepository<AuditEvent,Long>{}
