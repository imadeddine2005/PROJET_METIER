package ma.xproce.login_test.Services;

import ma.xproce.login_test.dto.OffreDtos.OffreRequest;
import ma.xproce.login_test.dto.OffreDtos.OffreResponse;

import java.util.List;

public interface Ioffre_Service {
    OffreResponse createOffre(OffreRequest request, String emailHR);

    OffreResponse updateOffre(Long id, OffreRequest request, String emailConnecte);

    OffreResponse deleteOffre(Long id, String emailConnecte);

    List<OffreResponse> mesOffres(String emailConnecte);

    OffreResponse getOffreById(Long id, String emailConnecte);

    // Candidat — voir toutes les offres publiquement
    List<OffreResponse> getAllOffres();

    // Candidat — voir détail d'une offre publiquement
    OffreResponse getOffreByIdPublic(Long id);
}
