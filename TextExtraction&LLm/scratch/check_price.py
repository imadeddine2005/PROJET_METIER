import os
import requests
from dotenv import load_dotenv

load_dotenv()

URL = "https://openrouter.ai/api/v1/models"

def check_qwen3_price():
    try:
        response = requests.get(URL)
        response.raise_for_status()
        models = response.json().get("data", [])
        
        target_model = "qwen/qwen3-vl-8b-instruct"
        for m in models:
            if m["id"] == target_model:
                pricing = m.get("pricing", {})
                prompt_price = float(pricing.get("prompt", 0))
                completion_price = float(pricing.get("completion", 0))
                image_price = float(pricing.get("image", 0))
                
                print(f"Détails des prix pour : {target_model}")
                print(f"- Prix par 1M tokens (Prompt / Entrée) : {prompt_price * 1000000}$")
                print(f"- Prix par 1M tokens (Completion / Sortie) : {completion_price * 1000000}$")
                print(f"- Prix par image : {image_price}$")
                
                if prompt_price == 0 and completion_price == 0:
                    print("\n=> Résultat : Le modèle est 100% GRATUIT ! 🟢")
                else:
                    print("\n=> Résultat : Le modèle est PAYANT 🟡 (mais souvent très peu cher)")
                return
                
        print(f"Modèle {target_model} introuvable.")
            
    except Exception as e:
        print(f"Erreur : {e}")

if __name__ == "__main__":
    check_qwen3_price()
