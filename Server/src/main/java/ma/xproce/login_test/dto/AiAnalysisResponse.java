package ma.xproce.login_test.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Réponse reçue du service IA Flask (app1.py)
 * après analyse du texte d'un CV.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class AiAnalysisResponse {

    /** Score de compatibilité CV ↔ offre (0-100). Null si aucune offre fournie. */
    private Double score;

    /** Explication courte du score IA */
    private String scoreAnalysis;

    /** Liste des compétences extraites par l'IA */
    private List<String> competences;

    /** Liste des diplômes extraits par l'IA */
    private List<String> diplomes;

    /**
     * Phrases sensibles à caviarder dans le PDF original.
     * Utilisées pour créer la version anonymisée.
     */
    private List<String> sensitivePhrases;

    /**
     * Le contenu du PDF anonymisé encodé en Base64.
     * Généré directement par l'IA.
     */
    private String anonymizedPdfBase64;
}
