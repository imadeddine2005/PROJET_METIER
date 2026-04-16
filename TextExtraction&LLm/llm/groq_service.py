import os
import json
import re
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
