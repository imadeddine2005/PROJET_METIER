import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { fetchMyAccessRequests, resetCandidatureHrState } from "../../features/candidatureHr/candidatureHrSlice"
import candidatureHrService from "../../features/candidatureHr/candidatureHrService"
import { toast } from "react-toastify"
import Spinner from "../../components/Spinner"
import { FaFileAlt, FaEye, FaLock, FaUnlock, FaClock, FaCheckCircle, FaTimesCircle, FaCommentDots, FaCalendarAlt } from "react-icons/fa"

function DemandesAcces() {
  const dispatch = useDispatch()
  const { accessRequests, isLoadingRequests, isError, message } = useSelector((state) => state.candidatureHr)
  
  useEffect(() => {
    dispatch(fetchMyAccessRequests())
    
    return () => {
      dispatch(resetCandidatureHrState())
    }
  }, [dispatch])

  useEffect(() => {
    if (isError) {
      toast.error(message, { toastId: 'hr-error' })
      dispatch(resetCandidatureHrState())
    }
  }, [isError, message, dispatch])

  const openAnonymizedCv = async (candidatureId) => {
    try {
      const blob = await candidatureHrService.getAnonymizedCvPdf(candidatureId);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (err) {
      toast.error("Erreur lors de l'ouverture du CV Anonymisé.");
    }
  };

  const openOriginalCv = async (demandeId) => {
    try {
      const blob = await candidatureHrService.getOriginalCvPdf(demandeId);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (err) {
      toast.error("Erreur lors de l'ouverture du CV Original. Accès potentiellement refusé.");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'EN_ATTENTE':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-600 outline outline-1 outline-amber-200 shadow-sm">
            <FaClock className="h-3 w-3" />
            <span className="text-[10px] font-bold uppercase tracking-wider">En attente</span>
          </div>
        );
      case 'APPROUVEE':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 outline outline-1 outline-emerald-200 shadow-sm">
            <FaCheckCircle className="h-3 w-3" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Approuvée</span>
          </div>
        );
      case 'REFUSEE':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-600 outline outline-1 outline-red-200 shadow-sm">
            <FaTimesCircle className="h-3 w-3" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Refusée</span>
          </div>
        );
      default:
        return null;
    }
  };

  if (isLoadingRequests) return <Spinner />

  return (
    <div className="space-y-8 animate-fade-in-up pb-12">
      {/* Header Premium */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-900 p-6 sm:p-8 text-white shadow-xl">
        {/* Decorative Gradients */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-brand-500/20 to-transparent pointer-events-none"></div>
        <div className="absolute top-0 right-0 -mt-8 -mr-8 text-white/5 pointer-events-none">
          <FaFileAlt className="w-48 h-48" />
        </div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-3 rounded-full bg-white/10 text-xs font-medium backdrop-blur-md border border-white/20">
            <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse"></span>
            <span className="text-slate-200">Centre d'accès</span>
          </div>
          <h2 className="text-3xl font-display font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">
            Mes Demandes d'Accès
          </h2>
          <p className="mt-2 text-slate-300 font-medium">
            Suivez l'état de vos requêtes pour débloquer les CV originaux des candidats.
          </p>
        </div>
      </div>

      {/* Content */}
      {accessRequests && accessRequests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {accessRequests.map((demande) => (
            <div 
              key={demande.id} 
              className="group relative flex flex-col bg-white rounded-3xl transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] border-2 border-brand-300 hover:border-brand-500 overflow-hidden justify-between"
            >
              {/* Strong Top Border Line Based on Status */}
              <div className={`absolute top-0 left-0 w-full h-1.5 z-20 transition-colors duration-300 ${demande.status === 'APPROUVEE' ? 'bg-emerald-500 group-hover:bg-emerald-600' : demande.status === 'REFUSEE' ? 'bg-rose-500 group-hover:bg-rose-600' : 'bg-amber-500 group-hover:bg-amber-600'}`} />

              {/* Card Header */}
              <div className="p-6 pb-4 flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-xs ring-4 ring-white shadow-sm">
                      {demande.candidatRef.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-[15px] font-extrabold text-slate-900 tracking-tight">{demande.candidatRef}</h3>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-700 font-bold">
                        <FaCalendarAlt className="text-slate-500" />
                        {new Date(demande.dateDemande).toLocaleDateString('fr-FR', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>
                </div>
                {getStatusBadge(demande.status)}
              </div>

              {/* Divider */}
              <div className="mx-6 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent opacity-60"></div>

              {/* Card Body */}
              <div className="p-6 space-y-5 flex-1">
                <div className="relative">
                  <div className="absolute -left-3 top-1 text-slate-300 text-3xl font-serif">"</div>
                  <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Motif de la demande</h4>
                  <p className="text-[13px] text-slate-900 font-semibold ml-1 leading-relaxed relative z-10">
                    {demande.motif}
                  </p>
                </div>

                {demande.decisionNote && (
                  <div>
                    <h4 className="text-[10px] font-extrabold text-slate-600 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                      <FaCommentDots className="text-slate-500" /> Message Admin
                    </h4>
                    <p className={`text-sm p-3 rounded-xl border leading-relaxed font-bold ${demande.status === 'APPROUVEE' ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900' : 'bg-red-50/50 border-red-200 text-red-900'}`}>
                      {demande.decisionNote}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="p-4 mx-2 mb-2 grid grid-cols-2 gap-2 bg-slate-50/80 rounded-2xl border border-slate-100/50">
                <button 
                  onClick={() => openAnonymizedCv(demande.candidatureId)}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 hover:shadow-lg hover:shadow-indigo-500/20 transition-all font-bold text-xs active:scale-95 group/btn"
                  title="Voir le CV Anonymisé"
                >
                  <FaEye className="text-indigo-400 group-hover/btn:text-indigo-200 transition-colors" /> CV Anonymisé
                </button>

                {demande.status === 'APPROUVEE' ? (
                  <button 
                    onClick={() => openOriginalCv(demande.id)}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-brand-600 text-white shadow-md shadow-brand-500/20 hover:bg-brand-700 hover:shadow-lg hover:shadow-brand-500/30 transition-all font-bold text-xs active:scale-95"
                    title="Accéder au CV Original"
                  >
                    <FaUnlock /> CV Original
                  </button>
                ) : (
                  <div 
                    className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-100 text-slate-400 font-bold text-xs border border-slate-200 cursor-not-allowed shadow-inner"
                    title="Bloqué (En attente ou refusé)"
                  >
                    <FaLock /> Contour Bloqué
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50/50 backdrop-blur-sm py-24 px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-white shadow-md flex items-center justify-center mb-6">
            <FaFileAlt className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900">Aucune demande trouvée</h3>
          <p className="mt-3 text-slate-500 max-w-md mx-auto text-lg">
            Vous n'avez pas encore demandé l'accès à un CV original. Allez sur une offre pour consulter les candidatures et soumettre une demande.
          </p>
        </div>
      )}
    </div>
  )
}

export default DemandesAcces
