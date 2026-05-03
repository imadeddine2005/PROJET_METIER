package ma.xproce.login_test.dao.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**

 * AuditLog — Entité JPA représentant un log d'audit
 * Chaque action importante dans SmartRecruit doit laisser une trace inviolable.
 * Chaque log contient le hash SHA-256 du log précédent.
 * Si quelqu'un modifie un log en BDD, son hash change,
 * et tous les logs suivants deviennent invalides.
 */
@Entity
@Table(name = "audit_logs")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Horodatage précis à la nanoseconde. */
    @Column(nullable = false)
    private LocalDateTime timestamp;
    /**
     * Email de l'utilisateur qui a déclenché l'action.
     */
    @Column(nullable = false)
    private String userEmail;
    private Long userId;
    @Column(nullable = false, length = 100)
    private String action;

    /**
     * Identifiant de la ressource concernée par l'action.
     */
    private String resourceId;
    @Column(nullable = false, length = 50)
    private String result;
    @Column(length = 500)
    private String details;
    @Column(nullable = false, length = 64)
    private String previousHash;
    @Column(nullable = false, length = 64)
    private String currentHash;

}