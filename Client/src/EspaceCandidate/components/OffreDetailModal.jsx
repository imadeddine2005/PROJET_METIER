import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { FaTimes, FaBriefcase, FaCalendarAlt, FaUserTie, FaTools, FaFileAlt, FaSpinner } from "react-icons/fa"
import offreService from "../../features/offre/offreService"

function OffreDetailModal({ offreId, isOpen, onClose, hasApplied = false }) {
  const [offre, setOffre] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isOpen || !offreId) return
    setIsLoading(true)
    setError(null)
    offreService.getOffreByIdCandidate(offreId)
      .then((data) => setOffre(data))
      .catch(() => setError("Impossible de charger les détails de l'offre."))
      .finally(() => setIsLoading(false))
  }, [isOpen, offreId])

  // Close on ESC key
  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose() }
    if (isOpen) document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return createPortal(
    // Backdrop
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6"
      onClick={onClose}
    >
      {/* Blur overlay */}
      <div className="absolute inset-0 bg-surface-900/40 backdrop-blur-sm animate-fade-in" />

      {/* Panel */}
      <div
        className="relative z-10 w-full max-w-2xl rounded-2xl border border-white/60 bg-white/95 backdrop-blur-md shadow-2xl shadow-brand-900/20 animate-slide-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 bg-gradient-to-r from-brand-600 to-indigo-700 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
              <FaBriefcase className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white/70 uppercase tracking-wider">Détails de l'offre</p>
              <h2 className="text-lg font-display font-bold text-white line-clamp-1">
                {isLoading ? "Chargement…" : (offre?.titre || "Offre")}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30 active:scale-90"
          >
            <FaTimes className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[65vh] overflow-y-auto custom-scrollbar p-6 space-y-5">

          {/* Loading */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-surface-400">
              <FaSpinner className="h-8 w-8 animate-spin text-brand-500" />
              <p className="text-sm font-medium">Chargement des détails…</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 font-medium">
              {error}
            </div>
          )}

          {/* Content */}
          {!isLoading && offre && (
            <>
              {/* Meta info row */}
              <div className="flex flex-wrap gap-3">
                {offre.hrName && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-100 px-3 py-1.5 text-xs font-semibold text-surface-700">
                    <FaUserTie className="h-3 w-3 text-brand-500" />
                    {offre.hrName}
                  </span>
                )}
                {offre.dateCreation && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-100 px-3 py-1.5 text-xs font-semibold text-surface-700">
                    <FaCalendarAlt className="h-3 w-3 text-brand-500" />
                    Publié le {new Date(offre.dateCreation).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
                  </span>
                )}
              </div>

              {/* Description */}
              {offre.description && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-5 w-1 rounded-full bg-brand-500" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-surface-500">Description du poste</h3>
                  </div>
                  <p className="text-sm text-surface-700 leading-relaxed whitespace-pre-line rounded-xl bg-surface-50 border border-surface-100 p-4">
                    {offre.description}
                  </p>
                </div>
              )}

              {/* Compétences requises */}
              {offre.competencesRequises && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-5 w-1 rounded-full bg-brand-500" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-surface-500">Compétences requises</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {offre.competencesRequises.split(",").map((comp, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 border border-brand-100 px-3 py-1 text-xs font-semibold text-brand-700"
                      >
                        <FaTools className="h-2.5 w-2.5" />
                        {comp.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Fichier CV requis info — uniquement avant de postuler */}
              {!hasApplied && (
                <div className="flex items-start gap-3 rounded-xl bg-blue-50 border border-blue-100 p-4">
                  <FaFileAlt className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-blue-800 leading-relaxed">
                    Pour postuler à cette offre, soumettez votre CV au format <strong>PDF</strong>. Votre candidature sera analysée automatiquement.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-surface-100 bg-surface-50/80 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-surface-200 bg-white px-5 py-2.5 text-sm font-semibold text-surface-700 transition hover:bg-surface-50 active:scale-95"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default OffreDetailModal
