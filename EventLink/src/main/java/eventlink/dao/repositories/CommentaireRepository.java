package eventlink.dao.repositories;

import eventlink.dao.entities.Commentaire;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentaireRepository extends JpaRepository<Commentaire, Long> {
    List<Commentaire> findByEvenementIdOrderByDateCreationDesc(Long evenementId);
    List<Commentaire> findByUserId(Long userId);
    boolean existsByEvenementId(Long evenementId);
    boolean existsByUserId(Long userId);
}