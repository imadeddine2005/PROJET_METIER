package ma.xproce.login_test.web;

import ma.xproce.login_test.Services.IDemandeAccesCvService;
import ma.xproce.login_test.dto.ApiResponse;
import ma.xproce.login_test.dto.CvDownloadResponse;
import ma.xproce.login_test.dto.DemandeAccesCvDtos.DemandeAccesCvRequest;
import ma.xproce.login_test.dto.DemandeAccesCvDtos.DemandeAccesCvResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/hr/api/demandes-acces-cv")
public class DemandeAccesCvHr_Controller {

    private final IDemandeAccesCvService demandeService;

    public DemandeAccesCvHr_Controller(IDemandeAccesCvService demandeService) {
        this.demandeService = demandeService;
    }

    // HR crée une demande d'accès
    @PostMapping
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<ApiResponse<DemandeAccesCvResponse>> creerDemande(
            @RequestBody @Valid DemandeAccesCvRequest request,
            Authentication auth
    ) {
        DemandeAccesCvResponse response = demandeService.creerDemande(
            request.getCandidatureId(),
            request.getMotif(),
            auth.getName()
        );
        return new ResponseEntity<>(
            ApiResponse.success("Demande créée", response),
            HttpStatus.CREATED
        );
    }

    // HR voit ses demandes
    @GetMapping
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<ApiResponse<List<DemandeAccesCvResponse>>> mesDemandes(
            Authentication auth
    ) {
        List<DemandeAccesCvResponse> demandes = demandeService.mesDemandes(auth.getName());
        return ResponseEntity.ok(ApiResponse.success("Mes demandes d'accès", demandes));
    }

    // HR télécharge le CV (seulement si demande approuvée)
    @GetMapping("/{demandeId}/cv")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<byte[]> downloadCv(
            @PathVariable Long demandeId,
            Authentication auth
    ) {
        CvDownloadResponse response = demandeService.downloadCvForHr(demandeId, auth.getName());
        
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + response.getFileName() + "\"")
                .body(response.getContent());
    }
}
