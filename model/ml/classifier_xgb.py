import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import joblib
import numpy as np

model = None
label_encoder = None


def _load_models():
    global model, label_encoder
    if model is not None:
        return
    if not os.path.exists("models/xgb_model.pkl"):
        raise RuntimeError(
            "Modele introuvable.\n"
            "Lancez d abord : python ml/train_classifier_xgb.py"
        )
    print("Chargement du modele XGBoost...")
    model = joblib.load("models/xgb_model.pkl")
    label_encoder = joblib.load("models/label_encoder.pkl")
    print("Modele charge.")


def predict_job_category(cv_text: str) -> dict:
    _load_models()

    if not cv_text.strip():
        return {
            "metier_ideal": "Indetermine",
            "confiance": 0.0,
            "toutes_categories": {}
        }

    from ml.embeddings_model import get_embedding
    cv_embedding = get_embedding(cv_text[:3000])
    cv_vector = cv_embedding.reshape(1, -1)

    pred_index = model.predict(cv_vector)[0]
    pred_label = label_encoder.inverse_transform([pred_index])[0]
    probas = model.predict_proba(cv_vector)[0]

    probas_dict = {
        cls: round(float(p) * 100, 1)
        for cls, p in zip(label_encoder.classes_, probas)
    }

    return {
        "metier_ideal": pred_label,
        "confiance": round(float(max(probas)) * 100, 1),
        "toutes_categories": dict(
            sorted(probas_dict.items(), key=lambda x: x[1], reverse=True)
        ),
    }
