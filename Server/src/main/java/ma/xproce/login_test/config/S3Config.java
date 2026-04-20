package ma.xproce.login_test.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

/**
 * Configuration du client AWS S3.
 * S'active uniquement quand app.storage.type=s3 (profil prod).
 *
 * En production sur EC2 avec rôle IAM, aucune clé d'accès n'est nécessaire.
 * Le SDK AWS résout automatiquement les credentials via la chaîne :
 *   1. Variables d'env AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY
 *   2. Profil ~/.aws/credentials
 *   3. Rôle IAM de l'instance EC2 (recommandé en prod)
 */
@Configuration
@ConditionalOnProperty(name = "app.storage.type", havingValue = "s3")
public class S3Config {

    @Value("${aws.region:eu-west-1}")
    private String awsRegion;

    /**
     * Client S3 standard pour upload/download/delete.
     */
    @Bean
    public S3Client s3Client() {
        return S3Client.builder()
                .region(Region.of(awsRegion))
                .build();
    }

    /**
     * S3Presigner pour générer des liens pré-signés (accès temporaire aux CVs).
     * Permet de renvoyer une URL temporaire au lieu du fichier brut.
     */
    @Bean
    public S3Presigner s3Presigner() {
        return S3Presigner.builder()
                .region(Region.of(awsRegion))
                .build();
    }
}
