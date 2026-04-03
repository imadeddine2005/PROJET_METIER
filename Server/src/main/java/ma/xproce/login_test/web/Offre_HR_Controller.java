package ma.xproce.login_test.web;

import jakarta.validation.Valid;
import ma.xproce.login_test.Services.Ioffre_Service;
import ma.xproce.login_test.dto.ApiResponse;
import ma.xproce.login_test.dto.OffreDtos.OffreRequest;
import ma.xproce.login_test.dto.OffreDtos.OffreResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/hr/api/offres")
public class Offre_HR_Controller {
    private final Ioffre_Service offreService;

    public Offre_HR_Controller(Ioffre_Service offreService) {
        this.offreService = offreService;
    }

    // HR seulement — liste de ses offres (avant /{id} pour eviter conflit de chemin)
    @GetMapping("/mes-offres")
    @PreAuthorize("hasAnyRole('HR','ADMIN')")
    public ResponseEntity<ApiResponse<List<OffreResponse>>> mesOffres(Authentication auth) {
        List<OffreResponse> offres = offreService.mesOffres(auth.getName());
        return ResponseEntity.ok(ApiResponse.success("Mes offres", offres));
    }

    // HR seulement — detail d'une offre (proprietaire ou ADMIN)
    @GetMapping("/{id:\\d+}")
    @PreAuthorize("hasAnyRole('HR','ADMIN')")
    public ResponseEntity<ApiResponse<OffreResponse>> getOffreById(
            @PathVariable Long id,
            Authentication auth
    ) {
        OffreResponse response = offreService.getOffreById(id, auth.getName());
        return ResponseEntity.ok(ApiResponse.success("Offre", response));
    }

    // HR seulement — creer une offre
    @PostMapping
    @PreAuthorize("hasAnyRole('HR','ADMIN')")
    public ResponseEntity<ApiResponse<OffreResponse>> createOffre(
            @Valid @RequestBody OffreRequest request,
            Authentication auth
    ) {
        String emailHR = auth.getName();
        OffreResponse response = offreService.createOffre(request, emailHR);
        return new ResponseEntity<>(ApiResponse.success("Offre creee avec succes", response), HttpStatus.CREATED);
    }

    // HR seulement — modifier une offre (et ADMIN)
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('HR','ADMIN')")
    public ResponseEntity<ApiResponse<OffreResponse>> updateOffre(
            @PathVariable Long id,
            @Valid @RequestBody OffreRequest request,
            Authentication auth
    ) {
        OffreResponse response = offreService.updateOffre(id, request, auth.getName());
        return ResponseEntity.ok(ApiResponse.success("Offre mise a jour avec succes", response));
    }

    // HR seulement — supprimer une offre (et ADMIN)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('HR','ADMIN')")
    public ResponseEntity<ApiResponse<OffreResponse>> deleteOffre(
            @PathVariable Long id,
            Authentication auth
    ) {
        OffreResponse response = offreService.deleteOffre(id, auth.getName());
        return ResponseEntity.ok(ApiResponse.success("Offre supprimee avec succes", response));
    }
}
