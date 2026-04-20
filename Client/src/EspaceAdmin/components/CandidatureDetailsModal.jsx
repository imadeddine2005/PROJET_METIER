import { useDispatch, useSelector } from "react-redux"
import { closeDetailsModal } from "../../features/admin/adminSlice"
import { FaTimes, FaUser, FaBriefcase, FaGraduationCap, FaTools, FaChartPie, FaFileAlt } from "react-icons/fa"

function CandidatureDetailsModal() {
  const dispatch = useDispatch()
  const { detailsModal } = useSelector((state) => state.admin)

  if (!detailsModal.isOpen || !detailsModal.demande) return null

  const demande = detailsModal.demande

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
        onClick={() => dispatch(closeDetailsModal())}
      />
      
      {/* Modal */}
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative animate-slide-up border border-slate-200 flex flex-col z-10">
        
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-xl px-6 py-4 border-b border-slate-100 flex justify-between items-center z-20 rounded-t-3xl shadow-sm">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
               <FaUser size={18} />
             </div>
             <div>
               <h2 className="text-xl font-bold text-slate-800 tracking-tight">Détails de la Candidature</h2>
               <p className="text-xs text-slate-500 font-medium">Demandé par {demande.hrName} ({demande.hrEmail})</p>
             </div>
          </div>
          <button 
            onClick={() => dispatch(closeDetailsModal())}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-8">
          
          {/* Section: Offre */}
          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <FaBriefcase /> Poste Ciblé
            </h3>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 shadow-inner">
               <h4 className="text-lg font-bold text-slate-800">{demande.offreTitre}</h4>
            </div>
          </div>

          {/* Section: Candidat */}
          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <FaUser /> Identité du Candidat
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border text-center border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                 <p className="text-xs font-medium text-slate-500 uppercase">Nom Complet</p>
                 <p className="text-base font-bold text-slate-800 mt-1">{demande.candidatName}</p>
              </div>
              <div className="bg-white border text-center border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                 <p className="text-xs font-medium text-slate-500 uppercase">Email Contact</p>
                 <p className="text-base font-bold text-slate-800 mt-1 truncate">{demande.candidatEmail}</p>
              </div>
            </div>
          </div>

          {/* Section: Motif RH */}
          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <FaFileAlt /> Motif de la requête RH
            </h3>
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-5">
               <p className="text-sm font-medium text-indigo-900 leading-relaxed italic border-l-4 border-indigo-400 pl-4">
                 "{demande.motif}"
               </p>
            </div>
          </div>

          {/* Section: Analyse IA */}
          <div className="relative">
            <div className="absolute inset-x-0 -top-4 flex items-center justify-center">
               <span className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-md">
                 Rapport Intelligence Artificielle
               </span>
            </div>
            <div className="bg-gradient-to-br from-indigo-50/80 to-purple-50/80 border border-indigo-100 rounded-3xl p-6 pt-10 shadow-sm">
                
                <div className="flex flex-col md:flex-row gap-6 mb-6">
                   <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FaChartPie className="text-purple-500" />
                        <h4 className="font-bold text-slate-700 text-sm">Score de Compatibilité</h4>
                      </div>
                      <div className="flex items-end gap-2">
                        <span className="text-4xl font-black text-indigo-600 tracking-tight">{demande.scoreCompatibilite}%</span>
                        <span className="text-sm text-slate-500 font-medium mb-1">Match Global</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 mt-3 rounded-full overflow-hidden">
                         <div 
                           className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full" 
                           style={{ width: `${demande.scoreCompatibilite || 0}%` }}
                         />
                      </div>
                   </div>

                   <div className="flex-[2] bg-white rounded-2xl p-4 shadow-sm border border-indigo-50/50">
                      <h4 className="font-bold text-slate-700 text-sm mb-2">Analyse Prédictive</h4>
                      <p className="text-sm text-slate-600 leading-relaxed italic">
                        "{demande.scoreAnalysis || 'Aucune analyse détaillée disponible.'}"
                      </p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-indigo-50/50">
                    <h4 className="font-bold text-slate-700 text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                      <FaTools className="text-indigo-400" /> Compétences Extraites
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {demande.competences ? demande.competences.split('|').map((comp, idx) => (
                        <span key={idx} className="bg-slate-100 text-slate-700 text-[11px] font-bold px-2 py-1 rounded-md">
                          {comp.trim()}
                        </span>
                      )) : <span className="text-xs text-slate-400">Non spécifié</span>}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-indigo-50/50">
                    <h4 className="font-bold text-slate-700 text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                      <FaGraduationCap className="text-purple-400" /> Diplômes / Formation
                    </h4>
                    <div className="flex flex-col gap-2">
                      {demande.diplomes ? demande.diplomes.split('|').map((dip, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                          <span className="text-sm text-slate-600 font-medium">{dip.trim()}</span>
                        </div>
                      )) : <span className="text-xs text-slate-400">Non spécifié</span>}
                    </div>
                  </div>
                </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  )
}

export default CandidatureDetailsModal
