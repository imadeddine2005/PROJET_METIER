package ma.xproce.login_test.Services;

import ma.xproce.login_test.dao.entities.CandidatureStatus;
import ma.xproce.login_test.dto.CandidatureDtos.CandidatureHrResponse;
import ma.xproce.login_test.dto.CandidatureDtos.CandidatureResponse;
import ma.xproce.login_test.dto.CandidatureDtos.UpdateCandidatureStatusRequest;
import ma.xproce.login_test.dto.CvDownloadResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface ICandidatureOffre_Service {

    List<CandidatureHrResponse> listCandidaturesForOffre(Long offreId, String emailConnecte);

    // Candidat — créer une candidature avec CV
    CandidatureResponse createCandidature(Long offreId, MultipartFile cvFile, String emailCandidat);

    // Candidat — lister toutes ses candidatures
    List<CandidatureResponse> listMyCandidatures(String emailCandidat);

    // Pour l'historique RH
    List<CandidatureHrResponse> getHistoriqueDecisionsForOffre(Long offreId, String emailHr);

    // HR — changer le statut d'une candidature (retourne la vue RH, pas la vue candidat)
    CandidatureHrResponse updateCandidatureStatus(Long candidatureId, CandidatureStatus newStatus, String emailHr);

    // Candidat — télécharger/visualiser son propre CV
    CvDownloadResponse getMyCv(Long candidatureId, String emailCandidat);
}
