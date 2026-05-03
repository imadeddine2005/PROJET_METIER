package ma.xproce.login_test.web;

import ma.xproce.login_test.Services.AuditService;
import ma.xproce.login_test.dao.entities.AuditLog;
import ma.xproce.login_test.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * AuditController — Endpoints REST de l'audit trail
 * ACCÈS :
 *   GET /api/audit/logs    → ROLE_RH ou ROLE_ADMIN uniquement
 *   GET /api/audit/verify  → ROLE_RH ou ROLE_ADMIN uniquement
 */
@RestController
@RequestMapping("/api/audit")
public class AuditController {

    private final AuditService auditService;

    public AuditController(AuditService auditService) {
        this.auditService = auditService;
    }

    /**

     * GET /api/audit/logs — Consulter tous les logs
     */
    @GetMapping("/logs")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<AuditLog>>> getAllLogs() {
        List<AuditLog> logs = auditService.getAllLogs();
        return ResponseEntity.ok(
                ApiResponse.success(
                        String.format("%d log(s) trouvé(s)", logs.size()),
                        logs
                )
        );
    }

    /**
     * ──────────────────────────────────────────────────────
     * GET /api/audit/verify — Vérifier l'intégrité de la chaîne
     * Il prouve mathématiquement que l'audit trail est inviolable. Aucun attaquant (même avec accès MySQL) ne peut modifier un log sans être détecté.
     */
    @GetMapping("/verify")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> verifyIntegrity() {
        // Déléguer toute la logique à AuditService
        AuditService.VerificationResult result = auditService.verify();
        // Construire la réponse JSON
        Map<String, Object> response = new HashMap<>();
        response.put("valid", result.valid());
        response.put("totalLogsChecked", result.totalLogs());
        response.put("message", result.message());
        // Si falsifié, inclure l'ID du log problématique
        if (!result.valid() && result.firstInvalidLogId() != null) {
            response.put("firstInvalidLogId", result.firstInvalidLogId());
        }
        return ResponseEntity.ok(
                result.valid()
                        ? ApiResponse.success(result.message(), response)
                        : ApiResponse.success("ALERTE SÉCURITÉ : " + result.message(), response)
        );
    }

    /**
     * GET /api/audit/logs/user/{email} — Logs d'un utilisateur
     * "Quelles décisions ont été prises sur ce candidat ?"
     * Le RH ou l'Admin peut tracer toutes les actions liées à un email spécifique.
     */
    @GetMapping("/logs/user/{email}")
    @PreAuthorize("hasAnyRole('RH', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<AuditLog>>> getLogsByUser(
            @PathVariable String email) {

        List<AuditLog> logs = auditService.getLogsByUser(email);
        return ResponseEntity.ok(
                ApiResponse.success(
                        String.format("%d log(s) pour %s", logs.size(), email),
                        logs
                )
        );
    }
}