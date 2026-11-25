package eventlink.dao.repositories;

import eventlink.dao.entities.Inscription;
import eventlink.dao.entities.StatutInscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InscriptionRepository extends JpaRepository<Inscription, Long> {
    List<Inscription> findByUserId(Long userId);
    List<Inscription> findByEvenementId(Long evenementId);
    List<Inscription> findByEvenementIdAndStatut(Long evenementId, StatutInscription statut);
    Optional<Inscription> findByUserIdAndEvenementId(Long userId, Long evenementId);
    boolean existsByUserIdAndEvenementId(Long userId, Long evenementId);

    boolean existsByEvenementId(Long evenementId);
    boolean existsByUserId(Long userId);
    void deleteByUserId(Long userId);
    int countByEvenementIdAndStatut(Long evenementId, StatutInscription statut);
}