import fitz

# Global cache: dictionary mapping a cache_key to a list of word dictionaries
# cache_key = "absolute_file_path_page_0"
# word_dicts = [{"text": "word", "rect": fitz.Rect(...) }, ...]
OCR_SPATIAL_CACHE = {}

def get_cache_key(file_path: str, page_num: int) -> str:
    import os
    return f"{os.path.abspath(file_path)}_page_{page_num}"
