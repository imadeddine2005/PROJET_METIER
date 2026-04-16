# Service IA SmartRecruit - Architecture d'Extraction et d'Anonymisation

Ce service est le moteur d'intelligence artificielle de la plateforme **SmartRecruit**. Il est responsable de l'analyse des CV (PDF textuels ou images), de l'extraction structurée des compétences et du caviardage (anonymisation) des données sensibles.

## 🚀 Fonctionnalités
- **OCR Haute Définition** : Conversion des scans/images PDF en texte via Tesseract.
- **Anonymisation Visuelle** : Masquage physique des données sensibles (Nom, Email, Téléphone, etc.) sur le PDF.
- **Analyse LLM (Groq)** : Extraction des compétences, diplômes et score de matching via l'API Groq.
- **Serveur Flask** : API REST exposant les fonctionnalités de traitement au Backend Java.

---

## 🛠️ Pré-requis (Installation)

Avant de lancer le serveur, assurez-vous d'avoir installé les éléments suivants :

### 1. Python 3.x
Installez Python [ici](https://www.python.org/downloads/). Vérifiez avec `python --version`.

### 2. Tesseract OCR (Obligatoire pour les scans)
Le service utilise Tesseract pour "lire" les images.
1. Téléchargez l'installeur pour Windows [ici](https://github.com/UB-Mannheim/tesseract/wiki).
2. Installez-le (souvent dans `C:\Program Files\Tesseract-OCR`).
3. **Important** : Pour une meilleure détection du français, assurez-vous que le fichier `fra.traineddata` est présent dans le dossier `tessdata`. Téléchargez-le [ici](https://github.com/tesseract-ocr/tessdata/blob/main/fra.traineddata) si nécessaire.

### 3. Clé API Groq
Créez un compte sur [Groq Cloud](https://console.groq.com/keys) et générez une clé API.

---

## ⚙️ Configuration du projet

1. **Allez dans le dossier du serveur IA** :
   ```bash
   cd TextExtraction&LLm
   ```

2. **Installer les dépendances Python** :
   ```bash
   pip install -r requirements.txt
   ```

3. **Configurer les variables d'environnement** :
   Créez un fichier `.env` à la racine de ce dossier avec le contenu suivant :
   ```env
   GROQ_API_KEY=votre_cle_api_ici
   TESSERACT_EXE_PATH=C:\Program Files\Tesseract-OCR\tesseract.exe
   ```

---

## 🏁 Lancement du serveur

Lancez le serveur Flask avec la commande suivante :
```bash
python app1.py
```
Le serveur sera disponible sur `http://localhost:5001`.

---

## 📡 API Endpoints

### `POST /api/process-cv`
C'est le point d'entrée principal utilisé par le backend Java.
- **Paramètres (Multipart/Form-Data)** :
  - `file` : Le fichier PDF du CV.
  - `offer_text` (Optionnel) : Le texte de l'offre d'emploi pour le matching.
- **Réponse (JSON)** : Contient le score, les compétences extraites et le PDF anonymisé en format Base64.

---

## 📁 Structure du dossier
- `app1.py` : Serveur Flask et routes API.
- `llm/` : Logique de communication avec l'API Groq.
- `extraction/` : Modules d'OCR (Tesseract) et de Redaction (PyMuPDF).
- `requirements.txt` : Liste des bibliothèques nécessaires.
