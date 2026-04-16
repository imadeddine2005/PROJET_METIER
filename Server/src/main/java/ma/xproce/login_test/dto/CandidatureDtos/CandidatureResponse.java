package ma.xproce.login_test.dto.CandidatureDtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Vue Candidat : ses propres candidatures avec score IA, compétences et statut.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class CandidatureResponse {
    private Long id;
    private Long offreId;
    private String offreTitre;

    // ─── Score IA ───────────────────────────────────────────
    /** Score global de compatibilité (0-100) */
    private Double scoreCompatibilite;
    // Note : scoreAnalysis est réservé aux RH (CandidatureHrResponse)

    /** Liste des compétences identifiées dans le CV */
    private List<String> competences;

    /** Liste des diplômes/formations identifiés dans le CV */
    private List<String> diplomes;

    // ─── Statut & Dates ─────────────────────────────────────
    private String status;
    private LocalDateTime dateSoumission;

    // ─── Infos CV (sans le fichier binaire) ─────────────────
    private Long cvFileId;
    private String cvFileName;
}
