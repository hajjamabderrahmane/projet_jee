package eventlink.service;

import eventlink.dao.entities.Commentaire;
import eventlink.dao.entities.Evenement;
import eventlink.dao.entities.User;
import eventlink.dao.repositories.CommentaireRepository;
import eventlink.dao.repositories.EvenementRepository;
import eventlink.exceptions.ResourceNotFoundException;
import eventlink.exceptions.UnauthorizedActionException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import eventlink.exceptions.InvalidRequestException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CommentaireService {

    private final CommentaireRepository commentaireRepository;
    private final EvenementRepository evenementRepository;
    private final UserService userService;

    private void validerContenu(String contenu) {
        if (contenu == null || contenu.isBlank()) {
            throw new InvalidRequestException(
                    "Le commentaire ne peut pas être vide."
            );
        }

        if (contenu.length() > 1000) {
            throw new InvalidRequestException(
                    "Le commentaire ne doit pas dépasser 1000 caractères."
            );
        }
    }

    public Commentaire ajouter(Long userId, Long evenementId, String contenu) {
        validerContenu(contenu);
        User user = userService.getById(userId);
        Evenement evenement = evenementRepository.findById(evenementId)
                .orElseThrow(() -> new ResourceNotFoundException("Événement introuvable : " + evenementId));

        Commentaire commentaire = new Commentaire();
        commentaire.setUser(user);
        commentaire.setEvenement(evenement);
        commentaire.setContenu(contenu);
        // dateCreation gérée par @PrePersist dans l'entité

        return commentaireRepository.save(commentaire);
    }

    public Commentaire modifier(Long commentaireId, Long userId, String nouveauContenu) {
        Commentaire commentaire = getById(commentaireId);
        checkOwnership(commentaire, userId);
        validerContenu(nouveauContenu);
        commentaire.setContenu(nouveauContenu);
        return commentaireRepository.save(commentaire);
    }

    public void supprimer(Long commentaireId, Long userId) {
        Commentaire commentaire = getById(commentaireId);
        checkOwnership(commentaire, userId);
        commentaireRepository.deleteById(commentaireId);
    }

    public void supprimerParAdmin(Long commentaireId) {
        if (!commentaireRepository.existsById(commentaireId)) {
            throw new ResourceNotFoundException("Commentaire introuvable : " + commentaireId);
        }
        commentaireRepository.deleteById(commentaireId);
    }

    public List<Commentaire> getByEvenement(Long evenementId) {
        return commentaireRepository.findByEvenementIdOrderByDateCreationDesc(evenementId);
    }

    public List<Commentaire> getByUser(Long userId) {
        return commentaireRepository.findByUserId(userId);
    }

    public Commentaire getById(Long id) {
        return commentaireRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Commentaire introuvable : " + id));
    }

    private void checkOwnership(Commentaire commentaire, Long userId) {
        if (!commentaire.getUser().getId().equals(userId)) {
            throw new UnauthorizedActionException("Vous ne pouvez modifier que vos propres commentaires.");
        }
    }
}