package ma.xproce.login_test.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO de réponse pour le téléchargement d'un CV.
 *
 * Champs :
 *  - content    : bytes du PDF (utilisé en mode local dev)
 *  - fileName   : nom du fichier suggéré pour le téléchargement
 *  - storageKey : clé S3 du fichier (utilisée en prod pour générer un lien pré-signé)
 *                 null en mode local
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CvDownloadResponse {

    /** Contenu binaire du PDF — chargé uniquement en mode local (dev). */
    private byte[] content;

    /** Nom de fichier suggéré au téléchargement (ex: "cv_jean_dupont.pdf"). */
    private String fileName;

    /**
     * Clé de stockage S3 (ex: "cvs/uuid.pdf").
     * Renseigné uniquement en mode S3 (prod).
     * Null en mode local.
     */
    private String storageKey;
}
