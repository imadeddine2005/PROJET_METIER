package ma.xproce.login_test.web;

import ma.xproce.login_test.Services.AiService;
import ma.xproce.login_test.Services.IEmailService;
import ma.xproce.login_test.dao.entities.Candidature;
import ma.xproce.login_test.dao.reposetories.CandidatureRepository;
import ma.xproce.login_test.dto.EmailDtos.GenerateEmailRequest;
import ma.xproce.login_test.dto.EmailDtos.SendEmailRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import ma.xproce.login_test.Exeptions.ResourceNotFoundException;
import ma.xproce.login_test.dto.ApiResponse;

import org.springframework.beans.factory.annotation.Value;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/hr/api/candidatures")
@CrossOrigin("*")
public class EmailController {

    @Autowired
    private CandidatureRepository candidatureRepository;

    @Autowired
    private IEmailService emailService;

    @Value("${app.ai.base-url:http://localhost:5001}")
    private String aiBaseUrl;

    @PostMapping("/{id}/generate-email")
    public ResponseEntity<ApiResponse<Map<String, String>>> generateEmail(@PathVariable Long id, @RequestBody GenerateEmailRequest request) {
        Candidature candidature = candidatureRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Candidature non trouvée avec l'ID: " + id));

        String candidateName = candidature.getCandidat().getName();
        String jobTitle = candidature.getOffre().getTitre();
        String decision = candidature.getStatus().toString();

        // Appel au service IA
        Map<String, Object> payload = new HashMap<>();
        payload.put("candidate_name", candidateName);
        payload.put("job_title", jobTitle);
        payload.put("decision", decision);
        payload.put("language", request.getLanguage());
        payload.put("reasons", candidature.getScoreAnalysis() != null ? candidature.getScoreAnalysis() : "");

        RestTemplate restTemplate = new RestTemplate();
        String aiUrl = aiBaseUrl + "/api/generate-email";
        
        ResponseEntity<Map> aiResponse = restTemplate.postForEntity(aiUrl, payload, Map.class);
        
        if (aiResponse.getStatusCode() == HttpStatus.OK && aiResponse.getBody() != null) {
            String generatedEmail = (String) aiResponse.getBody().get("email");
            Map<String, String> result = new HashMap<>();
            result.put("email", generatedEmail);
            return ResponseEntity.ok(ApiResponse.success("E-mail généré avec succès par l'IA", result));
        } else {
            throw new RuntimeException("Erreur lors de la génération de l'e-mail par l'IA.");
        }
    }

    @PostMapping("/{id}/send-email")
    public ResponseEntity<ApiResponse<String>> sendEmail(@PathVariable Long id, @RequestBody SendEmailRequest request) {
        Candidature candidature = candidatureRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Candidature non trouvée avec l'ID: " + id));

        String candidateEmail = candidature.getCandidat().getEmail();
        
        emailService.sendEmail(candidateEmail, request.getSubject(), request.getBody());
        
        candidature.setEmailSentContent(request.getBody());
        candidatureRepository.save(candidature);
        
        return ResponseEntity.ok(ApiResponse.success("E-mail envoyé avec succès à " + candidateEmail, null));
    }
}
