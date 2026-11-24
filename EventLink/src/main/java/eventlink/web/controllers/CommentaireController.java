package eventlink.web.controllers;

import eventlink.dao.entities.Commentaire;
import eventlink.security.AuthenticatedUserService;
import eventlink.service.CommentaireService;
import eventlink.service.UserService;
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
    private final UserService userService;
    private final AuthenticatedUserService authenticatedUserService;

    // POST /api/commentaires
    // Body: { "userId": 1, "evenementId": 2, "contenu": "Super événement !" }
    @PostMapping
    public ResponseEntity<Commentaire> ajouter(
            @RequestBody Map<String, String> body) {

        Long userId = authenticatedUserService.getCurrentUserId();
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

    // GET /api/commentaires/me
    @GetMapping("/me")
    public ResponseEntity<List<Commentaire>> getMyComments() {

        Long userId = authenticatedUserService.getCurrentUserId();

        return ResponseEntity.ok(commentaireService.getByUser(userId));
    }
    // PUT /api/commentaires/{id}
    // Body: { "userId": 1, "contenu": "Contenu modifié" }
    @PutMapping("/{id}")
    public ResponseEntity<Commentaire> modifier(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {

        Long userId = authenticatedUserService.getCurrentUserId();
        String contenu = body.get("contenu");

        return ResponseEntity.ok(
                commentaireService.modifier(id, userId, contenu));
    }

    // DELETE /api/commentaires/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(@PathVariable Long id) {

        Long userId = authenticatedUserService.getCurrentUserId();

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