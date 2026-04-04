from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from extraction.extractor import extract_text
from nlp.doc_anonymizer import create_anonymized_file
from ml.matching import calculate_matching_score
from ml.classifier_xgb import predict_job_category
import os
import uuid
import tempfile

app = Flask(__name__)
CORS(app)

ORIGINAL_DIR = "uploads/originals"
ANON_DIR = "uploads/anonymized"
os.makedirs(ORIGINAL_DIR, exist_ok=True)
os.makedirs(ANON_DIR, exist_ok=True)
os.makedirs("uploads", exist_ok=True)


@app.route("/")
def index():
    return """
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>SmartRecruit - Test Local</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: sans-serif; background: #f5f5f5; padding: 30px; }
    h1 { color: #1a1a2e; margin-bottom: 8px; }
    .subtitle { color: #666; margin-bottom: 30px; font-size: 14px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .card { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    h2 { font-size: 16px; color: #333; margin-bottom: 16px; }
    label { display: block; font-size: 13px; color: #555; margin-bottom: 6px; }
    input[type=file], textarea { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px; font-size: 13px; margin-bottom: 12px; }
    textarea { height: 80px; resize: vertical; }
    button { background: #16213e; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 13px; width: 100%; }
    button:hover { background: #0f3460; }
    .result { margin-top: 14px; padding: 12px; background: #f8f9fa; border-radius: 8px; font-size: 12px; white-space: pre-wrap; color: #333; min-height: 40px; max-height: 250px; overflow-y: auto; }
    .cv-frame { margin-top: 14px; width: 100%; height: 400px; border: 1px solid #ddd; border-radius: 8px; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; margin-right: 6px; margin-bottom: 6px; }
    .badge-blue { background: #e3f0ff; color: #1a5fb4; }
    .badge-green { background: #e3f9e5; color: #1b5e20; }
    .badge-orange { background: #fff3e0; color: #e65100; }
    .score-bar { background: #eee; border-radius: 10px; height: 12px; margin: 6px 0; overflow: hidden; }
    .score-fill { height: 100%; border-radius: 10px; background: linear-gradient(90deg, #16213e, #0f3460); transition: width 0.5s; }
    hr { border: none; border-top: 1px solid #eee; margin: 16px 0; }
    .cv-id { font-family: monospace; font-size: 11px; color: #999; }
    .btn-row { display: flex; gap: 10px; }
    .btn-row button { width: auto; flex: 1; }
    .btn-secondary { background: #6c757d !important; }
  </style>
</head>
<body>
<h1>SmartRecruit - Test Local</h1>
<p class="subtitle">Interface de test sans Spring Boot ni React</p>
<div class="grid">
  <div class="card">
    <h2>Traiter un CV (Matching + Anonymisation)</h2>
    <label>Fichier CV (PDF ou DOCX)</label>
    <input type="file" id="cv1" accept=".pdf,.docx">
    <label>Description de l offre (optionnel)</label>
    <textarea id="offer" placeholder="Ex: Developpeur Python Flask Machine Learning MySQL..."></textarea>
    <button onclick="processCV()">Envoyer</button>
    <div id="result1" class="result">En attente...</div>
    <div id="cv-viewer" style="display:none">
      <hr>
      <div class="btn-row">
        <button onclick="showPDF(\'anonymized\')" class="btn-secondary">CV Anonymise (RH)</button>
        <button onclick="showPDF(\'original\')">CV Original (Admin)</button>
      </div>
      <iframe id="cv-frame" class="cv-frame"></iframe>
    </div>
  </div>
  <div class="card">
    <h2>Decouvrir son Metier Ideal</h2>
    <label>Fichier CV (PDF ou DOCX)</label>
    <input type="file" id="cv2" accept=".pdf,.docx">
    <button onclick="predictJob()">Predire le metier</button>
    <div id="result2" class="result">En attente...</div>
  </div>
</div>
<script>
let currentCvId = null;
async function processCV() {
  const file = document.getElementById("cv1").files[0];
  const offer = document.getElementById("offer").value;
  const resultDiv = document.getElementById("result1");
  if (!file) { resultDiv.textContent = "Choisissez un fichier."; return; }
  resultDiv.textContent = "Traitement en cours...";
  const formData = new FormData();
  formData.append("cv", file);
  formData.append("offer_text", offer);
  try {
    const res = await fetch("/process-cv", { method: "POST", body: formData });
    const data = await res.json();
    if (data.error) { resultDiv.textContent = "Erreur : " + data.error; return; }
    currentCvId = data.cv_id;
    let html = `<span class="cv-id">cv_id : ${data.cv_id}</span>\n`;
    html += `Langue : <b>${data.language === "fr" ? "Francais" : "Anglais"}</b>\n\n`;
    if (data.score_matching !== null) {
      const score = data.score_matching;
      const color = score > 70 ? "#2e7d32" : score > 40 ? "#e65100" : "#c62828";
      html += `Score matching : <b style="color:${color}">${score}%</b>\n`;
      html += `<div class="score-bar"><div class="score-fill" style="width:${score}%"></div></div>\n`;
    }
    html += `\nCompetences :\n`;
    (data.fields.competences || []).forEach(s => { html += `<span class="badge badge-blue">${s}</span>`; });
    html += `\n\nDiplomes :\n`;
    (data.fields.diplomes || []).forEach(d => { html += `<span class="badge badge-green">${d}</span>`; });
    if ((data.fields.organisations || []).length > 0) {
      html += `\n\nOrganisations :\n`;
      data.fields.organisations.forEach(o => { html += `<span class="badge badge-orange">${o}</span>`; });
    }
    resultDiv.innerHTML = html;
    document.getElementById("cv-viewer").style.display = "block";
    showPDF("anonymized");
  } catch (e) { resultDiv.textContent = "Erreur reseau : " + e.message; }
}
function showPDF(type) {
  if (!currentCvId) return;
  document.getElementById("cv-frame").src = `/cv/${type}/${currentCvId}`;
}
async function predictJob() {
  const file = document.getElementById("cv2").files[0];
  const resultDiv = document.getElementById("result2");
  if (!file) { resultDiv.textContent = "Choisissez un fichier."; return; }
  resultDiv.textContent = "Analyse en cours...";
  const formData = new FormData();
  formData.append("cv", file);
  try {
    const res = await fetch("/predict-job", { method: "POST", body: formData });
    const data = await res.json();
    if (data.error) { resultDiv.textContent = "Erreur : " + data.error; return; }
    let html = `Metier ideal : <b>${data.metier_ideal}</b>\n`;
    html += `Confiance : <b>${data.confiance}%</b>\n`;
    html += `<div class="score-bar"><div class="score-fill" style="width:${data.confiance}%"></div></div>\n\n`;
    html += `Toutes les categories :\n`;
    Object.entries(data.toutes_categories).slice(0, 8).forEach(([cat, prob]) => {
      html += `<small>${cat}</small> <small style="float:right">${prob}%</small>\n`;
      html += `<div class="score-bar"><div class="score-fill" style="width:${prob}%"></div></div>`;
    });
    resultDiv.innerHTML = html;
  } catch (e) { resultDiv.textContent = "Erreur reseau : " + e.message; }
}
</script>
</body>
</html>
"""


@app.route("/process-cv", methods=["POST"])
def process_cv():
    if "cv" not in request.files:
        return jsonify({"error": "Champ cv manquant"}), 400
    cv_file = request.files["cv"]
    offer_text = request.form.get("offer_text", "")
    if cv_file.filename == "":
        return jsonify({"error": "Aucun fichier selectionne"}), 400
    filename = cv_file.filename.lower()
    if filename.endswith(".docx"):
        ext = ".docx"
    elif filename.endswith(".pdf"):
        ext = ".pdf"
    else:
        return jsonify({"error": "PDF ou DOCX uniquement."}), 400
    cv_id = str(uuid.uuid4())
    original_path = f"{ORIGINAL_DIR}/{cv_id}{ext}"
    anon_path = f"{ANON_DIR}/{cv_id}{ext}"
    cv_file.save(original_path)
    try:
        result = create_anonymized_file(original_path, anon_path)
    except Exception as e:
        os.remove(original_path)
        return jsonify({"error": f"Anonymisation echouee : {str(e)}"}), 500
    score = None
    if offer_text.strip():
        try:
            cv_text = extract_text(original_path)
            score = calculate_matching_score(cv_text, offer_text)
        except Exception as e:
            print(f"Avertissement matching : {e}")
    return jsonify({
        "cv_id": cv_id,
        "file_type": ext,
        "fields": result["fields"],
        "language": result["language"],
        "score_matching": score,
    }), 200


@app.route("/cv/anonymized/<cv_id>", methods=["GET"])
def serve_anonymized(cv_id):
    for ext, mime in [
        (".pdf", "application/pdf"),
        (".docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    ]:
        path = f"{ANON_DIR}/{cv_id}{ext}"
        if os.path.exists(path):
            return send_file(path, mimetype=mime,
                             as_attachment=(ext != ".pdf"),
                             download_name=f"cv_anonymise{ext}")
    return jsonify({"error": "CV introuvable"}), 404


@app.route("/cv/original/<cv_id>", methods=["GET"])
def serve_original(cv_id):
    for ext, mime in [
        (".pdf", "application/pdf"),
        (".docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    ]:
        path = f"{ORIGINAL_DIR}/{cv_id}{ext}"
        if os.path.exists(path):
            return send_file(path, mimetype=mime,
                             as_attachment=(ext != ".pdf"),
                             download_name=f"cv_original{ext}")
    return jsonify({"error": "CV introuvable"}), 404


@app.route("/predict-job", methods=["POST"])
def predict_job():
    if "cv" not in request.files:
        return jsonify({"error": "Champ cv manquant"}), 400
    cv_file = request.files["cv"]
    filename = cv_file.filename.lower()
    ext = ".docx" if filename.endswith(".docx") else ".pdf"
    tmp_path = os.path.join("uploads", f"tmp_{uuid.uuid4()}{ext}")
    cv_file.save(tmp_path)
    try:
        cv_text = extract_text(tmp_path)
        prediction = predict_job_category(cv_text)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
    return jsonify(prediction), 200


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "smartrecruit-ai"}), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
