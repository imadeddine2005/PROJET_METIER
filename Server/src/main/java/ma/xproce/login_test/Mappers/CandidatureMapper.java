package ma.xproce.login_test.Mappers;

import ma.xproce.login_test.dao.entities.Candidature;
import ma.xproce.login_test.dto.CandidatureDtos.CandidatureHrResponse;
import ma.xproce.login_test.dto.CandidatureDtos.CandidatureResponse;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Component
public class CandidatureMapper {

    /**
     * Convertit une chaîne "Python,Docker,React" en liste ["Python", "Docker", "React"].
     * Retourne une liste vide si la chaîne est null ou vide.
     */
    private List<String> parseList(String raw) {
        if (raw == null || raw.isBlank()) return Collections.emptyList();
        // On splitte principalement sur le nouveau séparateur "|"
        // Regex: split sur "|" avec espaces optionnels autour.
        return Arrays.stream(raw.split("\\s*\\|\\s*"))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }

    public CandidatureHrResponse toHrResponse(Candidature c) {
        CandidatureHrResponse dto = new CandidatureHrResponse();
        dto.setId(c.getId());
        dto.setOffreId(c.getOffre() != null ? c.getOffre().getId() : null);
        Long candidatId = c.getCandidat() != null ? c.getCandidat().getId() : null;
        dto.setCandidatRef(candidatId != null ? "C-" + candidatId : null);

        // Score IA
        dto.setScoreCompatibilite(c.getScoreCompatibilite());
        dto.setScoreAnalysis(c.getScoreAnalysis());

        // Données extraites du CV
        dto.setCompetences(parseList(c.getCompetences()));
        dto.setDiplomes(parseList(c.getDiplomes()));

        dto.setStatus(c.getStatus() != null ? c.getStatus().name() : null);
        dto.setDateSoumission(c.getDateSoumission());
        dto.setDateDecision(c.getDateDecision());
        dto.setEmailSentContent(c.getEmailSentContent());
        dto.setDecisionMakerName(c.getDecisionMaker() != null ? c.getDecisionMaker().getName() : null);
        dto.setCvFileId(c.getCvFile() != null ? c.getCvFile().getId() : null);
        return dto;
    }

    public CandidatureResponse toCandidateResponse(Candidature c) {
        CandidatureResponse dto = new CandidatureResponse();
        dto.setId(c.getId());
        dto.setOffreId(c.getOffre() != null ? c.getOffre().getId() : null);
        dto.setOffreTitre(c.getOffre() != null ? c.getOffre().getTitre() : null);

        // Score IA (candidat voit le chiffre uniquement, pas l'analyse détaillée réservée aux RH)
        dto.setScoreCompatibilite(c.getScoreCompatibilite());

        // Données extraites du CV
        dto.setCompetences(parseList(c.getCompetences()));
        dto.setDiplomes(parseList(c.getDiplomes()));

        dto.setStatus(c.getStatus() != null ? c.getStatus().name() : null);
        dto.setDateSoumission(c.getDateSoumission());

        if (c.getCvFile() != null) {
            dto.setCvFileId(c.getCvFile().getId());
            dto.setCvFileName(c.getCvFile().getOriginalFileName());
        }

        return dto;
    }
}
