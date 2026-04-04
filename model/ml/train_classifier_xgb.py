import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
import numpy as np
import re
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report
from xgboost import XGBClassifier
import joblib


def clean_text(text: str) -> str:
    text = str(text)
    text = re.sub(r"http\S+", " ", text)
    text = re.sub(r"[^\x00-\x7F]+", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def train_and_save():
    print("Chargement du dataset...")
    df = pd.read_csv("data/dataset.csv")
    print(f"Colonnes : {list(df.columns)} | Taille : {df.shape}")

    text_col = next(
        (c for c in df.columns if c.lower() in ["resume", "text", "cv_text"]), None
    )
    cat_col = next(
        (c for c in df.columns if c.lower() in ["category", "categorie"]), None
    )

    if not text_col or not cat_col:
        raise ValueError(f"Colonnes introuvables. Disponibles : {list(df.columns)}")

    df = df[[text_col, cat_col]].dropna()
    df[text_col] = df[text_col].apply(clean_text)
    df = df[df[text_col].str.len() > 50]

    print(f"\nDataset : {len(df)} CVs | {df[cat_col].nunique()} categories")
    print(df[cat_col].value_counts().to_string())
    print()

    X_texts = df[text_col].values
    y = df[cat_col].values

    label_encoder = LabelEncoder()
    y_encoded = label_encoder.fit_transform(y)

    embeddings_path = "data/embeddings_cache.npy"

    if os.path.exists(embeddings_path):
        print("Chargement embeddings depuis le cache...")
        X_embeddings = np.load(embeddings_path)
        print(f"Embeddings charges : {X_embeddings.shape}")
    else:
        print("Generation des embeddings...")
        from ml.embeddings_model import get_embeddings_batch
        X_texts_short = [t[:3000] for t in X_texts]
        X_embeddings = get_embeddings_batch(X_texts_short)
        np.save(embeddings_path, X_embeddings)
        print(f"Embeddings sauvegardes : {X_embeddings.shape}")

    X_train, X_test, y_train, y_test = train_test_split(
        X_embeddings, y_encoded,
        test_size=0.2, random_state=42, stratify=y_encoded
    )
    print(f"\nTrain : {X_train.shape[0]} | Test : {X_test.shape[0]}")

    print("\nEntrainement XGBoost sur embeddings...")
    model = XGBClassifier(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        eval_metric="mlogloss",
        tree_method="hist",
        random_state=42,
        n_jobs=-1,
        verbosity=0,
    )
    model.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=50)

    y_pred = model.predict(X_test)
    print("\nRapport de classification :")
    print(classification_report(
        label_encoder.inverse_transform(y_test),
        label_encoder.inverse_transform(y_pred)
    ))

    os.makedirs("models", exist_ok=True)
    joblib.dump(model, "models/xgb_model.pkl")
    joblib.dump(label_encoder, "models/label_encoder.pkl")
    print("\nModeles sauvegardes dans models/")


if __name__ == "__main__":
    train_and_save()
