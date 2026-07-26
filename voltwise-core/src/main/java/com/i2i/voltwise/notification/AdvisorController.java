//
package com.i2i.voltwise.notification;

import com.i2i.voltwise.state.LiveStateService;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;

@RestController
@RequestMapping("/api/advisor")
public class AdvisorController {
    private final LiveStateService liveState;
    private final NotificationService notifications;

    public AdvisorController(LiveStateService liveState, NotificationService notifications) {
        this.liveState = liveState;
        this.notifications = notifications;
    }

    record AdviceRequest(String question, String evContext) {}

    @PostMapping("/{homeId}")
    // DÜZELTİLEN SATIR: @PathVariable içine ("homeId") eklendi
    public Map<String, String> advise(@PathVariable("homeId") UUID homeId,
                                      @RequestBody(required = false) AdviceRequest request) {
        var home = liveState.get(homeId);
        if (home == null) throw new NoSuchElementException("Ev bulunamadı");

        String question = request == null ? "" : request.question();
        String evContext = request == null ? null : request.evContext();

        return Map.of("answer", notifications.advise(home, question, evContext), "model", "Gemini");
    }
}