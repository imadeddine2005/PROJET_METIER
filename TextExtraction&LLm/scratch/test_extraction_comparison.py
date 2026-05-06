import os
import sys
import io
import re

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import fitz
import pytesseract
from PIL import Image, ImageOps, ImageFilter, ImageEnhance
import numpy as np
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))
tesseract_path = os.getenv("TESSERACT_EXE_PATH")
if tesseract_path:
    pytesseract.pytesseract.tesseract_cmd = tesseract_path

TESS_CONFIG = r'--oem 1 --psm 1'
TESS_LANG   = "fra+eng"
ZOOM        = 3.5

TESTS = [
    {
        "pdf":   os.path.join("test", "cv_pdf_image.pdf"),
        "truth": os.path.join("test", "text_correct_(cv_pdf_image & web dev).txt"),
        "name":  "cv_pdf_image",
    },
    {
        "pdf":   os.path.join("test", "cv_01_image.pdf"),
        "truth": os.path.join("test", "text_correct_(cv_01_image).txt"),
        "name":  "cv_01_image",
    },
]

# ─── Stopwords FR+EN à ignorer ───────────────────────────────────────────────
STOPWORDS = {
    "le","la","les","de","du","des","un","une","et","en","au","aux","par","sur",
    "pour","dans","avec","qui","que","est","sont","pas","ne","se","on","il","elle",
    "the","of","and","in","to","for","a","an","is","with","at","by","from","or",
    "we","our","your","their","was","been","has","have","had","be","it","its",
    "je","tu","il","nous","vous","ils","elles","me","te","lui","y","en",
}

# ─── Extraction d'entités clés ───────────────────────────────────────────────
def extract_entities(text: str) -> dict:
    text_lower = text.lower()

    # Emails
    emails = set(re.findall(r'[\w.\-+]+@[\w.\-]+\.\w{2,}', text_lower))

    # Téléphones (ex: +212 657-256871 / 0657256871 / 06 57 25 68 71)
    phones = set(re.findall(r'(?:\+?\d[\d\s\-]{7,}\d)', text))

    # Années (ex: 2019, 2022, 2024–2027)
    years  = set(re.findall(r'\b(20\d{2}|19\d{2})\b', text))

    # Mots importants (≥5 chars, pas stopwords, pas de chiffres)
    words = set(
        w.lower() for w in re.findall(r'\b[a-zA-ZÀ-ÿ]{5,}\b', text)
        if w.lower() not in STOPWORDS
    )

    return {"emails": emails, "phones": phones, "years": years, "keywords": words}


def precision_recall(extracted: set, truth: set) -> tuple:
    if not truth:
        return (100.0, 100.0)
    found   = extracted & truth
    recall    = len(found) / len(truth)  * 100   # % de la vérité retrouvée
    precision = len(found) / len(extracted) * 100 if extracted else 0
    return round(precision, 1), round(recall, 1)


# ─── Pipelines ───────────────────────────────────────────────────────────────
def pipeline_current(img_raw: Image.Image) -> Image.Image:
    img = img_raw.convert("L")
    img = ImageOps.autocontrast(img)
    img = img.filter(ImageFilter.UnsharpMask(radius=2, percent=150, threshold=3))
    img = img.filter(ImageFilter.MedianFilter(size=3))
    return img

def pipeline_pro(img_raw: Image.Image) -> Image.Image:
    img = img_raw.convert("L")
    img = ImageOps.autocontrast(img, cutoff=1)
    arr = np.array(img, dtype=np.float32)
    arr = np.power(arr / 255.0, 0.90) * 255.0
    img = Image.fromarray(arr.astype(np.uint8))
    img = ImageEnhance.Contrast(img).enhance(1.3)
    img = img.filter(ImageFilter.UnsharpMask(radius=1.5, percent=180, threshold=2))
    img = ImageEnhance.Sharpness(img).enhance(1.8)
    img = img.filter(ImageFilter.MedianFilter(size=3))
    return img


def ocr_pdf(pdf_path: str, pipeline_fn) -> str:
    doc = fitz.open(pdf_path)
    parts = []
    for page in doc:
        mat  = fitz.Matrix(ZOOM, ZOOM)
        pix  = page.get_pixmap(matrix=mat)
        img  = Image.open(io.BytesIO(pix.tobytes("png")))
        img  = pipeline_fn(img)
        text = pytesseract.image_to_string(img, lang=TESS_LANG, config=TESS_CONFIG)
        parts.append(text.strip())
    doc.close()
    return "\n\n".join(parts)


def compare_entities(label: str, ext: set, truth: set):
    found   = ext & truth
    missed  = truth - ext
    extra   = ext - truth
    prec, rec = precision_recall(ext, truth)
    print(f"    {label} :")
    print(f"      ✅ Trouvés    ({len(found)}/{len(truth)}) Recall={rec}%  Precision={prec}%")
    if found:  print(f"         → {sorted(found)}")
    if missed: print(f"      ❌ Manqués  : {sorted(missed)}")
    if extra:  print(f"      ⚠️  Faux pos : {sorted(list(extra))[:5]}")


# ─── Main ────────────────────────────────────────────────────────────────────
print("=" * 70)
print("  COMPARAISON OCR PAR ENTITÉS  (Actuel vs Pro)")
print("=" * 70)

for t in TESTS:
    with open(t["truth"], "r", encoding="utf-8") as f:
        truth_text = f.read()
    truth_ents = extract_entities(truth_text)

    print(f"\n📄  {t['name']}")
    print("-" * 70)

    for pipeline_name, pipeline_fn in [("ACTUEL", pipeline_current), ("PRO", pipeline_pro)]:
        print(f"\n  🔬 Pipeline {pipeline_name}")
        text = ocr_pdf(t["pdf"], pipeline_fn)
        ents = extract_entities(text)
        compare_entities("📧 Emails",     ents["emails"],   truth_ents["emails"])
        compare_entities("📞 Téléphones", ents["phones"],   truth_ents["phones"])
        compare_entities("📅 Années",     ents["years"],    truth_ents["years"])
        kw_truth   = {w for w in truth_ents["keywords"] if len(w) >= 7}
        kw_extract = {w for w in ents["keywords"]       if len(w) >= 7}
        compare_entities("🔑 Mots-clés (≥7 chars)", kw_extract, kw_truth)

print("\n" + "=" * 70)
