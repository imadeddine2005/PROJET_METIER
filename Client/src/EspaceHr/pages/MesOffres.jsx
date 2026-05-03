import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { fetchMyOffres, reset, deleteOffre } from "../../features/offre/offreSlice"
import { FaBriefcase, FaEdit, FaTrash, FaUsers, FaPlus, FaCalendarAlt, FaStar } from "react-icons/fa"
import Spinner from "../../components/Spinner"
import { toast } from "react-toastify"
import { useNavigate } from "react-router-dom"
import DeleteConfirmationModal from "../components/DeleteConfirmationModal"

function MesOffres() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { offres, isLoading, isError, message } = useSelector(
    (state) => state.offre
  )
  const [filter, setFilter] = useState("all")
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    offreId: null,
    offreName: "",
    isDeleting: false,
  })

  useEffect(() => {
    dispatch(fetchMyOffres())
  }, [dispatch])

  useEffect(() => {
    if (isError) {
      toast.error(message || "Erreur lors du chargement des offres", { toastId: 'mes-offres-err' })
      dispatch(reset())
    }
  }, [isError, message, dispatch])

  const handleDelete = (offreId, offreName) => {
    setDeleteModal({
      isOpen: true,
      offreId,
      offreName,
      isDeleting: false,
    })
  }

  const handleConfirmDelete = () => {
    setDeleteModal((prev) => ({ ...prev, isDeleting: true }))
    
    dispatch(deleteOffre(deleteModal.offreId))
      .unwrap()
      .then(() => {
        toast.success("Offre supprimée avec succès", { toastId: 'del-offre-succ' })
        setDeleteModal({ isOpen: false, offreId: null, offreName: "", isDeleting: false })
        dispatch(reset())
      })
      .catch((error) => {
        toast.error(error || "Erreur lors de la suppression", { toastId: 'del-offre-err' })
        setDeleteModal((prev) => ({ ...prev, isDeleting: false }))
      })
  }

  const handleCancelDelete = () => {
    if (!deleteModal.isDeleting) {
      setDeleteModal({ isOpen: false, offreId: null, offreName: "", isDeleting: false })
    }
  }

  const handleEdit = (offreId) => {
    navigate(`/hr/edit-offer/${offreId}`)
  }

  const handleViewApplicants = (offreId) => {
    navigate(`/hr/offers/${offreId}/applicants`)
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
          <FaBriefcase className="w-48 h-48" />
        </div>
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-3 rounded-full bg-white/10 text-xs font-medium backdrop-blur-md border border-white/20">
              <FaStar className="text-yellow-400" />
              <span className="text-slate-200">Espace de recrutement</span>
            </div>
            <h2 className="text-3xl font-display font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">
              Mes Offres d'emploi
            </h2>
          </div>
          
          <button
            onClick={() => navigate("/hr/create-offer")}
            className="flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-500/30 transition-all hover:bg-brand-600 hover:-translate-y-0.5 active:translate-y-0"
          >
            <FaPlus className="h-4 w-4" />
            Créer une offre
          </button>
        </div>
      </div>

      {/* Offres Grid */}
      {offres && offres.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {offres.map((offre) => (
            <div key={offre.id} className="group relative flex flex-col bg-white rounded-3xl transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] border-2 border-brand-300 hover:border-brand-500 overflow-hidden">
              {/* Strong Top Border Line */}
              <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-600 group-hover:bg-blue-700 transition-colors duration-300 z-20"></div>
              
              <div className="p-6 pb-4 flex-1 relative z-10">
                <div className="flex justify-between items-start mb-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white shadow-md group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                    <FaBriefcase className="h-4 w-4" />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200/50">
                    <FaCalendarAlt className="text-slate-500" />
                    {offre.dateCreation ? new Date(offre.dateCreation).toLocaleDateString("fr-FR") : "-"}
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-900 leading-tight mb-3 group-hover:text-brand-700 transition-colors duration-300 line-clamp-2">
                  {offre.titre}
                </h3>
                
                <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
                  {offre.description}
                </p>
              </div>

              {/* Actions */}
              <div className="p-4 mx-2 mb-2 bg-slate-50/80 border border-slate-100 rounded-2xl grid grid-cols-3 gap-2 relative z-10">
                <button
                  onClick={() => handleViewApplicants(offre.id)}
                  className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl bg-white border border-brand-100 text-brand-600 hover:bg-brand-500 hover:text-white transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
                  title="Voir les candidatures"
                >
                  <FaUsers className="h-4 w-4" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Candidats</span>
                </button>
                <button
                  onClick={() => handleEdit(offre.id)}
                  className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl bg-white border border-amber-100 text-amber-600 hover:bg-amber-500 hover:text-white transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
                  title="Modifier l'offre"
                >
                  <FaEdit className="h-4 w-4" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Modifier</span>
                </button>
                <button
                  onClick={() => handleDelete(offre.id, offre.titre)}
                  className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl bg-white border border-rose-100 text-rose-600 hover:bg-rose-500 hover:text-white transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
                  title="Supprimer l'offre"
                >
                  <FaTrash className="h-4 w-4" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Supprimer</span>
                </button>
              </div>

              {/* Glow Effect behind the card on hover */}
              <div className="absolute inset-0 z-0 bg-gradient-to-br from-brand-50/80 to-transparent transition-opacity duration-500 pointer-events-none opacity-0 group-hover:opacity-100"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50/50 backdrop-blur-sm py-24 px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-white shadow-md flex items-center justify-center mb-6">
            <FaBriefcase className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900">Aucune offre créée</h3>
          <p className="mt-3 text-slate-500 max-w-md mx-auto text-lg">
            Vous n'avez pas encore d'offres d'emploi. Cliquez sur le bouton "Créer une offre" pour commencer.
          </p>
          <button
            onClick={() => navigate("/hr/create-offer")}
            className="mt-8 flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3 font-bold text-white shadow-lg shadow-brand-500/30 transition-all hover:bg-brand-600 hover:-translate-y-1"
          >
            <FaPlus className="h-4 w-4" />
            Créer ma première offre
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        title="Supprimer l'offre"
        message={`Êtes-vous sûr de vouloir supprimer l'offre "${deleteModal.offreName}" ? Cette action supprimera également toutes les candidatures associées.`}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isLoading={deleteModal.isDeleting}
      />
    </div>
  )
}

export default MesOffres
