package eventlink.dao.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "inscriptions",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_inscription_user_evenement",
                columnNames = {"user_id", "evenement_id"}
        )
)
@Getter
@Setter
@NoArgsConstructor
public class Inscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDateTime dateInscription;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutInscription statut = StatutInscription.EN_ATTENTE;

    @NotBlank(message = "Le lien LinkedIn est obligatoire")
    @Column(nullable = false)
    private String lienLinkedIn;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "evenement_id", nullable = false)
    private Evenement evenement;

    @PrePersist
    protected void onCreate() {
        if (dateInscription == null) {
            dateInscription = LocalDateTime.now();
        }
    }
}