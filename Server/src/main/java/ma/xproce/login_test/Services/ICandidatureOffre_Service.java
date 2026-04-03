package ma.xproce.login_test.Services;

import ma.xproce.login_test.dao.entities.CandidatureStatus;
import ma.xproce.login_test.dto.CandidatureDtos.CandidatureHrResponse;
import ma.xproce.login_test.dto.CandidatureDtos.CandidatureResponse;
import ma.xproce.login_test.dto.CandidatureDtos.UpdateCandidatureStatusRequest;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface ICandidatureOffre_Service {

    List<CandidatureHrResponse> listCandidaturesForOffre(Long offreId, String emailConnecte);

    // Candidat — créer une candidature avec CV
    CandidatureResponse createCandidature(Long offreId, MultipartFile cvFile, String emailCandidat);

    // Candidat — lister toutes ses candidatures
    List<CandidatureResponse> listMyCandidatures(String emailCandidat);

    // HR — changer le statut d'une candidature
    CandidatureResponse updateCandidatureStatus(Long candidatureId, CandidatureStatus newStatus, String emailHr);
}
