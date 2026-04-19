package ma.xproce.login_test.dto.DemandeAccesCvDtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import ma.xproce.login_test.dao.entities.DemandeAccesCvStatus;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DemandeAccesCvAdminResponse {
    
    private Long id;
    
    // Info HR (demandeur)
    private String hrEmail;
    private String hrName;
    
    // Info Candidat (sans anonymisation pour admin)
    private String candidatEmail;
    private String candidatName;
    private String candidatRef;
    private Long candidatureId;
    
    // AI Analysis Info
    private Double scoreCompatibilite;
    private String scoreAnalysis;
    private String competences;
    private String diplomes;
    
    // Info Offre
    private String offreTitre;
    
    // Demande
    private String motif;  // Raison de la demande
    private DemandeAccesCvStatus status;
    private LocalDateTime dateDemande;
    
    // Décision (si décision prise)
    private String adminEmail;
    private LocalDateTime dateDecision;
    private String decisionNote;  // Raison de l'approbation/rejet
}
