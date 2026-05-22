import re
import requests
import fitz
from extraction.extractor import extract_text

def extract_github_link(pdf_path: str) -> str:
    """
    Extrait l'URL GitHub depuis un PDF de 3 façons différentes :
    1. Lien cliquable caché (Annotations URI)
    2. Texte natif
    3. Texte OCR (pour les images scannées)
    """
    # CAS C : Recherche des liens cliquables (URIs) cachés derrière des mots
    try:
        doc = fitz.open(pdf_path)
        for page in doc:
            links = page.get_links()
            for link in links:
                uri = link.get("uri", "")
                if uri and "github.com/" in uri:
                    doc.close()
                    return uri.strip()
        doc.close()
    except Exception as e:
        print(f"Erreur lors de la lecture native des liens avec fitz: {e}")

    # CAS A & B : Recherche dans le texte brut (Natif ou OCR)
    try:
        # extract_text gère automatiquement le texte natif ET le fallback OCR
        full_text = extract_text(pdf_path)
        
        # Regex pour trouver une URL GitHub dans le texte
        # Ex: https://github.com/imadeddineoukrati25 ou github.com/username
        match = re.search(r'(?:https?://)?(?:www\.)?github\.com/([a-zA-Z0-9_-]+)', full_text, re.IGNORECASE)
        if match:
            username = match.group(1)
            return f"https://github.com/{username}"
    except Exception as e:
        print(f"Erreur lors de l'extraction textuelle/OCR: {e}")

    return None

def fetch_github_stats(github_url: str) -> dict:
    """
    Récupère les statistiques publiques d'un compte GitHub via son URL.
    """
    if not github_url:
        return None

    try:
        # Extraire le username proprement
        # Supprimer les éventuels trailing slashes ou paramètres
        clean_url = github_url.split('?')[0].rstrip('/')
        username = clean_url.split('github.com/')[-1]
        
        if not username:
            return None

        # Appels à l'API publique de GitHub
        api_url = f"https://api.github.com/users/{username}"
        repos_url = f"https://api.github.com/users/{username}/repos?per_page=100&sort=updated"
        
        # Timeout de 5s pour éviter de bloquer l'interface
        user_response = requests.get(api_url, timeout=5)
        if user_response.status_code != 200:
            return None
            
        user_data = user_response.json()
        
        repos_response = requests.get(repos_url, timeout=5)
        repos_data = repos_response.json() if repos_response.status_code == 200 else []
        
        # Extraire les langages uniques et les trier par occurrence (simplifié)
        languages = []
        for r in repos_data:
            lang = r.get('language')
            if lang and lang not in languages:
                languages.append(lang)
                
        return {
            "username": username,
            "url": github_url,
            "public_repos": user_data.get("public_repos", 0),
            "followers": user_data.get("followers", 0),
            "top_languages": languages[:5], # Les 5 premiers langages rencontrés
            "bio": user_data.get("bio") or "Aucune biographie disponible",
            "avatar_url": user_data.get("avatar_url")
        }
    except Exception as e:
        print(f"Erreur lors de la récupération des données GitHub: {e}")
        return None
