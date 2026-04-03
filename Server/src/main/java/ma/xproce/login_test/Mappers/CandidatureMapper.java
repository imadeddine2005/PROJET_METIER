package ma.xproce.login_test.Mappers;

import ma.xproce.login_test.dao.entities.Candidature;
import ma.xproce.login_test.dto.CandidatureDtos.CandidatureHrResponse;
import ma.xproce.login_test.dto.CandidatureDtos.CandidatureResponse;
import org.springframework.stereotype.Component;

@Component
public class CandidatureMapper {
    

    public CandidatureHrResponse toHrResponse(Candidature c) {
        CandidatureHrResponse dto = new CandidatureHrResponse();
        dto.setId(c.getId());
        dto.setOffreId(c.getOffre() != null ? c.getOffre().getId() : null);
        Long candidatId = c.getCandidat() != null ? c.getCandidat().getId() : null;
        dto.setCandidatRef(candidatId != null ? "C-" + candidatId : null);
        dto.setScoreCompatibilite(c.getScoreCompatibilite());
        dto.setStatus(c.getStatus() != null ? c.getStatus().name() : null);
        dto.setDateSoumission(c.getDateSoumission());
        dto.setCvFileId(c.getCvFile() != null ? c.getCvFile().getId() : null);
        return dto;
    }

    public CandidatureResponse toCandidateResponse(Candidature c) {
        CandidatureResponse dto = new CandidatureResponse();
        dto.setId(c.getId());
        dto.setOffreId(c.getOffre() != null ? c.getOffre().getId() : null);
        dto.setOffreTitre(c.getOffre() != null ? c.getOffre().getTitre() : null);
        dto.setScoreCompatibilite(c.getScoreCompatibilite());
        dto.setStatus(c.getStatus() != null ? c.getStatus().name() : null);
        dto.setDateSoumission(c.getDateSoumission());
        
        // Infos CV (sans le fichier binaire)
        if (c.getCvFile() != null) {
            dto.setCvFileId(c.getCvFile().getId());
            dto.setCvFileName(c.getCvFile().getOriginalFileName());
        }
        
        return dto;
    }
}

