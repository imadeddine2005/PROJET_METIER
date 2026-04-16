package ma.xproce.login_test.web;

import ma.xproce.login_test.Exeptions.InvalidFileException;
import ma.xproce.login_test.Services.AiService;
import ma.xproce.login_test.Services.CvFileValidationService;
import ma.xproce.login_test.Services.PdfTextExtractorService;
import ma.xproce.login_test.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

/**
 * Outils IA pour le candidat — AUCUN stockage en base de données.
 * Le traitement est 100% stateless : PDF in → résultat out.
 *
 * URL de base : /candidate/api/cv-tools
 */
@RestController
@RequestMapping("/candidate/api/cv-tools")
public class CvToolsCandidate_Controller {

    private final AiService aiService;
    private final PdfTextExtractorService pdfExtractor;
    private final CvFileValidationService cvFileValidator;

    public CvToolsCandidate_Controller(AiService aiService,
                                       PdfTextExtractorService pdfExtractor,
                                       CvFileValidationService cvFileValidator) {
        this.aiService = aiService;
        this.pdfExtractor = pdfExtractor;
        this.cvFileValidator = cvFileValidator;
    }

    /**
     * Prédit le métier idéal d'un candidat à partir de son CV (PDF).
     *
     * Flux :
     *   1. Spring Boot extrait le texte du PDF (PDFBox)
     *   2. Appelle Flask POST /api/predict-job { cv_text }
     *   3. Retourne la prédiction au candidat
     *
     * AUCUNE donnée n'est sauvegardée en base.
     *
     * URL : POST /candidate/api/cv-tools/predict-job
     * Body : form-data  → cvFile (PDF)
     *
     * Exemple de réponse :
     * {
     *   "metier_ideal":    "Développeur Full-Stack",
     *   "confiance":       87.5,
     *   "explication":     "Vos compétences en React, Node.js et Docker correspondent...",
     *   "toutes_categories": [
     *       { "metier": "Développeur Backend",  "score": 78.0 },
     *       { "metier": "Data Engineer",         "score": 62.0 }
     *   ]
     * }
     */
    @PostMapping("/predict-job")
    @PreAuthorize("hasRole('CANDIDAT')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> predictJob(
            @RequestParam("cvFile") MultipartFile cvFile
    ) {
        // 1. Valider le fichier (service centralisé, réutilisé partout)
        cvFileValidator.validate(cvFile);

        // 2. Extraire le texte du PDF (PDFBox — côté Spring Boot)
        String cvText;
        try {
            cvText = pdfExtractor.extractText(cvFile);
        } catch (IOException e) {
            throw new InvalidFileException("Impossible de lire le PDF : " + e.getMessage());
        }

        // 3. Appeler Flask /api/predict-job (stateless, zéro DB)
        Map<String, Object> prediction = aiService.predictJob(cvText);

        // 4. Si l'IA a retourné une erreur, la propager proprement
        if (prediction.containsKey("error")) {
            return ResponseEntity.ok(ApiResponse.error(
                    "Prédiction indisponible : " + prediction.get("error")
            ));
        }

        return ResponseEntity.ok(ApiResponse.success("Métier idéal prédit avec succès", prediction));
    }
}
