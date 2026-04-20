package ma.xproce.login_test.web;

import ma.xproce.login_test.Services.IDemandeAccesCvService;
import ma.xproce.login_test.Services.ICvFileStorageService;
import ma.xproce.login_test.dto.ApiResponse;
import ma.xproce.login_test.dto.CvDownloadResponse;
import ma.xproce.login_test.dto.DemandeAccesCvDtos.DemandeAccesCvRequest;
import ma.xproce.login_test.dto.DemandeAccesCvDtos.DemandeAccesCvResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import java.util.Map;

/**
 * Contrôleur RH pour l'accès aux CVs.
 *
 * Adapté pour AWS S3 :
 *  - En mode S3 (prod), les téléchargements de CVs sont redirigés vers
 *    des liens pré-signés S3 temporaires (15 min) → le fichier ne transite
 *    plus par le serveur Spring Boot, ce qui réduit la charge mémoire et réseau.
 *  - En mode local (dev), le comportement original (byte[]) est conservé.
 */
@RestController
@RequestMapping("/hr/api/demandes-acces-cv")
public class DemandeAccesCvHr_Controller {

    private final IDemandeAccesCvService demandeService;
    private final ICvFileStorageService storageService;

    @Value("${app.storage.type:local}")
    private String storageType;

    public DemandeAccesCvHr_Controller(IDemandeAccesCvService demandeService,
                                       ICvFileStorageService storageService) {
        this.demandeService = demandeService;
        this.storageService = storageService;
    }

    // ── HR crée une demande d'accès ─────────────────────────────────────────
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

    // ── HR liste ses demandes ───────────────────────────────────────────────
    @GetMapping
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<ApiResponse<List<DemandeAccesCvResponse>>> mesDemandes(
            Authentication auth
    ) {
        List<DemandeAccesCvResponse> demandes = demandeService.mesDemandes(auth.getName());
        return ResponseEntity.ok(ApiResponse.success("Mes demandes d'accès", demandes));
    }

    /**
     * CV ANONYMISÉ — accessible sans approbation.
     *
     * En prod S3 : retourne un lien pré-signé (redirect 302) vers S3.
     * En dev local : retourne les bytes du PDF directement.
     *
     * URL : GET /hr/api/demandes-acces-cv/candidature/{candidatureId}/cv-anonymise
     */
    @GetMapping("/candidature/{candidatureId}/cv-anonymise")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<?> downloadCvAnonymise(
            @PathVariable Long candidatureId,
            Authentication auth
    ) {
        CvDownloadResponse response = demandeService.downloadAnonymizedCv(candidatureId, auth.getName());
        return buildCvResponse(response, "cv_anonymise.pdf");
    }

    /**
     * CV ORIGINAL — UNIQUEMENT si la demande est APPROUVÉE par l'admin.
     *
     * En prod S3 : retourne un lien pré-signé (redirect 302) vers S3.
     * En dev local : retourne les bytes du PDF directement.
     *
     * URL : GET /hr/api/demandes-acces-cv/{demandeId}/cv-original
     */
    @GetMapping("/{demandeId}/cv-original")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<?> downloadCvOriginal(
            @PathVariable Long demandeId,
            Authentication auth
    ) {
        CvDownloadResponse response = demandeService.downloadCvForHr(demandeId, auth.getName());
        return buildCvResponse(response, response.getFileName());
    }

    /**
     * Construit la réponse HTTP selon le mode de stockage.
     *
     * Mode S3 (prod) :
     *   Si un storageKey est disponible, génère un lien pré-signé et
     *   redirige le client directement vers S3. Le serveur Spring Boot
     *   ne charge pas le fichier en mémoire.
     *   Retourne 200 avec {"presignedUrl": "https://..."} si le client
     *   ne supporte pas les redirections (ex: Axios).
     *
     * Mode local (dev) :
     *   Retourne les bytes du PDF avec Content-Type application/pdf.
     */
    private ResponseEntity<?> buildCvResponse(CvDownloadResponse response, String filename) {
        // ── Mode S3 : utiliser un lien pré-signé ─────────────────────────
        if ("s3".equals(storageType) && response.getStorageKey() != null) {
            String presignedUrl = storageService.generatePresignedUrl(response.getStorageKey());
            if (presignedUrl != null) {
                // Option A : retourner l'URL en JSON (recommandé pour Axios/React)
                return ResponseEntity.ok(
                        Map.of(
                                "presignedUrl", presignedUrl,
                                "fileName", filename,
                                "expiresInMinutes", 15
                        )
                );
                // Option B : redirect direct (décommenter si le frontend gère les 302)
                // return ResponseEntity.status(HttpStatus.FOUND)
                //         .location(URI.create(presignedUrl))
                //         .build();
            }
        }

        // ── Mode local / fallback : retourner les bytes ───────────────────
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                .body(response.getContent());
    }
}
