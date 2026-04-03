package ma.xproce.login_test.Services;

import ma.xproce.login_test.dao.entities.Offre;
import ma.xproce.login_test.dao.entities.user_entity;
import org.springframework.stereotype.Component;

/**
 * Service utilitaire pour les vérifications d'autorisation métier.
 * Centralise la logique d'autorisation métier spécifique (ex: propriétaire ressource).
 * 
 * NOTE: Les vérifications de rôles simples (ROLE_ADMIN, ROLE_HR) sont gérées par Spring Security
 * via @PreAuthorize et SecurityFilterChain. Ne pas dupliquer ici.
 */
@Component
public class AuthorizationUtils {

    /**
     * Vérifie si l'utilisateur est propriétaire de l'offre ou admin
     * 
     * Logique métier : L'utilisateur peut modifier/supprimer l'offre seulement si:
     * - Il est le propriétaire (HR qui a créé), OU
     * - Il est admin
     * 
     * @param offre L'offre à vérifier
     * @param user L'utilisateur connecté
     * @return true si propriétaire ou admin, false sinon
     */
    public boolean isOffreOwnerOrAdmin(Offre offre, user_entity user) {
        // Vérifie si l'utilisateur est le propriétaire de l'offre
        if (offre.getHr() != null && offre.getHr().getId().equals(user.getId())) {
            return true;
        }

        // Vérifie si l'utilisateur est admin
        return isAdmin(user);
    }

    /**
     * Vérifie si l'utilisateur est admin
     * Helper pour logique métier (pas pour @PreAuthorize, Spring gère ça)
     * 
     * @param user L'utilisateur à vérifier
     * @return true si admin, false sinon
     */
    private boolean isAdmin(user_entity user) {
        if (user == null || user.getRoles() == null) {
            return false;
        }

        return user.getRoles().stream()
                .anyMatch(role -> "ROLE_ADMIN".equals(role.getName()));
    }
}

