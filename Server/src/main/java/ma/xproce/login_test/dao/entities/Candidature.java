package ma.xproce.login_test.dao.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "candidatures",
        uniqueConstraints = @UniqueConstraint(columnNames = {"offre_id", "candidat_id"})
)
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Candidature {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "offre_id", nullable = false)
    private Offre offre;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "candidat_id", nullable = false)
    private user_entity candidat;

    @OneToOne(fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "cv_file_id")
    private CvFile cvFile;

    private LocalDateTime dateSoumission;

    /**
     * Score de compatibilite CV ↔ offre (0..100).
     * Peut être null si l'IA n'a pas encore calculé.
     */
    private Double scoreCompatibilite;

    @Enumerated(EnumType.STRING)
    private CandidatureStatus status = CandidatureStatus.EN_COURS;
}

