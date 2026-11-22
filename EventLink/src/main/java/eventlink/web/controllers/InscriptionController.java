package eventlink.web.controllers;

import eventlink.dao.entities.Inscription;
import eventlink.service.InscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inscriptions")
@RequiredArgsConstructor
public class InscriptionController {

    private final InscriptionService inscriptionService;

    // POST /api/inscriptions
    // Body: { "userId": 1, "evenementId": 2, "lienLinkedIn": "https://..." }
    @PostMapping
    public ResponseEntity<Inscription> inscrire(@RequestBody Map<String, String> body) {
        Long userId = Long.parseLong(body.get("userId"));
        Long evenementId = Long.parseLong(body.get("evenementId"));
        String lienLinkedIn = body.get("lienLinkedIn");
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(inscriptionService.inscrire(userId, evenementId, lienLinkedIn));
    }

    // GET /api/inscriptions/user/{userId}
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Inscription>> getByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(inscriptionService.getByUser(userId));
    }

    // GET /api/inscriptions/evenement/{evenementId}
    @GetMapping("/evenement/{evenementId}")
    public ResponseEntity<List<Inscription>> getByEvenement(@PathVariable Long evenementId) {
        return ResponseEntity.ok(inscriptionService.getByEvenement(evenementId));
    }

    // GET /api/inscriptions/evenement/{evenementId}/validees
    @GetMapping("/evenement/{evenementId}/validees")
    public ResponseEntity<List<Inscription>> getValidees(@PathVariable Long evenementId) {
        return ResponseEntity.ok(inscriptionService.getValideesByEvenement(evenementId));
    }

    // PUT /api/inscriptions/{id}/valider  (ADMIN)
    @PutMapping("/{id}/valider")
    public ResponseEntity<Inscription> valider(@PathVariable Long id) {
        return ResponseEntity.ok(inscriptionService.valider(id));
    }

    // PUT /api/inscriptions/{id}/refuser  (ADMIN)
    @PutMapping("/{id}/refuser")
    public ResponseEntity<Inscription> refuser(@PathVariable Long id) {
        return ResponseEntity.ok(inscriptionService.refuser(id));
    }
}