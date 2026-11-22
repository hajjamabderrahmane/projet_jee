package eventlink.web.controllers;

import eventlink.dao.entities.Commentaire;
import eventlink.service.CommentaireService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/commentaires")
@RequiredArgsConstructor
public class CommentaireController {

    private final CommentaireService commentaireService;

    // POST /api/commentaires
    // Body: { "userId": 1, "evenementId": 2, "contenu": "Super événement !" }
    @PostMapping
    public ResponseEntity<Commentaire> ajouter(@RequestBody Map<String, String> body) {
        Long userId = Long.parseLong(body.get("userId"));
        Long evenementId = Long.parseLong(body.get("evenementId"));
        String contenu = body.get("contenu");
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(commentaireService.ajouter(userId, evenementId, contenu));
    }

    // GET /api/commentaires/evenement/{evenementId}
    @GetMapping("/evenement/{evenementId}")
    public ResponseEntity<List<Commentaire>> getByEvenement(@PathVariable Long evenementId) {
        return ResponseEntity.ok(commentaireService.getByEvenement(evenementId));
    }

    // GET /api/commentaires/user/{userId}
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Commentaire>> getByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(commentaireService.getByUser(userId));
    }

    // PUT /api/commentaires/{id}
    // Body: { "userId": 1, "contenu": "Contenu modifié" }
    @PutMapping("/{id}")
    public ResponseEntity<Commentaire> modifier(@PathVariable Long id,
                                                @RequestBody Map<String, String> body) {
        Long userId = Long.parseLong(body.get("userId"));
        String contenu = body.get("contenu");
        return ResponseEntity.ok(commentaireService.modifier(id, userId, contenu));
    }

    // DELETE /api/commentaires/{id}/user/{userId}  (participant)
    @DeleteMapping("/{id}/user/{userId}")
    public ResponseEntity<Void> supprimer(@PathVariable Long id,
                                          @PathVariable Long userId) {
        commentaireService.supprimer(id, userId);
        return ResponseEntity.noContent().build();
    }

    // DELETE /api/commentaires/{id}/admin  (ADMIN)
    @DeleteMapping("/{id}/admin")
    public ResponseEntity<Void> supprimerParAdmin(@PathVariable Long id) {
        commentaireService.supprimerParAdmin(id);
        return ResponseEntity.noContent().build();
    }
}