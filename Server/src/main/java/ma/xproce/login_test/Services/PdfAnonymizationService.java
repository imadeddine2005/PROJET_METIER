package ma.xproce.login_test.Services;

import ma.xproce.login_test.Exeptions.InvalidFileException;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.pdfbox.text.TextPosition;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;

/**
 * Service de caviardage PDF en Java (PDFBox 3.x).
 *
 * Reproduit fidèlement la logique Python (redactor.py) :
 *   Passe 1 : Rectangle BLANC  → efface le texte original
 *   Passe 2 : Rectangle NAVY   → couvre la zone de manière élégante
 *
 * ─── SYSTÈME DE COORDONNÉES PDFBox ─────────────────────────────────────────
 * TextPosition.getX() / getY() → espace de rendu (Y=0 en HAUT, comme un écran)
 * PDPageContentStream.addRect() → espace PDF natif  (Y=0 en BAS)
 *
 * Conversion : pdfY = pageHeight - renderingY
 * ────────────────────────────────────────────────────────────────────────────
 */
@Service
public class PdfAnonymizationService {

    @Value("${app.upload.cv-dir:uploads/cvs}")
    private String cvUploadDir;

    // Navy blue correspondant au #1E2E61 du Python (RGB 0.0–1.0)
    private static final float NAVY_R = 0.12f;
    private static final float NAVY_G = 0.18f;
    private static final float NAVY_B = 0.38f;

    // Marge autour du texte détecté (comme REDACT_PADDING = 2 en Python)
    private static final float PADDING = 2.5f;

    // ─── Point d'entrée public ──────────────────────────────────────────────

    public String anonymizeAndSave(byte[] originalPdfBytes, List<String> sensitivePhrases) {
        try {
            byte[] anonymizedBytes = redactPdf(originalPdfBytes, sensitivePhrases);

            String fileName = "anon_" + UUID.randomUUID() + ".pdf";
            Path uploadPath = Paths.get(cvUploadDir).toAbsolutePath().normalize();
            Files.createDirectories(uploadPath);
            Files.write(uploadPath.resolve(fileName), anonymizedBytes);

            return "cvs/" + fileName;

        } catch (InvalidFileException e) {
            throw e;
        } catch (Exception e) {
            throw new InvalidFileException("Échec de l'anonymisation PDF : " + e.getMessage());
        }
    }

    // ─── Logique de caviardage ──────────────────────────────────────────────

    private byte[] redactPdf(byte[] pdfBytes, List<String> sensitivePhrases) throws IOException {

        try (PDDocument doc = Loader.loadPDF(pdfBytes);
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            // Étape 1 : Collecter les positions de TOUS les caractères de tout le doc
            PageTextCollector collector = new PageTextCollector();
            collector.setSortByPosition(true);
            collector.getText(doc);
            Map<Integer, List<TextPosition>> pageMap = collector.getPageMap();

            // Étape 2 : Pour chaque page, chercher les phrases → dessiner les rectangles
            int pageIndex = 0;
            for (PDPage page : doc.getPages()) {
                float pageHeight = page.getMediaBox().getHeight();
                List<TextPosition> chars = pageMap.getOrDefault(pageIndex, Collections.emptyList());

                // Chercher toutes les zones sensibles sur cette page
                List<float[]> redactZones = new ArrayList<>();
                for (String phrase : sensitivePhrases) {
                    if (phrase == null || phrase.strip().length() < 2) continue;
                    redactZones.addAll(findPhraseZones(chars, phrase.strip(), pageHeight));
                }

                if (!redactZones.isEmpty()) {
                    try (PDPageContentStream cs = new PDPageContentStream(
                            doc, page, PDPageContentStream.AppendMode.APPEND, true, true)) {

                        // ── Passe 1 : Rectangle BLANC (efface le texte original) ──
                        cs.setNonStrokingColor(Color.WHITE);
                        for (float[] z : redactZones) {
                            cs.addRect(z[0], z[1], z[2], z[3]);
                            cs.fill();
                        }

                        // ── Passe 2 : Rectangle NAVY (couvre proprement) ──
                        cs.setNonStrokingColor(NAVY_R, NAVY_G, NAVY_B);
                        for (float[] z : redactZones) {
                            cs.addRect(z[0], z[1], z[2], z[3]);
                            cs.fill();
                        }
                    }
                }

                pageIndex++;
            }

            doc.save(out);
            return out.toByteArray();
        }
    }

    // ─── Recherche d'une phrase dans les positions de caractères ────────────

    /**
     * Miroir de _get_sensitive_rects() en Python.
     *
     * Construit l'index de tous les caractères de la page → cherche la phrase
     * (insensible à la casse) → retourne les rectangles [x, y, w, h]
     * EN COORDONNÉES PDF NATIVES (Y=0 en bas).
     */
    private List<float[]> findPhraseZones(List<TextPosition> allChars,
                                          String phrase, float pageHeight) {
        List<float[]> results = new ArrayList<>();
        if (allChars.isEmpty()) return results;

        // Construire une chaîne linéaire et un index char → TextPosition
        StringBuilder sb = new StringBuilder();
        List<TextPosition> index = new ArrayList<>();

        for (TextPosition tp : allChars) {
            String uni = tp.getUnicode();
            if (uni == null) continue;
            for (char ignored : uni.toCharArray()) {
                sb.append(uni.charAt(0)); // un char par TextPosition (approx)
                index.add(tp);
            }
        }

        String textLow   = sb.toString().toLowerCase();
        String phraseLow = phrase.toLowerCase();

        // Chercher toutes les occurrences de la phrase (case-insensitive)
        int from = 0;
        while (from < textLow.length()) {
            int start = textLow.indexOf(phraseLow, from);
            if (start < 0) break;

            int end = start + phraseLow.length();
            if (end > index.size()) break;

            // Calculer la boîte englobante des caractères matchés
            float minX      = Float.MAX_VALUE;
            float maxXRight = -Float.MAX_VALUE;
            float minRenderY = Float.MAX_VALUE; // Y le plus petit = le PLUS HAUT à l'écran
            float maxRenderY = -Float.MAX_VALUE; // Y le plus grand = le PLUS BAS à l'écran
            float maxH      = 0;

            for (int i = start; i < end && i < index.size(); i++) {
                TextPosition tp = index.get(i);
                minX       = Math.min(minX,       tp.getX());
                maxXRight  = Math.max(maxXRight,  tp.getX() + tp.getWidth());
                minRenderY = Math.min(minRenderY, tp.getY() - tp.getHeight()); // haut du char
                maxRenderY = Math.max(maxRenderY, tp.getY());                  // baseline
                maxH       = Math.max(maxH,       tp.getHeight());
            }

            if (minX < Float.MAX_VALUE) {
                /*
                 * Conversion rendu → PDF natif :
                 *   renderingY croît vers le BAS  (0 = haut de page)
                 *   pdfY       croît vers le HAUT (0 = bas de page)
                 *
                 *   pdfY_du_bas_du_rect  = pageHeight - maxRenderY - PADDING
                 *   pdfY_du_haut_du_rect = pageHeight - minRenderY + PADDING
                 *   hauteur = pdfY_haut - pdfY_bas
                 */
                float pdfBottom = pageHeight - maxRenderY - PADDING;
                float pdfTop    = pageHeight - minRenderY + PADDING;
                float rectH     = pdfTop - pdfBottom;
                float rectW     = (maxXRight - minX) + 2 * PADDING;
                float rectX     = minX - PADDING;

                if (rectW > 0 && rectH > 0) {
                    results.add(new float[]{ rectX, pdfBottom, rectW, rectH });
                }
            }

            from = start + 1;
        }

        return results;
    }

    // ─── Collecteur de positions de texte par page ──────────────────────────

    /**
     * Sous-classe de PDFTextStripper qui intercepte writeString()
     * pour collecter les positions brutes de chaque caractère, page par page.
     */
    private static class PageTextCollector extends PDFTextStripper {

        // pageIndex (0-based) → liste de TextPosition
        private final Map<Integer, List<TextPosition>> pageMap = new HashMap<>();

        PageTextCollector() throws IOException {}

        @Override
        protected void writeString(String text, List<TextPosition> textPositions) throws IOException {
            int page = getCurrentPageNo() - 1; // PDFBox est 1-based → on convertit en 0-based
            pageMap.computeIfAbsent(page, k -> new ArrayList<>()).addAll(textPositions);
        }

        Map<Integer, List<TextPosition>> getPageMap() {
            return pageMap;
        }
    }
}
