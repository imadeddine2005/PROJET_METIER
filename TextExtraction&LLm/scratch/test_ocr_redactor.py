import os
import fitz
from extraction.extractor import extract_text
from llm.groq_service import anonymize_cv_with_llm
from extraction.redactor import redact_pdf

def run_test():
    input_pdf = os.path.join("test", "cv_pdf_image.pdf")
    output_pdf = os.path.join("test", "cv_pdf_image_redacted_cache.pdf")
    
    print("==================================================")
    print("🚀 TEST E2E : Spatial Caching (OCR One-Pass)")
    print("==================================================\n")
    
    try:
        # Étape 1 : Extraction du texte (Génère le Cache Spatial)
        print("Étape 1 : Extraction OCR et création du Spatial Cache...")
        cv_text = extract_text(input_pdf)
        
        # Étape 2 : Groq
        print("\nÉtape 2 : Analyse LLM (Groq)...")
        phrases_to_hide = anonymize_cv_with_llm(cv_text)
        print(f"  -> Groq a trouvé : {phrases_to_hide}")
        
        if not phrases_to_hide:
            return

        # Étape 3 : Caviardage (Consomme le Cache Spatial)
        print("\nÉtape 3 : Application du caviardage (Zéro OCR Supplémentaire)...")
        redact_pdf(input_pdf, phrases_to_hide, output_pdf)
        print("✅ Fichier caviardé généré :", output_pdf)
        
    except Exception as e:
        print(f"❌ ERREUR: {e}")

if __name__ == '__main__':
    run_test()
