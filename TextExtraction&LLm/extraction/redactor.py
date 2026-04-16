import fitz
import os
import io
import pytesseract
from PIL import Image
from dotenv import load_dotenv

# Charger les variables d'env pour récupérer le chemin Tesseract
load_dotenv()

# ═══════════════════════════════════════════════════════
# Design Token : Couleur du masquage (Style Moderne)
# ═══════════════════════════════════════════════════════
REDACT_COLOR   = (0.12, 0.18, 0.38)   # Bleu navy profond
REDACT_RADIUS  = 0.35                  # Arrondi des coins
REDACT_PADDING = 2                     # Extension

# ───────────────────────────────────
# Zoom d'analyse (pour la rediction image)
# ───────────────────────────────────
ZOOM = 3.0   # Zoom  × 3 → ~216 DPI, équilibre vitesse/précision


def _configure_tesseract():
    """Configure l'exécutable Tesseract depuis les variables d'env."""
    tess_path = os.getenv("TESSERACT_EXE_PATH")
    if tess_path and os.path.exists(tess_path):
        pytesseract.pytesseract.tesseract_cmd = tess_path
        tess_dir = os.path.dirname(tess_path)
        tessdata_dir = os.path.join(tess_dir, "tessdata")
        os.environ["TESSDATA_PREFIX"] = tessdata_dir if os.path.exists(tessdata_dir) else tess_dir
        if tess_dir not in os.environ["PATH"]:
            os.environ["PATH"] = tess_dir + os.pathsep + os.environ["PATH"]


def _draw_styled_overlay(page, rects):
    """ Dessine les rectangles arrondis colorés après apply_redactions. """
    for r in rects:
        expanded = fitz.Rect(
            r.x0 - REDACT_PADDING,
            r.y0 - REDACT_PADDING,
            r.x1 + REDACT_PADDING,
            r.y1 + REDACT_PADDING
        )
        page.draw_rect(
            expanded,
            color=None,
            fill=REDACT_COLOR,
            radius=REDACT_RADIUS,
            overlay=True
        )


def _find_rects_in_native_pdf(page, phrases: list) -> list:
    """
    Recherche des phrases dans un PDF avec texte vectoriel natif.
    Inclut un fallback par mot pour les noms multi-mots.
    """
    all_rects = []
    for phrase in phrases:
        phrase = phrase.strip()
        if not phrase or len(phrase) < 2:
            continue

        # Recherche exacte
        found = page.search_for(phrase)
        if found:
            print(f"  [OK-NATIVE] '{phrase}': {len(found)} zone(s)")
            all_rects.extend(found)
            continue

        # Fallback : mot par mot
        if " " in phrase:
            for word in phrase.split():
                if len(word) >= 3:
                    wf = page.search_for(word)
                    if wf:
                        all_rects.extend(wf)

        # Liens mailto
        for link in page.get_links():
            uri = link.get("uri", "") or ""
            if uri.lower().startswith("mailto:"):
                rect = link.get("from")
                if rect:
                    all_rects.append(fitz.Rect(rect))

    return all_rects


def _find_rects_in_image_page(page, phrases: list) -> list:
    """
    Recherche de phrases dans une page IMAGE via pytesseract.image_to_data().
    Retourne des Rect en coordonnées PDF en convertissant les pixels.
    """
    # 1. Rendre la page en image
    mat = fitz.Matrix(ZOOM, ZOOM)
    pix = page.get_pixmap(matrix=mat)
    img = Image.open(io.BytesIO(pix.tobytes("png"))).convert("L")

    # 2. Extraire les données mots avec coordonnées en pixels
    try:
        data = pytesseract.image_to_data(
            img,
            lang="fra+eng",
            config="--oem 1 --psm 1",
            output_type=pytesseract.Output.DICT
        )
    except Exception as e:
        print(f"  [WARN] pytesseract.image_to_data failed: {e}")
        return []

    # 3. Scaling : pixels → coordonnées PDF
    # La page PDF fait page.rect.width x page.rect.height pts.
    # L'image rendue fait (pix.width x pix.height) pixels.
    scale_x = page.rect.width  / pix.width
    scale_y = page.rect.height / pix.height

    # 4. Construire une liste de mots
    words_data = []  # (x0, y0, x1, y1, text) en pts PDF
    n = len(data["text"])
    for i in range(n):
        word_text = str(data["text"][i]).strip()
        if not word_text:
            continue
        conf = int(data["conf"][i])
        if conf < 30:   # Ignorer les mots peu fiables
            continue
        x = data["left"][i]
        y = data["top"][i]
        w = data["width"][i]
        h = data["height"][i]
        # Convertir en pts PDF
        x0 = x * scale_x
        y0 = y * scale_y
        x1 = (x + w) * scale_x
        y1 = (y + h) * scale_y
        words_data.append((x0, y0, x1, y1, word_text))

    # 5. Chercher chaque phrase dans les mots extraits
    all_rects = []
    for phrase in phrases:
        phrase_clean = phrase.strip()
        if not phrase_clean or len(phrase_clean) < 2:
            continue

        phrase_lower = phrase_clean.lower()
        phrase_words = phrase_lower.split()

        matched = False

        # -- Recherche de la phrase entière (séquentielle) --
        if len(phrase_words) > 1:
            for i in range(len(words_data) - len(phrase_words) + 1):
                match = True
                for j, pw in enumerate(phrase_words):
                    ocr_word = words_data[i + j][4].lower()
                    # Comparaison stricte : le mot OCR DOIT être le même (ou très proche)
                    if pw != ocr_word and pw not in ocr_word and ocr_word not in pw:
                        match = False
                        break
                if match:
                    x0 = min(words_data[i + j2][0] for j2 in range(len(phrase_words)))
                    y0 = min(words_data[i + j2][1] for j2 in range(len(phrase_words)))
                    x1 = max(words_data[i + j2][2] for j2 in range(len(phrase_words)))
                    y1 = max(words_data[i + j2][3] for j2 in range(len(phrase_words)))
                    all_rects.append(fitz.Rect(x0, y0, x1, y1))
                    matched = True

        # -- Fallback mot par mot (SÉCURISÉ) --
        # Seulement pour les mots d‑au moins 5 caractères pour éviter les faux positifs
        # Les URLs/emails sont traités comme un seul mot (pas d‑éclatement)
        if not matched:
            is_url_or_email = any(c in phrase_lower for c in ['@', '/', '.com', 'linkedin', 'github', 'http'])
            
            if is_url_or_email:
                # Pour les URLs : chercher le token le plus long (ex: "imadeddineoukrati25")
                long_tokens = [w for w in phrase_lower.replace('@', ' ').replace('/', ' ').split() if len(w) >= 6]
                for token in long_tokens:
                    for (x0, y0, x1, y1, wt) in words_data:
                        if token in wt.lower():
                            all_rects.append(fitz.Rect(x0, y0, x1, y1))
                            matched = True
            else:
                # Pour les noms simples : mots EXACTS de 5+ caractères uniquement
                for pw in phrase_words:
                    if len(pw) < 5:
                        continue  # Ignorer les mots trop courts ("de", "le", "la"...)
                    for (x0, y0, x1, y1, wt) in words_data:
                        # Le mot OCR doit aussi être suffisamment long (évite les icônes/bullets)
                        if len(wt) < 4:
                            continue
                        # Correspondance : le mot OCR doit commencer par le mot cherché (pas l'inverse)
                        if pw == wt.lower() or wt.lower().startswith(pw):
                            all_rects.append(fitz.Rect(x0, y0, x1, y1))
                            matched = True
            

    return all_rects


def redact_pdf(original_pdf_path: str, sensitive_phrases: list, output_pdf_path: str):
    """
    Redaction intelligente supportant TXT et IMG (OCR pytesseract direct).
    """
    _configure_tesseract()

    try:
        doc = fitz.open(original_pdf_path)

        for page in doc:
            # 1. Détecter si la page est image ou texte natif
            text_content = page.get_text("text").strip()
            is_image_page = len(text_content) < 50

            # 2. Trouver les rectangles sensibles
            if is_image_page:
                sensitive_rects = _find_rects_in_image_page(page, sensitive_phrases)
            else:
                sensitive_rects = _find_rects_in_native_pdf(page, sensitive_phrases)

            # 3. Appliquer les masquages
            if sensitive_rects:
                for rect in sensitive_rects:
                    r_ext = fitz.Rect(rect.x0 - REDACT_PADDING, rect.y0 - REDACT_PADDING,
                                      rect.x1 + REDACT_PADDING, rect.y1 + REDACT_PADDING)
                    page.add_redact_annot(r_ext, fill=(1, 1, 1))

                page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_PIXELS)
                _draw_styled_overlay(page, sensitive_rects)
            else:
                print("  [WARN] Aucune zone sensible trouvée sur cette page.")

        doc.save(output_pdf_path, garbage=3, deflate=True)
        doc.close()

    except Exception as e:
        raise Exception(f"Le caviardage a échoué : {str(e)}")
