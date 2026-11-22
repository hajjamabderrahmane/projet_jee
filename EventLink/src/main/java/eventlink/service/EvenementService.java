package eventlink.service;

import eventlink.dao.entities.Categorie;
import eventlink.dao.entities.Evenement;
import eventlink.dao.repositories.EvenementRepository;
import eventlink.exceptions.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EvenementService {

    private final EvenementRepository evenementRepository;

    public Evenement create(Evenement evenement) {
        return evenementRepository.save(evenement);
    }

    public Evenement update(Long id, Evenement updated) {
        Evenement existing = getById(id);
        existing.setTitre(updated.getTitre());
        existing.setDescription(updated.getDescription());
        existing.setCategorie(updated.getCategorie());
        existing.setDate(updated.getDate());
        existing.setAdresse(updated.getAdresse());
        existing.setCapacite(updated.getCapacite());
        return evenementRepository.save(existing);
    }

    public void delete(Long id) {
        if (!evenementRepository.existsById(id)) {
            throw new ResourceNotFoundException("Événement introuvable : " + id);
        }
        evenementRepository.deleteById(id);
    }

    public Evenement getById(Long id) {
        return evenementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Événement introuvable : " + id));
    }

    public List<Evenement> getAll() {
        return evenementRepository.findAll();
    }

    public List<Evenement> getByCategorie(Categorie categorie) {
        return evenementRepository.findByCategorie(categorie);
    }

    public List<Evenement> searchByTitre(String titre) {
        return evenementRepository.findByTitreContainingIgnoreCase(titre);
    }

    public List<Evenement> getUpcoming() {
        return evenementRepository.findByDateAfter(LocalDateTime.now());
    }
}