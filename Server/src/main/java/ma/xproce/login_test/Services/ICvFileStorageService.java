package ma.xproce.login_test.Services;

import org.springframework.web.multipart.MultipartFile;

/**
 * Interface pour les services de stockage de fichiers CV.
 * Permet de changer facilement d'implémentation (local, S3, etc.)
 */
public interface ICvFileStorageService {

    /**
     * Sauvegarde un fichier et retourne la clé de stockage
     */
    String saveFile(MultipartFile file);

    /**
     * Sauvegarde un fichier à partir de bytes et retourne la clé de stockage
     */
    String saveFile(byte[] content, String originalFileName, String contentType);

    /**
     * Supprime un fichier du stockage
     */
    void deleteFile(String storageKey);

    /**
     * Récupère le contenu d'un fichier
     */
    byte[] getFile(String storageKey);
}
