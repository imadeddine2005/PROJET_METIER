package ma.xproce.login_test.Services;

import org.springframework.web.multipart.MultipartFile;

/**
 * Interface du service de stockage des fichiers CV.
 *
 * Deux implémentations existent :
 *  - CvFileStorageService  → stockage local (dev, application.properties)
 *  - S3CvFileStorageService → stockage S3   (prod, application-prod.properties)
 *
 * Le profil actif détermine quelle implémentation est injectée.
 */
public interface ICvFileStorageService {

    /**
     * Sauvegarde un fichier MultipartFile et retourne la clé de stockage.
     * En local  : retourne "cvs/{uuid}.pdf"
     * En S3     : retourne "cvs/{uuid}.pdf" (clé S3)
     */
    String saveFile(MultipartFile file);

    /**
     * Sauvegarde des bytes bruts (ex: CV anonymisé produit par l'IA).
     */
    String saveFile(byte[] content, String originalFileName, String contentType);

    /**
     * Supprime un fichier par sa clé de stockage.
     */
    void deleteFile(String storageKey);

    /**
     * Récupère le contenu d'un fichier en bytes.
     * Utilisé pour l'envoi direct au client ou le traitement IA.
     */
    byte[] getFile(String storageKey);

    /**
     * Génère une URL d'accès temporaire au fichier.
     *
     * - En local : retourne null (non supporté, utiliser getFile() directement)
     * - En S3    : retourne un lien pré-signé valide 15 minutes
     *
     * Les contrôleurs doivent préférer cette méthode en prod pour
     * ne pas streamer les fichiers via Spring Boot.
     */
    default String generatePresignedUrl(String storageKey) {
        return null; // Non supporté par défaut (implémentation locale)
    }
}
