package ma.xproce.login_test.dto.CandidatureDtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Vue RH : pas de nom / email candidat, pas de nom de fichier CV original.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class CandidatureHrResponse {

    private Long id;
    private Long offreId;
    /** Référence opaque (ex: C-12), pas le vrai nom. */
    private String candidatRef;
    private Double scoreCompatibilite;
    private String status;
    private LocalDateTime dateSoumission;
    /** Id technique du fichier CV (si présent). */
    private Long cvFileId;
}
