import os
import json
import re
from datetime import datetime, timedelta
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GROQ_API_KEY")
if not api_key:
    raise ValueError("GROQ_API_KEY non trouvée dans .env")

client = Groq(api_key=api_key)

def call_groq_llm(prompt: str, model: str = "llama-3.1-8b-instant", max_tokens: int = 1500) -> str:
    try:
        completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model=model,
            max_tokens=max_tokens,
            temperature=0.1,
        )
        return completion.choices[0].message.content.strip()
    except Exception as e:
        print(f"Erreur Groq: {str(e)}")
        raise

def robust_json_parse(response: str):
    """Essaie d'extraire de manière robuste un dictionnaire JSON généré par l'IA"""
    try:
        json_match = re.search(r'\{.*\}', response, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
    except Exception:
        pass
    return None

def anonymize_cv_with_llm(cv_text: str) -> list:
    prompt = f"""Tu es un expert en RGPD. Ton but est d'isoler les informations personnelles de ce CV pour qu'un algorithme puisse les caviarder dans le PDF original.
Identifie EXCLUSIVEMENT ET EXACTEMENT :
- Les prénoms et noms complets du candidat (et aussi juste le prénom seul ou nom seul s'il apparaît séparément)
- Les emails (et aussi juste la partie avant le @, ex: si email est "john.doe@gmail.com", ajoute aussi "john.doe@gmail.com", car il peut être coupé en deux)
- Les numéros de téléphone (toutes les formes : +212..., 06..., 0600...)
- Les dates de naissance / âge
- Les adresses physiques complètes ou partielles (Ville, Rue, Code Postal)
- Les identifiants personnels visibles (URL LinkedIn, profil GitHub, URL de portfolio)

RÈGLE VITALE : Tu dois COPIER-COLLER EXACTEMENT (au caractère près) les mots tels qu'ils sont écrits dans le texte du CV.
Ne normalise PAS, ne corrige PAS les fautes, ne reformate PAS les numéros.

Retourne UNIQUEMENT un JSON avec cette liste :
{{
  "sensibles": ["Mohamed El Amrani", "m.elamrani@gmail.com", "+212 6 61 23 45 67", "Casablanca", "linkedin.com/in/mohamedelamrani"]
}}

CV:
{cv_text[:3000]}"""
    resp = call_groq_llm(prompt, max_tokens=1000)
    data = robust_json_parse(resp)
    if isinstance(data, dict):
        raw = data.get("sensibles", [])
        # Étape de sécurité : on déduit aussi des sous-parties courtes pour les emails
        expanded = list(raw)
        for item in raw:
            item = str(item).strip()
            # Si c'est un email, ajouter aussi le nom d'utilisateur (avant @)
            if "@" in item:
                username = item.split("@")[0]
                if len(username) > 4:
                    expanded.append(username)
        return expanded
    return []

def extract_information_with_llm(cv_text: str) -> dict:
    """Extrait compétences et diplômes"""
    prompt = f"""Analyse ce CV. Extrait les compétences et les diplômes/formations.
S'il y a des indications de colonnes dans le texte (ex: SIDEBAR), traite-les comme faisant partie intégrante du document.

IMPORTANT - RÈGLE DE FORMATAGE DES DIPLÔMES : 
Chaque diplôme doit être une SEULE chaîne de caractères unique regroupant impérativement (Titre du diplôme + Établissement + Dates). 
NE SÉPARE JAMAIS l'année du titre du diplôme, fusionne-les.

✅ BON : ["Master en IA, Université de Paris, 2021-2023"]
❌ MAUVAIS : ["Master en IA", "Université de Paris", "2021-2023"]

Retourne UNIQUEMENT un JSON valide avec cette structure :
{{
  "competences": ["nom de competence 1", "nom de competence 2"],
  "diplomes": ["Titre, Établissement, Dates"]
}}

CV:
{cv_text[:3000]}"""
    resp = call_groq_llm(prompt, max_tokens=1000)
    data = robust_json_parse(resp)
    
    if isinstance(data, dict):
        competences = data.get("competences", [])
        raw_diplomes = data.get("diplomes", [])
        
        # --- POST-TRAITEMENT DE SÉCURITÉ ULTRA-ROBUSTE ---
        # On définit ce qui ressemble à un début de diplôme
        TITRES_CLES = ['master', 'licence', 'bac', 'cycle', 'diplôme', 'diplome', 'formation', 'bachelor', 'ingénieur', 'ingenieur', 'msc', 'mba', 'phd', 'doctorat']
        
        merged_diplomes = []
        for item in raw_diplomes:
            item = item.strip()
            if not item: continue
            
            # On vérifie si l'item commence par un mot clé de diplôme
            lower_item = item.lower()
            is_new_diploma = any(lower_item.startswith(tk) for tk in TITRES_CLES)
            
            # Si ce n'est pas un nouveau diplôme (ex: c'est juste une ville ou une date)
            # ou si c'est très court (moins de 10 chars), on fusionne avec le précédent.
            if merged_diplomes and (not is_new_diploma or len(item) < 10):
                # On évite les répétitions si la fusion a déjà eu lieu
                if item.lower() not in merged_diplomes[-1].lower():
                    merged_diplomes[-1] = f"{merged_diplomes[-1]}, {item}"
            else:
                merged_diplomes.append(item)
        
        return {
            "competences": competences,
            "diplomes": merged_diplomes
        }
    
    return {"competences": [], "diplomes": []}

def analyze_matching_with_llm(cv_text: str, offer_text: str) -> dict:
    prompt = f"""Tu es un recruteur expert. Analyse la compatibilité entre ce CV et cette offre.
Lis l'ensemble du CV (fais attention aux éventuelles indications de colonnes ou sidebars) pour ne rater aucune compétence.
1. Calcule un score de pertinence entre 0 et 100.
2. Donne une courte analyse (1-2 phrases) des points forts et des lacunes (points faibles) en te basant STRICTEMENT sur le texte.

Retourne UNIQUEMENT un JSON valide avec cette structure (remplace par ton analyse) :
{{
  "score": (insere un nombre ici),
  "analysis": "Insere ton analyse precise ici en fonction du CV et de l'offre."
}}

OFFRE:
{offer_text[:2000]}

CV:
{cv_text[:3000]}"""
    resp = call_groq_llm(prompt, max_tokens=800)
    data = robust_json_parse(resp)
    if isinstance(data, dict):
        return {
            "score": data.get("score", 50),
            "analysis": data.get("analysis", "Analyse non disponible.")
        }
    return {"score": 50, "analysis": "Impossible de calculer le score."}

def predict_job_category_with_llm(cv_text: str) -> dict:
    prompt = f"""Tu es un expert RH. Quel est le rôle principal et idéal pour ce candidat parmi la sphère IT / Engineering ?
Prends en compte toutes les compétences et expériences, qu'elles soient dans une colonne annexe ou dans le corps principal du CV.
Donne : le métier idéal, une confiance en % (0-100), une explication claire et concise, et 3 alternatives.

Retourne UNIQUEMENT un JSON avec cette structure (ne recopie pas cet exemple !) :
{{
  "metier_ideal": "Le metier",
  "confiance": 90,
  "explication": "Ton explication de 1 phrase.",
  "toutes_categories": {{
    "Metier 1": 90,
    "Metier 2": 60,
    "Metier 3": 40
  }}
}}

CV:
{cv_text[:3000]}"""
    resp = call_groq_llm(prompt, max_tokens=800)
    data = robust_json_parse(resp)
    if isinstance(data, dict):
        return data
    return {
        "metier_ideal": "Indéterminé",
        "confiance": 0,
        "explication": "Analyse échouée.",
        "toutes_categories": {}
    }

def generate_email_with_llm(candidate_name: str, job_title: str, decision: str, language: str = "fr", reasons: str = "") -> str:
    """
    Génère un e-mail professionnel via l'IA en fonction de la décision (ACCEPTEE/REFUSEE).
    Structure fixe avec marqueurs pour le parsing Java.
    """
    tomorrow = (datetime.now() + timedelta(days=1)).strftime("%d/%m/%Y")

    reasons_en = f"\n\nHere are the specific reasons for this decision (score analysis):\n{reasons}\nYou MUST include these reasons in your email inside a block marked exactly by ##REASONS_START## and ##REASONS_END##." if reasons else ""
    reasons_block_en_positive = "\n##REASONS_START##\n[Briefly mention the positive reasons for this decision here]\n##REASONS_END##\n" if reasons else ""
    reasons_block_en_negative = "\n##REASONS_START##\n[Briefly mention the constructive reasons for this decision here]\n##REASONS_END##\n" if reasons else ""

    reasons_fr = f"\n\nVoici les raisons spécifiques de cette décision (analyse du score) :\n{reasons}\nTu DOIS inclure ces raisons dans ton e-mail à l'intérieur d'un bloc délimité exactement par les marqueurs ##REASONS_START## et ##REASONS_END##." if reasons else ""
    reasons_block_fr_positive = "\n##REASONS_START##\n[Mentionne brièvement les raisons positives de cette décision ici]\n##REASONS_END##\n" if reasons else ""
    reasons_block_fr_negative = "\n##REASONS_START##\n[Mentionne brièvement les raisons constructives de cette décision ici]\n##REASONS_END##\n" if reasons else ""

    if language == "en":
        if decision.upper() == "ACCEPTEE":
            prompt = f"""You are an HR recruiter. Write a concise, warm acceptance email for {candidate_name} for the {job_title} position. Be direct, no repetition.{reasons_en}

You MUST follow this EXACT structure (do not change the marker lines):

Subject: [write subject here]

[Write 2-3 short sentences: congratulate the candidate, and confirm the interview.]

##INTERVIEW_START##
Date: {tomorrow} at 10:00 AM
Location: Company premises
Duration: Approximately 1 hour
##INTERVIEW_END##

{reasons_block_en_positive}
[Write 1 short closing sentence]

[Signature]

IMPORTANT:
- Write STRICTLY IN ENGLISH.
- Return ONLY the email text. No commentary, no prefix like "Here is the email:".
- Do NOT change or omit the markers ##INTERVIEW_START##, ##INTERVIEW_END##, ##REASONS_START##, ##REASONS_END## if they are present."""

        else:
            prompt = f"""You are an HR recruiter. Write a concise, polite rejection email for {candidate_name} for the {job_title} position. Be direct, no repetition.{reasons_en}

You MUST follow this EXACT structure:

Subject: [write subject here]

[Write 2-3 short sentences: thank the candidate, and inform them of the decision.]

{reasons_block_en_negative}
[Signature]

IMPORTANT:
- Write STRICTLY IN ENGLISH.
- Return ONLY the email text. No commentary, no prefix.
- Do NOT change or omit the markers ##REASONS_START## and ##REASONS_END## if they are present."""

    else:
        # French
        if decision.upper() == "ACCEPTEE":
            prompt = f"""Tu es un(e) recruteur/RH. Rédige un e-mail d'acceptation concis et chaleureux pour {candidate_name} pour le poste de {job_title}. Sois direct, pas de répétition.{reasons_fr}

Tu DOIS suivre cette structure EXACTE (ne change pas les lignes marqueurs) :

Objet : [écris l'objet ici]

[Écris 2-3 phrases courtes : félicite le candidat, et confirme l'entretien.]

##INTERVIEW_START##
Date : {tomorrow} à 10h00
Lieu : Locaux de l'entreprise
Durée : Environ 1 heure
##INTERVIEW_END##

{reasons_block_fr_positive}
[Écris 1 phrase de clôture courte]

[Signature]

IMPORTANT :
- Rédige STRICTEMENT EN FRANÇAIS.
- Retourne UNIQUEMENT le texte de l'e-mail. Pas de commentaire, pas de préfixe type "Voici l'e-mail :".
- Ne modifie PAS et n'omets PAS les marqueurs ##INTERVIEW_START##, ##INTERVIEW_END##, ##REASONS_START##, ##REASONS_END## s'ils sont présents."""

        else:
            prompt = f"""Tu es un(e) recruteur/RH. Rédige un e-mail de refus concis et poli pour {candidate_name} pour le poste de {job_title}. Sois direct, pas de répétition.{reasons_fr}

Tu DOIS suivre cette structure EXACTE :

Objet : [écris l'objet ici]

[Écris 2-3 phrases courtes : remercie le candidat, et informe-le de la décision.]

{reasons_block_fr_negative}
[Signature]

IMPORTANT :
- Rédige STRICTEMENT EN FRANÇAIS.
- Retourne UNIQUEMENT le texte de l'e-mail. Pas de commentaire, pas de préfixe.
- Ne modifie PAS et n'omets PAS les marqueurs ##REASONS_START## et ##REASONS_END## s'ils sont présents."""

    try:
        resp = call_groq_llm(prompt, max_tokens=500)
        return resp.strip()
    except Exception as e:
        return f"Erreur lors de la génération de l'e-mail : {str(e)}"
