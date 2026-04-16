import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchCandidaturesForOffer, requestCvAccess, updateCandidatureStatus } from "../../features/candidatureHr/candidatureHrSlice";
import candidatureHrService from "../../features/candidatureHr/candidatureHrService";
import { FaArrowLeft, FaFilePdf, FaLock, FaCheckCircle, FaTimesCircle, FaClock, FaEye, FaUnlock, FaUsers, FaChevronDown, FaChevronUp, FaRobot, FaBriefcase, FaGraduationCap } from "react-icons/fa";
import Spinner from "../../components/Spinner";
import { toast } from "react-toastify";

function OffreCandidatures() {
  const { offreId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { applicants, isLoading, isError, message, isRequestingAccess } = useSelector((state) => state.candidatureHr);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [motif, setMotif] = useState("");
  const [expandedIds, setExpandedIds] = useState([]);

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
      toast.error(message || "Erreur lors de la récupération des candidatures.");
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
      toast.error("Impossible de télécharger le CV anonymisé.");
    }
  };

  const openOriginalCv = async (demandeId) => {
    try {
      const blob = await candidatureHrService.getOriginalCvPdf(demandeId);
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (error) {
      toast.error("Impossible de télécharger le CV original.");
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
      .then(() => toast.success("Statut mis à jour avec succès!"))
      .catch((err) => toast.error(err || "Erreur lors de la mise à jour du statut."));
  };

  const submitAccessRequest = () => {
    if (!motif.trim()) {
      toast.error("Veuillez fournir un motif pour la demande d'accès.");
      return;
    }
    dispatch(requestCvAccess({ candidatureId: selectedCandidate.id, motif }))
      .unwrap()
      .then(() => {
        toast.success("Demande d'accès envoyée à l'administrateur.");
        setShowAccessModal(false);
        // On pourrait re-fetch ou mettre à jour le statut du candidat ici
      })
      .catch((err) => toast.error(err || "Erreur lors de la demande d'accès."));
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
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={handleBack} 
          className="h-10 w-10 flex border border-slate-200 items-center justify-center rounded-xl bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition"
        >
          <FaArrowLeft />
        </button>
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-900 tracking-tight">Analyse des Candidatures</h2>
          <p className="text-sm text-slate-500 font-medium">Offre #{offreId} • {applicants?.length || 0} candidat(s)</p>
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

                  <div className="flex items-center gap-4 text-slate-400 group-hover:text-brand-500 transition-colors">
                    <span className="hidden sm:block text-xs font-semibold uppercase tracking-widest italic">
                      {isExpanded ? "Réduire" : "Voir l'analyse"}
                    </span>
                    {isExpanded ? <FaChevronUp className="h-4 w-4" /> : <FaChevronDown className="h-4 w-4" />}
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
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                               <FaRobot className="text-brand-500" /> Synthèse IA
                            </h4>
                            <p className="text-sm text-slate-600 bg-slate-50/50 rounded-2xl p-5 border border-slate-100 leading-relaxed italic shadow-inner">
                              "{candidat.scoreAnalysis || "Aucune analyse détaillée disponible."}"
                            </p>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Compétences */}
                            <div className="space-y-3">
                              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <FaBriefcase className="text-slate-400" /> Compétences
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
                              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <FaGraduationCap className="text-slate-400" /> Formations
                              </h4>
                              {candidat.diplomes && candidat.diplomes.length > 0 ? (
                                <div className="space-y-2">
                                    {candidat.diplomes.map((dip, idx) => (
                                      <div key={idx} className="flex items-start gap-2 bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                                        <div className="h-1.5 w-1.5 rounded-full bg-slate-300 mt-1.5" />
                                        <span className="text-[10px] text-slate-600 font-medium leading-tight">{dip}</span>
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
                                onClick={() => handleUpdateStatus(candidat.id, "ACCEPTEE")}
                                className="flex-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white py-2.5 rounded-xl text-[10px] font-bold transition-all duration-200 border border-emerald-200 active:scale-95"
                              >
                                Accepter
                              </button>
                              <button 
                                onClick={() => handleUpdateStatus(candidat.id, "REFUSEE")}
                                className="flex-1 bg-red-50 text-red-700 hover:bg-red-600 hover:text-white py-2.5 rounded-xl text-[10px] font-bold transition-all duration-200 border border-red-200 active:scale-95"
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

      {/* Access Request Modal */}
      {showAccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
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
        </div>
      )}
    </div>
  );
}

export default OffreCandidatures;
