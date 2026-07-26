package com.i2i.voltwise.invoice;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

import java.util.Base64;
import java.util.List;
import java.util.Map;

/**
 * Reads the "Fatura Detayı" table of an uploaded electricity bill photo using Gemini's
 * vision capability, and extracts:
 *   1) the "Birim Fiyat" (₺/kWh) of the energy consumption row (e.g. "Enerji Tük.Bed.-Düşük Kademe"), and
 *   2) whether the bill uses a single-tier tariff ("tek kademeli") or a Gündüz/Puant/Gece
 *      multi-period tariff.
 *
 * Falls back to a "not recognized" result (so the caller can prompt for manual entry)
 * when no Gemini API key is configured or the request/parse fails, mirroring the pattern
 * already used in {@code NotificationService}.
 */
@Service
public class InvoiceParsingService {
  private static final Logger log = LoggerFactory.getLogger(InvoiceParsingService.class);

  private static final String PROMPT = """
      Sana bir Türkiye elektrik faturası görseli veriyorum. Yalnızca "Fatura Detayı" başlıklı tablodaki
      bilgileri kullan.
      1) Tabloda enerji tüketim bedeli satırını bul (genelde "Enerji Tük.Bed.-Düşük Kademe" ya da benzer
         şekilde adlandırılır) ve bu satırın "Birim Fiyat" sütunundaki değeri oku. Türkçe ondalık virgülü
         nokta yaparak sayıya çevir (örn. "2,98432" -> 2.98432).
      2) Aynı tabloda "Gündüz", "Puant" ve "Gece" gibi ayrı satırlar olup olmadığını kontrol et. Böyle bir
         ayrım yoksa fatura tek kademeli (tek zamanlı) kabul edilir; varsa çok zamanlı tarife kabul edilir.
      Yalnızca aşağıdaki JSON şemasıyla, başka hiçbir açıklama veya markdown olmadan cevap ver:
      {"recognized": boolean, "unitPrice": number veya null, "singleTier": boolean, "tariffLabel": string}
      tariffLabel değeri singleTier true ise "Tek Kademeli", false ise "Çok Zamanlı (Gündüz/Puant/Gece)" olsun.
      Fatura detayı tablosunu ya da enerji tüketim bedeli satırını bulamazsan
      {"recognized": false, "unitPrice": null, "singleTier": true, "tariffLabel": "Bilinmiyor"} döndür.
      """;

  private final RestClient http;
  private final ObjectMapper mapper = new ObjectMapper();

  @Value("${voltwise.gemini-api-key:}") String apiKey;
  @Value("${voltwise.gemini-model}") String model;

  public InvoiceParsingService(RestClient http) {
    this.http = http;
  }

  public InvoiceDtos.InvoiceParseResult parse(MultipartFile file) {
    if (apiKey == null || apiKey.isBlank()) {
      return fallback("Fatura okuma servisi şu anda yapılandırılmamış; birim fiyatı elle girebilirsin.");
    }
    try {
      String base64 = Base64.getEncoder().encodeToString(file.getBytes());
      String mime = "image/png".equals(file.getContentType()) ? "image/png" : "image/jpeg";
      Map<String, Object> body = Map.of("contents", List.of(
          Map.of("parts", List.of(
              Map.of("text", PROMPT),
              Map.of("inline_data", Map.of("mime_type", mime, "data", base64))
          ))));
      Map<?, ?> response = http.post()
          .uri("https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent", model)
          .header("x-goog-api-key", apiKey)
          .body(body).retrieve().body(Map.class);
      var candidates = (List<?>) response.get("candidates");
      var content = (Map<?, ?>) ((Map<?, ?>) candidates.get(0)).get("content");
      var parts = (List<?>) content.get("parts");
      String text = String.valueOf(((Map<?, ?>) parts.get(0)).get("text"));
      String clean = text.replaceAll("```json|```", "").trim();
      JsonNode node = mapper.readTree(clean);

      boolean singleTier = node.path("singleTier").asBoolean(true);
      String tariffLabel = node.hasNonNull("tariffLabel") && !node.path("tariffLabel").asText().isBlank()
          ? node.path("tariffLabel").asText()
          : (singleTier ? "Tek Kademeli" : "Çok Zamanlı (Gündüz/Puant/Gece)");
      boolean recognized = node.path("recognized").asBoolean(false);
      Double unitPrice = recognized && node.hasNonNull("unitPrice") ? node.path("unitPrice").asDouble() : null;

      if (!recognized || unitPrice == null) {
        return new InvoiceDtos.InvoiceParseResult(false, null, singleTier, tariffLabel,
            "Faturadaki birim fiyat okunamadı; elle girebilirsin.");
      }
      return new InvoiceDtos.InvoiceParseResult(true, unitPrice, singleTier, tariffLabel,
          "Fatura başarıyla okundu.");
    } catch (Exception error) {
      log.warn("Invoice parse failed with model {}: {}", model, error.getMessage());
      return fallback("Fatura okunurken bir sorun oluştu; elle girebilirsin.");
    }
  }

  private InvoiceDtos.InvoiceParseResult fallback(String message) {
    return new InvoiceDtos.InvoiceParseResult(false, null, true, "Bilinmiyor", message);
  }
}
