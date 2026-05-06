import os
import sys
import io
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import fitz
from PIL import Image, ImageOps, ImageFilter, ImageDraw, ImageFont

PDF_PATH = os.path.join("test", "cv_pdf_image.pdf")
OUTPUT_PATH = os.path.join("scratch", "preprocessing_comparison.png")

print("📄 Ouverture du PDF...")
doc = fitz.open(PDF_PATH)
page = doc[0]

# ── Étape 0 : Image brute (sans zoom, juste pour montrer l'original)
mat_orig = fitz.Matrix(1.0, 1.0)
pix_orig = page.get_pixmap(matrix=mat_orig)
img_orig_full = Image.open(io.BytesIO(pix_orig.tobytes("png")))

# ── Pipeline de prétraitement (même chose que dans extractor.py)
mat = fitz.Matrix(3.5, 3.5)
pix = page.get_pixmap(matrix=mat)
img_data = pix.tobytes("png")
img_base = Image.open(io.BytesIO(img_data))

step1 = img_base.convert('L')                                                        # Niveaux de gris
step2 = ImageOps.autocontrast(step1)                                                 # Auto-contraste
step3 = step2.filter(ImageFilter.UnsharpMask(radius=2, percent=150, threshold=3))   # Netteté
step4 = step3.filter(ImageFilter.MedianFilter(size=3))                               # Débruitage

# ── Redimensionner toutes les images à la même taille pour le côte-à-côte
TARGET_H = 900
def resize_to_height(img, h):
    ratio = h / img.height
    return img.resize((int(img.width * ratio), h), Image.LANCZOS)

imgs = [
    ("0. Original (sans zoom)", img_orig_full.convert("RGB")),
    ("1. Zoom 3.5x (haute résolution)", img_base.convert("RGB")),
    ("2. Niveaux de gris", step1.convert("RGB")),
    ("3. Auto-contraste", step2.convert("RGB")),
    ("4. Unsharp Mask (netteté)", step3.convert("RGB")),
    ("5. Filtre Médian (débruitage)", step4.convert("RGB")),
]

resized = [(label, resize_to_height(img, TARGET_H)) for label, img in imgs]

# ── Construire l'image côte-à-côte
LABEL_H = 40
PADDING = 10
total_w = sum(img.width for _, img in resized) + PADDING * (len(resized) + 1)
total_h = TARGET_H + LABEL_H + PADDING * 2

canvas = Image.new("RGB", (total_w, total_h), color=(30, 30, 30))

try:
    font = ImageFont.truetype("arial.ttf", 18)
except:
    font = ImageFont.load_default()

draw = ImageDraw.Draw(canvas)
x_offset = PADDING
for label, img in resized:
    canvas.paste(img, (x_offset, LABEL_H + PADDING))
    draw.text((x_offset + 5, 8), label, fill=(255, 220, 80), font=font)
    x_offset += img.width + PADDING

canvas.save(OUTPUT_PATH)
print(f"✅ Image de comparaison sauvegardée : {OUTPUT_PATH}")
print(f"   → Ouvrez le fichier pour voir les 6 étapes côte-à-côte.")
doc.close()
