package eventlink.web.controllers;

import eventlink.dao.entities.Categorie;
import eventlink.dao.entities.Evenement;
import eventlink.service.EvenementService;
import eventlink.service.InscriptionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/evenements")
@RequiredArgsConstructor
public class EvenementController {

    private final EvenementService evenementService;
    private final InscriptionService inscriptionService;

    // GET /api/evenements
    @GetMapping
    public ResponseEntity<List<Evenement>> getAll() {
        return ResponseEntity.ok(evenementService.getAll());
    }

    // GET /api/evenements/{id}
    @GetMapping("/{id}")
    public ResponseEntity<Evenement> getById(@PathVariable Long id) {
        return ResponseEntity.ok(evenementService.getById(id));
    }

    // GET /api/evenements/upcoming
    @GetMapping("/upcoming")
    public ResponseEntity<List<Evenement>> getUpcoming() {
        return ResponseEntity.ok(evenementService.getUpcoming());
    }

    // GET /api/evenements/search?titre=xxx
    @GetMapping("/search")
    public ResponseEntity<List<Evenement>> searchByTitre(@RequestParam String titre) {
        return ResponseEntity.ok(evenementService.searchByTitre(titre));
    }

    // GET /api/evenements/categorie/{categorie}
    @GetMapping("/categorie/{categorie}")
    public ResponseEntity<List<Evenement>> getByCategorie(@PathVariable Categorie categorie) {
        return ResponseEntity.ok(evenementService.getByCategorie(categorie));
    }

    // GET /api/evenements/{id}/places
    @GetMapping("/{id}/places")
    public ResponseEntity<Integer> getPlacesRestantes(@PathVariable Long id) {
        return ResponseEntity.ok(inscriptionService.getPlacesRestantes(id));
    }

    // POST /api/evenements  (ADMIN)
    @PostMapping
    public ResponseEntity<Evenement> create(@Valid @RequestBody Evenement evenement) {
        return ResponseEntity.status(HttpStatus.CREATED).body(evenementService.create(evenement));
    }

    // PUT /api/evenements/{id}  (ADMIN)
    @PutMapping("/{id}")
    public ResponseEntity<Evenement> update(@PathVariable Long id,
                                            @Valid @RequestBody Evenement evenement) {
        return ResponseEntity.ok(evenementService.update(id, evenement));
    }

    // DELETE /api/evenements/{id}  (ADMIN)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        evenementService.delete(id);
        return ResponseEntity.noContent().build();
    }
}