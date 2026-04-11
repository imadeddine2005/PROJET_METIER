package ma.xproce.login_test.web;

import ma.xproce.login_test.Services.AuditService;
import ma.xproce.login_test.Services.ICandidatureOffre_Service;
import ma.xproce.login_test.dao.entities.user_entity;
import ma.xproce.login_test.dao.reposetories.UserReposetory;
import ma.xproce.login_test.dto.ApiResponse;
import ma.xproce.login_test.dto.CandidatureDtos.CandidatureResponse;
import org.springframework.http.HttpStatus;
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

import java.util.List;

@RestController
@RequestMapping("/candidate/api/candidatures")
public class CandidatureCandidate_Controller {
    private final ICandidatureOffre_Service candidatureOffreService;
    private final AuditService auditService;
    private final UserReposetory userReposetory;
    public CandidatureCandidate_Controller(ICandidatureOffre_Service candidatureOffreService, AuditService auditService, UserReposetory userReposetory) {
        this.candidatureOffreService = candidatureOffreService;
        this.auditService = auditService;
        this.userReposetory = userReposetory;
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

    private Long getUserId(Authentication auth){
        return userReposetory
                .findByEmail(auth.getName())
                .map(user_entity::getId)
                .orElse(null);
    }
}

