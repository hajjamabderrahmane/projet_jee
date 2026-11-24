package eventlink.web.controllers;

import eventlink.dao.entities.User;
import eventlink.security.AuthenticatedUserService;
import eventlink.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final AuthenticatedUserService authenticatedUserService;


    // GET /api/users/me
    @GetMapping("/me")
    public ResponseEntity<User> getCurrentUser() {
        return ResponseEntity.ok(authenticatedUserService.getCurrentUser());
    }

    // GET /api/users/{id}
    @GetMapping("/{id}")
    public ResponseEntity<User> getById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getById(id));
    }

    // GET /api/users/participants
    @GetMapping("/participants")
    public ResponseEntity<List<User>> getAllParticipants() {
        return ResponseEntity.ok(userService.getAllParticipants());
    }

    // DELETE /api/users/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        userService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
