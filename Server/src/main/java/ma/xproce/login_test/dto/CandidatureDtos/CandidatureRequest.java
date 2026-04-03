package ma.xproce.login_test.dto.CandidatureDtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CandidatureRequest {
    private Long offreId;
    // Le fichier CV sera gére par MultipartFile dans le contrôleur
}
