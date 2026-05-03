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
      toast.error(message || "Erreur lors du chargement des offres", { toastId: 'cand-off-err' })
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
    <div className="-mt-6 space-y-3">
      {/* Header Premium & Search Bar (Minimized Height) */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-900 p-3 text-white shadow-xl">
        {/* Decorative Gradients */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-brand-500/20 to-transparent pointer-events-none"></div>
        <div className="absolute top-0 right-0 -mt-8 -mr-8 text-white/5 pointer-events-none">
          <FaBriefcase className="w-32 h-32" />
        </div>
        
        <div className="relative z-10 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-2 py-0.5 mb-2 rounded-full bg-white/10 text-[10px] font-bold backdrop-blur-md border border-white/20 uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse"></span>
            <span className="text-slate-200">Opportunités</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-display font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300 mb-2">
            Trouvez votre prochain défi
          </h2>
          
          {/* Search Bar */}
          <div className="relative group mx-auto w-full max-w-md">
            <div className="absolute -inset-1 bg-brand-500/30 rounded-xl blur-lg transition duration-500 group-hover:bg-brand-500/50 opacity-70"></div>
            <div className="relative flex items-center">
              <div className="absolute left-4 z-20 flex items-center justify-center pointer-events-none">
                <FaSearch className="h-4 w-4 text-slate-400 group-focus-within:text-brand-600 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Rechercher une offre, une compétence..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border-2 border-white/20 bg-white/10 backdrop-blur-md pl-10 pr-4 py-2 text-sm text-white placeholder:text-slate-300 shadow-xl transition-all focus:border-brand-400 focus:bg-white focus:text-slate-900 focus:placeholder:text-slate-400 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Offers Grid */}
      {filteredOffres.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredOffres.map((offre) => (
            <div
              key={offre.id}
              className="group flex flex-col justify-between rounded-3xl border-2 border-brand-300 bg-white p-4 shadow-sm hover:border-brand-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] transition-all duration-300 relative overflow-hidden"
            >
              {/* Subtle accent color bar on top */}
              <div className="absolute top-0 left-0 w-full h-1.5 bg-brand-600 transition-colors duration-300 z-20 group-hover:bg-brand-700"></div>

              <div>
                {/* Offre Header */}
                <div className="mb-2">
                  <h3 className="text-xl font-display font-extrabold text-slate-900 group-hover:text-brand-600 transition-colors">
                    {offre.titre}
                  </h3>
                  {offre.hrName && (
                    <p className="mt-1 text-sm font-bold text-slate-600 flex items-center gap-1.5">
                      <FaBriefcase className="h-3.5 w-3.5 text-slate-400" />
                      {offre.hrName}
                    </p>
                  )}
                </div>

                {/* Description */}
                <p className="mb-3 line-clamp-2 text-sm text-slate-800 font-medium leading-relaxed">
                  {offre.description}
                </p>

                {/* Competences */}
                {offre.competencesRequises && (
                  <div className="mb-3">
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
                  <div className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-500">
                    <FaCalendarAlt className="h-3.5 w-3.5" />
                    Publié le {new Date(offre.dateCreation).toLocaleDateString("fr-FR")}
                  </div>
                )}

                {/* Action Button */}
                <button
                  onClick={() => navigate(`/candidate/offers/${offre.id}/apply`)}
                  className="w-full rounded-xl border-2 border-brand-600 bg-brand-600 px-4 py-3 text-center text-sm font-bold text-white shadow-lg shadow-brand-500/20 transition-all hover:bg-white hover:text-brand-600 active:scale-95"
                >
                  Postuler via CV
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50/50 backdrop-blur-sm py-24 px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-white shadow-md flex items-center justify-center mb-6">
            <FaBriefcase className="h-8 w-8 text-slate-400" />
          </div>
          <p className="text-2xl font-display font-extrabold text-slate-900">
            {searchTerm ? "Aucun résultat trouvé" : "Préparez votre profil"}
          </p>
          <p className="mt-3 text-slate-600 max-w-md mx-auto text-lg font-medium">
            {searchTerm ? "Essayez avec des mots-clés différents ou élargissez votre recherche." : "Les entreprises ajouteront de nouvelles offres très bientôt. En attendant, mettez à jour votre CV !"}
          </p>
        </div>
      )}
    </div>
  )
}

export default CanddatteJobeOffers
