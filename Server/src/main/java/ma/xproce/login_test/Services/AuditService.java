package ma.xproce.login_test.Services;

import ma.xproce.login_test.dao.entities.AuditLog;
import ma.xproce.login_test.dao.reposetories.AuditLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class AuditService {

/**
 * AuditService — Cœur du système d'audit trail chaîné. Il centralise TOUTE la logique d'audit :
 */
    /**
     * Valeur du hash pour le tout premier log de la chaîne.
     */
    private static final String GENESIS_HASH = "GENESIS";

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    /**

     * COMMENT ça fonctionne ?
     *   1. On récupère le hash du dernier log en base
     *   2. On crée le nouveau log avec ce hash comme previousHash
     *   3. On calcule le currentHash sur tous les champs
     *   4. On insère en base (INSERT only, jamais UPDATE)

     * @Transactional : Si la sauvegarde en base échoue, tout est annulé
     */
    @Transactional
    public AuditLog log(String userEmail, Long userId, String action,
                        String resourceId, String result, String details) {

        String previousHash = auditLogRepository
                .findLastLog()
                .map(AuditLog::getCurrentHash)   // log précédent trouvé → son hash
                .orElse(GENESIS_HASH);            // table vide → GENESIS

        // ── Étape 2 : Créer l'objet log ──
        AuditLog log = new AuditLog();
        log.setTimestamp(LocalDateTime.now());
        log.setUserEmail(userEmail);
        log.setUserId(userId);
        log.setAction(action);
        log.setResourceId(resourceId != null ? resourceId : "N/A");
        log.setResult(result);
        log.setDetails(details != null ? details : "");
        log.setPreviousHash(previousHash);

        // ── Étape 3 : Calculer le currentHash
        String dataToHash = buildHashInput(log, previousHash);
        log.setCurrentHash(computeSHA256(dataToHash));

        return auditLogRepository.save(log);
    }
    /**
     * COMMENT ça fonctionne ?
     1. On lit tous les logs dans l'ordre (ID croissant)
     2. Pour chaque log, on recalcule son currentHash à partir de ses données stockées en base
     3. Si le hash recalculé ≠ hash stocké → FRAUDE détectée
     4. On vérifie aussi que le previousHash de chaque log correspond bien au currentHash du log précédent
     */
    @Transactional(readOnly = true)
    public VerificationResult verify() {

        List<AuditLog> allLogs = auditLogRepository.findAllByOrderByIdAsc();
        if (allLogs.isEmpty()) {
            return new VerificationResult(true, allLogs.size(),
                    null, "Aucun log en base — chaîne vide.");
        }

        String expectedPreviousHash = GENESIS_HASH;

        for (AuditLog log : allLogs) {

            // ── Vérification 1 : le previousHash est-il correct ?
            if (!log.getPreviousHash().equals(expectedPreviousHash)) {
                return new VerificationResult(
                        false,
                        allLogs.size(),
                        log.getId(),
                        String.format(
                                "Rupture de chaîne au log #%d : " +
                                        "previousHash attendu='%s', trouvé='%s'",
                                log.getId(),
                                expectedPreviousHash,
                                log.getPreviousHash()
                        )
                );
            }
            // ── Vérification 2 : le currentHash est-il intact ? ──
            String recalculatedHash = computeSHA256(
                    buildHashInput(log, log.getPreviousHash())
            );

            if (!recalculatedHash.equals(log.getCurrentHash())) {
                return new VerificationResult(
                        false,
                        allLogs.size(),
                        log.getId(),
                        String.format(
                                "Log #%d falsifié : " +
                                        "hash stocké='%s...', hash recalculé='%s...'",
                                log.getId(),
                                log.getCurrentHash().substring(0, 8),
                                recalculatedHash.substring(0, 8)
                        )
                );
            }

            // Ce log est valide → son currentHash devient le expectedPreviousHash du log suivant
            expectedPreviousHash = log.getCurrentHash();
        }
        return new VerificationResult(
                true,
                allLogs.size(),
                null,
                String.format("Chaîne intègre — %d log(s) vérifiés.", allLogs.size())
        );
    }

    /**

     MÉTHODE PRIVÉE : buildHashInput()
     Construit la chaîne de caractères sur laquelle SHA-256
     sera calculé. TOUS les champs importants sont inclus.
     */
    private String buildHashInput(AuditLog log, String previousHash) {
        return log.getTimestamp()  + "|"
                + log.getUserEmail()  + "|"
                + log.getUserId()     + "|"
                + log.getAction()     + "|"
                + log.getResourceId() + "|"
                + log.getResult()     + "|"
                + log.getDetails()    + "|"
                + previousHash;
    }

    /**
     * MÉTHODE PRIVÉE : computeSHA256()
     * Calcule le hash SHA-256 d'une chaîne de caractères
     */
    private String computeSHA256(String data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(data.getBytes(StandardCharsets.UTF_8));

            // Convertir le tableau de bytes en chaîne hexadécimale
            // Exemple : byte 0xFF → "ff", byte 0x0A → "0a"
            StringBuilder hexString = new StringBuilder();
            for (byte b : hashBytes) {
                // "%02x" : 2 caractères hex, avec zéro en préfixe si nécessaire
                hexString.append(String.format("%02x", b));
            }
            return hexString.toString(); // 64 caractères pour SHA-256

        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 non disponible dans ce JDK", e);
        }
    }

    /**
     * ══════════════════════════════════════════════════════
     * CLASSE INTERNE : VerificationResult
     * ══════════════════════════════════════════════════════
     * Ce résultat est uniquement utilisé par AuditService et AuditController — le garder en classe interne évite de créer un fichier supplémentaire pour un objet si simple.
     */
    public record VerificationResult(
            boolean valid, int totalLogs, Long firstInvalidLogId, String message) {}


    // ── Méthodes publiques appelées par AuditController ──────

    /** Retourne tous les logs dans l'ordre (pour l'affichage). */
    @Transactional(readOnly = true)
    public List<AuditLog> getAllLogs() {
        return auditLogRepository.findAllByOrderByIdAsc();
    }

    /** Retourne les logs d'un utilisateur spécifique. */
    @Transactional(readOnly = true)
    public List<AuditLog> getLogsByUser(String email) {
        return auditLogRepository.findByUserEmailOrderByIdAsc(email);
    }
}
