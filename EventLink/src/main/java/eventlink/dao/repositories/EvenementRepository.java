package eventlink.dao.repositories;

import eventlink.dao.entities.Evenement;
import eventlink.dao.entities.CategorieEvenement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EvenementRepository extends JpaRepository<Evenement, Long> {
    List<Evenement> findByCategorie(CategorieEvenement categorie);
    List<Evenement> findByTitreContainingIgnoreCase(String titre);
    List<Evenement> findByDateAfter(LocalDateTime date);
    List<Evenement> findByCategorieAndDateAfter(CategorieEvenement categorie, LocalDateTime date);
}