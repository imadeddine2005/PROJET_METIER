package ma.xproce.login_test.web;

import org.springframework.beans.factory.annotation.Value;
import ma.xproce.login_test.Services.AuditService;
import ma.xproce.login_test.dao.entities.user_entity;
import ma.xproce.login_test.dao.reposetories.UserReposetory;

import ma.xproce.login_test.Services.ICandidatureOffre_Service;
import ma.xproce.login_test.Services.ICvFileStorageService;
import ma.xproce.login_test.dto.ApiResponse;
import ma.xproce.login_test.dto.CandidatureDtos.CandidatureResponse;
import ma.xproce.login_test.dto.CvDownloadResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.net.URI;

@RestController
@RequestMapping("/candidate/api/candidatures")
public class CandidatureCandidate_Controller {
    private final ICandidatureOffre_Service candidatureOffreService;
    private final AuditService auditService;
    private final UserReposetory userReposetory;
    private final ICvFileStorageService storageService;

    @Value("${app.storage.type:local}")
    private String storageType;

    public CandidatureCandidate_Controller(ICandidatureOffre_Service candidatureOffreService, AuditService auditService, UserReposetory userReposetory, ICvFileStorageService storageService) {
        this.candidatureOffreService = candidatureOffreService;
        this.auditService = auditService;
        this.userReposetory = userReposetory;
        this.storageService = storageService;
    }

    // Candidat — postuler à une offre avec CV
    @PostMapping("/{offreId}")
    @PreAuthorize("hasRole('CANDIDAT')")
    public ResponseEntity<ApiResponse<CandidatureResponse>> candidater(
            @PathVariable Long offreId,
            @RequestParam("cvFile") MultipartFile cvFile,
            Authentication auth
    ) {
        CandidatureResponse response = candidatureOffreService.createCandidature(offreId, cvFile, auth.getName());
        auditService.log(
                auth.getName(),
                getUserId(auth),
                "CV_UPLOAD",
                String.valueOf(response.getId()),
                "SUCCES",
                "offreId=" + offreId
        );

        return new ResponseEntity<>(ApiResponse.success("Candidature envoyée avec succès", response), HttpStatus.CREATED);
    }

    // Candidat — voir toutes ses candidatures
    @GetMapping
    @PreAuthorize("hasRole('CANDIDAT')")
    public ResponseEntity<ApiResponse<List<CandidatureResponse>>> listMyCandidatures(Authentication auth) {
        List<CandidatureResponse> candidatures = candidatureOffreService.listMyCandidatures(auth.getName());
        return ResponseEntity.ok(ApiResponse.success("Vos candidatures", candidatures));
    }

    /**
     * Candidat — visualiser son propre CV (inline dans le navigateur).
     * URL : GET /candidate/api/candidatures/{candidatureId}/my-cv
     * Sécurité : Vérifie que la candidature appartient bien au candidat connecté.
     */
    @GetMapping("/{candidatureId}/my-cv")
    @PreAuthorize("hasRole('CANDIDAT')")
    public ResponseEntity<?> getMyCv(
            @PathVariable Long candidatureId,
            Authentication auth
    ) {
        CvDownloadResponse response = candidatureOffreService.getMyCv(candidatureId, auth.getName());

        // ── Mode S3 : retourner un lien pré-signé ────────────────────────
        if ("s3".equals(storageType) && response.getStorageKey() != null) {
            String presignedUrl = storageService.generatePresignedUrl(response.getStorageKey());
            if (presignedUrl != null) {
                return ResponseEntity.ok(
                        Map.of(
                                "presignedUrl", presignedUrl,
                                "fileName", response.getFileName(),
                                "expiresInMinutes", 15
                        )
                );
            }

                return ResponseEntity.status(HttpStatus.FOUND)
                    .location(URI.create(presignedUrl))
                  .build();
            }

            // ── Mode local : retourner les bytes ─────────────────────────────
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + response.getFileName() + "\"")
                    .body(response.getContent());
        }
    private Long getUserId(Authentication auth){
        return userReposetory
                .findByEmail(auth.getName())
                .map(user_entity::getId)
                .orElse(null);
    }

}
