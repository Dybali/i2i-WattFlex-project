package com.i2i.voltwise.notification;

import com.i2i.voltwise.audit.Recommendation;
import com.i2i.voltwise.audit.RecommendationRepository;
import com.i2i.voltwise.home.Home;
import com.i2i.voltwise.state.LiveModels;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
public class NotificationService {
  private final RestClient http;
  private final JavaMailSender mail;
  private final RecommendationRepository recommendations;

  @Value("${voltwise.gemini-api-key:}") String apiKey;
  @Value("${voltwise.gemini-model}") String model;
  @Value("${voltwise.alert-from}") String from;

  public NotificationService(RestClient http, JavaMailSender mail,
                             RecommendationRepository recommendations) {
    this.http = http;
    this.mail = mail;
    this.recommendations = recommendations;
  }

  public void notify(Home home, LiveModels.HomeLive live, String reason) {
    String text = generate(live, reason);
    String status = "SKIPPED";
    try {
      if (!home.email.isBlank()) {
        var message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(home.email);
        message.setSubject("WattFlex enerji uyarısı");
        message.setText(text);
        mail.send(message);
        status = "SENT";
      }
    } catch (Exception ignored) {
      status = "FAILED";
    }
    recommendations.save(new Recommendation(home, text, status));
  }

  public String advise(LiveModels.HomeLive live, String question) {
    String reason = question == null || question.isBlank()
        ? "Genel tüketim profilini incele ve en etkili üç tasarruf adımını öner"
        : question;
    return generate(live, reason);
  }

  private String generate(LiveModels.HomeLive live, String reason) {
    String fallback = fallbackAdvice(live, reason);
    if (apiKey == null || apiKey.isBlank()) return fallback;
    try {
      String prompt = "Sen WattFlex enerji danışmanısın. Yalnızca Türkçe cevap ver. "
          + "Yanıtın kısa, kişisel, sayısal ve uygulanabilir olsun. Ev=" + live.name
          + ", enerji=" + String.format("%.2f", live.energyKwh) + " kWh"
          + ", maliyet=" + String.format("%.2f", live.cost) + " TL"
          + ", bütçe=" + String.format("%.2f", live.budgetLimit) + " TL"
          + ", ceza tarifesi=" + live.penalty
          + ", anomaliler=" + live.appliances.values().stream()
              .filter(a -> a.anomalous).map(a -> a.name).toList()
          + ". Kullanıcı sorusu: " + reason;
      Map<String, Object> body = Map.of("contents", List.of(
          Map.of("parts", List.of(Map.of("text", prompt)))));
      Map<?, ?> response = http.post()
          .uri("https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent", model)
          .header("x-goog-api-key", apiKey.trim())
          .body(body).retrieve().body(Map.class);
      var candidates = (List<?>) response.get("candidates");
      var content = (Map<?, ?>) ((Map<?, ?>) candidates.get(0)).get("content");
      var parts = (List<?>) content.get("parts");
      return Objects.toString(((Map<?, ?>) parts.get(0)).get("text"), fallback);
    } catch (Exception ignored) {
      return fallback;
    }
  }

  private String fallbackAdvice(LiveModels.HomeLive live, String reason) {
    double percent = live.budgetLimit == 0 ? 0 : live.cost / live.budgetLimit * 100;
    String priority = live.penalty
        ? "Ceza tarifesi etkin. Klima ve yüksek güçlü cihazları yoğun saatler dışında kullanın."
        : percent >= 80
          ? "Bütçenizin yüzde 80'ini geçtiniz. Bugün gereksiz bekleme tüketimini kapatın."
          : "Tüketiminiz kontrol altında. Programlı cihaz kullanımını sürdürün.";
    return "WattFlex AI analizi: " + priority
        + " Tahmini yüzde 12 tasarruf için klimayı 24°C'de çalıştırın, çamaşır makinesini tam dolu kullanın "
        + "ve gece bekleme yüklerini kapatın. Sorunuz: " + reason;
  }
}
