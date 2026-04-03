package ma.xproce.login_test.dto.OffreDtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OffreResponse {

    private Long          id;
    private String        titre;
    private String        description;
    private String        competencesRequises;
    private LocalDateTime dateCreation;
    private String        nomHR;   // juste le nom du HR, pas tout l'objet
}
