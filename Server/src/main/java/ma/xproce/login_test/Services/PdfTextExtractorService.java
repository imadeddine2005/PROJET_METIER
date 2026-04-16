package ma.xproce.login_test.Services;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;

/**
 * Service d'extraction de texte depuis un PDF.
 * Utilise Apache PDFBox (bibliothèque Java native).
 *
 * Côté Flask (app.py) faisait cela avec pdfplumber/fitz.
 * Ici Spring Boot le fait lui-même pour garder Flask stateless.
 */
@Service
public class PdfTextExtractorService {

    /**
     * Extrait le texte brut d'un fichier PDF MultipartFile.
     *
     * @param pdfFile Le fichier PDF uploadé par le candidat
     * @return Le texte brut du CV (toutes pages concaténées)
     * @throws IOException Si le fichier est corrompu ou non-PDF
     */
    public String extractText(MultipartFile pdfFile) throws IOException {
        try (InputStream is = pdfFile.getInputStream();
             PDDocument document = Loader.loadPDF(is.readAllBytes())) {

            if (document.isEncrypted()) {
                throw new IOException("Le CV PDF est protégé par un mot de passe.");
            }

            PDFTextStripper stripper = new PDFTextStripper();
            // Garder l'ordre de lecture naturel (colonne gauche → colonne droite)
            stripper.setSortByPosition(true);

            String text = stripper.getText(document).trim();

            if (text.length() < 50) {
                throw new IOException(
                    "Texte insuffisant extrait du PDF (CV image ou PDF vide). " +
                    "Veuillez soumettre un CV avec du texte lisible."
                );
            }

            return text;
        }
    }

    /**
     * Extrait le texte depuis un tableau de bytes (pour accéder à un CV depuis le stockage local).
     *
     * @param pdfBytes Contenu binaire du PDF
     * @return Le texte brut
     */
    public String extractText(byte[] pdfBytes) throws IOException {
        try (PDDocument document = Loader.loadPDF(pdfBytes)) {
            if (document.isEncrypted()) {
                throw new IOException("Le CV PDF est protégé par un mot de passe.");
            }
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            return stripper.getText(document).trim();
        }
    }
}
