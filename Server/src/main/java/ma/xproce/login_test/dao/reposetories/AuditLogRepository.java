package ma.xproce.login_test.dao.reposetories;

import ma.xproce.login_test.dao.entities.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * ════════════════════════════════════════════════════════════
 * AuditLogRepository — Accès à la table audit_logs
 */
@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    /**
     * Récupère TOUS les logs dans l'ordre croissant des IDs.
     */
    List<AuditLog> findAllByOrderByIdAsc();

    /**
     * Récupère le dernier log inséré.
     */
    @Query("SELECT a FROM AuditLog a ORDER BY a.id DESC LIMIT 1")
    Optional<AuditLog> findLastLog();

    /**
     * Récupère tous les logs concernant un utilisateur.
     */
    List<AuditLog> findByUserEmailOrderByIdAsc(String userEmail);

    /**
     * Récupère tous les logs concernant une ressource précise.
     */
    List<AuditLog> findByResourceIdOrderByIdAsc(String resourceId);
}