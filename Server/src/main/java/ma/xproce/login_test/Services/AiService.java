package ma.xproce.login_test.Services;

import ma.xproce.login_test.dto.AiAnalysisResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service qui communique avec le service IA Flask (app1.py).
 *
 * En développement  : Flask tourne sur localhost:5001
 * En production AWS : URL vient de application.properties → app.ai.base-url
 */
@Service
public class AiService {

    @Value("${app.ai.base-url:http://localhost:5001}")
    private String aiBaseUrl;

    private final RestTemplate restTemplate;

    public AiService() {
        this.restTemplate = new RestTemplate();
    }

    /**
     * Analyse un CV complet : extraction, score de matching, et anonymisation (tout côté IA).
     *
     * @param cvFile    Le fichier PDF brut envoyé par le candidat
     * @param offerText Description de l'offre (optionnel)
     * @return AiAnalysisResponse avec score, compétences, diplômes, et le PDF anonymisé en Base64
     */
    public AiAnalysisResponse analyzeCv(MultipartFile cvFile, String offerText) {
        try {
            // Configuration Multipart
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            
            // Ajouter le fichier (conversion en ressource pour RestTemplate)
            ByteArrayResource fileResource = new ByteArrayResource(cvFile.getBytes()) {
                @Override
                public String getFilename() {
                    return cvFile.getOriginalFilename();
                }
            };
            body.add("file", fileResource);
            
            if (offerText != null && !offerText.isBlank()) {
                body.add("offer_text", offerText);
            }

            HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);

            // Appel HTTP vers Flask
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    aiBaseUrl + "/api/process-cv",
                    request,
                    Map.class
            );

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                return mapToAiResponse(response.getBody());
            }

            return buildFallbackResponse();

        } catch (IOException | RestClientException e) {
            System.err.println("⚠️  Service IA indisponible ou erreur d'envoi : " + e.getMessage());
            return buildFallbackResponse();
        }
    }

    /**
     * Prédit le métier idéal pour une candidature (feature optionnelle).
     *
     * @param cvText Texte brut du CV
     * @return Map avec metier_ideal, confiance, explication, toutes_categories
     */
    public Map<String, Object> predictJob(String cvText) {
        try {
            Map<String, String> body = new HashMap<>();
            body.put("cv_text", cvText);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, String>> request = new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    aiBaseUrl + "/api/predict-job",
                    request,
                    Map.class
            );

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                return response.getBody();
            }
            return Map.of("error", "Prédiction indisponible");

        } catch (RestClientException e) {
            System.err.println("⚠️  Service IA (predict-job) indisponible : " + e.getMessage());
            return Map.of("error", "Service IA indisponible");
        }
    }

    // ─── Helpers privés ───────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private AiAnalysisResponse mapToAiResponse(Map<String, Object> body) {
        AiAnalysisResponse resp = new AiAnalysisResponse();
        
        // Score (peut être Integer ou Double selon la réponse JSON)
        Object scoreRaw = body.get("score");
        if (scoreRaw instanceof Number) {
            resp.setScore(((Number) scoreRaw).doubleValue());
        }

        resp.setScoreAnalysis((String) body.get("score_analysis"));
        resp.setCompetences((List<String>) body.getOrDefault("competences", List.of()));
        resp.setDiplomes((List<String>) body.getOrDefault("diplomes", List.of()));
        resp.setSensitivePhrases((List<String>) body.getOrDefault("sensitive_phrases", List.of()));
        resp.setAnonymizedPdfBase64((String) body.get("anonymized_pdf_base64"));

        return resp;
    }

    private AiAnalysisResponse buildFallbackResponse() {
        AiAnalysisResponse fallback = new AiAnalysisResponse();
        fallback.setScore(null);
        fallback.setScoreAnalysis("Analyse IA temporairement indisponible");
        fallback.setCompetences(List.of());
        fallback.setDiplomes(List.of());
        fallback.setSensitivePhrases(List.of());
        return fallback;
    }
}
