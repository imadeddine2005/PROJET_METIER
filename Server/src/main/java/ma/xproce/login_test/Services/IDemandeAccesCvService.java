package ma.xproce.login_test.Services;

import ma.xproce.login_test.dto.CvDownloadResponse;
import ma.xproce.login_test.dto.DemandeAccesCvDtos.DemandeAccesCvAdminResponse;
import ma.xproce.login_test.dto.DemandeAccesCvDtos.DemandeAccesCvResponse;

import java.util.List;

public interface IDemandeAccesCvService {
    
    // HR crée une demande d'accès
    DemandeAccesCvResponse creerDemande(Long candidatureId, String motif, String emailHr);
    
    // HR voit ses demandes
    List<DemandeAccesCvResponse> mesDemandes(String emailHr);
    
    // Admin voit demandes EN_ATTENTE (vue complète)
    List<DemandeAccesCvAdminResponse> demandesEnAttente();
    
    // Admin approuve avec raison (retourne vue complète)
    DemandeAccesCvAdminResponse approveDemande(Long demandeId, String emailAdmin, String decisionNote);
    
    // Admin rejette avec raison (retourne vue complète)
    DemandeAccesCvAdminResponse rejectDemande(Long demandeId, String emailAdmin, String decisionNote);
    
    // Admin télécharge le CV (pour consultation avant décision)
    CvDownloadResponse downloadCv(Long demandeId);
    
    // HR télécharge le CV ORIGINAL (seulement si demande APPROUVEE par admin)
    CvDownloadResponse downloadCvForHr(Long demandeId, String emailHr);

    // HR télécharge le CV ANONYMISÉ (accessible sans approbation, données masquées)
    CvDownloadResponse downloadAnonymizedCv(Long candidatureId, String emailHr);
}
