package eventlink.service;

import eventlink.dao.entities.Role;
import eventlink.dao.entities.User;
import eventlink.dao.repositories.UserRepository;
import eventlink.exceptions.DuplicateResourceException;
import eventlink.exceptions.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
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

    public void deleteById(Long id) {
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("Utilisateur introuvable : " + id);
        }
        userRepository.deleteById(id);
    }
}