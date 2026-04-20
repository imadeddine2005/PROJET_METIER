package ma.xproce.login_test.dto.DemandeAccesCvDtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import ma.xproce.login_test.dao.entities.DemandeAccesCvStatus;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DemandeAccesCvResponse {
    
    private Long id;
    private Long candidatureId;
    private String candidatRef;  // "C-123" anonymisé
    private DemandeAccesCvStatus status;
    private LocalDateTime dateDemande;
    private LocalDateTime dateDecision;
    private String motif;
    private String decisionNote;
}
