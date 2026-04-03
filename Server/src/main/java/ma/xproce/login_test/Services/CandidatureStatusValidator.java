package ma.xproce.login_test.Services;

import ma.xproce.login_test.Exeptions.InvalidCandidatureStatusTransitionException;
import ma.xproce.login_test.dao.entities.CandidatureStatus;
import org.springframework.stereotype.Component;

/**
 * Validateur des transitions entre états de candidature.
 * Applique les règles métier strictes.
 */
@Component
public class CandidatureStatusValidator {

    /**
     * Valide si une transition d'état est autorisée
     */
    public void validateTransition(CandidatureStatus currentStatus, CandidatureStatus newStatus) {
        // Pas de changement
        if (currentStatus == newStatus) {
            throw new InvalidCandidatureStatusTransitionException("Le statut est déjà " + currentStatus);
        }

        // EN_COURS → ACCEPTEE ou REFUSEE (OK)
        if (currentStatus == CandidatureStatus.EN_COURS) {
            if (newStatus == CandidatureStatus.ACCEPTEE || newStatus == CandidatureStatus.REFUSEE) {
                return; // Valide
            }
        }

        // États terminaux: pas de transition possible
        if (currentStatus == CandidatureStatus.ACCEPTEE || currentStatus == CandidatureStatus.REFUSEE) {
            throw new InvalidCandidatureStatusTransitionException("Impossible de changer le statut d'une candidature " + currentStatus);
        }

        // Autres transitions non autorisées
        throw new InvalidCandidatureStatusTransitionException("Transition non autorisée : " + currentStatus + " → " + newStatus);
    }
}
