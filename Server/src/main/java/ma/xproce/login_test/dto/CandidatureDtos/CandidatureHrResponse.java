package ma.xproce.login_test.dto.CandidatureDtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Vue RH : pas de nom / email candidat, pas de nom de fichier CV original.
 * Inclut toutes les données d'analyse IA pour aider la décision de recrutement.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class CandidatureHrResponse {

    private Long id;
    private Long offreId;

    /** Référence opaque (ex: C-12), pas le vrai nom. */
    private String candidatRef;

    // ─── Score IA ───────────────────────────────────────────
    private Double scoreCompatibilite;

    /** Explication IA de pourquoi ce score a été donné */
    private String scoreAnalysis;

    // ─── Données extraites du CV (aide à la décision RH) ────
    /** Compétences techniques identifiées dans le CV anonymisé */
    private List<String> competences;

    /** Diplômes et formations identifiés dans le CV anonymisé */
    private List<String> diplomes;

    // ─── Statut & Dates ─────────────────────────────────────
    private String status;
    private LocalDateTime dateSoumission;

    /** Id technique du fichier CV anonymisé (à utiliser pour télécharger le PDF censuré). */
    private Long cvFileId;

    /** Vrai si l'administrateur a approuvé la demande d'accès au CV original pour ce RH */
    private boolean hasAccessToOriginalCv;

    /** Le statut de la demande d'accès (EN_ATTENTE, APPROUVEE, REJETEE, ou null) */
    private String accessRequestStatus;

    /** ID de la demande d'accès, utilisé pour télécharger le CV original si l'accès est accordé */
    private Long demandeAccesId;
}
