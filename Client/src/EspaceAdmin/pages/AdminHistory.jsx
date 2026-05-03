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
      className="group relative flex flex-col bg-white rounded-3xl transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] border-2 border-indigo-300 hover:border-indigo-500 overflow-hidden justify-between"
    >
      <div className={`absolute top-0 left-0 w-full h-1.5 z-20 transition-colors duration-300 ${demande.status === 'APPROUVEE' ? 'bg-emerald-500 group-hover:bg-emerald-600' : 'bg-rose-500 group-hover:bg-rose-600'}`} />

      {/* Card Header */}
      <div className="p-6 pb-4 flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ring-4 ring-white shadow-sm ${demande.status === 'APPROUVEE' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
              {demande.hrEmail?.substring(0, 2).toUpperCase() || "HR"}
            </div>
            <div>
              <h3 className="text-[13px] font-extrabold text-slate-900 tracking-tight">De: {demande.hrEmail}</h3>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-700 font-bold">
                <FaCalendarAlt className="text-slate-500" />
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
          <div className="absolute -left-2 top-0 text-slate-300 text-3xl font-serif">"</div>
          <p className="text-[13px] text-slate-900 font-semibold ml-2 leading-relaxed relative z-10 italic">
            {demande.motif}
          </p>
        </div>

        {demande.decisionNote && (
          <div className={`mt-4 p-3 rounded-xl border-2 ${demande.status === 'APPROUVEE' ? 'bg-emerald-50/50 border-emerald-200' : 'bg-red-50/50 border-red-200'}`}>
            <h4 className="text-[10px] font-extrabold text-slate-600 uppercase tracking-widest mb-1">Votre note:</h4>
            <p className={`text-xs font-bold ${demande.status === 'APPROUVEE' ? 'text-emerald-900' : 'text-red-900'}`}>{demande.decisionNote}</p>
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
    <div className="w-full space-y-8 animate-fade-in-up pb-12">
      {/* Header Premium */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-900 p-6 sm:p-8 text-white shadow-xl">
        {/* Decorative Gradients */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-indigo-500/20 to-transparent pointer-events-none"></div>
        <div className="absolute top-0 right-0 -mt-8 -mr-8 text-white/5 pointer-events-none">
          <FaHistory className="w-48 h-48" />
        </div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-3 rounded-full bg-white/10 text-xs font-medium backdrop-blur-md border border-white/20">
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            <span className="text-slate-200">Archive & Historique</span>
          </div>
          <h2 className="text-3xl font-display font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">
            Historique des Décisions
          </h2>
        </div>
      </div>

      {/* Content */}
      {historyRequests && historyRequests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {historyRequests.map(renderCard)}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50/50 backdrop-blur-sm py-24 px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-white shadow-md flex items-center justify-center mb-6">
            <FaShieldAlt className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900">Aucun historique</h3>
          <p className="mt-3 text-slate-500 max-w-md mx-auto text-lg">
            L'historique de vos décisions est vide. Acceptez ou refusez une requête pour la voir apparaître ici.
          </p>
        </div>
      )}
    </div>
  )
}

export default AdminHistory
