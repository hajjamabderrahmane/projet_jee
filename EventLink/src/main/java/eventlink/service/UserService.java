package eventlink.service;

import eventlink.dao.entities.Role;
import eventlink.dao.entities.User;
import eventlink.dao.repositories.UserRepository;
import eventlink.exceptions.DuplicateResourceException;
import eventlink.exceptions.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import eventlink.dao.repositories.InscriptionRepository;
import eventlink.dao.repositories.CommentaireRepository;
import eventlink.dao.repositories.NotificationRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final InscriptionRepository inscriptionRepository;
    private final CommentaireRepository commentaireRepository;
    private final NotificationRepository notificationRepository;
    private final PasswordEncoder passwordEncoder;

    public User register(User user) {
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new DuplicateResourceException("Un compte existe déjà avec cet email.");
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setRole(Role.PARTICIPANT);
        return userRepository.save(user);
    }

    public List<User> getAllParticipants() {
        return userRepository.findByRole(Role.PARTICIPANT);
    }

    public User getById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable : " + id));
    }

    public User getByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable : " + email));
    }

    @Transactional
    public void deleteById(Long id) {

        User user = getById(id);

        commentaireRepository.deleteByUserId(id);
        inscriptionRepository.deleteByUserId(id);
        notificationRepository.deleteByUserId(id);

        userRepository.delete(user);
    }
}