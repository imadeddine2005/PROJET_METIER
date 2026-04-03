package ma.xproce.login_test.web;

import ma.xproce.login_test.Services.IDemandeAccesCvService;
import ma.xproce.login_test.dto.ApiResponse;
import ma.xproce.login_test.dto.CvDownloadResponse;
import ma.xproce.login_test.dto.DemandeAccesCvDtos.DemandeAccesCvAdminResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/api/demandes-acces-cv")
public class DemandeAccesCvAdmin_Controller {

    private final IDemandeAccesCvService demandeService;

    public DemandeAccesCvAdmin_Controller(IDemandeAccesCvService demandeService) {
        this.demandeService = demandeService;
    }

    // Admin voit demandes EN_ATTENTE
    @GetMapping("/en-attente")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<DemandeAccesCvAdminResponse>>> enAttente() {
        List<DemandeAccesCvAdminResponse> demandes = demandeService.demandesEnAttente();
        return ResponseEntity.ok(ApiResponse.success("Demandes en attente", demandes));
    }

    // Admin approuve avec raison
    @PutMapping("/{demandeId}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<DemandeAccesCvAdminResponse>> approveDemande(
            @PathVariable Long demandeId,
            @RequestParam(required = false, defaultValue = "") String decisionNote,
            Authentication auth
    ) {
        DemandeAccesCvAdminResponse response = demandeService.approveDemande(demandeId, auth.getName(), decisionNote);
        return ResponseEntity.ok(ApiResponse.success("Demande approuvée", response));
    }

    // Admin rejette avec raison
    @PutMapping("/{demandeId}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<DemandeAccesCvAdminResponse>> rejectDemande(
            @PathVariable Long demandeId,
            @RequestParam(required = false, defaultValue = "") String decisionNote,
            Authentication auth
    ) {
        DemandeAccesCvAdminResponse response = demandeService.rejectDemande(demandeId, auth.getName(), decisionNote);
        return ResponseEntity.ok(ApiResponse.success("Demande rejetée", response));
    }

    // Admin télécharge le CV pour consultation
    @GetMapping("/{demandeId}/cv")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<byte[]> downloadCv(@PathVariable Long demandeId) {
        CvDownloadResponse response = demandeService.downloadCv(demandeId);
        
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + response.getFileName() + "\"")
                .body(response.getContent());
    }
}
