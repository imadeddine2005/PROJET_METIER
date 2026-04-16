import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { fetchOffres, reset } from "../../features/offre/offreSlice"
import { FaMapMarkerAlt, FaBriefcase, FaCalendarAlt, FaSearch } from "react-icons/fa"
import { useNavigate } from "react-router-dom"
import Spinner from "../../components/Spinner"
import { toast } from "react-toastify"

function CanddatteJobeOffers() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { offres, isLoading, isError, message } = useSelector(
    (state) => state.offre
  )
  const { user } = useSelector((state) => state.auth)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredOffres, setFilteredOffres] = useState([])

  useEffect(() => {
    dispatch(fetchOffres())
  }, [dispatch])

  useEffect(() => {
    if (isError) {
      toast.error(message || "Erreur lors du chargement des offres")
      dispatch(reset())
    }
  }, [isError, message, dispatch])

  useEffect(() => {
    if (offres && offres.length > 0) {
      const filtered = offres.filter(
        (offre) =>
          offre.titre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          offre.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          offre.competencesRequises?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredOffres(filtered)
    } else {
      setFilteredOffres([])
    }
  }, [offres, searchTerm])

  if (isLoading) {
    return <Spinner />
  }

  return (
    <div className="space-y-6">
      {/* Search Bar (Glass) Centered */}
      <div className="relative group mx-auto max-w-xl mt-0 mb-8">
        {/* Decorative blur background */}
        <div className="absolute -inset-1 bg-brand-500/20 rounded-xl blur-lg transition duration-500 group-hover:bg-brand-500/30"></div>

        <div className="relative flex items-center">
          <div className="absolute left-4 z-20 flex items-center justify-center pointer-events-none">
            <FaSearch className="h-5 w-5 text-slate-300 group-focus-within:text-brand-600 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Rechercher une offre, une compétence, une entreprise..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-brand-200 bg-white pl-12 pr-6 py-4 text-slate-900 shadow-xl shadow-brand-900/5 transition placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
          />
        </div>
      </div>

      {/* Offers Grid */}
      {filteredOffres.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredOffres.map((offre) => (
            <div
              key={offre.id}
              className="group flex flex-col justify-between rounded-2xl border border-surface-200 bg-white/80 p-6 shadow-sm hover-lift backdrop-blur relative overflow-hidden"
            >
              {/* Subtle accent color bar on top */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-400 to-brand-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>

              <div>
                {/* Offre Header */}
                <div className="mb-4">
                  <h3 className="text-xl font-display font-bold text-surface-900 group-hover:text-brand-600 transition-colors">
                    {offre.titre}
                  </h3>
                  {offre.hrName && (
                    <p className="mt-1 text-sm font-medium text-surface-500 flex items-center gap-1.5">
                      <FaBriefcase className="h-3.5 w-3.5" />
                      {offre.hrName}
                    </p>
                  )}
                </div>

                {/* Description */}
                <p className="mb-6 line-clamp-3 text-sm text-surface-600 leading-relaxed">
                  {offre.description}
                </p>

                {/* Competences */}
                {offre.competencesRequises && (
                  <div className="mb-6">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-surface-400">
                      Compétences attendues
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {offre.competencesRequises.split(",").slice(0, 3).map((comp, idx) => (
                        <span
                          key={idx}
                          className="inline-block rounded-full bg-brand-50 px-3 py-1 font-sans text-[11px] font-semibold tracking-wide text-brand-700 ring-1 ring-inset ring-brand-600/10"
                        >
                          {comp.trim()}
                        </span>
                      ))}
                      {offre.competencesRequises.split(",").length > 3 && (
                        <span className="inline-block rounded-full bg-surface-100 px-3 py-1 font-sans text-[11px] font-semibold text-surface-600 ring-1 ring-inset ring-surface-500/10">
                          +{offre.competencesRequises.split(",").length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div>
                {/* Date */}
                {offre.dateCreation && (
                  <div className="mb-4 flex items-center gap-2 text-xs font-medium text-surface-400">
                    <FaCalendarAlt className="h-3.5 w-3.5" />
                    Publié le {new Date(offre.dateCreation).toLocaleDateString("fr-FR")}
                  </div>
                )}

                {/* Action Button */}
                <button
                  onClick={() => navigate(`/candidate/offers/${offre.id}/apply`)}
                  className="w-full rounded-xl bg-brand-600 px-4 py-3 text-center text-sm font-bold text-white shadow-sm transition hover:bg-brand-500 active:scale-95"
                >
                  Postuler via CV
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-surface-200 border-dashed bg-surface-50/50 p-16 text-center animate-fade-in">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-surface-100 mb-6">
            <FaBriefcase className="h-8 w-8 text-surface-400" />
          </div>
          <p className="text-xl font-display font-semibold text-surface-900">
            {searchTerm ? "Aucun résultat trouvé" : "Préparez votre profil"}
          </p>
          <p className="mt-2 text-surface-500 max-w-sm mx-auto">
            {searchTerm ? "Essayez avec des mots-clés différents ou élargissez votre recherche." : "Les entreprises ajouteront de nouvelles offres très bientôt. En attendant, mettez à jour votre CV !"}
          </p>
        </div>
      )}
    </div>
  )
}

export default CanddatteJobeOffers
