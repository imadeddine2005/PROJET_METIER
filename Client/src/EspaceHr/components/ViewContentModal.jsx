import { FaTimesCircle, FaEnvelope, FaRobot } from "react-icons/fa"
import { createPortal } from "react-dom"

function ViewContentModal({ isOpen, title, content, type, onClose }) {
  if (!isOpen) return null;

  const Icon = type === 'email' ? FaEnvelope : FaRobot;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-surface-200 flex items-center justify-between bg-surface-50">
          <h3 className="font-bold text-surface-900 flex items-center gap-2">
            <Icon className="text-brand-500" /> {title}
          </h3>
          <button 
            onClick={onClose}
            className="text-surface-400 hover:text-surface-700 transition-colors"
          >
            <FaTimesCircle className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          {type === 'email' ? (
            <div 
              className="prose prose-sm max-w-none prose-a:text-brand-600"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          ) : (
            <div className="text-surface-700 whitespace-pre-wrap leading-relaxed">
              {content}
            </div>
          )}
        </div>
        
        <div className="px-6 py-4 border-t border-surface-200 bg-surface-50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-surface-300 text-surface-700 font-bold hover:bg-surface-50 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default ViewContentModal;
