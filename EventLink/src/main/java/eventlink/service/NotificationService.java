package eventlink.service;

import eventlink.dao.entities.Notification;
import eventlink.dao.entities.User;
import eventlink.dao.repositories.NotificationRepository;
import eventlink.exceptions.ResourceNotFoundException;
import eventlink.exceptions.UnauthorizedActionException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public void notifier(User user, String message) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setMessage(message);
        // dateCreation et lue=false gérés par @PrePersist dans l'entité

        notificationRepository.save(notification);
    }

    public List<Notification> getByUser(Long userId) {
        return notificationRepository.findByUserIdOrderByDateCreationDesc(userId);
    }

    public List<Notification> getNonLues(Long userId) {
        return notificationRepository.findByUserIdAndLueFalse(userId);
    }


    public int countNonLues(Long userId) {
        return notificationRepository.countByUserIdAndLueFalse(userId);
    }


    public Notification marquerLue(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Notification introuvable : " + notificationId));

        if (!notification.getUser().getId().equals(userId)) {
            throw new UnauthorizedActionException(
                    "Vous ne pouvez modifier que vos propres notifications.");
        }

        notification.setLue(true);
        return notificationRepository.save(notification);
    }

    public void marquerToutesLues(Long userId) {
        List<Notification> nonLues = notificationRepository.findByUserIdAndLueFalse(userId);
        nonLues.forEach(n -> n.setLue(true));
        notificationRepository.saveAll(nonLues);
    }
}