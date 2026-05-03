import { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { fetchOffreById, updateOffre, reset } from "../../features/offre/offreSlice"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "react-toastify"
import { FaBriefcase, FaArrowLeft } from "react-icons/fa"
import Spinner from "../../components/Spinner"

function EditerOffre() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { offreId } = useParams()
  
  const { selectedOffre, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.offre
  )

  const [formData, setFormData] = useState({
    titre: "",
    description: "",
    competencesRequises: "",
  })

  const [errors, setErrors] = useState({})
  const [isEditing, setIsEditing] = useState(false)
  const [isLoadingOffre, setIsLoadingOffre] = useState(true)

  // Fetch offer on mount
  useEffect(() => {
    dispatch(reset())
    dispatch(fetchOffreById(offreId))
      .then(() => setIsLoadingOffre(false))
      .catch(() => setIsLoadingOffre(false))
  }, [offreId, dispatch])

  // Populate form when offer is loaded
  useEffect(() => {
    if (selectedOffre) {
      setFormData({
        titre: selectedOffre.titre || "",
        description: selectedOffre.description || "",
        competencesRequises: selectedOffre.competencesRequises || "",
      })
      setIsLoadingOffre(false)
    }
  }, [selectedOffre])

  // Handle errors
  useEffect(() => {
    if (isError) {
      setIsEditing(false)
      toast.error(message || "Erreur lors de la modification de l'offre", { toastId: 'edit-offre-err' })
      dispatch(reset())
    }
  }, [isError, message, dispatch])

  // Handle success
  useEffect(() => {
    if (isSuccess && isEditing) {
      setIsEditing(false)
      toast.success("Offre modifiée avec succès!", { toastId: 'edit-offre-succ' })
      dispatch(reset())
      setTimeout(() => {
        navigate("/hr/offers")
      }, 1500)
    }
  }, [isSuccess, isEditing, dispatch, navigate])

  // Validate form
  const validateForm = () => {
    const newErrors = {}

    if (!formData.titre.trim()) {
      newErrors.titre = "Le titre est obligatoire"
    }
    if (formData.titre.trim().length < 5) {
      newErrors.titre = "Le titre doit contenir au moins 5 caractères"
    }

    if (!formData.description.trim()) {
      newErrors.description = "La description est obligatoire"
    }
    if (formData.description.trim().length < 20) {
      newErrors.description = "La description doit contenir au moins 20 caractères"
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
      toast.error("Veuillez corriger les erreurs du formulaire", { toastId: 'edit-form-err' })
      return
    }

    setIsEditing(true)
    dispatch(updateOffre({ offreId, offreData: formData }))
  }

  if (isLoadingOffre || isLoading) {
    return <Spinner />
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header Premium */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-900 p-6 sm:p-8 text-white shadow-xl">
        {/* Decorative Gradients */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-brand-500/20 to-transparent pointer-events-none"></div>
        <div className="absolute top-0 right-0 -mt-8 -mr-8 text-white/5 pointer-events-none">
          <FaBriefcase className="w-48 h-48" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
          <button 
            type="button"
            onClick={() => navigate("/hr/offers")}
            className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all duration-300 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-lg hover:-translate-x-1 shrink-0 h-fit"
            title="Retour"
          >
            <FaArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-3xl font-display font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">
              Modifier une offre
            </h2>
            <p className="mt-2 text-slate-300 font-medium">Mettez à jour les détails de votre offre d'emploi</p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div className="relative rounded-3xl border-2 border-brand-300 bg-white p-6 md:p-8 shadow-xl overflow-hidden">
        {/* Strong Top Border Line */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-600 z-20"></div>
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
              className={`mt-2 w-full rounded-xl border px-4 py-3 text-slate-900 shadow-sm transition-all placeholder:text-slate-400 focus:outline-none focus:ring-2 bg-slate-50 focus:bg-white ${
                errors.titre
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500/30"
                  : "border-slate-200 focus:border-brand-500 focus:ring-brand-500/30"
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
              className={`mt-2 w-full rounded-xl border px-4 py-3 text-slate-900 shadow-sm transition-all placeholder:text-slate-400 focus:outline-none focus:ring-2 bg-slate-50 focus:bg-white ${
                errors.description
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500/30"
                  : "border-slate-200 focus:border-brand-500 focus:ring-brand-500/30"
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
              className={`mt-2 w-full rounded-xl border px-4 py-3 text-slate-900 shadow-sm transition-all placeholder:text-slate-400 focus:outline-none focus:ring-2 bg-slate-50 focus:bg-white ${
                errors.competencesRequises
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500/30"
                  : "border-slate-200 focus:border-brand-500 focus:ring-brand-500/30"
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
                        className="inline-block rounded-lg bg-brand-100 border border-brand-200 px-3 py-1.5 text-xs font-bold text-brand-700 shadow-sm"
                      >
                        {comp.trim()}
                      </span>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-4 pt-8 mt-8 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate("/hr/offers")}
              disabled={isLoading}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl border-2 border-slate-200 font-bold text-slate-600 transition-all hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:flex-1 flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-8 py-3.5 font-bold text-white transition-all hover:bg-brand-500 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none active:scale-95"
            >
              <FaBriefcase className="h-5 w-5" />
              {isLoading ? "Modification en cours..." : "Modifier l'offre"}
            </button>
          </div>
        </form>
      </div>

      {/* Form Tips */}
      <div className="rounded-3xl border border-indigo-200 bg-indigo-50/50 p-6 shadow-sm">
        <h3 className="font-bold text-indigo-900 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-200 text-indigo-800 text-xs">i</span>
          Conseils pour une bonne offre
        </h3>
        <ul className="mt-4 space-y-3 text-sm font-medium text-indigo-800/80">
          <li className="flex items-start gap-2"><span className="text-indigo-400">✓</span> Utilisez un titre clair et spécifique (incluez le niveau d'expérience)</li>
          <li className="flex items-start gap-2"><span className="text-indigo-400">✓</span> Décrivez précisément les tâches et responsabilités</li>
          <li className="flex items-start gap-2"><span className="text-indigo-400">✓</span> Listez les 5-10 compétences les plus importantes</li>
          <li className="flex items-start gap-2"><span className="text-indigo-400">✓</span> Incluez les avantages (salaire, télétravail, formation, etc.)</li>
          <li className="flex items-start gap-2"><span className="text-indigo-400">✓</span> Soyez transparent sur les conditions de travail</li>
        </ul>
      </div>
    </div>
  )
}

export default EditerOffre
