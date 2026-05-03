import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { fetchAllOffresHr, reset } from "../../features/offre/offreSlice"
import { FaHistory, FaCalendarAlt, FaUsers, FaArrowRight, FaStar } from "react-icons/fa"
import Spinner from "../../components/Spinner"
import { toast } from "react-toastify"
import { useNavigate } from "react-router-dom"

function HistoriqueOffres() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { offres, isLoading, isError, message } = useSelector(
    (state) => state.offre
  )

  useEffect(() => {
    dispatch(fetchAllOffresHr())
  }, [dispatch])

  useEffect(() => {
    if (isError) {
      toast.error(message || "Erreur lors du chargement des offres", { toastId: 'hist-offres-err' })
      dispatch(reset())
    }
  }, [isError, message, dispatch])

  const handleViewHistory = (offreId) => {
    navigate(`/hr/history/${offreId}`)
  }

  if (isLoading) {
    return <Spinner />
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header with modern gradient text matching sidebar */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-900 p-6 sm:p-8 text-white shadow-xl">
        {/* Decorative Gradients matching sidebar */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-brand-500/20 to-transparent pointer-events-none"></div>
        <div className="absolute top-0 right-0 -mt-8 -mr-8 text-white/5 pointer-events-none">
          <FaHistory className="w-48 h-48" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-3 rounded-full bg-white/10 text-xs font-medium backdrop-blur-md border border-white/20">
            <FaStar className="text-yellow-400" />
            <span className="text-slate-200">Suivi des candidatures</span>
          </div>
          <h2 className="text-3xl font-display font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">
            Historique des Décisions
          </h2>
        </div>
      </div>

      {offres && offres.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {offres.map((offre) => (
            <div
              key={offre.id}
              onClick={() => handleViewHistory(offre.id)}
              className="group relative flex flex-col bg-white rounded-3xl cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] border-2 border-brand-300 hover:border-brand-500 overflow-hidden"
            >
              {/* Strong Top Border Line */}
              <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-600 group-hover:bg-blue-700 transition-colors duration-300 z-20"></div>

              <div className="p-6 flex flex-col h-full relative z-10">
                {/* Icon Badge */}
                <div className="w-10 h-10 rounded-xl bg-brand-500 text-white flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-md">
                  <FaHistory className="w-4 h-4" />
                </div>

                <h3 className="text-lg font-bold text-slate-900 group-hover:text-brand-700 transition-colors duration-300 mb-2 line-clamp-2">
                  {offre.titre}
                </h3>
                
                <div className="mt-auto pt-5 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                    <div className="p-1.5 rounded-lg bg-slate-100 text-slate-500">
                      <FaCalendarAlt className="w-4 h-4" />
                    </div>
                    <span>{new Date(offre.dateCreation).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                    <div className="p-1.5 rounded-lg bg-slate-100 text-slate-500">
                      <FaUsers className="w-4 h-4" />
                    </div>
                    <span>Suivi complet disponible</span>
                  </div>
                </div>

                {/* Animated Bottom CTA */}
                <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between text-brand-700 text-sm font-bold transition-all duration-300">
                  <span>Explorer l'historique</span>
                  <FaArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
              
              {/* Glow Effect behind the card on hover */}
              <div className="absolute inset-0 z-0 bg-gradient-to-br from-brand-50/80 to-transparent transition-opacity duration-500 pointer-events-none"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50/50 backdrop-blur-sm py-24 px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-white shadow-md flex items-center justify-center mb-6">
            <FaHistory className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900">Aucune offre disponible</h3>
          <p className="mt-3 text-slate-500 max-w-md mx-auto text-lg">
            Commencez par créer une offre d'emploi pour voir apparaître l'historique de vos recrutements ici.
          </p>
        </div>
      )}
    </div>
  )
}

export default HistoriqueOffres
