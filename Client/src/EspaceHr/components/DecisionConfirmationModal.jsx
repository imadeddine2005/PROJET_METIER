import { FaExclamationCircle, FaTimes, FaCheckCircle, FaTimesCircle } from "react-icons/fa"
import { createPortal } from "react-dom"

function DecisionConfirmationModal({ 
  isOpen, 
  status, // "ACCEPTEE" ou "REFUSEE"
  candidatRef = "",
  onConfirm, 
  onCancel,
  isLoading = false 
}) {
  if (!isOpen) return null

  const isAccept = status === "ACCEPTEE"
  const title = isAccept ? "Confirmer l'acceptation" : "Confirmer le rejet"
  const message = isAccept 
    ? "Êtes-vous sûr de vouloir accepter ce candidat pour la prochaine étape ?"
    : "Êtes-vous sûr de vouloir rejeter cette candidature ?"
    
  const buttonText = isAccept ? "Accepter" : "Rejeter"
  const Icon = isAccept ? FaCheckCircle : FaTimesCircle
  
  // Couleurs dynamiques
  const iconBgColor = isAccept ? "bg-emerald-100" : "bg-red-100"
  const iconTextColor = isAccept ? "text-emerald-600" : "text-red-600"
  const btnColor = isAccept 
    ? "bg-emerald-600 hover:bg-emerald-700" 
    : "bg-red-600 hover:bg-red-700"

  const modalContent = (
    <div className="fixed inset-0 z-[110] w-screen h-screen flex items-center justify-center bg-black/50 backdrop-blur-sm">
      {/* Modal */}
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl animate-fade-in relative overflow-hidden">
        {/* Dynamic Top Border */}
        <div className={`absolute top-0 inset-x-0 h-1.5 ${isAccept ? 'bg-emerald-500' : 'bg-red-500'}`}></div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-4">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconBgColor}`}>
              <Icon className={`h-6 w-6 ${iconTextColor}`} />
            </div>
            <h3 className="text-xl font-display font-bold text-slate-900">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
          >
            <FaTimes className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          <p className="text-slate-600 font-medium">{message}</p>
          {candidatRef && (
            <div className={`mt-4 rounded-xl px-4 py-3 font-bold border border-l-4 ${
              isAccept ? 'bg-emerald-50 text-emerald-800 border-emerald-300 border-l-emerald-500' : 'bg-red-50 text-red-800 border-red-300 border-l-red-500'
            }`}>
              Candidat : {candidatRef}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 bg-slate-50/50 px-6 py-5">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold text-white transition disabled:opacity-50 active:scale-95 ${btnColor}`}
          >
            {isLoading ? "Traitement..." : buttonText}
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

export default DecisionConfirmationModal
