import os
from dotenv import load_dotenv
import fitz          
import pytesseract
from PIL import Image, ImageEnhance
import io
import re

load_dotenv()

# Configuration du moteur OCR Tesseract
# 1. On cherche d'abord dans les variables d'environnement (.env)
# 2. On teste ensuite les chemins par défaut sur Windows
TESSERACT_EXE = os.getenv("TESSERACT_EXE_PATH")

if TESSERACT_EXE and os.path.exists(TESSERACT_EXE):
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_EXE
else:
    # Fallback sur les chemins standards si .env non configuré
    DEFAULT_PATHS = [
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        r"C:\Users\pc\AppData\Local\Tesseract-OCR\tesseract.exe"
    ]
    for p in DEFAULT_PATHS:
        if os.path.exists(p):
            pytesseract.pytesseract.tesseract_cmd = p
            break

MIN_CHARS_THRESHOLD = 50

class PDFExtractionError(Exception):
    """Exception levée pour les erreurs spécifiques d'extraction PDF ATS"""
    pass

def clean_extracted_text(text: str) -> str:
    """Nettoie le texte extrait et corrige les erreurs OCR courantes"""
    if not text: return ""
    
    # Corrections OCR courantes (le @ est souvent mal lu)
    text = text.replace('%¢', '@').replace('©', '@').replace('érogmail', '@gmail')
    
    # Nettoyage des caractères parasites en début de ligne (souvent des icônes mal lues)
    text = re.sub(r'^[\\/&©@\+\-\*]\s+', '', text, flags=re.MULTILINE)
    
    # Nettoyage standard
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()

def sort_blocks_by_columns(blocks):
    """
    Trie les blocs en détectant les colonnes (sidebar + main).
    Lit d'abord la colonne gauche entièrement, puis la droite.
    """
    text_blocks = [b for b in blocks if b[6] == 0]
    if not text_blocks:
        return ""

    # Trouver la largeur de la page (x1 max)
    page_width = max((b[2] for b in text_blocks), default=0)
    
    # Seuil de séparation des colonnes (40% de la page = sidebar typique)
    column_split = page_width * 0.40

    left_blocks  = [b for b in text_blocks if b[0] < column_split]
    right_blocks = [b for b in text_blocks if b[0] >= column_split]

    # Trier chaque colonne par Y (de haut en bas)
    left_blocks.sort(key=lambda b: b[1])
    right_blocks.sort(key=lambda b: b[1])

    def blocks_to_text(blist):
        parts = []
        for b in blist:
            t = b[4].strip()
            if t:
                parts.append(t)
        return "\n\n".join(parts)

    left_text  = blocks_to_text(left_blocks)
    right_text = blocks_to_text(right_blocks)

    sections = []
    if left_text:
        sections.append("=== SIDEBAR (GAUCHE) ===\n" + left_text)
    if right_text:
        sections.append("=== CONTENU PRINCIPAL (DROITE) ===\n" + right_text)

    return "\n\n".join(sections)

def extract_text(file_path: str) -> str:
    """Fonction principale SmartRecruit ATS (PDF uniquement)"""
    if not os.path.exists(file_path):
        raise PDFExtractionError("Le fichier est introuvable sur le serveur.")
        
    ext = os.path.splitext(file_path)[1].lower()
    if ext != ".pdf":
        raise PDFExtractionError(f"Format non supporté ({ext}). Seul le format PDF est autorisé.")
        
    # 1. Validation native avec fitz
    try:
        doc = fitz.open(file_path)
    except Exception:
        raise PDFExtractionError("Ceci n'est pas un fichier PDF valide ou le fichier est corrompu.")
        
    # Validation du verrouillage (cryptage)
    if doc.is_encrypted:
        doc.close()
        raise PDFExtractionError("Ce CV PDF est protégé par un mot de passe. Veuillez envoyer un fichier non verrouillé.")
        
    text_parts = []
    try:
        for page_number in range(len(doc)):
            page = doc[page_number]
            
            # 2. Extraction native par blocs (Gère les colonnes parfaitement)
            blocks = page.get_text("blocks")
            native_text = sort_blocks_by_columns(blocks)
            
            # Vérifier si on a du vrai texte ou juste quelques miettes (logo etc)
            if native_text and len(native_text.strip()) >= MIN_CHARS_THRESHOLD:
                text_parts.append(native_text)
                print(f"  Page {page_number + 1} : Texte natif (mode colonnes) extrait ({len(native_text)} caractères)")
            else:
                # 3. Mode OCR (Tesseract) pour les CVs scannés
                print(f"  Page {page_number + 1} : Image détectée, extraction Tesseract OCR en cours...")
                ocr_text_tess = _ocr_pdf_page_hq(page, file_path, page_number)
                if ocr_text_tess:
                    text_parts.append(ocr_text_tess)
                    print(f"  Page {page_number + 1} : Tesseract OK ({len(ocr_text_tess)} caractères)")
                else:
                    print(f"  Page {page_number + 1} : Page complètement vide ou illisible")
                    
        doc.close()
    except Exception as e:
        doc.close()
        raise PDFExtractionError(f"Une erreur système est survenue pendant la lecture du PDF : {str(e)}")
        
    final_text = clean_extracted_text("\n\n".join(text_parts))
    
    # 4. Vérification d'utilité finale
    if len(final_text) < MIN_CHARS_THRESHOLD:
        raise PDFExtractionError("Lecture impossible : Le système n'a pas pu trouver assez de texte dans ce fichier (image de trop mauvaise qualité ou CV vide).")
        
    return final_text

def _ocr_pdf_page_hq(page: fitz.Page, file_path: str, page_number: int) -> str:
    """Réalise un OCR Haute Définition équilibré (Version Finale avec SPATIAL CACHING)"""
    try:
        from pytesseract import Output
        from extraction.spatial_cache import OCR_SPATIAL_CACHE, get_cache_key
        
        # 1. Résolution de haute qualité (Zoom 3.5x = excellent équilibre netteté/bruit)
        mat = fitz.Matrix(3.5, 3.5)
        pix = page.get_pixmap(matrix=mat)
        img_data = pix.tobytes("png")
        
        from PIL import ImageOps, ImageFilter
        img = Image.open(io.BytesIO(img_data))
        
        # 2. Prétraitement contrasté
        img = img.convert('L')
        img = ImageOps.autocontrast(img)
        
        # 3. Masque de netteté (Unsharp Mask) : renforce les détails des lettres
        img = img.filter(ImageFilter.UnsharpMask(radius=2, percent=150, threshold=3))
        
        # 4. Léger débruitage
        img = img.filter(ImageFilter.MedianFilter(size=3))
        
        # Extraction avec Coordonnées
        custom_config = r'--oem 1 --psm 1'
        data = pytesseract.image_to_data(img, lang="fra+eng", config=custom_config, output_type=Output.DICT)
        
        scale_x = page.rect.width / pix.width
        scale_y = page.rect.height / pix.height
        
        words_data = []
        lines = []
        current_line = []
        last_line_num = -1
        last_block_num = -1
        
        for i, word in enumerate(data['text']):
            word_str = str(word).strip()
            if not word_str: continue
            
            block_num = data['block_num'][i]
            line_num = data['line_num'][i]
            
            if line_num != last_line_num or block_num != last_block_num:
                if current_line:
                    lines.append(current_line)
                    current_line = []
                last_line_num = line_num
                last_block_num = block_num
                
            x = data['left'][i]
            y = data['top'][i]
            w = data['width'][i]
            h = data['height'][i]
            
            fx0 = x * scale_x
            fy0 = y * scale_y
            fx1 = (x + w) * scale_x
            fy1 = (y + h) * scale_y
            
            word_info = {
                "text": word_str,
                "rect": fitz.Rect(fx0, fy0, fx1, fy1)
            }
            current_line.append(word_info)
            words_data.append(word_info)
            
        if current_line:
            lines.append(current_line)
            
        # Reconstruction du texte
        text_parts = []
        for line in lines:
            text_parts.append(" ".join([w["text"] for w in line]))
            
        final_text = "\n".join(text_parts)
        
        # SPATIAL CACHING : On stocke les coordonnées pour redactor.py !
        cache_key = get_cache_key(file_path, page_number)
        OCR_SPATIAL_CACHE[cache_key] = words_data
        
        return final_text.strip()
    except Exception as e:
        print(f"Erreur interne dans Tesseract OCR: {str(e)}")
        return ""