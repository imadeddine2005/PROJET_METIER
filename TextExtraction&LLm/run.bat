@echo off
REM Lancer le serveur SmartRecruite avec Groq + Llama3

cls
echo.
echo ==================================================
echo   SmartRecruite powered by Groq + Llama3
echo ==================================================
echo.

cd /d "c:\Users\pc\Desktop\projet_metier\SmartRecruite_App\model copy"

REM Verifier que .env existe
if not exist .env (
    echo.
    echo ❌ ERREUR: Fichier .env non trouve!
    echo.
    echo Crée .env avec ta clé API:
    echo GROQ_API_KEY=gsk_...
    echo.
    pause
    exit /b 1
)

echo ✅ Fichier .env trouvé
echo.
echo 🤖 Démarrage du serveur Flask...
echo.

python app.py

pause
