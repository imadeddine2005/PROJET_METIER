import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { fetchOffres, reset } from "../../features/offre/offreSlice"
import { FaMapMarkerAlt, FaBriefcase, FaCalendarAlt } from "react-icons/fa"
import Spinner from "../../components/Spinner"
import { toast } from "react-toastify"

function CanddatteJobeOffers() {
  const dispatch = useDispatch()
  const { offres, isLoading, isError, message } = useSelector(
    (state) => state.offre
  )
  const {user} = useSelector((state) => state.auth)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredOffres, setFilteredOffres] = useState([])

  useEffect(() => {
    const user = localStorage.getItem("user")
    if (!user) {
      toast.error("Vous devez être connecté pour voir les offres d'emploi")
      return
    }
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
      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Offres d'emploi</h2>
          <p className="mt-1 text-slate-600">
            {filteredOffres.length} offre{filteredOffres.length !== 1 ? "s" : ""} disponible{filteredOffres.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Rechercher une offre (titre, domaine, compétences)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
        />
      </div>

      {/* Offers Grid */}
      {filteredOffres.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredOffres.map((offre) => (
            <div
              key={offre.id}
              className="group rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-indigo-300"
            >
              {/* Offre Header */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-600 transition">
                  {offre.titre}
                </h3>
                {offre.hrName && (
                  <p className="mt-1 text-sm text-slate-500">{offre.hrName}</p>
                )}
              </div>

              {/* Description */}
              <p className="mb-4 line-clamp-3 text-sm text-slate-600">
                {offre.description}
              </p>

              {/* Competences */}
              {offre.competencesRequises && (
                <div className="mb-4">
                  <p className="mb-2 text-xs font-semibold uppercase text-slate-500">
                    Compétences
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {offre.competencesRequises.split(",").slice(0, 3).map((comp, idx) => (
                      <span
                        key={idx}
                        className="inline-block rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-medium text-indigo-700"
                      >
                        {comp.trim()}
                      </span>
                    ))}
                    {offre.competencesRequises.split(",").length > 3 && (
                      <span className="inline-block rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                        +{offre.competencesRequises.split(",").length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Date */}
              {offre.dateCreation && (
                <div className="mb-4 flex items-center gap-2 text-xs text-slate-500">
                  <FaCalendarAlt className="h-3 w-3" />
                  {new Date(offre.dateCreation).toLocaleDateString("fr-FR")}
                </div>
              )}

              {/* Action Button */}
              <button className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-indigo-700 active:scale-95">
                Postuler
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
          <FaBriefcase className="mx-auto mb-4 h-12 w-12 text-slate-300" />
          <p className="text-lg font-medium text-slate-900">
            {searchTerm ? "Aucune offre ne correspond à votre recherche" : "Aucune offre disponible"}
          </p>
          <p className="mt-1 text-slate-600">
            {searchTerm ? "Essayez avec des mots-clés différents" : "Les offres s'ajouteront bientôt"}
          </p>
        </div>
      )}
    </div>
  )
}

export default CanddatteJobeOffers
