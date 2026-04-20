import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { fetchMyOffres, reset, deleteOffre } from "../../features/offre/offreSlice"
import { FaBriefcase, FaEdit, FaTrash, FaUsers, FaPlus, FaCalendarAlt } from "react-icons/fa"
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
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-3xl font-display font-bold text-surface-900 tracking-tight">Mes Offres d'emploi</h2>
          <p className="mt-1 text-surface-500 font-medium">
            {offres?.length || 0} offre{offres?.length !== 1 ? "s" : ""} créée{offres?.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => navigate("/hr/create-offer")}
          className="flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-500 active:scale-95"
        >
          <FaPlus className="h-4 w-4" />
          Créer une offre
        </button>
      </div>

      {/* Offres Table/Grid */}
      {/* Offres Grid */}
      {offres && offres.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {offres.map((offre) => (
            <div key={offre.id} className="group relative bg-white/80 backdrop-blur-xl border border-surface-200 hover:border-brand-200 rounded-[24px] shadow-sm hover:shadow-xl hover:shadow-brand-500/10 transition-all duration-300 flex flex-col overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-400 to-indigo-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500" />
              
              <div className="p-6 pb-4 flex-1">
                <div className="flex justify-between items-start mb-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 border border-brand-100/50 text-brand-600 group-hover:scale-110 transition-transform">
                    <FaBriefcase className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-surface-500 bg-surface-100 px-2.5 py-1.5 rounded-lg border border-surface-200/50">
                    <FaCalendarAlt className="text-surface-400" />
                    {offre.dateCreation ? new Date(offre.dateCreation).toLocaleDateString("fr-FR") : "-"}
                  </div>
                </div>

                <h3 className="text-lg font-bold text-surface-900 leading-tight mb-2 group-hover:text-brand-600 transition-colors">
                  {offre.titre}
                </h3>
                
                <p className="text-sm text-surface-600 line-clamp-3 leading-relaxed">
                  {offre.description}
                </p>
              </div>

              <div className="p-4 mx-2 mb-2 bg-surface-50/50 border border-surface-100/50 rounded-2xl grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleViewApplicants(offre.id)}
                  className="flex flex-col items-center justify-center gap-1.5 py-2.5 rounded-xl bg-brand-50/80 text-brand-600 hover:bg-brand-100/80 hover:text-brand-800 transition"
                  title="Voir les candidatures"
                >
                  <FaUsers className="h-4 w-4" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Candidats</span>
                </button>
                <button
                  onClick={() => handleEdit(offre.id)}
                  className="flex flex-col items-center justify-center gap-1.5 py-2.5 rounded-xl bg-yellow-50/80 text-yellow-600 hover:bg-yellow-100/80 hover:text-yellow-800 transition"
                  title="Modifier l'offre"
                >
                  <FaEdit className="h-4 w-4" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Modifier</span>
                </button>
                <button
                  onClick={() => handleDelete(offre.id, offre.titre)}
                  className="flex flex-col items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-50/80 text-red-600 hover:bg-red-100/80 hover:text-red-800 transition"
                  title="Supprimer l'offre"
                >
                  <FaTrash className="h-4 w-4" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Supprimer</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-surface-200 border-dashed bg-white/60 p-16 text-center shadow-sm">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-50 mb-6">
            <FaBriefcase className="h-8 w-8 text-brand-400" />
          </div>
          <p className="text-xl font-display font-bold text-surface-900">Aucune offre créée</p>
          <p className="mt-2 text-surface-500 font-medium">
            Commencez par créer votre première offre d'emploi.
          </p>
          <button
            onClick={() => navigate("/hr/create-offer")}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-brand-500 hover:-translate-y-0.5 active:scale-95 shadow-md shadow-brand-500/20"
          >
            <FaPlus className="h-4 w-4" />
            Créer une offre
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        title="Supprimer l'offre"
        message="Cette action est irréversible. L'offre, tous ses candidatures, les demandes d'accès CV et les fichiers CV associés seront supprimés."
        itemName={deleteModal.offreName}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isLoading={deleteModal.isDeleting}
      />
    </div>
  )
}

export default MesOffres
