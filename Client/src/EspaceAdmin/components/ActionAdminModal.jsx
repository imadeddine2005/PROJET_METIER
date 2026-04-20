import { useState } from "react"
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa"

function ActionAdminModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  demandeId, 
  actionType, 
  candidatRef 
}) {
  const [note, setNote] = useState("")

  if (!isOpen) return null

  const isApprove = actionType === 'APPROVER'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
      <div 
        className="w-full max-w-md transform overflow-hidden rounded-[2rem] bg-white p-8 text-left shadow-2xl transition-all border border-white/50 animate-scale-in relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-400 to-purple-500" />
        
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <div className={`h-16 w-16 rounded-full flex items-center justify-center ${isApprove ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'}`}>
            {isApprove ? <FaCheckCircle size={32} /> : <FaTimesCircle size={32} />}
          </div>
          
          <div>
            <h3 className="text-xl font-bold text-slate-800">
              {isApprove ? 'Approuver la demande' : 'Refuser la demande'}
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Candidat ciblé : <strong className="text-slate-700">{candidatRef}</strong>
            </p>
          </div>
          
          <div className="w-full mt-4 text-left">
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Note de décision (Optionnelle)
            </label>
            <textarea
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 hover:border-slate-300 transition-colors"
              rows={3}
              placeholder="Expliquez brièvement votre décision au recruteur..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row">
            <button
              onClick={() => {
                onConfirm(demandeId, actionType, note)
                setNote("")
              }}
              className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-md transition-all active:scale-95 ${
                isApprove 
                  ? 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-500/25' 
                  : 'bg-red-600 hover:bg-red-700 hover:shadow-red-500/25'
              }`}
            >
              {isApprove ? 'Confirmer Approbation' : 'Confirmer Refus'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 active:scale-95 transition-all outline-none"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ActionAdminModal
