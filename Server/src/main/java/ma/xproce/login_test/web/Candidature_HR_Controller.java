package ma.xproce.login_test.web;

import ma.xproce.login_test.Services.ICandidatureOffre_Service;
import ma.xproce.login_test.dao.entities.CandidatureStatus;
import ma.xproce.login_test.dto.ApiResponse;
import ma.xproce.login_test.dto.CandidatureDtos.CandidatureHrResponse;
import ma.xproce.login_test.dto.CandidatureDtos.CandidatureResponse;
import ma.xproce.login_test.dto.CandidatureDtos.UpdateCandidatureStatusRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/hr/api/candidatures")
public class Candidature_HR_Controller {
    private final ICandidatureOffre_Service candidatureOffreService;

    public Candidature_HR_Controller(ICandidatureOffre_Service candidatureOffreService) {
        this.candidatureOffreService = candidatureOffreService;
    }

    // HR seulement — voir candidatures d'UNE offre (sans donnees sensibles candidat)
    @GetMapping("/{offreId}")
    @PreAuthorize("hasAnyRole('HR','ADMIN')")
    public ResponseEntity<ApiResponse<List<CandidatureHrResponse>>> listCandidatures(
            @PathVariable Long offreId,
            Authentication auth
    ) {
        List<CandidatureHrResponse> list = candidatureOffreService.listCandidaturesForOffre(offreId, auth.getName());
        return ResponseEntity.ok(ApiResponse.success("Candidatures de l'offre", list));
    }

    // HR seulement — changer le statut d'une candidature
    @PutMapping("/{candidatureId}/status")
    @PreAuthorize("hasAnyRole('HR','ADMIN')")
    public ResponseEntity<ApiResponse<CandidatureResponse>> updateStatus(
            @PathVariable Long candidatureId,
            @RequestBody UpdateCandidatureStatusRequest request,
            Authentication auth
    ) {
        CandidatureResponse response = candidatureOffreService.updateCandidatureStatus(
            candidatureId, 
            request.getNewStatus(), 
            auth.getName()
        );
        return ResponseEntity.ok(ApiResponse.success("Statut mis à jour", response));
    }
}
