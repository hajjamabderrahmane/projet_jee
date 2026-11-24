package eventlink.dao.repositories;

import eventlink.dao.entities.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserIdOrderByDateCreationDesc(Long userId);
    List<Notification> findByUserIdAndLueFalse(Long userId);
    int countByUserIdAndLueFalse(Long userId);
    boolean existsByUserId(Long userId);
}