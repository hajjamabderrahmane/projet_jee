package eventlink.web.controllers;

import eventlink.dao.entities.Notification;
import eventlink.security.AuthenticatedUserService;
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
    private final AuthenticatedUserService authenticatedUserService;

    // GET /api/notifications/me
    @GetMapping("/me")
    public ResponseEntity<List<Notification>> getMyNotifications() {
        Long userId = authenticatedUserService.getCurrentUserId();
        return ResponseEntity.ok(notificationService.getByUser(userId));
    }

    // GET /api/notifications/me/non-lues
    @GetMapping("/me/non-lues")
    public ResponseEntity<List<Notification>> getMyNonLues() {
        Long userId = authenticatedUserService.getCurrentUserId();
        return ResponseEntity.ok(notificationService.getNonLues(userId));
    }

    // GET /api/notifications/me/count
    @GetMapping("/me/count")
    public ResponseEntity<Map<String, Integer>> countMyNonLues() {
        Long userId = authenticatedUserService.getCurrentUserId();
        return ResponseEntity.ok(
                Map.of("nonLues", notificationService.countNonLues(userId)));
    }

    // PUT /api/notifications/{id}/lue
    @PutMapping("/{id}/lue")
    public ResponseEntity<Notification> marquerLue(@PathVariable Long id) {
        Long userId = authenticatedUserService.getCurrentUserId();
        return ResponseEntity.ok(notificationService.marquerLue(id, userId));
    }

    // PUT /api/notifications/me/toutes-lues
    @PutMapping("/me/toutes-lues")
    public ResponseEntity<Void> marquerToutesLues() {
        Long userId = authenticatedUserService.getCurrentUserId();
        notificationService.marquerToutesLues(userId);
        return ResponseEntity.noContent().build();
    }
}