package ma.xproce.login_test.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.secretsmanager.SecretsManagerClient;
import software.amazon.awssdk.services.secretsmanager.model.GetSecretValueRequest;
import software.amazon.awssdk.services.secretsmanager.model.GetSecretValueResponse;

/**
 * Charge les secrets AWS Secrets Manager au démarrage.
 * Chaque secret est stocké séparément (valeur brute, pas JSON) :
 *   - smartrecruit/db_password  → mot de passe RDS
 *   - smartrecruit/jwt_secret   → clé de signature JWT
 */
@Configuration
@ConditionalOnProperty(name = "aws.secretsmanager.enabled", havingValue = "true")
public class AwsSecretsManagerConfig {

    private static final Logger log = LoggerFactory.getLogger(AwsSecretsManagerConfig.class);

    @Value("${aws.secretsmanager.db-password-secret:smartrecruit/db_password}")
    private String dbPasswordSecretName;

    @Value("${aws.secretsmanager.jwt-secret-secret:smartrecruit/jwt_secret}")
    private String jwtSecretSecretName;

    @Value("${aws.region:us-east-1}")
    private String awsRegion;

    @Bean
    public SecretsManagerClient secretsManagerClient() {
        return SecretsManagerClient.builder()
                .region(Region.of(awsRegion))
                .build();
    }

    @Bean(name = "awsSecretsLoader")
    public String loadSecrets(SecretsManagerClient secretsManagerClient) {
        log.info("Chargement des secrets depuis AWS Secrets Manager...");

        // ── db_password ───────────────────────────────────────────────────
        try {
            String dbPassword = getSecretValue(secretsManagerClient, dbPasswordSecretName);
            System.setProperty("DB_PASSWORD", dbPassword);
            log.info("Secret '{}' chargé avec succès", dbPasswordSecretName);
        } catch (Exception e) {
            log.error("Impossible de charger '{}' : {}", dbPasswordSecretName, e.getMessage());
            throw new RuntimeException("Échec chargement db_password depuis Secrets Manager", e);
        }

        // ── jwt_secret ────────────────────────────────────────────────────
        try {
            String jwtSecret = getSecretValue(secretsManagerClient, jwtSecretSecretName);
            System.setProperty("JWT_SECRET", jwtSecret);
            log.info("Secret '{}' chargé avec succès", jwtSecretSecretName);
        } catch (Exception e) {
            log.error("Impossible de charger '{}' : {}", jwtSecretSecretName, e.getMessage());
            throw new RuntimeException("Échec chargement jwt_secret depuis Secrets Manager", e);
        }

        log.info("Tous les secrets AWS chargés avec succès ✅");
        return "secrets-loaded";
    }

    /**
     * Récupère la valeur brute d'un secret (pas de parsing JSON).
     * Fonctionne que le secret soit stocké comme "texte brut" ou "autre".
     */
    private String getSecretValue(SecretsManagerClient client, String secretName) {
        GetSecretValueRequest request = GetSecretValueRequest.builder()
                .secretId(secretName)
                .build();

        GetSecretValueResponse response = client.getSecretValue(request);

        // Secrets Manager retourne soit secretString soit secretBinary
        if (response.secretString() != null) {
            return response.secretString().trim();
        }
        throw new RuntimeException("Le secret '" + secretName + "' est en format binaire, non supporté");
    }
}