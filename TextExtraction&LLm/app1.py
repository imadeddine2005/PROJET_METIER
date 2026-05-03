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

ARCHITECTURE GLOBALE :
======================
Spring Boot (Java)                     Flask (Python)
   │                                       │
   │  POST /api/process-cv                 │
   │  (multipart: PDF + offre texte)       │
   │ ─────────────────────────────────────►│
   │                                       │  1. Extraction texte (PyMuPDF / OCR Tesseract)
   │                                       │  2. Analyse LLM via Groq API (Llama 3.1)
   │                                       │     → Compétences, Diplômes
   │                                       │     → Score de compatibilité avec l'offre
   │                                       │     → Phrases sensibles (RGPD)
   │                                       │  3. Anonymisation PDF (PyMuPDF redaction)
   │                                       │  4. Encodage Base64 du PDF anonymisé
   │  ◄─────────────────────────────────── │
   │  JSON { score, competences,           │
   │         diplomes, anonymized_pdf }    │
   │                                       │
   │  POST /api/predict-job                │
   │  (multipart: PDF)                     │
   │ ─────────────────────────────────────►│
   │                                       │  1. Extraction texte
   │                                       │  2. LLM prédit le métier idéal
   │  ◄─────────────────────────────────── │
   │  JSON { metier_ideal, confiance,      │
   │         explication, alternatives }   │

MODULES UTILISÉS :
- extraction/extractor.py  → Extraction texte (PyMuPDF natif + OCR Tesseract en fallback)
- extraction/redactor.py   → Anonymisation/caviardage PDF (PyMuPDF redaction + overlay visuel)
- llm/groq_service.py      → Appels au LLM Groq (Llama 3.1) pour analyse, matching, anonymisation
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
    anonymize_cv_with_llm,
    generate_email_with_llm
)
from extraction.extractor import extract_text
from extraction.redactor import redact_pdf

app = Flask(__name__)
CORS(app)  # Permettre les appels depuis Spring Boot


# ═══════════════════════════════════════════════════════════════════════════════
# ROUTE 1 : Traitement complet d'un CV (appelée automatiquement à la candidature)
# ═══════════════════════════════════════════════════════════════════════════════
#
# QUI L'APPELLE ?  → Spring Boot (CandidatureOffreService.java)
# QUAND ?          → Dès qu'un candidat postule à une offre
# ENTRÉE ?         → Fichier PDF (multipart/form-data) + texte de l'offre
# SORTIE ?         → JSON contenant :
#                    - competences    : liste des compétences extraites du CV
#                    - diplomes       : liste des diplômes extraits du CV
#                    - score          : score de compatibilité CV/offre (0-100)
#                    - score_analysis : explication textuelle du score
#                    - sensitive_phrases      : liste des infos personnelles détectées
#                    - anonymized_pdf_base64  : PDF anonymisé encodé en Base64
#
@app.route("/api/process-cv", methods=["POST"])
def process_cv():
    """
    Endpoint principal appelé par Spring Boot quand un candidat postule.
    Accepte un FICHIER PDF (multipart/form-data).
    """

    # ┌─────────────────────────────────────────────────────────────────────┐
    # │ ÉTAPE 1 : Validation des entrées                                   │
    # │ → Vérifie que le fichier PDF est bien présent dans la requête      │
    # │ → Vérifie que le nom du fichier n'est pas vide                     │
    # │ → Récupère le texte de l'offre (optionnel, pour le matching)       │
    # └─────────────────────────────────────────────────────────────────────┘
    if 'file' not in request.files:
        return jsonify({"error": "Fichier 'file' manquant"}), 400
    
    file = request.files['file']
    offer_text = request.form.get("offer_text", "").strip()

    if file.filename == '':
        return jsonify({"error": "Nom de fichier vide"}), 400

    temp_input = None
    temp_output = None

    try:
        # ┌─────────────────────────────────────────────────────────────────┐
        # │ ÉTAPE 2 : Sauvegarde temporaire du fichier PDF                 │
        # │ → On crée un fichier temporaire sur le disque car PyMuPDF      │
        # │   (fitz) a besoin d'un chemin physique pour ouvrir le PDF      │
        # │ → Le fichier sera supprimé dans le bloc "finally"              │
        # └─────────────────────────────────────────────────────────────────┘
        suffix = os.path.splitext(file.filename)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            file.save(tmp.name)
            temp_input = tmp.name

        # ┌─────────────────────────────────────────────────────────────────┐
        # │ ÉTAPE 3 : Extraction du texte brut depuis le PDF               │
        # │ → Utilise PyMuPDF pour extraire le texte natif (vectoriel)     │
        # │ → Si le PDF est une image scannée, active Tesseract OCR        │
        # │ → Gère les CVs à double colonne (sidebar + contenu principal)  │
        # │ → Retourne le texte complet nettoyé                            │
        # └─────────────────────────────────────────────────────────────────┘
        cv_text = extract_text(temp_input)

        result = {}

        # ┌─────────────────────────────────────────────────────────────────┐
        # │ ÉTAPE 4a : Extraction des compétences et diplômes via LLM      │
        # │ → Envoie le texte du CV au LLM (Groq / Llama 3.1)             │
        # │ → Le LLM analyse et retourne un JSON structuré contenant       │
        # │   les compétences techniques et les diplômes/formations        │
        # │ → Post-traitement : fusion des diplômes fragmentés par le LLM  │
        # └─────────────────────────────────────────────────────────────────┘
        info = extract_information_with_llm(cv_text)
        result["competences"] = info.get("competences", [])
        result["diplomes"]    = info.get("diplomes", [])

        # ┌─────────────────────────────────────────────────────────────────┐
        # │ ÉTAPE 4b : Calcul du score de compatibilité CV ↔ Offre         │
        # │ → Exécuté UNIQUEMENT si le texte de l'offre est fourni         │
        # │ → Le LLM compare les compétences du CV avec les exigences      │
        # │   de l'offre et attribue un score de 0 à 100                   │
        # │ → Fournit aussi une analyse textuelle (points forts/faibles)   │
        # └─────────────────────────────────────────────────────────────────┘
        result["score"]          = None
        result["score_analysis"] = None
        if offer_text:
            matching = analyze_matching_with_llm(cv_text, offer_text)
            result["score"]          = matching.get("score")
            result["score_analysis"] = matching.get("analysis")

        # ┌─────────────────────────────────────────────────────────────────┐
        # │ ÉTAPE 4c : Détection des informations personnelles (RGPD)      │
        # │ → Le LLM identifie les données sensibles dans le CV :          │
        # │   noms, emails, téléphones, adresses, liens LinkedIn/GitHub    │
        # │ → Retourne une liste de phrases EXACTES à caviarder            │
        # │ → Post-traitement : décompose les emails pour capter aussi     │
        # │   le username seul (ex: "john.doe" depuis "john.doe@gmail.com")│
        # └─────────────────────────────────────────────────────────────────┘
        sensitive_phrases = anonymize_cv_with_llm(cv_text)
        result["sensitive_phrases"] = sensitive_phrases

        # ┌─────────────────────────────────────────────────────────────────┐
        # │ ÉTAPE 5 : Anonymisation visuelle du PDF (Caviardage)           │
        # │ → Utilise PyMuPDF pour localiser les phrases sensibles dans    │
        # │   le PDF original (recherche textuelle ou OCR si image)        │
        # │ → Applique des rectangles de masquage navy arrondis par-dessus │
        # │ → Le texte original est IRRÉVERSIBLEMENT supprimé du PDF       │
        # │ → Sauvegarde le résultat dans un fichier temporaire            │
        # └─────────────────────────────────────────────────────────────────┘
        temp_output = temp_input + "_anon.pdf"
        redact_pdf(temp_input, sensitive_phrases, temp_output)

        # ┌─────────────────────────────────────────────────────────────────┐
        # │ ÉTAPE 6 : Encodage Base64 pour le transport via JSON           │
        # │ → Lit le PDF anonymisé en bytes binaires                       │
        # │ → L'encode en Base64 (texte ASCII) pour pouvoir le transporter │
        # │   dans une réponse JSON vers Spring Boot                       │
        # │ → Spring Boot décodera le Base64 et stockera le PDF            │
        # └─────────────────────────────────────────────────────────────────┘
        with open(temp_output, "rb") as f:
            result["anonymized_pdf_base64"] = base64.b64encode(f.read()).decode('utf-8')

        return jsonify(result), 200

    except Exception as e:
        print(f"Erreur /api/process-cv : {e}")
        return jsonify({"error": f"Erreur IA : {str(e)}"}), 500
    
    finally:
        # ┌─────────────────────────────────────────────────────────────────┐
        # │ NETTOYAGE : Suppression des fichiers temporaires               │
        # │ → Garantit que RIEN ne reste sur le disque (stateless)         │
        # │ → S'exécute même en cas d'erreur (bloc finally)                │
        # └─────────────────────────────────────────────────────────────────┘
        if temp_input and os.path.exists(temp_input):
            os.remove(temp_input)
        if temp_output and os.path.exists(temp_output):
            os.remove(temp_output)


# ═══════════════════════════════════════════════════════════════════════════════
# ROUTE 2 : Prédiction du métier idéal (appelée sur demande)
# ═══════════════════════════════════════════════════════════════════════════════
#
# QUI L'APPELLE ?  → Spring Boot (sur action utilisateur, ex: bouton "Prédire")
# QUAND ?          → Quand un recruteur veut connaître le métier idéal du candidat
# ENTRÉE ?         → Fichier PDF (multipart/form-data)
# SORTIE ?         → JSON contenant :
#                    - metier_ideal      : le poste recommandé (ex: "Développeur Full-Stack")
#                    - confiance         : niveau de confiance du LLM (0-100%)
#                    - explication       : justification textuelle
#                    - toutes_categories : top 3 des métiers alternatifs avec scores
#
@app.route("/api/predict-job", methods=["POST"])
def predict_job():
    """
    Prédit le métier idéal d'un candidat depuis son CV.
    
    Accepte un FICHIER PDF (multipart/form-data) 
    pour appliquer l'OCR si nécessaire.
    """

    # ┌─────────────────────────────────────────────────────────────────────┐
    # │ ÉTAPE 1 : Validation des entrées                                   │
    # │ → Vérifie que le fichier PDF est présent et a un nom valide        │
    # └─────────────────────────────────────────────────────────────────────┘
    if 'file' not in request.files:
        return jsonify({"error": "Fichier 'file' manquant"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "Nom de fichier vide"}), 400

    temp_input = None
    try:
        # ┌─────────────────────────────────────────────────────────────────┐
        # │ ÉTAPE 2 : Sauvegarde temporaire du fichier                     │
        # │ → Même logique que la Route 1                                  │
        # └─────────────────────────────────────────────────────────────────┘
        suffix = os.path.splitext(file.filename)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            file.save(tmp.name)
            temp_input = tmp.name

        # ┌─────────────────────────────────────────────────────────────────┐
        # │ ÉTAPE 3 : Extraction du texte (PyMuPDF natif + OCR fallback)   │
        # └─────────────────────────────────────────────────────────────────┘
        cv_text = extract_text(temp_input)
        
        # ┌─────────────────────────────────────────────────────────────────┐
        # │ ÉTAPE 4 : Prédiction du métier via LLM                         │
        # │ → Envoie le texte complet du CV au LLM (Groq / Llama 3.1)     │
        # │ → Le LLM analyse les compétences, expériences et formations    │
        # │ → Retourne le métier idéal + confiance + alternatives          │
        # └─────────────────────────────────────────────────────────────────┘
        prediction = predict_job_category_with_llm(cv_text)
        return jsonify(prediction), 200

    except Exception as e:
        print(f"Erreur /api/predict-job : {e}")
        return jsonify({"error": f"Erreur IA : {str(e)}"}), 500
        
    finally:
        # ┌─────────────────────────────────────────────────────────────────┐
        # │ NETTOYAGE : Suppression du fichier temporaire                  │
        # └─────────────────────────────────────────────────────────────────┘
        if temp_input and os.path.exists(temp_input):
            os.remove(temp_input)


# ═══════════════════════════════════════════════════════════════════════════════
# ROUTE 3 : Health Check (pour monitoring et vérification)
# ═══════════════════════════════════════════════════════════════════════════════
#
# QUI L'APPELLE ?  → Spring Boot au démarrage OU outils de monitoring
# QUAND ?          → Pour vérifier que le micro-service Python est bien en ligne
# ENTRÉE ?         → Rien (GET simple)
# SORTIE ?         → JSON { status: "ok", service, mode, version }
#
@app.route("/api/health", methods=["GET"])
def health():
    """
    Simple vérification de santé — si cette route répond,
    le service IA est opérationnel et prêt à recevoir des CVs.
    """
    return jsonify({
        "status": "ok",
        "service": "smartrecruit-ai",
        "mode": "stateless-production",
        "version": "2.0"
    }), 200


# ═══════════════════════════════════════════════════════════════════════════════
# ROUTE 4 : Génération d'e-mail IA (Acceptation/Refus)
# ═══════════════════════════════════════════════════════════════════════════════
@app.route("/api/generate-email", methods=["POST"])
def generate_email():
    """
    Crée un draft d'e-mail pour un candidat en fonction de la décision RH.
    Attendu en JSON : { candidate_name: "...", job_title: "...", decision: "ACCEPTEE", language: "fr" }
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "Aucun corps JSON fourni."}), 400

    candidate_name = data.get("candidate_name", "Candidat")
    job_title = data.get("job_title", "le poste")
    decision = data.get("decision", "REFUSEE")
    language = data.get("language", "fr")
    reasons = data.get("reasons", "")

    email_draft = generate_email_with_llm(candidate_name, job_title, decision, language, reasons)
    
    return jsonify({
        "email": email_draft
    }), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
    # Note: port 5001 pour ne pas conflicter avec app.py (port 5000)
