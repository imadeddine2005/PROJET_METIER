package ma.xproce.login_test.dao.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "demande_acces_cv",
        uniqueConstraints = @UniqueConstraint(columnNames = {"candidature_id", "hr_id"})
)
@Data
@AllArgsConstructor
@NoArgsConstructor
public class DemandeAccesCv {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "candidature_id", nullable = false)
    private Candidature candidature;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "hr_id", nullable = false)
    private user_entity hr;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admin_id")
    private user_entity admin;

    @Enumerated(EnumType.STRING)
    private DemandeAccesCvStatus status = DemandeAccesCvStatus.EN_ATTENTE;

    private LocalDateTime createdAt;
    private LocalDateTime decidedAt;

    @Column(columnDefinition = "TEXT")
    private String motif;  // Raison de la demande (du HR)

    @Column(columnDefinition = "TEXT")
    private String decisionNote;  // Note de la décision (de l'admin)
}

