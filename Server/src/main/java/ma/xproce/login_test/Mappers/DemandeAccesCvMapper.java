package ma.xproce.login_test.Mappers;

import ma.xproce.login_test.dao.entities.DemandeAccesCv;
import ma.xproce.login_test.dto.DemandeAccesCvDtos.DemandeAccesCvAdminResponse;
import ma.xproce.login_test.dto.DemandeAccesCvDtos.DemandeAccesCvResponse;
import org.springframework.stereotype.Component;

@Component
public class DemandeAccesCvMapper {
    
    // Vue pour HR (anonymisée)
    public DemandeAccesCvResponse toResponse(DemandeAccesCv demande) {
        DemandeAccesCvResponse response = new DemandeAccesCvResponse();
        response.setId(demande.getId());
        response.setCandidatureId(demande.getCandidature().getId());
        response.setCandidatRef("C-" + demande.getCandidature().getCandidat().getId());
        response.setStatus(demande.getStatus());
        response.setDateDemande(demande.getCreatedAt());
        response.setDateDecision(demande.getDecidedAt());
        response.setMotif(demande.getMotif());
        response.setDecisionNote(demande.getDecisionNote());
        return response;
    }
    
    // Vue pour Admin (complète, détails réels)
    public DemandeAccesCvAdminResponse toAdminResponse(DemandeAccesCv demande) {
        DemandeAccesCvAdminResponse response = new DemandeAccesCvAdminResponse();
        response.setId(demande.getId());
        
        // Info HR
        response.setHrEmail(demande.getHr().getEmail());
        response.setHrName(demande.getHr().getName());
        
        // Info Candidat
        response.setCandidatEmail(demande.getCandidature().getCandidat().getEmail());
        response.setCandidatName(demande.getCandidature().getCandidat().getName());
        response.setCandidatRef("C-" + demande.getCandidature().getCandidat().getId());
        response.setCandidatureId(demande.getCandidature().getId());
        
        response.setScoreCompatibilite(demande.getCandidature().getScoreCompatibilite());
        response.setScoreAnalysis(demande.getCandidature().getScoreAnalysis());
        response.setCompetences(demande.getCandidature().getCompetences());
        response.setDiplomes(demande.getCandidature().getDiplomes());
        
        // Info Offre
        response.setOffreTitre(demande.getCandidature().getOffre().getTitre());
        
        // Demande
        response.setMotif(demande.getMotif());
        response.setStatus(demande.getStatus());
        response.setDateDemande(demande.getCreatedAt());
        
        // Décision
        if (demande.getAdmin() != null) {
            response.setAdminEmail(demande.getAdmin().getEmail());
        }
        response.setDateDecision(demande.getDecidedAt());
        response.setDecisionNote(demande.getDecisionNote());
        
        return response;
    }
}
