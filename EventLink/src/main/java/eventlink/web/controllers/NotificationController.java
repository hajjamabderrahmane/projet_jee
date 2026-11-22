package eventlink.web.controllers;

import eventlink.dao.entities.Notification;
import eventlink.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    // GET /api/notifications/user/{userId}
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Notification>> getByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(notificationService.getByUser(userId));
    }

    // GET /api/notifications/user/{userId}/non-lues
    @GetMapping("/user/{userId}/non-lues")
    public ResponseEntity<List<Notification>> getNonLues(@PathVariable Long userId) {
        return ResponseEntity.ok(notificationService.getNonLues(userId));
    }

    // GET /api/notifications/user/{userId}/count
    @GetMapping("/user/{userId}/count")
    public ResponseEntity<Map<String, Integer>> countNonLues(@PathVariable Long userId) {
        return ResponseEntity.ok(Map.of("nonLues", notificationService.countNonLues(userId)));
    }

    // PUT /api/notifications/{id}/lue
    @PutMapping("/{id}/lue")
    public ResponseEntity<Notification> marquerLue(@PathVariable Long id) {
        return ResponseEntity.ok(notificationService.marquerLue(id));
    }

    // PUT /api/notifications/user/{userId}/toutes-lues
    @PutMapping("/user/{userId}/toutes-lues")
    public ResponseEntity<Void> marquerToutesLues(@PathVariable Long userId) {
        notificationService.marquerToutesLues(userId);
        return ResponseEntity.noContent().build();
    }
}