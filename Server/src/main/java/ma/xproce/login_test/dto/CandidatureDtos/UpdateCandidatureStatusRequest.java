package ma.xproce.login_test.dto.CandidatureDtos;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import ma.xproce.login_test.dao.entities.CandidatureStatus;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UpdateCandidatureStatusRequest {
    
    @NotNull(message = "Le nouveau statut est obligatoire")
    private CandidatureStatus newStatus;
}
