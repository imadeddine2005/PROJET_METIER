import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import numpy as np


def calculate_matching_score(cv_text: str, offer_text: str) -> float:
    if not cv_text.strip() or not offer_text.strip():
        return 0.0
    try:
        from ml.embeddings_model import get_embedding
        return _matching_embeddings(cv_text, offer_text)
    except Exception:
        return _matching_tfidf(cv_text, offer_text)


def _matching_embeddings(cv_text: str, offer_text: str) -> float:
    from ml.embeddings_model import get_embedding
    vec_cv = get_embedding(cv_text[:3000])
    vec_offer = get_embedding(offer_text[:1000])
    similarity = float(np.dot(vec_cv, vec_offer))
    score = (similarity + 1) / 2 * 100
    return round(score, 2)


def _matching_tfidf(cv_text: str, offer_text: str) -> float:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    vectorizer = TfidfVectorizer(ngram_range=(1, 2), max_features=5000, sublinear_tf=True)
    tfidf_matrix = vectorizer.fit_transform([cv_text, offer_text])
    score = cosine_similarity(tfidf_matrix[0], tfidf_matrix[1])[0][0]
    return round(float(score) * 100, 2)
