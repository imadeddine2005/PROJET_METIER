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
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl md:text-3xl font-display font-bold text-slate-900 tracking-tight flex items-center gap-3">
          <FaFileAlt className="text-brand-500" />
          Mes Demandes d'Accès
        </h1>
        <p className="text-slate-600 font-medium">
          Suivez l'état de vos requêtes pour débloquer les CV originaux des candidats.
        </p>
      </div>

      {/* Content */}
      {accessRequests && accessRequests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {accessRequests.map((demande) => (
            <div 
              key={demande.id} 
              className="group bg-white/90 backdrop-blur-xl rounded-[24px] border border-slate-200 shadow-sm hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-500/10 hover:border-brand-200 transition-all duration-300 flex flex-col justify-between overflow-hidden relative"
            >
              {/* Subtle top accent gradient */}
              <div className={`absolute top-0 left-0 w-full h-1 ${demande.status === 'APPROUVEE' ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : demande.status === 'REFUSEE' ? 'bg-gradient-to-r from-red-400 to-red-600' : 'bg-gradient-to-r from-amber-400 to-amber-600'}`} />

              {/* Card Header */}
              <div className="p-6 pb-4 flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-xs ring-4 ring-white shadow-sm">
                      {demande.candidatRef.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-[15px] font-bold text-slate-800 tracking-tight">{demande.candidatRef}</h3>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                        <FaCalendarAlt className="text-slate-400" />
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
                  <div className="absolute -left-3 top-1 text-slate-200 text-3xl font-serif">"</div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Motif de la demande</h4>
                  <p className="text-[13px] text-slate-700 font-medium ml-1 leading-relaxed relative z-10">
                    {demande.motif}
                  </p>
                </div>

                {demande.decisionNote && (
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                      <FaCommentDots className="text-slate-400" /> Message Admin
                    </h4>
                    <p className={`text-sm p-3 rounded-xl border leading-relaxed ${demande.status === 'APPROUVEE' ? 'bg-emerald-50/50 border-emerald-100 text-emerald-800' : 'bg-red-50/50 border-red-100 text-red-800'}`}>
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
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 border-dashed rounded-3xl">
          <div className="h-16 w-16 mb-4 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-500">
            <FaFileAlt size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Aucune demande trouvée</h3>
          <p className="text-slate-500 mt-2 max-w-sm text-center font-medium">
            Vous n'avez pas encore demandé l'accès à un CV original. Allez sur une offre pour consulter les candidatures et soumettre une demande.
          </p>
        </div>
      )}
    </div>
  )
}

export default DemandesAcces
