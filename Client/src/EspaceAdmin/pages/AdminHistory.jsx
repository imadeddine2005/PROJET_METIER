import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { fetchHistoryRequests, resetAdminState, openDetailsModal } from "../../features/admin/adminSlice"
import adminService from "../../features/admin/adminService"
import { toast } from "react-toastify"
import Spinner from "../../components/Spinner"
import { FaFilePdf, FaCalendarAlt, FaHistory, FaShieldAlt } from "react-icons/fa"

function AdminHistory() {
  const dispatch = useDispatch()
  const { historyRequests, isLoading, isError, message } = useSelector((state) => state.admin)
  
  useEffect(() => {
    dispatch(fetchHistoryRequests())
    return () => { dispatch(resetAdminState()) }
  }, [dispatch])

  useEffect(() => {
    if (isError) {
      toast.error(message, { toastId: 'admin-history-error' })
      dispatch(resetAdminState())
    }
  }, [isError, message, dispatch])

  const openAdminCv = async (demandeId) => {
    try {
      const blob = await adminService.getAdminCvPdf(demandeId);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (err) {
      toast.error("Erreur lors du téléchargement du CV original.");
    }
  };

  const renderCard = (demande) => (
    <div 
      key={demande.id} 
      className="group bg-white/90 backdrop-blur-xl rounded-[24px] border border-slate-200 shadow-sm hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-200 transition-all duration-300 flex flex-col justify-between overflow-hidden relative"
    >
      <div className={`absolute top-0 left-0 w-full h-1 ${demande.status === 'APPROUVEE' ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : 'bg-gradient-to-r from-red-400 to-red-600'}`} />

      {/* Card Header */}
      <div className="p-6 pb-4 flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ring-4 ring-white shadow-sm ${demande.status === 'APPROUVEE' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
              {demande.hrEmail?.substring(0, 2).toUpperCase() || "HR"}
            </div>
            <div>
              <h3 className="text-[13px] font-bold text-slate-800 tracking-tight">De: {demande.hrEmail}</h3>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                <FaCalendarAlt className="text-slate-400" />
                {new Date(demande.dateDemande).toLocaleDateString('fr-FR', {
                  day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </div>
            </div>
          </div>
        </div>
        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${demande.status === 'APPROUVEE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
          {demande.status}
        </span>
      </div>

      <div className="mx-6 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent opacity-60"></div>

      {/* Card Body */}
      <div className="p-6 space-y-4 flex-1">
        <div className="flex items-center gap-2 mb-2">
           <span className="bg-slate-100 px-2 py-1 rounded-md text-[10px] font-bold text-slate-600 uppercase tracking-widest">
             Cible: {demande.candidatRef}
           </span>
        </div>
        <div className="relative">
          <div className="absolute -left-2 top-0 text-slate-200 text-2xl font-serif">"</div>
          <p className="text-[13px] text-slate-700 font-medium ml-2 leading-relaxed relative z-10 italic">
            {demande.motif}
          </p>
        </div>

        {demande.decisionNote && (
          <div className={`mt-4 p-3 rounded-xl border ${demande.status === 'APPROUVEE' ? 'bg-emerald-50/50 border-emerald-100' : 'bg-red-50/50 border-red-100'}`}>
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Votre note:</h4>
            <p className={`text-xs ${demande.status === 'APPROUVEE' ? 'text-emerald-800' : 'text-red-800'}`}>{demande.decisionNote}</p>
          </div>
        )}
      </div>

      {/* Actions Footer */}
      <div className="p-4 mx-2 mb-2 grid grid-cols-1 gap-2 bg-slate-50/80 rounded-2xl border border-slate-100/50">
        <button 
          onClick={() => dispatch(openDetailsModal(demande))}
          className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 hover:bg-slate-200 transition-all font-bold text-xs active:scale-95 shadow-sm"
        >
          <FaCalendarAlt /> Informations & Analyse IA
        </button>

        <button 
          onClick={() => openAdminCv(demande.id)}
          className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white text-indigo-700 hover:text-indigo-600 border border-indigo-100 hover:bg-indigo-50 transition-all font-bold text-xs active:scale-95 shadow-sm"
        >
          <FaFilePdf /> Lire le CV Archivé (Sécurisé)
        </button>
      </div>
    </div>
  )

  if (isLoading && (!historyRequests || historyRequests.length === 0)) return <Spinner />

  return (
    <div className="w-full space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl md:text-3xl font-display font-bold text-slate-900 tracking-tight flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-slate-200 flex items-center justify-center">
            <FaHistory className="text-slate-500" />
          </div>
          Historique des Décisions
        </h1>
        <p className="text-slate-600 font-medium ml-1">
          Visualisez l'ensemble des requêtes d'accès au CV originales que vous avez approuvées ou refusées.
        </p>
      </div>

      {/* Content */}
      {historyRequests && historyRequests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {historyRequests.map(renderCard)}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 bg-white/50 border border-slate-200 border-dashed rounded-[2rem]">
          <div className="h-16 w-16 mb-4 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <FaShieldAlt size={28} />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Aucun historique</h3>
          <p className="text-slate-500 mt-2 max-w-sm text-center font-medium">
            L'historique de vos décisions est vide. Acceptez ou refusez une requête pour la voir apparaître ici.
          </p>
        </div>
      )}
    </div>
  )
}

export default AdminHistory
