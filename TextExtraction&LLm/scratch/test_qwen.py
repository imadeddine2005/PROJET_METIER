import os
import difflib
from extraction.extractor import extract_text

import re

def calculate_accuracy(extracted_text, correct_text):
    """Calcule le pourcentage de similarité en ignorant les espaces, sauts de ligne et puces."""
    def clean_text(t):
        # Convertir en minuscules
        t = t.lower()
        # Supprimer tout ce qui n'est pas des lettres ou des chiffres (enlève espaces, \n, •, -, etc.)
        return re.sub(r'[^\w]', '', t)
        
    clean_extracted = clean_text(extracted_text)
    clean_correct = clean_text(correct_text)
    
    matcher = difflib.SequenceMatcher(None, clean_extracted, clean_correct)
    return matcher.ratio() * 100

def test_qwen_accuracy():
    # Chemins des fichiers
    pdf_path = os.path.join("test", "cv_pdf_image.pdf")
    correct_txt_path = os.path.join("test", "text_correct.txt")
    
    print("==================================================")
    print("🚀 Test de Précision avec Qwen3 VL 8B")
    print(f"Fichier cible : {pdf_path}")
    print("==================================================\n")
    
    # Vérifier si le fichier texte correct existe
    if not os.path.exists(correct_txt_path):
        print(f"❌ Le fichier {correct_txt_path} n'existe pas.")
        return

    # 1. Lire le texte parfait (Ground Truth)
    with open(correct_txt_path, "r", encoding="utf-8") as f:
        correct_text = f.read().strip()
    
    # 2. Extraire avec Qwen
    try:
        print("Extraction en cours avec Qwen3 VL 8B... (Veuillez patienter)")
        extracted_text = extract_text(pdf_path)
        
        # 3. Calculer la précision
        accuracy = calculate_accuracy(extracted_text, correct_text)
        
        print("\n✅ RÉSULTAT DE L'EXTRACTION :")
        print("-" * 50)
        print(f"Caractères attendus : {len(correct_text)}")
        print(f"Caractères extraits : {len(extracted_text)}")
        print("-" * 50)
        print(f"🎯 PRÉCISION DU MODÈLE QWEN3 VL 8B : {accuracy:.2f} %")
        print("-" * 50)
        
        if accuracy > 95:
            print("🌟 Excellent ! Le modèle lit parfaitement le document.")
        elif accuracy > 85:
            print("👍 Très bien ! Quelques différences mineures (espaces ou sauts de ligne).")
        else:
            print("⚠️ Précision moyenne. Il peut y avoir des pertes de données.")
            
    except Exception as e:
        print(f"\n❌ ERREUR: {e}")

if __name__ == "__main__":
    test_qwen_accuracy()
