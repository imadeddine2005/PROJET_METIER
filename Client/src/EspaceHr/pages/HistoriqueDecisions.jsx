import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useParams, useNavigate } from "react-router-dom"
import { fetchHistoriqueForOffer, resetCandidatureHrState } from "../../features/candidatureHr/candidatureHrSlice"
import { FaArrowLeft, FaCheckCircle, FaTimesCircle, FaCalendarAlt, FaEnvelope, FaHistory, FaRobot, FaFilter } from "react-icons/fa"
import Spinner from "../../components/Spinner"
import { toast } from "react-toastify"
import ViewContentModal from "../components/ViewContentModal"

function HistoriqueDecisions() {
  const { offreId } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  
  const { applicants, isLoading, isError, message } = useSelector(
    (state) => state.candidatureHr
  )

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: null,
    title: "",
    content: ""
  })

  useEffect(() => {
    dispatch(fetchHistoriqueForOffer(offreId))
    
    return () => {
      dispatch(resetCandidatureHrState())
    }
  }, [dispatch, offreId])

  useEffect(() => {
    if (isError) {
      toast.error(message || "Erreur lors du chargement de l'historique", { toastId: 'hist-err' })
    }
  }, [isError, message])

  if (isLoading) {
    return <Spinner />
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header with modern gradient text matching sidebar */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-900 p-6 sm:p-8 text-white shadow-xl">
        {/* Decorative Gradients */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-brand-500/20 to-transparent pointer-events-none"></div>
        <div className="absolute top-0 right-0 -mt-8 -mr-8 text-white/5 pointer-events-none">
          <FaFilter className="w-48 h-48" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/hr/history')}
              className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all duration-300 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-lg hover:-translate-x-1"
              title="Retour aux offres"
            >
              <FaArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 mb-2 rounded-full bg-white/10 text-xs font-medium backdrop-blur-md border border-white/20">
                <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse"></span>
                <span className="text-slate-200">Détails de l'offre #{offreId}</span>
              </div>
              <h2 className="text-3xl font-display font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">
                Historique des Décisions
              </h2>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl px-6 py-3 flex items-center gap-4">
            <div className="text-center">
              <span className="block text-2xl font-bold text-white">{applicants ? applicants.length : 0}</span>
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Décisions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-3xl shadow-xl ring-1 ring-slate-200 overflow-hidden border border-slate-100">
        {applicants && applicants.length > 0 ? (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 border-b-2 border-slate-200">
                  <th className="px-6 py-5 font-bold text-sm text-slate-700">Candidat (Réf)</th>
                  <th className="px-6 py-5 font-bold text-sm text-slate-700">Décidé par</th>
                  <th className="px-6 py-5 font-bold text-sm text-slate-700">Date de décision</th>
                  <th className="px-6 py-5 font-bold text-sm text-slate-700">Statut</th>
                  <th className="px-6 py-5 font-bold text-sm text-center text-slate-700">Raison (IA)</th>
                  <th className="px-6 py-5 font-bold text-sm text-center text-slate-700">E-mail envoyé</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applicants.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50 transition-colors duration-200 group">
                    <td className="px-6 py-5 font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                      {app.candidatRef}
                    </td>
                    <td className="px-6 py-5 text-sm font-bold text-brand-600 bg-brand-50/30">
                      {app.decisionMakerName || <span className="text-slate-400 italic font-normal">Système</span>}
                    </td>
                    <td className="px-6 py-5 text-sm font-semibold text-slate-600">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-slate-100 text-slate-500">
                          <FaCalendarAlt className="w-3.5 h-3.5" />
                        </div>
                        {app.dateDecision ? new Date(app.dateDecision).toLocaleString('fr-FR') : "Date inconnue"}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {app.status === "ACCEPTEE" ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 ring-1 ring-inset ring-emerald-600/20 shadow-sm">
                          <FaCheckCircle className="text-emerald-600 w-3.5 h-3.5" /> Accepté
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-100 text-rose-800 ring-1 ring-inset ring-rose-600/20 shadow-sm">
                          <FaTimesCircle className="text-rose-600 w-3.5 h-3.5" /> Refusé
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-center">
                      {app.scoreAnalysis ? (
                        <button 
                          onClick={() => setModalConfig({ isOpen: true, type: 'reason', title: "Raison / Analyse IA", content: app.scoreAnalysis })}
                          className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-brand-50 text-brand-600 hover:bg-brand-500 hover:text-white transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                          title="Voir l'analyse détaillée de l'IA"
                        >
                          <FaRobot className="h-4 w-4" />
                        </button>
                      ) : (
                        <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">Aucune</span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-center">
                      {app.emailSentContent ? (
                        <button 
                          onClick={() => setModalConfig({ isOpen: true, type: 'email', title: "Contenu de l'e-mail envoyé", content: app.emailSentContent })}
                          className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-500 hover:text-white transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                          title="Voir l'e-mail envoyé"
                        >
                          <FaEnvelope className="h-4 w-4" />
                        </button>
                      ) : (
                        <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">Aucun</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center bg-slate-50/50 py-24 px-6 text-center">
            <div className="h-20 w-20 rounded-full bg-white shadow-md flex items-center justify-center mb-6">
              <FaFilter className="h-8 w-8 text-slate-300" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">Aucun historique</h3>
            <p className="mt-3 text-slate-500 max-w-md mx-auto text-lg">
              Vous n'avez pas encore pris de décision (Acceptation/Refus) pour les candidats de cette offre.
            </p>
          </div>
        )}
      </div>

      {/* View Content Modal */}
      <ViewContentModal 
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        content={modalConfig.content}
        type={modalConfig.type}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
      />
    </div>
  )
}

export default HistoriqueDecisions
