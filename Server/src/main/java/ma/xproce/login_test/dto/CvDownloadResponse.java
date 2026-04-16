package ma.xproce.login_test.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

/**
 * Contenu du CV + nom original du fichier
 * Utilisé pour le téléchargement des CVs
 */
@Getter
@Setter
@AllArgsConstructor
public class CvDownloadResponse {
    private byte[] content;
    private String fileName;
}