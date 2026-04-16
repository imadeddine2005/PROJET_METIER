import { FaExclamationTriangle, FaTimes } from "react-icons/fa"
import { createPortal } from "react-dom"

function DeleteConfirmationModal({ 
  isOpen, 
  title = "Confirmer la suppression",
  message = "Êtes-vous sûr de vouloir supprimer cet élément?",
  itemName = "",
  onConfirm, 
  onCancel,
  isLoading = false 
}) {
  if (!isOpen) return null

  const modalContent = (
    <div className="fixed inset-0 z-50 w-screen h-screen flex items-center justify-center bg-black/50 backdrop-blur-sm">
      {/* Modal */}
      <div className="w-full max-w-md rounded-lg bg-white shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
              <FaExclamationTriangle className="h-5 w-5 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="text-slate-400 transition hover:text-slate-600 disabled:opacity-50"
          >
            <FaTimes className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <p className="text-slate-600">{message}</p>
          {itemName && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 font-medium text-red-700">
              "{itemName}"
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-slate-200 px-6 py-4">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 font-medium text-white transition hover:bg-red-700 disabled:opacity-50 active:scale-95"
          >
            {isLoading ? "Suppression..." : "Supprimer"}
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

export default DeleteConfirmationModal
