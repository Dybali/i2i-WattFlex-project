package com.i2i.voltwise.invoice;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Set;

@RestController
@RequestMapping("/api/invoice")
public class InvoiceController {
  private static final Set<String> ALLOWED_TYPES = Set.of("image/png", "image/jpeg", "image/jpg");

  private final InvoiceParsingService parsingService;

  public InvoiceController(InvoiceParsingService parsingService) {
    this.parsingService = parsingService;
  }

  @PostMapping(path = "/parse", consumes = "multipart/form-data")
  public ResponseEntity<InvoiceDtos.InvoiceParseResult> parse(@RequestParam("file") MultipartFile file) {
    if (file == null || file.isEmpty()) {
      return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
          new InvoiceDtos.InvoiceParseResult(false, null, true, "Bilinmiyor", "Fatura dosyası alınamadı."));
    }
    String contentType = file.getContentType();
    if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
      return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
          new InvoiceDtos.InvoiceParseResult(false, null, true, "Bilinmiyor", "Sadece .png veya .jpg dosyaları desteklenir."));
    }
    return ResponseEntity.ok(parsingService.parse(file));
  }
}
