package ma.xproce.login_test.Services;

import ma.xproce.login_test.Exeptions.InvalidFileException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

/**
 * Service de stockage des fichiers CV.
 * Responsable de la persistance physique des fichiers.
 * 
 * Peut être étendu pour S3, Azure Blob, etc.
 */
@Service
public class CvFileStorageService implements ICvFileStorageService {

    @Value("${app.upload.cv-dir:uploads/cvs}")
    private String cvUploadDir;

    /**
     * Sauvegarde un fichier CV et retourne la clé de stockage
     * 
     * @param file Le fichier MultipartFile à sauvegarder
     * @return La clé de stockage (chemin relatif)
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
     * Sauvegarde un fichier à partir de bytes et retourne la clé de stockage.
     * Utilisé notamment pour sauver les versions anonymisées produites par l'IA.
     */
    @Override
    public String saveFile(byte[] content, String originalFileName, String contentType) {
        try {
            // Vérifier que le répertoire existe
            Path uploadPath = Paths.get(cvUploadDir).toAbsolutePath().normalize();
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Générer un nom unique (UUID) pour le stockage physique
            String fileName = UUID.randomUUID() + ".pdf";
            Path filePath = uploadPath.resolve(fileName);

            // Sauvegarder le contenu
            Files.write(filePath, content);

            // Retourner la clé de stockage (chemin relatif standardisé)
            return "cvs/" + fileName;

        } catch (IOException e) {
            throw new InvalidFileException("Erreur lors de la sauvegarde physique du fichier CV", e);
        }
    }

    /**
     * Supprime un fichier CV du stockage
     * 
     * @param storageKey La clé de stockage du fichier
     */
    @Override
    public void deleteFile(String storageKey) {
        try {
            Path uploadPath = Paths.get(cvUploadDir).toAbsolutePath().normalize();
            Path filePath = uploadPath.resolve(storageKey.replace("cvs/", ""));

            // Vérifier que le chemin est dans le répertoire autorisé (sécurité)
            if (!filePath.toAbsolutePath().startsWith(uploadPath)) {
                throw new InvalidFileException("Chemin de fichier invalide");
            }

            Files.deleteIfExists(filePath);

        } catch (IOException e) {
            throw new InvalidFileException("Erreur lors de la suppression du fichier CV", e);
        }
    }

    /**
     * Récupère le contenu d'un fichier CV
     * 
     * @param storageKey La clé de stockage du fichier
     * @return Le contenu du fichier en bytes
     */
    @Override
    public byte[] getFile(String storageKey) {
        try {
            Path uploadPath = Paths.get(cvUploadDir).toAbsolutePath().normalize();
            Path filePath = uploadPath.resolve(storageKey.replace("cvs/", ""));

            // Vérifier que le chemin est dans le répertoire autorisé (sécurité)
            if (!filePath.toAbsolutePath().startsWith(uploadPath)) {
                throw new InvalidFileException("Chemin de fichier invalide");
            }

            return Files.readAllBytes(filePath);

        } catch (IOException e) {
            throw new InvalidFileException("Erreur lors de la lecture du fichier CV", e);
        }
    }
}
