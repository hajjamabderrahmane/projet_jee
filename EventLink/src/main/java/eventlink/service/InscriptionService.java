package eventlink.service;

import eventlink.dao.entities.*;
import eventlink.dao.repositories.EvenementRepository;
import eventlink.dao.repositories.InscriptionRepository;
import eventlink.exceptions.CapacityExceededException;
import eventlink.exceptions.DuplicateResourceException;
import eventlink.exceptions.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class InscriptionService {

    private final InscriptionRepository inscriptionRepository;
    private final EvenementRepository evenementRepository;
    private final UserService userService;
    private final NotificationService notificationService;

    @Transactional
    public Inscription inscrire(Long userId, Long evenementId, String lienLinkedIn) {
        if (inscriptionRepository.existsByUserIdAndEvenementId(userId, evenementId)) {
            throw new DuplicateResourceException("Vous êtes déjà inscrit à cet événement.");
        }

        Evenement evenement = evenementRepository.findById(evenementId)
                .orElseThrow(() -> new ResourceNotFoundException("Événement introuvable : " + evenementId));

        int placesOccupees = inscriptionRepository.countValidatedByEvenementId(evenementId);
        if (placesOccupees >= evenement.getCapacite()) {
            throw new CapacityExceededException("Événement complet ! Le nombre maximal de participants a été atteint.");
        }

        User user = userService.getById(userId);
        Inscription inscription = new Inscription();
        inscription.setUser(user);
        inscription.setEvenement(evenement);
        inscription.setLienLinkedIn(lienLinkedIn);
        // dateInscription et statut EN_ATTENTE gérés par @PrePersist dans l'entité

        return inscriptionRepository.save(inscription);
    }

    @Transactional
    public Inscription valider(Long inscriptionId) {
        Inscription inscription = getById(inscriptionId);
        if (inscription.getStatut() != StatutInscription.EN_ATTENTE) {
            throw new DuplicateResourceException(
                    "Cette inscription a déjà été traitée."
            );
        }

        int placesOccupees = inscriptionRepository.countValidatedByEvenementId(
                inscription.getEvenement().getId());
        if (placesOccupees >= inscription.getEvenement().getCapacite()) {
            throw new CapacityExceededException("Plus de places disponibles pour valider cette inscription.");
        }

        inscription.setStatut(StatutInscription.VALIDEE);
        Inscription saved = inscriptionRepository.save(inscription);

        notificationService.notifier(
                inscription.getUser(),
                "Votre inscription à « " + inscription.getEvenement().getTitre() + " » a été validée."
        );
        return saved;
    }

    @Transactional
    public Inscription refuser(Long inscriptionId) {
        Inscription inscription = getById(inscriptionId);
        if (inscription.getStatut() != StatutInscription.EN_ATTENTE) {
            throw new DuplicateResourceException(
                    "Cette inscription a déjà été traitée."
            );
        }
        inscription.setStatut(StatutInscription.REFUSEE);
        Inscription saved = inscriptionRepository.save(inscription);

        notificationService.notifier(
                inscription.getUser(),
                "Votre inscription à « " + inscription.getEvenement().getTitre() + " » a été refusée."
        );
        return saved;
    }

    public List<Inscription> getByUser(Long userId) {
        return inscriptionRepository.findByUserId(userId);
    }

    public List<Inscription> getByEvenement(Long evenementId) {
        return inscriptionRepository.findByEvenementId(evenementId);
    }

    public List<Inscription> getValideesByEvenement(Long evenementId) {
        return inscriptionRepository.findByEvenementIdAndStatut(evenementId, StatutInscription.VALIDEE);
    }

    public Inscription getById(Long id) {
        return inscriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inscription introuvable : " + id));
    }

    public int getPlacesRestantes(Long evenementId) {
        Evenement evenement = evenementRepository.findById(evenementId)
                .orElseThrow(() -> new ResourceNotFoundException("Événement introuvable : " + evenementId));
        int occupees = inscriptionRepository.countValidatedByEvenementId(evenementId);
        return evenement.getCapacite() - occupees;
    }
}