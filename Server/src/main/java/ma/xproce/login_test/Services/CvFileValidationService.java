package ma.xproce.login_test.Services;

import ma.xproce.login_test.Exeptions.InvalidFileException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/**
 * Service de validation des fichiers CV.
 * Centralisé ici pour être réutilisé depuis n'importe quel contrôleur ou service.
 *
 * Utilisé par :
 *   - CandidatureOffreService  (lors d'une candidature)
 *   - CvToolsCandidate_Controller  (prédiction de métier, etc.)
 */
@Service
public class CvFileValidationService {

    private static final long   MAX_SIZE_BYTES   = 5 * 1024 * 1024; // 5 MB
    private static final String ALLOWED_MIME_TYPE = "application/pdf";

    /**
     * Valide qu'un fichier est bien un PDF, non vide et dans la limite de taille.
     * Lance une {@link InvalidFileException} en cas d'échec (interceptée par le GlobalExceptionHandler).
     *
     * @param file Le fichier envoyé par le client
     */
    public void validate(MultipartFile file) {

        // 1. Fichier présent ?
        if (file == null || file.isEmpty()) {
            throw new InvalidFileException("Le fichier CV est obligatoire");
        }

        // 2. Nom de fichier valide ?
        if (file.getOriginalFilename() == null || file.getOriginalFilename().isBlank()) {
            throw new InvalidFileException("Le nom du fichier est invalide");
        }

        // 3. Taille ≤ 5 MB ?
        if (file.getSize() > MAX_SIZE_BYTES) {
            throw new InvalidFileException(
                "Le fichier dépasse la taille maximale autorisée (5 MB). " +
                "Taille reçue : " + (file.getSize() / (1024 * 1024)) + " MB"
            );
        }

        // 4. Type MIME = application/pdf ?
        if (!ALLOWED_MIME_TYPE.equals(file.getContentType())) {
            throw new InvalidFileException(
                "Seuls les fichiers PDF sont acceptés. " +
                "Type reçu : " + file.getContentType()
            );
        }

        // 5. Extension .pdf (double contrôle sécurité — certains clients mentent sur le MIME type)
        String filename = file.getOriginalFilename().toLowerCase();
        if (!filename.endsWith(".pdf")) {
            throw new InvalidFileException("Le fichier doit avoir l'extension .pdf");
        }
    }
}
