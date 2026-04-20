package ma.xproce.login_test.Services;

import ma.xproce.login_test.Exeptions.InvalidFileException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

import java.io.IOException;
import java.time.Duration;
import java.util.UUID;

/**
 * Implémentation S3 du service de stockage de CVs.
 *
 * Remplace CvFileStorageService (stockage local) en production AWS.
 * S'active automatiquement quand app.storage.type=s3 dans application-prod.properties.
 *
 * Stratégie de stockage :
 *  - Les CVs sont stockés dans S3 sous la clé "cvs/{uuid}.pdf"
 *  - Le bucket est PRIVÉ — aucun accès public direct
 *  - L'accès se fait via des liens pré-signés valables 15 minutes
 */
@Service
@Primary  // Prioritaire sur CvFileStorageService quand les deux beans existent
@ConditionalOnProperty(name = "app.storage.type", havingValue = "s3")
public class S3CvFileStorageService implements ICvFileStorageService {

    private static final Logger log = LoggerFactory.getLogger(S3CvFileStorageService.class);
    private static final String CV_PREFIX = "cvs/";
    private static final Duration PRESIGNED_URL_DURATION = Duration.ofMinutes(15);

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;

    @Value("${aws.s3.bucket}")
    private String bucketName;

    public S3CvFileStorageService(S3Client s3Client, S3Presigner s3Presigner) {
        this.s3Client = s3Client;
        this.s3Presigner = s3Presigner;
    }

    /**
     * Upload un fichier MultipartFile vers S3.
     * @return La clé S3 du fichier (ex: "cvs/uuid.pdf")
     */
    @Override
    public String saveFile(MultipartFile file) {
        try {
            return saveFile(file.getBytes(), file.getOriginalFilename(), file.getContentType());
        } catch (IOException e) {
            throw new InvalidFileException("Erreur lors de la lecture du fichier MultipartFile", e);
        }
    }

    /**
     * Upload des bytes vers S3 (utilisé pour les CVs anonymisés produits par l'IA).
     * @return La clé S3 du fichier
     */
    @Override
    public String saveFile(byte[] content, String originalFileName, String contentType) {
        String s3Key = CV_PREFIX + UUID.randomUUID() + ".pdf";
        String resolvedContentType = (contentType != null) ? contentType : "application/pdf";

        try {
            PutObjectRequest putRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(s3Key)
                    .contentType(resolvedContentType)
                    .contentLength((long) content.length)
                    // Jamais public — accès uniquement via liens pré-signés
                    .serverSideEncryption(ServerSideEncryption.AES256)
                    .build();

            s3Client.putObject(putRequest, RequestBody.fromBytes(content));
            log.info("CV uploadé sur S3 : s3://{}/{}", bucketName, s3Key);
            return s3Key;

        } catch (S3Exception e) {
            log.error("Erreur S3 lors de l'upload du fichier : {}", e.getMessage());
            throw new InvalidFileException("Erreur lors de l'upload vers S3 : " + e.getMessage(), e);
        }
    }

    /**
     * Supprime un fichier CV de S3.
     * @param storageKey La clé S3 du fichier (ex: "cvs/uuid.pdf")
     */
    @Override
    public void deleteFile(String storageKey) {
        try {
            DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(storageKey)
                    .build();

            s3Client.deleteObject(deleteRequest);
            log.info("CV supprimé de S3 : s3://{}/{}", bucketName, storageKey);

        } catch (S3Exception e) {
            log.error("Erreur S3 lors de la suppression : {}", e.getMessage());
            throw new InvalidFileException("Erreur lors de la suppression sur S3 : " + e.getMessage(), e);
        }
    }

    /**
     * Récupère le contenu d'un fichier CV depuis S3.
     * Utilisé pour retourner le PDF directement en bytes (ex: pour l'anonymisation IA).
     * @param storageKey La clé S3 du fichier
     * @return Le contenu du fichier en bytes
     */
    @Override
    public byte[] getFile(String storageKey) {
        try {
            GetObjectRequest getRequest = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(storageKey)
                    .build();

            byte[] content = s3Client.getObjectAsBytes(getRequest).asByteArray();
            log.debug("CV récupéré depuis S3 : {} ({} bytes)", storageKey, content.length);
            return content;

        } catch (NoSuchKeyException e) {
            throw new InvalidFileException("Fichier CV introuvable sur S3 : " + storageKey, e);
        } catch (S3Exception e) {
            log.error("Erreur S3 lors de la récupération : {}", e.getMessage());
            throw new InvalidFileException("Erreur lors de la récupération depuis S3 : " + e.getMessage(), e);
        }
    }

    /**
     * Génère un lien pré-signé temporaire pour accéder au CV.
     * Le lien expire après PRESIGNED_URL_DURATION (15 min par défaut).
     *
     * Utilisation recommandée : retourner cette URL au client frontend
     * plutôt que de streamer le fichier en bytes.
     *
     * @param storageKey La clé S3 du fichier
     * @return URL pré-signée temporaire
     */
    public String generatePresignedUrl(String storageKey) {
        GetObjectRequest getRequest = GetObjectRequest.builder()
                .bucket(bucketName)
                .key(storageKey)
                .build();

        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(PRESIGNED_URL_DURATION)
                .getObjectRequest(getRequest)
                .build();

        PresignedGetObjectRequest presignedRequest = s3Presigner.presignGetObject(presignRequest);
        String url = presignedRequest.url().toString();
        log.debug("Lien pré-signé généré pour {} (expire dans {})", storageKey, PRESIGNED_URL_DURATION);
        return url;
    }
}
