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
      toast.error(message || "Erreur lors du chargement des offres")
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
        toast.success("Offre supprimée avec succès")
        setDeleteModal({ isOpen: false, offreId: null, offreName: "", isDeleting: false })
        dispatch(reset())
      })
      .catch((error) => {
        toast.error(error || "Erreur lors de la suppression")
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
      {offres && offres.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl border border-surface-200 bg-white/60 backdrop-blur-md shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-200 bg-surface-50/50">
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-surface-500">
                  Titre
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-surface-500">
                  Description
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-surface-500">
                  Date
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-surface-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {offres.map((offre) => (
                <tr
                  key={offre.id}
                  className="border-b border-surface-100 transition hover:bg-surface-50/80"
                >
                  {/* Title */}
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 border border-brand-100">
                        <FaBriefcase className="h-5 w-5 text-brand-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-surface-900 line-clamp-2">{offre.titre}</p>
                      </div>
                    </div>
                  </td>

                  {/* Description */}
                  <td className="px-6 py-5">
                    <p className="line-clamp-2 text-sm text-surface-600 max-w-sm">
                      {offre.description}
                    </p>
                  </td>

                  {/* Date */}
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-sm font-medium text-surface-500">
                      <FaCalendarAlt className="h-4 w-4 text-surface-400" />
                      {offre.dateCreation
                        ? new Date(offre.dateCreation).toLocaleDateString("fr-FR")
                        : "-"}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-5">
                    <div className="flex justify-center gap-2">
                      {/* View Applicants */}
                      <button
                        onClick={() => handleViewApplicants(offre.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-surface-100 px-3 py-2 text-xs font-semibold text-surface-700 transition hover:bg-brand-50 hover:text-brand-700 active:scale-95"
                        title="Voir les candidatures"
                      >
                        <FaUsers className="h-3.5 w-3.5" />
                        Candidatures
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => handleEdit(offre.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-surface-100 px-3 py-2 text-xs font-semibold text-surface-700 transition hover:bg-yellow-50 hover:text-yellow-700 active:scale-95"
                        title="Modifier l'offre"
                      >
                        <FaEdit className="h-3.5 w-3.5" />
                        Modifier
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(offre.id, offre.titre)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100 active:scale-95"
                        title="Supprimer l'offre"
                      >
                        <FaTrash className="h-3.5 w-3.5" />
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
