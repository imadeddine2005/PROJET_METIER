package ma.xproce.login_test.dto.DemandeAccesCvDtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DemandeAccesCvRequest {
    
    @NotNull(message = "L'ID candidature est obligatoire")
    private Long candidatureId;
    
    @NotBlank(message = "Le motif est obligatoire")
    private String motif;
}
