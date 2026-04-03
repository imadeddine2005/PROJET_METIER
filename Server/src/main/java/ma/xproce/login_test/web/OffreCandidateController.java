package ma.xproce.login_test.web;

import ma.xproce.login_test.Services.Ioffre_Service;
import ma.xproce.login_test.dto.ApiResponse;
import ma.xproce.login_test.dto.OffreDtos.OffreResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/candidate/api/offres")
public class OffreCandidateController {
    private final Ioffre_Service offreService;

    public OffreCandidateController(Ioffre_Service offreService) {
        this.offreService = offreService;
    }

    // Candidat — voir TOUTES les offres
    @GetMapping
    @PreAuthorize("hasRole('CANDIDAT')")
    public ResponseEntity<ApiResponse<List<OffreResponse>>> getAllOffres() {
        List<OffreResponse> offres = offreService.getAllOffres();
        return ResponseEntity.ok(ApiResponse.success("Toutes les offres", offres));
    }

    // Candidat — voir détail d'une offre
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('CANDIDAT')")
    public ResponseEntity<ApiResponse<OffreResponse>> getOffreById(
            @PathVariable Long id
    ) {
        OffreResponse offre = offreService.getOffreByIdPublic(id);
        return ResponseEntity.ok(ApiResponse.success("Offre", offre));
    }
}
