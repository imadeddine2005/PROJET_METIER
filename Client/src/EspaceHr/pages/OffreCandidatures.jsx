import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchCandidaturesForOffer, requestCvAccess, updateCandidatureStatus, generateEmailThunk, sendEmailThunk } from "../../features/candidatureHr/candidatureHrSlice";
import candidatureHrService from "../../features/candidatureHr/candidatureHrService";
import { FaArrowLeft, FaFilePdf, FaLock, FaCheckCircle, FaTimesCircle, FaClock, FaEye, FaUnlock, FaUsers, FaChevronDown, FaChevronUp, FaRobot, FaBriefcase, FaGraduationCap, FaEnvelope, FaPaperPlane } from "react-icons/fa";
import Spinner from "../../components/Spinner";
import { toast } from "react-toastify";
import DecisionConfirmationModal from "../components/DecisionConfirmationModal";

function OffreCandidatures() {
  const { offreId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { applicants, isLoading, isError, message, isRequestingAccess } = useSelector((state) => state.candidatureHr);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [motif, setMotif] = useState("");
  const [expandedIds, setExpandedIds] = useState([]);
  const [decisionModal, setDecisionModal] = useState({
    isOpen: false,
    status: "", // "ACCEPTEE" or "REFUSEE"
    candidatureId: null,
    candidatRef: ""
  });
  
  const [emailModal, setEmailModal] = useState({
    isOpen: false,
    candidatureId: null,
    candidatRef: "",
    subject: "Mise à jour concernant votre candidature",
    body: "",
    language: "fr"
  });

  const { isGeneratingEmail, isSendingEmail } = useSelector((state) => state.candidatureHr);

  const toggleExpand = (id) => {
    setExpandedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    dispatch(fetchCandidaturesForOffer(offreId));
  }, [dispatch, offreId]);

  useEffect(() => {
    if (isError) {
      toast.error(message || "Erreur lors de la récupération des candidatures.", { toastId: 'offre-cand-err' });
    }
  }, [isError, message]);

  const handleBack = () => {
    navigate("/hr/offers");
  };

  const openAnonymizedCv = async (candidatureId) => {
    try {
      const blob = await candidatureHrService.getAnonymizedCvPdf(candidatureId);
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (error) {
      toast.error("Impossible de télécharger le CV anonymisé.", { toastId: 'anon-cv-err' });
    }
  };

  const openOriginalCv = async (demandeId) => {
    try {
      const blob = await candidatureHrService.getOriginalCvPdf(demandeId);
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (error) {
      toast.error("Impossible de télécharger le CV original.", { toastId: 'orig-cv-err' });
    }
  };

  const handleRequestAccessClick = (candidature) => {
    setSelectedCandidate(candidature);
    setMotif("");
    setShowAccessModal(true);
  };

  const handleUpdateStatus = (candidatureId, newStatus) => {
    dispatch(updateCandidatureStatus({ candidatureId, newStatus }))
      .unwrap()
      .then(() => {
        toast.success("Statut mis à jour avec succès!", { toastId: 'statut-update-succ' });
        setDecisionModal({ isOpen: false, status: "", candidatureId: null, candidatRef: "" });
      })
      .catch((err) => {
        toast.error(err || "Erreur lors de la mise à jour du statut.", { toastId: 'statut-update-err' });
        setDecisionModal(prev => ({ ...prev, isOpen: false }));
      });
  };

  const openDecisionModal = (candidatureId, status, candidatRef) => {
    setDecisionModal({
      isOpen: true,
      status,
      candidatureId,
      candidatRef
    });
  };

  const handleGenerateEmail = (candidat) => {
    setEmailModal(prev => ({ ...prev, isOpen: true, candidatureId: candidat.id, candidatRef: candidat.candidatRef, body: "" }));
    dispatch(generateEmailThunk({ candidatureId: candidat.id, language: emailModal.language }))
      .unwrap()
      .then((res) => {
        let generatedEmail = res.data?.email || res.email || "";
        let extractedSubject = emailModal.subject; // conserver le sujet par défaut

        // Extraire la ligne de sujet (commençant par Subject: ou Objet :)
        const lines = generatedEmail.split('\n');
        const subjectLineIndex = lines.findIndex(line => line.match(/^(subject|objet)\s*:/i));

        if (subjectLineIndex !== -1) {
          // Extraire le texte du sujet sans le préfixe
          extractedSubject = lines[subjectLineIndex].replace(/^(subject|objet)\s*:\s*(?:\*\*)?/i, '').replace(/\*\*$/, '').trim();
          // Supprimer la ligne du sujet du reste du corps
          lines.splice(subjectLineIndex, 1);
          generatedEmail = lines.join('\n').trim();
        }

        setEmailModal(prev => ({ ...prev, subject: extractedSubject, body: generatedEmail }));
        toast.success(res.message || "E-mail généré avec succès !");
      })
      .catch((err) => {
        toast.error(err || "Erreur lors de la génération de l'e-mail.");
        setEmailModal(prev => ({ ...prev, isOpen: false }));
      });
  };

  const handleSendEmail = () => {
    if (!emailModal.subject.trim() || !emailModal.body.trim()) {
      toast.error("Le sujet et le corps de l'e-mail sont obligatoires.");
      return;
    }
    dispatch(sendEmailThunk({ candidatureId: emailModal.candidatureId, subject: emailModal.subject, body: emailModal.body }))
      .unwrap()
      .then((res) => {
        toast.success(res.message || `E-mail envoyé avec succès à ${emailModal.candidatRef} !`);
        setEmailModal({ ...emailModal, isOpen: false });
      })
      .catch((err) => {
        toast.error(err || "Erreur lors de l'envoi de l'e-mail.");
      });
  };

  const submitAccessRequest = () => {
    if (!motif.trim()) {
      toast.error("Veuillez fournir un motif pour la demande d'accès.", { toastId: 'motif-err' });
      return;
    }
    dispatch(requestCvAccess({ candidatureId: selectedCandidate.id, motif }))
      .unwrap()
      .then(() => {
        toast.success("Demande d'accès envoyée à l'administrateur.", { toastId: 'demande-succ' });
        setShowAccessModal(false);
        // On pourrait re-fetch ou mettre à jour le statut du candidat ici
      })
      .catch((err) => toast.error(err || "Erreur lors de la demande d'accès.", { toastId: 'demande-err' }));
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'EN_ATTENTE': 
      case 'EN_COURS': return <span className="px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-bold border border-yellow-200">En Cours</span>;
      case 'ACCEPTEE': return <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">Accepté</span>;
      case 'ENTRETIEN': return <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold border border-blue-200">Entretien</span>;
      case 'REFUSEE': 
      case 'REJETE': return <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-800 text-xs font-bold border border-red-200">Rejeté</span>;
      default: return <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-bold">{status}</span>;
    }
  };

  // Color gradient for the AI score gauge
  const getScoreColor = (score) => {
    if (score >= 80) return "text-emerald-500";
    if (score >= 60) return "text-brand-500";
    if (score >= 40) return "text-yellow-500";
    return "text-red-500";
  };

  if (isLoading) return <Spinner />;

  return (
    <div className="space-y-6">
      {/* Header with modern gradient text matching sidebar */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-900 p-6 sm:p-8 text-white shadow-xl mb-8">
        {/* Decorative Gradients */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-brand-500/20 to-transparent pointer-events-none"></div>
        <div className="absolute top-0 right-0 -mt-8 -mr-8 text-white/5 pointer-events-none">
          <FaUsers className="w-48 h-48" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleBack}
              className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all duration-300 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-lg hover:-translate-x-1 shrink-0"
              title="Retour aux offres"
            >
              <FaArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 mb-2 rounded-full bg-white/10 text-xs font-medium backdrop-blur-md border border-white/20">
                <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse"></span>
                <span className="text-slate-200">ID Offre: {offreId}</span>
              </div>
              <h2 className="text-3xl font-display font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">
                Candidatures Reçues
              </h2>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl px-6 py-3 flex items-center gap-4">
            <div className="text-center">
              <span className="block text-2xl font-bold text-white">{applicants ? applicants.length : 0}</span>
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Candidats</span>
            </div>
          </div>
        </div>
      </div>

      {applicants && applicants.length > 0 ? (
        <div className="grid gap-4">
          {applicants.map((candidat) => {
            const isExpanded = expandedIds.includes(candidat.id);
            return (
              <div 
                key={candidat.id} 
                className={`bg-white rounded-3xl transition-all duration-300 overflow-hidden border-2 relative group ${
                  isExpanded ? "border-brand-500 shadow-xl" : "border-brand-300 hover:border-brand-500 shadow-sm"
                }`}
              >
                {/* Ligne bleue supérieure toujours visible */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-600 group-hover:bg-blue-700 transition-colors duration-300 z-20"></div>
                {/* --- HEADER COMPACT (Toujours visible) --- */}
                <div 
                  onClick={() => toggleExpand(candidat.id)}
                  className="px-6 py-4 flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-6 flex-1">
                    {/* Miniature du Score */}
                    <div className="relative flex items-center justify-center h-12 w-12 shrink-0 rounded-full bg-slate-50 border-[3px] border-slate-100">
                      <span className={`text-xs font-black ${getScoreColor(candidat.scoreCompatibilite)}`}>
                        {Math.round(candidat.scoreCompatibilite || 0)}%
                      </span>
                      <svg className="absolute inset-0 h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="46" fill="transparent" stroke="currentColor" strokeWidth="10" className="text-slate-100" />
                        <circle cx="50" cy="50" r="46" fill="transparent" stroke="currentColor" strokeWidth="10" strokeDasharray={`${(candidat.scoreCompatibilite || 0) * 2.89} 289`} className={`${getScoreColor(candidat.scoreCompatibilite)} transition-all duration-1000 ease-out`} />
                      </svg>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                      <h3 className="text-md font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                        {candidat.candidatRef || "Candidat IA"}
                      </h3>
                      <div>{getStatusBadge(candidat.status)}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 relative z-10">
                    {/* Quick Access Buttons */}
                    <div className="hidden sm:flex items-center gap-2 mr-4 border-r border-slate-200 pr-4">
                      <button 
                        onClick={(e) => { e.stopPropagation(); openAnonymizedCv(candidat.id); }}
                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-900 hover:text-white transition-colors shadow-sm active:scale-95"
                        title="Voir le CV Anonymisé"
                      >
                        <FaEye className="h-4 w-4" />
                      </button>

                      {candidat.hasAccessToOriginalCv ? (
                        <button 
                          onClick={(e) => { e.stopPropagation(); openOriginalCv(candidat.demandeAccesId); }}
                          className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 hover:text-emerald-700 transition shadow-sm active:scale-95"
                          title="Accéder CV Original"
                        >
                          <FaUnlock className="h-4 w-4" />
                        </button>
                      ) : candidat.accessRequestStatus === 'EN_ATTENTE' ? (
                        <button disabled className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-600 cursor-not-allowed shadow-none" title="Demande en cours">
                          <FaClock className="h-4 w-4" />
                        </button>
                      ) : candidat.accessRequestStatus === 'REFUSEE' ? (
                        <button disabled className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 border border-red-200 text-red-600 cursor-not-allowed shadow-none" title="Demande refusée">
                          <FaLock className="h-4 w-4" />
                        </button>
                      ) : (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleRequestAccessClick(candidat); }}
                          className="flex h-9 w-9 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-500 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 transition shadow-sm active:scale-95"
                          title="Débloquer CV Original"
                        >
                          <FaLock className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-slate-400 group-hover:text-brand-500 transition-colors cursor-pointer pointer-events-none">
                      <span className="hidden md:block text-xs font-semibold uppercase tracking-widest italic">
                        {isExpanded ? "Réduire" : "Voir l'analyse"}
                      </span>
                      {isExpanded ? <FaChevronUp className="h-4 w-4" /> : <FaChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                </div>

                {/* --- DETAILS (Collapsible avec animation) --- */}
                <div 
                  className={`grid transition-all duration-300 ease-in-out ${
                    isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="px-6 pb-6 pt-2 border-t border-slate-50">
                      <div className="flex flex-col lg:flex-row gap-8">
                        
                        {/* Center: AI Analysis details */}
                        <div className="lg:w-3/4 space-y-6">
                          <div>
                            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                               <FaRobot className="text-brand-500" /> Synthèse IA
                            </h4>
                            <p className="text-sm text-slate-800 font-medium bg-slate-50/50 rounded-2xl p-5 border-2 border-slate-200 leading-relaxed italic shadow-sm hover:border-brand-300 transition-colors duration-300">
                              "{candidat.scoreAnalysis || "Aucune analyse détaillée disponible."}"
                            </p>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Compétences */}
                            <div className="space-y-3">
                              <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                                <FaBriefcase className="text-slate-500" /> Compétences
                              </h4>
                              {candidat.competences && candidat.competences.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {candidat.competences.map((comp, idx) => (
                                    <span key={idx} className="px-2.5 py-1 bg-brand-50/50 text-brand-700 rounded-lg text-[10px] font-bold border border-brand-100 transition-transform hover:scale-105">
                                      {comp}
                                    </span>
                                  ))}
                                </div>
                              ) : <p className="text-xs text-slate-400 italic">Non détecté</p>}
                            </div>

                            {/* Diplômes */}
                            <div className="space-y-3">
                              <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                                <FaGraduationCap className="text-slate-500" /> Formations
                              </h4>
                              {candidat.diplomes && candidat.diplomes.length > 0 ? (
                                <div className="space-y-2">
                                    {candidat.diplomes.map((dip, idx) => (
                                      <div key={idx} className="flex items-start gap-3 bg-slate-50/50 p-3 rounded-xl border-2 border-slate-200 hover:border-brand-300 transition-colors duration-300">
                                        <div className="h-2 w-2 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                                        <span className="text-xs text-slate-800 font-bold leading-relaxed">{dip}</span>
                                      </div>
                                  ))}
                                </div>
                              ) : <p className="text-xs text-slate-400 italic">Non détecté</p>}
                            </div>
                          </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex flex-col gap-4 lg:w-1/4 bg-slate-50/50 p-5 rounded-2xl border-2 border-slate-200 h-fit hover:border-brand-300 transition-colors duration-300">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Poste de contrôle</h4>
                          
                          <div className="space-y-3">
                            <button 
                              onClick={() => openAnonymizedCv(candidat.id)}
                              className="flex justify-between items-center w-full bg-slate-900 hover:bg-slate-800 text-white px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm shadow-lg shadow-slate-200 active:scale-95 border-2 border-transparent"
                            >
                              <span className="flex items-center gap-2"><FaEye className="text-slate-400" /> Voir le CV</span>
                              <FaFilePdf className="text-red-400" />
                            </button>

                            {candidat.hasAccessToOriginalCv ? (
                              <button 
                                onClick={() => openOriginalCv(candidat.demandeAccesId)}
                                className="flex justify-between items-center w-full bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700 px-4 py-3 rounded-xl transition font-medium text-sm"
                              >
                                <span className="flex items-center gap-2"><FaUnlock className="text-emerald-500" /> Accéder CV Original</span>
                              </button>
                            ) : candidat.accessRequestStatus === 'EN_ATTENTE' ? (
                              <button disabled className="flex justify-between items-center w-full bg-yellow-50 border border-yellow-200 text-yellow-600 px-4 py-3 rounded-xl cursor-not-allowed font-medium text-sm opacity-80">
                                <span className="flex items-center gap-2"><FaClock className="text-yellow-500" /> Demande en cours</span>
                              </button>
                            ) : candidat.accessRequestStatus === 'REFUSEE' ? (
                              <button disabled className="flex justify-between items-center w-full bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl cursor-not-allowed font-medium text-sm opacity-80">
                                <span className="flex items-center gap-2"><FaLock className="text-red-500" /> Demande Refusée</span>
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleRequestAccessClick(candidat)}
                                className="flex justify-between items-center w-full bg-white border border-slate-200 hover:border-brand-300 hover:bg-brand-50 text-slate-700 hover:text-brand-700 px-4 py-3 rounded-xl transition font-medium text-sm"
                              >
                                <span className="flex items-center gap-2"><FaLock className="text-brand-500" /> Débloquer CV Original</span>
                              </button>
                            )}
                          </div>

                            {["ACCEPTEE", "REFUSEE", "REJETE"].includes(candidat.status) ? (
                              <button
                                onClick={() => handleGenerateEmail(candidat)}
                                disabled={isGeneratingEmail}
                                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 border shadow-sm ${
                                  isGeneratingEmail ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed" : "bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white border-indigo-200 active:scale-95"
                                }`}
                              >
                                {isGeneratingEmail && emailModal.candidatureId === candidat.id ? <FaClock className="h-4 w-4 animate-spin" /> : <FaRobot className="h-4 w-4" />}
                                {isGeneratingEmail && emailModal.candidatureId === candidat.id ? "Génération..." : "Générer E-mail (IA)"}
                              </button>
                            ) : (
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => openDecisionModal(candidat.id, "ACCEPTEE", candidat.candidatRef)}
                                  disabled={!candidat.hasAccessToOriginalCv}
                                  title={!candidat.hasAccessToOriginalCv ? "L'accès au CV doit être approuvé d'abord" : ""}
                                  className="flex-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white py-2.5 rounded-xl text-[10px] font-bold transition-all duration-200 border border-emerald-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200"
                                >
                                  Accepter
                                </button>
                                <button 
                                  onClick={() => openDecisionModal(candidat.id, "REFUSEE", candidat.candidatRef)}
                                  disabled={!candidat.hasAccessToOriginalCv}
                                  title={!candidat.hasAccessToOriginalCv ? "L'accès au CV doit être approuvé d'abord" : ""}
                                  className="flex-1 bg-red-50 text-red-700 hover:bg-red-600 hover:text-white py-2.5 rounded-xl text-[10px] font-bold transition-all duration-200 border border-red-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200"
                                >
                                  Rejeter
                                </button>
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50/50 backdrop-blur-sm py-24 px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-white shadow-md flex items-center justify-center mb-6">
            <FaUsers className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900">Aucune candidature</h3>
          <p className="mt-3 text-slate-500 max-w-md mx-auto text-lg">
            Personne n'a encore postulé à cette offre.
          </p>
        </div>
      )}

      {/* Access Request Modal via React Portal */}
      {showAccessModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl animate-fade-in relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-brand-500 to-indigo-600"></div>
            
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 mb-6">
              <FaUnlock className="h-7 w-7 text-brand-600" />
            </div>

            <h3 className="text-2xl font-display font-bold text-center text-slate-900">Débloquer le CV</h3>
            <p className="text-center text-slate-500 mt-2 font-medium">
              Veuillez justifier votre demande d'accès aux données personnelles de {selectedCandidate?.candidatRef}.
            </p>

            <div className="mt-6">
              <label className="block text-sm font-bold text-slate-700 mb-2">Motif de la demande</label>
              <textarea 
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 bg-slate-50 h-32 resize-none transition"
                placeholder="Ex: Poursuite du processus de recrutement, convocation à un entretien..."
              />
            </div>

            <div className="mt-8 flex gap-3">
              <button 
                onClick={() => setShowAccessModal(false)}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition"
              >
                Annuler
              </button>
              <button 
                onClick={submitAccessRequest}
                disabled={isRequestingAccess}
                className="flex-1 px-4 py-3 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRequestingAccess ? 'Envoi...' : 'Demander l\'accès'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Decision Confirmation Modal */}
      <DecisionConfirmationModal
        isOpen={decisionModal.isOpen}
        status={decisionModal.status}
        candidatRef={decisionModal.candidatRef}
        onCancel={() => setDecisionModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={() => handleUpdateStatus(decisionModal.candidatureId, decisionModal.status)}
      />

      {/* Email Generation Modal */}
      {emailModal.isOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] p-8 max-w-2xl w-full shadow-2xl animate-fade-in relative overflow-hidden flex flex-col max-h-[90vh]">
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-brand-500 to-indigo-600"></div>
            
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50">
                  <FaEnvelope className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-xl font-display font-bold text-slate-900">E-mail IA ({emailModal.candidatRef})</h3>
                  <p className="text-sm font-medium text-slate-500">Révisez et envoyez l'e-mail</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-500 mr-2">Langue IA</label>
                <select 
                  className="bg-slate-50 border border-slate-200 text-slate-700 rounded-lg p-2 text-sm focus:ring-brand-500 focus:border-brand-500 outline-none"
                  value={emailModal.language}
                  onChange={(e) => {
                    setEmailModal(prev => ({ ...prev, language: e.target.value }));
                    // Optionnel: On pourrait re-générer automatiquement ici
                  }}
                  disabled={isGeneratingEmail}
                >
                  <option value="fr">Français</option>
                  <option value="en">Anglais</option>
                </select>
                <button 
                  onClick={() => handleGenerateEmail({ id: emailModal.candidatureId, candidatRef: emailModal.candidatRef })}
                  disabled={isGeneratingEmail}
                  className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 p-2 rounded-lg transition"
                  title="Re-générer avec la langue sélectionnée"
                >
                  <FaRobot className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Sujet de l'e-mail</label>
                <input
                  type="text"
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl p-4 text-slate-800 text-sm focus:ring-2 focus:ring-brand-500 outline-none transition"
                  value={emailModal.subject}
                  onChange={(e) => setEmailModal(prev => ({ ...prev, subject: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Corps de l'e-mail</label>
                <textarea
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl p-4 text-slate-800 text-sm focus:ring-2 focus:ring-brand-500 outline-none transition"
                  rows={8}
                  value={isGeneratingEmail ? "L'IA rédige l'e-mail..." : emailModal.body}
                  onChange={(e) => setEmailModal(prev => ({ ...prev, body: e.target.value }))}
                  disabled={isGeneratingEmail}
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-slate-100">
              <button 
                onClick={() => setEmailModal(prev => ({ ...prev, isOpen: false }))}
                className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition"
              >
                Annuler
              </button>
              <button 
                onClick={handleSendEmail}
                disabled={isSendingEmail || isGeneratingEmail}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-200"
              >
                {isSendingEmail ? <FaClock className="h-4 w-4 animate-spin" /> : <FaPaperPlane className="h-4 w-4" />}
                {isSendingEmail ? 'Envoi...' : 'Envoyer l\'E-mail'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default OffreCandidatures;
