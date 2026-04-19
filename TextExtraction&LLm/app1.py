"""
app1.py — Flask Stateless (pour connexion avec Spring Boot)
============================================================
Ce fichier est la version PRODUCTION du service IA.
- Reçoit uniquement du texte JSON (pas de fichiers)
- Retourne uniquement du JSON (pas de fichiers)
- NE STOCKE RIEN sur le disque
- Peut être scalé à n'importe quel nombre d'instances

DIFFERÉNCE avec app.py :
- app.py  = version TEST (interface web HTML, gère les fichiers)
- app1.py = version PRODUCTION (API pure JSON, stateless)
"""

import os
import tempfile
import base64
from flask import Flask, request, jsonify
from flask_cors import CORS
from llm.groq_service import (
    analyze_matching_with_llm,
    extract_information_with_llm,
    predict_job_category_with_llm,
    anonymize_cv_with_llm
)
from extraction.extractor import extract_text
from extraction.redactor import redact_pdf

app = Flask(__name__)
CORS(app)  # Permettre les appels depuis Spring Boot


# ═══════════════════════════════════════════════════════════
# ROUTE 1 : Traitement complet d'un CV (appelée à la candidature)
# ═══════════════════════════════════════════════════════════
@app.route("/api/process-cv", methods=["POST"])
def process_cv():
    """
    Endpoint principal appelé par Spring Boot quand un candidat postule.
    Accepte maintenant un FICHIER PDF (multipart/form-data).
    """
    # 1. Vérification des inputs
    if 'file' not in request.files:
        return jsonify({"error": "Fichier 'file' manquant"}), 400
    
    file = request.files['file']
    offer_text = request.form.get("offer_text", "").strip()

    if file.filename == '':
        return jsonify({"error": "Nom de fichier vide"}), 400

    temp_input = None
    temp_output = None

    try:
        # 2. Sauvegarde temporaire du fichier entrant
        suffix = os.path.splitext(file.filename)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            file.save(tmp.name)
            temp_input = tmp.name

        # 3. Extraction intelligente du texte (avec gestion colonnes/OCR)
        cv_text = extract_text(temp_input)

        result = {}

        # 4. Analyse LLM (Groq)
        # 4a. Compétences et diplômes
        info = extract_information_with_llm(cv_text)
        result["competences"] = info.get("competences", [])
        result["diplomes"]    = info.get("diplomes", [])

        # 4b. Matching (si offre présente)
        result["score"]          = None
        result["score_analysis"] = None
        if offer_text:
            matching = analyze_matching_with_llm(cv_text, offer_text)
            result["score"]          = matching.get("score")
            result["score_analysis"] = matching.get("analysis")

        # 4c. Phrases sensibles
        sensitive_phrases = anonymize_cv_with_llm(cv_text)
        result["sensitive_phrases"] = sensitive_phrases

        # 5. Anonymisation (Caviardage moderne via PyMuPDF)
        temp_output = temp_input + "_anon.pdf"
        redact_pdf(temp_input, sensitive_phrases, temp_output)

        # 6. Encodage en Base64 pour le transport JSON
        with open(temp_output, "rb") as f:
            result["anonymized_pdf_base64"] = base64.b64encode(f.read()).decode('utf-8')

        return jsonify(result), 200

    except Exception as e:
        print(f"Erreur /api/process-cv : {e}")
        return jsonify({"error": f"Erreur IA : {str(e)}"}), 500
    
    finally:
        # Nettoyage des fichiers temporaires
        if temp_input and os.path.exists(temp_input):
            os.remove(temp_input)
        if temp_output and os.path.exists(temp_output):
            os.remove(temp_output)


# ═══════════════════════════════════════════════════════════
# ROUTE 2 : Prédiction du métier idéal (appelée sur demande)
# ═══════════════════════════════════════════════════════════
@app.route("/api/predict-job", methods=["POST"])
def predict_job():
    """
    Prédit le métier idéal d'un candidat depuis son CV.
    
    Accepte maintenant un FICHIER PDF (multipart/form-data) 
    pour appliquer l'OCR si nécessaire.
    """
    if 'file' not in request.files:
        return jsonify({"error": "Fichier 'file' manquant"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "Nom de fichier vide"}), 400

    temp_input = None
    try:
        # Sauvegarde temporaire
        suffix = os.path.splitext(file.filename)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            file.save(tmp.name)
            temp_input = tmp.name

        # Extraction intelligente (avec OCR natif si besoin)
        cv_text = extract_text(temp_input)
        
        prediction = predict_job_category_with_llm(cv_text)
        return jsonify(prediction), 200

    except Exception as e:
        print(f"Erreur /api/predict-job : {e}")
        return jsonify({"error": f"Erreur IA : {str(e)}"}), 500
        
    finally:
        # Nettoyage
        if temp_input and os.path.exists(temp_input):
            os.remove(temp_input)


# ═══════════════════════════════════════════════════════════
# ROUTE 3 : Health Check (pour vérifier que le service tourne)
# ═══════════════════════════════════════════════════════════
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "service": "smartrecruit-ai",
        "mode": "stateless-production",
        "version": "2.0"
    }), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
    # Note: port 5001 pour ne pas conflicter avec app.py (port 5000)
