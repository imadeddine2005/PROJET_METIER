package ma.xproce.login_test.dto.CandidatureDtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Vue Candidat : ses propres candidatures avec score, status et infos CV
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class CandidatureResponse {
    private Long id;
    private Long offreId;
    private String offreTitre;
    private Double scoreCompatibilite;
    private String status;
    private LocalDateTime dateSoumission;
    
    // Informations du CV (pas le fichier binaire)
    private Long cvFileId;              // ID pour retrouver le CV
    private String cvFileName;          // Nom du fichier original (pour affichage)
}
