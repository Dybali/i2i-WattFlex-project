package com.i2i.voltwise.web;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.NoSuchElementException;

@RestControllerAdvice
public class ApiExceptionHandler {
  private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);
  record ErrorBody(String message, Instant timestamp) {}

  @ExceptionHandler(NoSuchElementException.class)
  ResponseEntity<ErrorBody> notFound(NoSuchElementException e) {
    return ResponseEntity.status(404).body(new ErrorBody(e.getMessage(), Instant.now()));
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  ResponseEntity<ErrorBody> invalid(MethodArgumentNotValidException e) {
    var message = e.getBindingResult().getFieldErrors().stream()
            .map(x -> x.getField() + ": " + x.getDefaultMessage()).findFirst().orElse("Geçersiz istek");
    return ResponseEntity.badRequest().body(new ErrorBody(message, Instant.now()));
  }

  @ExceptionHandler(Exception.class)
  ResponseEntity<ErrorBody> general(Exception e) {
    log.error("Unhandled API request error", e);
    return ResponseEntity.status(500).body(new ErrorBody("İşlem tamamlanamadı. Lütfen tekrar deneyin.", Instant.now()));
  }
}
