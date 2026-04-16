#!/bin/bash
# Lancer le serveur SmartRecruite avec Groq + Llama3

echo "🚀 Démarrage de SmartRecruite..."
cd "c:\Users\pc\Desktop\projet_metier\SmartRecruite_App\model copy"

# Vérifier que .env existe
if [ ! -f .env ]; then
    echo "❌ ERREUR: Fichier .env non trouvé!"
    echo "Crée .env avec: GROQ_API_KEY=gsk_..."
    exit 1
fi

echo "✅ .env trouvé"
echo "🤖 Démarrage du serveur Flask..."
python app.py
