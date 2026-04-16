package ma.xproce.login_test.dao.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

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

    /** Score de compatibilité CV ↔ offre (0..100). Null si IA indisponible. */
    private Double scoreCompatibilite;

    /** Analyse textuelle du score par l'IA (ex: "Bon profil Kotlin. Manque AWS.") */
    @Column(columnDefinition = "TEXT")
    private String scoreAnalysis;

    /**
     * Compétences extraites par l'IA depuis le CV, stockées en JSON simple.
     * Ex: ["Python", "Docker", "React"]
     * Utiliser columnDefinition TEXT car la liste peut être longue.
     */
    @Column(columnDefinition = "TEXT")
    private String competences;  // JSON array → "Python,Docker,React" (séparés par virgule)

    /**
     * Diplômes/formations extraits par l'IA depuis le CV.
     * Ex: ["Master Informatique ENSAM", "Licence MIAGE"]
     */
    @Column(columnDefinition = "TEXT")
    private String diplomes;

    @Enumerated(EnumType.STRING)
    private CandidatureStatus status = CandidatureStatus.EN_COURS;

    @OneToMany(mappedBy = "candidature", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DemandeAccesCv> demandesAccesCv;
}
