import os
from extraction.extractor import extract_text
from extraction.spatial_cache import OCR_SPATIAL_CACHE, get_cache_key

input_pdf = os.path.join("test", "cv_pdf_image.pdf")
cv_text = extract_text(input_pdf)

cache_key = get_cache_key(input_pdf, 0)
words_data = OCR_SPATIAL_CACHE.get(cache_key, [])
full_text = ""
for i, w_info in enumerate(words_data):
    full_text += w_info["text"] + " "
print("FULL TEXT:")
print(full_text)
