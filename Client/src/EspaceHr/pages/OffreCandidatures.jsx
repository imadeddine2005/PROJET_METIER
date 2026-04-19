import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchCandidaturesForOffer, requestCvAccess, updateCandidatureStatus } from "../../features/candidatureHr/candidatureHrSlice";
import candidatureHrService from "../../features/candidatureHr/candidatureHrService";
import { FaArrowLeft, FaFilePdf, FaLock, FaCheckCircle, FaTimesCircle, FaClock, FaEye, FaUnlock, FaUsers, FaChevronDown, FaChevronUp, FaRobot, FaBriefcase, FaGraduationCap } from "react-icons/fa";
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
      {/* Header Premium */}
      <div className="relative bg-white/60 backdrop-blur-xl border border-white/80 rounded-3xl p-6 shadow-sm overflow-hidden mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 -z-10 w-64 h-64 bg-brand-200/40 rounded-full mix-blend-multiply blur-[80px]"></div>
        <div className="absolute bottom-0 left-10 -z-10 w-48 h-48 bg-indigo-200/40 rounded-full mix-blend-multiply blur-[60px]"></div>

        <div className="flex items-center gap-5 z-10">
          <button 
            onClick={handleBack} 
            className="h-12 w-12 flex border border-slate-200 shadow-sm items-center justify-center rounded-2xl bg-white text-slate-500 hover:bg-slate-50 hover:text-brand-600 hover:border-brand-200 transition-all active:scale-95 shrink-0"
          >
            <FaArrowLeft />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="bg-brand-100 text-brand-700 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                ID Offre: {offreId}
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-900 tracking-tight">Candidatures Reçues</h2>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white/80 rounded-2xl p-4 border border-slate-100 shadow-sm z-10">
          <div className="flex items-center justify-center h-12 w-12 rounded-full bg-indigo-50 text-indigo-500 shrink-0">
             <FaUsers size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Total Candidats</p>
            <p className="text-2xl font-black text-slate-800 tracking-tight leading-none">{applicants?.length || 0}</p>
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
                className={`bg-white/80 backdrop-blur-md rounded-2xl border transition-all duration-300 overflow-hidden ${
                  isExpanded ? "border-brand-200 shadow-lg" : "border-slate-200 shadow-sm hover:border-slate-300"
                }`}
              >
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
                            <p className="text-sm text-slate-800 font-medium bg-slate-50/50 rounded-2xl p-5 border border-slate-100 leading-relaxed italic shadow-inner">
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
                                      <div key={idx} className="flex items-start gap-2 bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                                        <div className="h-1.5 w-1.5 rounded-full bg-slate-400 mt-1.5" />
                                        <span className="text-xs text-slate-800 font-bold leading-tight">{dip}</span>
                                      </div>
                                  ))}
                                </div>
                              ) : <p className="text-xs text-slate-400 italic">Non détecté</p>}
                            </div>
                          </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex flex-col gap-4 lg:w-1/4">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Poste de contrôle</h4>
                          
                          <div className="space-y-2">
                            <button 
                              onClick={() => openAnonymizedCv(candidat.id)}
                              className="flex justify-between items-center w-full bg-slate-900 hover:bg-slate-800 text-white px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm shadow-lg shadow-slate-200 active:scale-95"
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

                          <div className="mt-4 pt-4 border-t border-slate-100">
                            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 text-center">Décision recrutement</h4>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => openDecisionModal(candidat.id, "ACCEPTEE", candidat.candidatRef)}
                                disabled={["ACCEPTEE", "REFUSEE", "REJETE"].includes(candidat.status) || !candidat.hasAccessToOriginalCv}
                                title={!candidat.hasAccessToOriginalCv ? "L'accès au CV doit être approuvé d'abord" : ""}
                                className="flex-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white py-2.5 rounded-xl text-[10px] font-bold transition-all duration-200 border border-emerald-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200"
                              >
                                Accepter
                              </button>
                              <button 
                                onClick={() => openDecisionModal(candidat.id, "REFUSEE", candidat.candidatRef)}
                                disabled={["ACCEPTEE", "REFUSEE", "REJETE"].includes(candidat.status) || !candidat.hasAccessToOriginalCv}
                                title={!candidat.hasAccessToOriginalCv ? "L'accès au CV doit être approuvé d'abord" : ""}
                                className="flex-1 bg-red-50 text-red-700 hover:bg-red-600 hover:text-white py-2.5 rounded-xl text-[10px] font-bold transition-all duration-200 border border-red-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200"
                              >
                                Rejeter
                              </button>
                            </div>
                          </div>
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
        <div className="bg-white/60 backdrop-blur-md rounded-2xl p-12 border border-slate-200 text-center">
            <FaUsers className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900">Aucune candidature</h3>
            <p className="text-slate-500 mt-2">Personne n'a encore postulé à cette offre.</p>
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
    </div>
  );
}

export default OffreCandidatures;
