import { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { createOffre, reset } from "../../features/offre/offreSlice"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import { FaBriefcase, FaArrowLeft } from "react-icons/fa"
import Spinner from "../../components/Spinner"

function CreerOffre() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.offre
  )

  const [formData, setFormData] = useState({
    titre: "",
    description: "",
    competencesRequises: "",
  })

  const [errors, setErrors] = useState({})
  const [isCreating, setIsCreating] = useState(false)

  // Reset state on component mount
  useEffect(() => {
    dispatch(reset())
  }, [dispatch])

  // Handle errors
  useEffect(() => {
    if (isError) {
      setIsCreating(false)
      toast.error(message || "Erreur lors de la création de l'offre", { toastId: 'create-offre-err' })
      dispatch(reset())
    }
  }, [isError, message, dispatch])

  // Handle success
  useEffect(() => {
    if (isSuccess && isCreating) {
      setIsCreating(false)
      toast.success("Offre créée avec succès!", { toastId: 'create-offre-succ' })
      dispatch(reset())
      setTimeout(() => {
        navigate("/hr/offers")
      }, 1500)
    }
  }, [isSuccess, isCreating, dispatch, navigate])

  // Validate form
  const validateForm = () => {
    const newErrors = {}

    if (!formData.titre.trim()) {
      newErrors.titre = "Le titre est obligatoire"
    }
    if (formData.titre.trim().length < 5) {
      newErrors.titre = "Le titre doit contenir au least 5 caractères"
    }

    if (!formData.description.trim()) {
      newErrors.description = "La description est obligatoire"
    }
    if (formData.description.trim().length < 20) {
      newErrors.description = "La description doit contenir au least 20 caractères"
    }

    if (!formData.competencesRequises.trim()) {
      newErrors.competencesRequises = "Les compétences sont obligatoires"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }))
    }
  }

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error("Veuillez corriger les erreurs du formulaire", { toastId: 'create-form-err' })
      return
    }

    setIsCreating(true)
    dispatch(createOffre(formData))
  }

  if (isLoading) {
    return <Spinner />
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Créer une offre</h2>
        <p className="mt-1 text-slate-600">Publiez une nouvelle offre d'emploi</p>
      </div>

      {/* Form Card */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Titre Field */}
          <div>
            <label htmlFor="titre" className="block text-sm font-medium text-slate-900">
              Titre de l'offre *
            </label>
            <p className="mt-1 text-xs text-slate-500">
              Exemple: Développeur JavaScript Senior, Responsable RH, etc.
            </p>
            <input
              type="text"
              id="titre"
              name="titre"
              value={formData.titre}
              onChange={handleChange}
              placeholder="Entrez le titre de l'offre..."
              className={`mt-2 w-full rounded-lg border px-4 py-2.5 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                errors.titre
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500/30"
                  : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/30"
              }`}
            />
            {errors.titre && (
              <p className="mt-1 text-sm text-red-600">{errors.titre}</p>
            )}
          </div>

          {/* Description Field */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-900">
              Description *
            </label>
            <p className="mt-1 text-xs text-slate-500">
              Décrivez le rôle, les responsabilités et les conditions de travail
            </p>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Entrez une description détaillée..."
              rows="6"
              className={`mt-2 w-full rounded-lg border px-4 py-2.5 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                errors.description
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500/30"
                  : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/30"
              }`}
            />
            <div className="mt-1 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                {formData.description.length} / min. 20 caractères
              </p>
              {errors.description && (
                <p className="text-sm text-red-600">{errors.description}</p>
              )}
            </div>
          </div>

          {/* Competences Field */}
          <div>
            <label htmlFor="competencesRequises" className="block text-sm font-medium text-slate-900">
              Compétences requises *
            </label>
            <p className="mt-1 text-xs text-slate-500">
              Séparez les compétences par des virgules (ex: JavaScript, React, Node.js)
            </p>
            <textarea
              id="competencesRequises"
              name="competencesRequises"
              value={formData.competencesRequises}
              onChange={handleChange}
              placeholder="React, JavaScript, REST API, Git..."
              rows="3"
              className={`mt-2 w-full rounded-lg border px-4 py-2.5 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                errors.competencesRequises
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500/30"
                  : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/30"
              }`}
            />
            {errors.competencesRequises && (
              <p className="mt-1 text-sm text-red-600">{errors.competencesRequises}</p>
            )}
            {/* Preview */}
            {formData.competencesRequises.trim() && (
              <div className="mt-3 space-y-2">
                <p className="text-xs font-medium text-slate-600">Aperçu:</p>
                <div className="flex flex-wrap gap-2">
                  {formData.competencesRequises
                    .split(",")
                    .map((comp, idx) => (
                      <span
                        key={idx}
                        className="inline-block rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-medium text-indigo-700"
                      >
                        {comp.trim()}
                      </span>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 border-t border-slate-200 pt-6">
            <button
              type="button"
              onClick={() => navigate("/hr/offers")}
              disabled={isLoading}
              className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50 active:scale-95"
            >
              <FaBriefcase className="h-4 w-4" />
              {isLoading ? "Création en cours..." : "Créer l'offre"}
            </button>
          </div>
        </form>
      </div>

      {/* Form Tips */}
      <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h3 className="font-medium text-slate-900">Conseils pour une bonne offre</h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-600">
          <li>✓ Utilisez un titre clair et spécifique (incluez le niveau d'expérience)</li>
          <li>✓ Décrivez précisément les tâches et responsabilités</li>
          <li>✓ Listez les 5-10 compétences les plus importantes</li>
          <li>✓ Incluez les avantages (salaire, télétravail, formation, etc.)</li>
          <li>✓ Soyez transparent sur les conditions de travail</li>
        </ul>
      </div>
    </div>
  )
}

export default CreerOffre
