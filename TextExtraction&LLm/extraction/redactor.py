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


def _find_rects_in_image_page(page, phrases: list, file_path: str, page_number: int) -> list:
    """
    Recherche de phrases dans une page IMAGE en utilisant le Spatial Cache 
    avec Mapping Alphanumérique (Robuste contre les hallucinations de ponctuation).
    """
    from extraction.spatial_cache import OCR_SPATIAL_CACHE, get_cache_key
    from pytesseract import Output
    import re
    
    all_rects = []
    cache_key = get_cache_key(file_path, page_number)
    
    if cache_key in OCR_SPATIAL_CACHE:
        print(f"  [VISION] Utilisation du Spatial Cache (ZÉRO OCR supplémentaire) pour la page {page_number + 1}...")
        words_data = OCR_SPATIAL_CACHE[cache_key]
        
        # 1. Reconstruire un texte purement ALPHANUMÉRIQUE et mapper à l'index de mot
        # Cela ignore les espaces, les sauts de ligne et la ponctuation (ex: '+' vs '&')
        full_text_alphanum = ""
        alphanum_to_word = []
        
        for i, w_info in enumerate(words_data):
            word_str = w_info["text"].lower()
            
            for char in word_str:
                if char.isalnum():
                    full_text_alphanum += char
                    alphanum_to_word.append(i)
                    
        # 2. Chercher les phrases nettoyées dans le texte alphanumérique
        for phrase in phrases:
            # Nettoyer la phrase renvoyée par le LLM (garder uniquement lettres/chiffres)
            phrase_alphanum = "".join([c.lower() for c in str(phrase) if c.isalnum()])
            
            if not phrase_alphanum or len(phrase_alphanum) < 3: 
                continue
                
            # Trouver toutes les occurrences
            for match in re.finditer(re.escape(phrase_alphanum), full_text_alphanum):
                start_idx = match.start()
                end_idx = match.end() - 1 # Dernier caractère inclus
                
                # Récupérer l'index du premier et du dernier mot OCR
                start_word_idx = alphanum_to_word[start_idx]
                end_word_idx = alphanum_to_word[end_idx]
                
                if start_word_idx != -1 and end_word_idx != -1:
                    # Fusionner les rectangles des mots correspondants
                    merged_rect = fitz.Rect(words_data[start_word_idx]["rect"])
                    for i in range(start_word_idx + 1, end_word_idx + 1):
                        merged_rect = merged_rect | words_data[i]["rect"]
                    
                    all_rects.append(merged_rect)
                    print(f"  [CACHE-BBOX] Localisé (Alphanum Exact) : '{phrase}' -> {merged_rect}")
                    
        return all_rects
        
    else:
        print(f"  [WARN] Spatial Cache introuvable pour la page {page_number + 1}. Fallback OCR d'urgence...")
        mat = fitz.Matrix(3.0, 3.0)
        pix = page.get_pixmap(matrix=mat)
        img_bytes = pix.tobytes("png")
        img = Image.open(io.BytesIO(img_bytes))
        custom_config = r'--oem 1 --psm 1'
        data = pytesseract.image_to_data(img, lang="fra+eng", config=custom_config, output_type=Output.DICT)
        scale_x = page.rect.width / pix.width
        scale_y = page.rect.height / pix.height

        for phrase in phrases:
            phrase_str = str(phrase).strip().lower()
            if not phrase_str or len(phrase_str) < 3: continue
            for i, word in enumerate(data['text']):
                word_str = str(word).strip().lower()
                if not word_str or len(word_str) < 3: continue
                if word_str in phrase_str or phrase_str in word_str:
                    x, y, w, h = data['left'][i], data['top'][i], data['width'][i], data['height'][i]
                    rect = fitz.Rect(x * scale_x, y * scale_y, (x + w) * scale_x, (y + h) * scale_y)
                    all_rects.append(rect)
        return all_rects


def redact_pdf(original_pdf_path: str, sensitive_phrases: list, output_pdf_path: str):
    """
    Redaction intelligente supportant TXT et IMG. Utilise le Spatial Cache pour les IMG.
    """
    _configure_tesseract()

    try:
        doc = fitz.open(original_pdf_path)

        for page_number, page in enumerate(doc):
            # 1. Détecter si la page est image ou texte natif
            text_content = page.get_text("text").strip()
            is_image_page = len(text_content) < 50

            # 2. Trouver les rectangles sensibles
            if is_image_page:
                sensitive_rects = _find_rects_in_image_page(page, sensitive_phrases, original_pdf_path, page_number)
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
