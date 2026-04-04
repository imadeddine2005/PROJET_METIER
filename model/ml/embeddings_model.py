import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sentence_transformers import SentenceTransformer
import numpy as np

print("Chargement du modele Sentence-BERT...")
_model = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
print("Modele charge.")


def get_embedding(text: str) -> np.ndarray:
    return _model.encode(
        text,
        normalize_embeddings=True,
        show_progress_bar=False
    )


def get_embeddings_batch(texts: list) -> np.ndarray:
    return _model.encode(
        texts,
        normalize_embeddings=True,
        batch_size=32,
        show_progress_bar=True
    )
