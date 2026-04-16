import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FaCloudUploadAlt, FaCheckCircle, FaExclamationTriangle, FaArrowLeft, FaBriefcase, FaGraduationCap, FaMedal, FaInfoCircle, FaFileAlt, FaTimes } from "react-icons/fa";
import { applyToOffer, fetchMyApplications, resetCandidatureState, clearApplicationResult, setApplicationResult } from "../../features/candidature/candidatureSlice";
import OffreDetailModal from "../components/OffreDetailModal";
import candidatureService from "../../features/candidature/candidatureService";
import { toast } from "react-toastify";

function ApplyToOffer() {
  const { offreId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [selectedFile, setSelectedFile] = useState(null);
  const [showOffreModal, setShowOffreModal] = useState(false);

  const { isApplying, isError, isSuccess, message, applicationResult, candidatures } = useSelector(
    (state) => state.candidature
  );

  // Vérifie si on a déjà postulé ou lance le chargement
  useEffect(() => {
    // Si on a les candidatures chargées, on vérifie si l'id existe dedans
    const existingApplication = candidatures?.find((c) => c.offreId.toString() === offreId.toString());

    if (existingApplication && !applicationResult) {
      dispatch(setApplicationResult(existingApplication));
    } else {
      // Charger les candidatures si ce n'est pas déjà fait
      if (!candidatures || candidatures.length === 0) {
        dispatch(fetchMyApplications());
      }
    }
  }, [candidatures, offreId, applicationResult, dispatch]);

  // Remise à zéro propre au démontage seulement
  useEffect(() => {
    return () => {
      dispatch(resetCandidatureState());
      dispatch(clearApplicationResult());
    };
  }, [dispatch]);

  // Écoute des erreurs
  useEffect(() => {
    if (isError) {
      toast.error(message || "Erreur lors de l'envoi de la candidature");
      dispatch(resetCandidatureState());
    }
  }, [isError, message, dispatch]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== "application/pdf") {
        toast.error("Veuillez sélectionner un fichier PDF.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Le fichier ne doit pas dépasser 5 MB.");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type !== "application/pdf") {
        toast.error("Veuillez sélectionner un fichier PDF.");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.warning("Veuillez sélectionner un fichier CV.");
      return;
    }
    dispatch(applyToOffer({ offreId, cvFile: selectedFile }));
  };

  const handleViewCv = async (candidatureId) => {
    try {
      const blob = await candidatureService.downloadMyCv(candidatureId);
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      toast.error("Erreur lors de l'ouverture du CV");
    }
  };

  // Si on a le résultat de la candidature, on affiche le composant de succès avec les infos IA
  if (applicationResult) {
    const score = applicationResult.scoreCompatibilite || 0;

    let scoreColor = "text-red-500";
    let scoreBg = "bg-red-50";
    let scoreRing = "ring-red-200";
    let scoreBarColor = "bg-red-400";
    let scoreLabel = "Profil à améliorer";
    if (score >= 50) { scoreColor = "text-yellow-600"; scoreBg = "bg-yellow-50"; scoreRing = "ring-yellow-200"; scoreBarColor = "bg-yellow-400"; scoreLabel = "Profil correct"; }
    if (score >= 75) { scoreColor = "text-green-600"; scoreBg = "bg-green-50"; scoreRing = "ring-green-200"; scoreBarColor = "bg-green-400"; scoreLabel = "Excellent profil"; }

    const extractItems = (list) => {
      if (!list || !Array.isArray(list)) return [];
      return list.map(str => str.trim()).filter(str => str);
    };

    const competences = extractItems(applicationResult.competences);
    const diplomes = extractItems(applicationResult.diplomes);

    return (
      <div className="w-full space-y-3 animate-fade-in pb-4">

        {/* Success Banner */}
        <div className="flex items-center justify-between gap-4 rounded-xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100">
              <FaCheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <h2 className="text-md font-display font-bold text-green-900 leading-tight">Candidature envoyée avec succès !</h2>
              <p className="text-xs text-green-700">Votre dossier est maintenant visible par le recruteur.</p>
            </div>
          </div>
          <button
            onClick={() => setShowOffreModal(true)}
            className="flex shrink-0 items-center gap-2 rounded-xl border border-green-200 bg-white/70 px-3 py-1.5 text-xs font-semibold text-green-800 transition hover:bg-white active:scale-95"
          >
            <FaInfoCircle className="h-3 w-3" />
            Détails de l'offre
          </button>
        </div>

        {/* Modal */}
        <OffreDetailModal
          offreId={offreId}
          isOpen={showOffreModal}
          onClose={() => setShowOffreModal(false)}
          hasApplied={true}
        />

        {/* 3-column grid: Score | Diplômes | Compétences */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Score Card */}
          <div className={`flex flex-col items-center justify-center rounded-2xl border p-4 shadow-sm ${scoreBg} ${scoreRing} ring-1`}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-surface-400 mb-2">Score de compatibilité</p>
            <div className="relative flex items-center justify-center">
              <div className={`text-4xl font-extrabold ${scoreColor}`}>{score}<span className="text-xl">%</span></div>
            </div>
            <div className="mt-3 w-full rounded-full bg-white/70 h-1.5">
              <div className={`h-1.5 rounded-full ${scoreBarColor} transition-all duration-1000 ease-out`} style={{ width: `${score}%` }}></div>
            </div>
            <p className={`mt-2 text-[10px] font-semibold rounded-full px-3 py-0.5 ${scoreBg} ${scoreColor}`}>{scoreLabel}</p>
          </div>

          {/* Diplômes Card */}
          <div className="flex flex-col rounded-2xl border border-surface-200 bg-white/80 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-100">
                <FaGraduationCap className="h-3.5 w-3.5 text-brand-600" />
              </div>
              <h3 className="text-xs font-bold text-surface-800">Diplômes détectés</h3>
            </div>
            <div className="flex-grow overflow-y-auto max-h-32 space-y-1.5 custom-scrollbar pr-1">
              {diplomes.length > 0 ? diplomes.map((dip, idx) => (
                <div key={idx} className="flex items-start gap-2 rounded-lg bg-surface-50 border border-surface-100 px-2 py-1.5">
                  <span className="mt-0.5 text-brand-400 text-xs">•</span>
                  <span className="text-[11px] text-surface-700 font-medium leading-tight">{dip}</span>
                </div>
              )) : (
                <p className="text-xs text-surface-400 italic">Aucun diplôme détecté.</p>
              )}
            </div>
          </div>

          {/* Compétences Card */}
          <div className="flex flex-col rounded-2xl border border-surface-200 bg-white/80 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-100">
                <FaBriefcase className="h-3.5 w-3.5 text-brand-600" />
              </div>
              <h3 className="text-xs font-bold text-surface-800">Compétences identifiées</h3>
            </div>
            <div className="flex-grow overflow-y-auto max-h-32 custom-scrollbar pr-1">
              {competences.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {competences.map((comp, idx) => (
                    <span key={idx} className="rounded-full bg-brand-50 border border-brand-100 px-2 py-0.5 text-[10px] font-semibold text-brand-700">
                      {comp}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-surface-400 italic">Aucune compétence identifiée.</p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-1">
          <button
            onClick={() => handleViewCv(applicationResult.id)}
            className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-2 text-xs font-semibold text-brand-700 shadow-sm transition hover:bg-brand-100 active:scale-95 flex items-center gap-2"
          >
            <FaFileAlt className="h-3 w-3" />
            Visualiser mon CV
          </button>
          <button
            onClick={() => navigate("/candidate/offers")}
            className="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-semibold text-surface-700 shadow-sm transition hover:bg-surface-50 active:scale-95"
          >
            Retour aux offres
          </button>
          <button
            onClick={() => navigate("/candidate/applications")}
            className="rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-brand-500 hover:-translate-y-0.5 active:scale-95"
          >
            Voir mes candidatures
          </button>
        </div>
      </div>
    );
  }


  // --- RENDU : FORMULAIRE D'APPLICATION (Initial) ---
  return (
    <div className="w-full">
      {/* Back button + Voir détails */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-800 transition-colors"
        >
          <FaArrowLeft /> Retour aux offres
        </button>
        <button
          onClick={() => setShowOffreModal(true)}
          className="flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-100 active:scale-95"
        >
          <FaInfoCircle className="h-4 w-4" />
          Voir les détails de l'offre
        </button>
      </div>

      {/* Offre Detail Modal */}
      <OffreDetailModal
        offreId={offreId}
        isOpen={showOffreModal}
        onClose={() => setShowOffreModal(false)}
      />

      {/* Horizontal 2-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">

        {/* LEFT — Drop Zone */}
        <div className="space-y-3">
          <div>
            <h2 className="text-xl font-display font-bold text-surface-900">Soumettre votre candidature</h2>
            <p className="mt-1 text-sm text-surface-500">
              Uploadez votre CV en PDF. Notre IA analysera vos compétences et calculera votre score.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="h-full">
            <div
              className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition-colors cursor-pointer ${
                selectedFile
                  ? "border-brand-500 bg-brand-50"
                  : "border-surface-300 hover:border-brand-400 hover:bg-surface-50"
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0 z-10"
                disabled={isApplying}
              />

              {/* Bouton de désélection (X) */}
              {selectedFile && !isApplying && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                  className="absolute top-2 right-2 z-20 p-1.5 rounded-full bg-red-100 text-red-500 hover:bg-red-200 transition-colors shadow-sm"
                  title="Supprimer le fichier"
                >
                  <FaTimes className="h-3 w-3" />
                </button>
              )}

              <div className="flex flex-col items-center pointer-events-none">
                {!selectedFile ? (
                  <>
                    <FaCloudUploadAlt className="mb-3 h-12 w-12 text-brand-400" />
                    <h3 className="text-base font-semibold text-surface-700">Cliquez ou glissez-déposez</h3>
                    <p className="mt-1 text-sm text-surface-400">Format PDF uniquement · Max 5 MB</p>
                  </>
                ) : (
                  <>
                    <FaCheckCircle className="mb-3 h-12 w-12 text-brand-600" />
                    <h3 className="text-base font-semibold text-brand-900">Fichier sélectionné</h3>
                    <p className="mt-1 text-sm font-medium text-brand-600 truncate max-w-xs">{selectedFile.name}</p>
                    <p className="mt-0.5 text-xs text-brand-400">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* RIGHT — Steps + Notice + Submit */}
        <div className="flex flex-col justify-between gap-5">
          {/* Steps */}
          <div className="space-y-3 pt-1">
            <p className="text-xs font-bold uppercase tracking-wider text-surface-400">Comment ça marche</p>
            {[
              { n: "1", text: "Déposez votre CV en PDF" },
              { n: "2", text: "Vos compétences & diplômes peuvent être extraits" },
              { n: "3", text: "Votre score de compatibilité est calculé" },
            ].map((step) => (
              <div key={step.n} className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-600">{step.n}</span>
                <span className="text-sm text-surface-600 font-medium">{step.text}</span>
              </div>
            ))}
          </div>

          {/* Privacy notice */}
          <div className="flex items-start gap-3 rounded-xl bg-blue-50 border border-blue-100 p-4 text-blue-800">
            <FaExclamationTriangle className="h-5 w-5 shrink-0 text-blue-400 mt-0.5" />
            <p className="text-sm leading-relaxed">
              Les informations personnelles (Email, Nom, Tél.) seront <strong>automatiquement caviardées</strong> avant d'être transmises aux recruteurs.
            </p>
          </div>

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={isApplying || !selectedFile}
            className={`w-full rounded-xl px-4 py-3.5 text-center text-sm font-bold text-white shadow-md transition-all ${
              isApplying || !selectedFile
                ? "cursor-not-allowed bg-surface-300"
                : "bg-brand-600 hover:bg-brand-500 hover:-translate-y-0.5 active:scale-[0.98] shadow-brand-500/20"
            }`}
          >
            {isApplying ? (
              <div className="flex items-center justify-center gap-2">
                <svg className="h-5 w-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyse IA en cours… (~30s)
              </div>
            ) : (
              "Postuler avec ce CV"
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

export default ApplyToOffer;
