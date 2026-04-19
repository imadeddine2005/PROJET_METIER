import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { fetchMyApplications, resetCandidatureState } from "../../features/candidature/candidatureSlice"
import { FaBriefcase, FaCalendarAlt, FaFileAlt, FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaMedal, FaGraduationCap } from "react-icons/fa"
import { toast } from "react-toastify"
import Spinner from "../../components/Spinner"
import candidatureService from "../../features/candidature/candidatureService"

// Status badge config
const statusConfig = {
  ACCEPTEE: {
    label: "Acceptée",
    icon: FaCheckCircle,
    classes: "bg-green-50 text-green-700 border-green-200 ring-green-100",
    iconClass: "text-green-500",
  },
  REFUSEE: {
    label: "Refusée",
    icon: FaTimesCircle,
    classes: "bg-red-50 text-red-700 border-red-200 ring-red-100",
    iconClass: "text-red-500",
  },
  EN_ATTENTE: {
    label: "En attente",
    icon: FaHourglassHalf,
    classes: "bg-yellow-50 text-yellow-700 border-yellow-200 ring-yellow-100",
    iconClass: "text-yellow-500",
  },
}

function getScoreStyle(score) {
  if (score >= 75) return { color: "text-green-600", bar: "bg-green-400", bg: "bg-green-50" }
  if (score >= 50) return { color: "text-yellow-600", bar: "bg-yellow-400", bg: "bg-yellow-50" }
  return { color: "text-red-500", bar: "bg-red-400", bg: "bg-red-50" }
}

function MesCandidatures() {
  const dispatch = useDispatch()
  const { candidatures, isLoading, isError, message } = useSelector((state) => state.candidature)

  useEffect(() => {
    dispatch(fetchMyApplications())
    return () => dispatch(resetCandidatureState())
  }, [dispatch])

  useEffect(() => {
    if (isError) {
      toast.error(message || "Erreur lors du chargement des candidatures", { toastId: 'mes-cand-err' })
      dispatch(resetCandidatureState())
    }
  }, [isError, message, dispatch])

  const handleViewCv = async (candidatureId) => {
    try {
      const blob = await candidatureService.downloadMyCv(candidatureId);
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      toast.error("Erreur lors de l'ouverture du CV", { toastId: 'open-cv-err' });
    }
  };

  if (isLoading) return <Spinner />

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-display font-bold text-surface-900 tracking-tight">Mes Candidatures</h2>
          <p className="mt-1 text-sm font-medium text-surface-500">
            {candidatures?.length || 0} candidature{candidatures?.length !== 1 ? "s" : ""} soumise{candidatures?.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* List */}
      {candidatures && candidatures.length > 0 ? (
        <div className="space-y-4">
          {candidatures.map((c) => {
            const score = c.scoreCompatibilite || 0
            const scoreStyle = getScoreStyle(score)
            const status = statusConfig[c.status] || statusConfig["EN_ATTENTE"]
            const StatusIcon = status.icon

            const competences = (c.competences || []).map(s => s.trim()).filter(Boolean)
            const diplomes = (c.diplomes || []).map(s => s.trim()).filter(Boolean)

            return (
              <div
                key={c.id}
                className="group rounded-2xl border border-surface-200 bg-white/80 backdrop-blur-sm p-5 shadow-sm hover:shadow-md hover:border-brand-200 transition-all duration-200"
              >
                {/* Top row: Title + Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 border border-brand-100">
                      <FaBriefcase className="h-4 w-4 text-brand-600" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-surface-900 group-hover:text-brand-700 transition-colors">
                        {c.offreTitre || "Offre sans titre"}
                      </h3>
                      {c.cvFileName && (
                        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-surface-400 font-medium">
                          <FaFileAlt className="h-3 w-3" />
                          {c.cvFileName}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status badge */}
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ring-1 shrink-0 ${status.classes}`}>
                    <StatusIcon className={`h-3.5 w-3.5 ${status.iconClass}`} />
                    {status.label}
                  </span>
                </div>

                {/* Middle row: Score + Diplômes + Compétences */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                  {/* Score */}
                  <div className={`flex flex-col items-center justify-center rounded-xl p-3 ${scoreStyle.bg}`}>
                    <FaMedal className={`h-4 w-4 mb-1 ${scoreStyle.color}`} />
                    <span className={`text-3xl font-extrabold ${scoreStyle.color}`}>{score}<span className="text-lg">%</span></span>
                    <div className="mt-2 w-full rounded-full bg-white/60 h-1.5">
                      <div className={`h-1.5 rounded-full ${scoreStyle.bar} transition-all duration-700`} style={{ width: `${score}%` }}></div>
                    </div>
                    <p className="mt-1.5 text-xs font-semibold text-surface-500">Compatibilité</p>
                  </div>

                  {/* Diplômes */}
                  <div className="rounded-xl bg-surface-50 border border-surface-100 p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <FaGraduationCap className="h-3.5 w-3.5 text-brand-500" />
                      <p className="text-xs font-bold text-surface-500 uppercase tracking-wider">Diplômes</p>
                    </div>
                    <div className="space-y-1.5 max-h-24 overflow-y-auto custom-scrollbar pr-1">
                      {diplomes.length > 0 ? diplomes.map((d, i) => (
                        <p key={i} className="text-xs text-surface-700 font-medium leading-snug">• {d}</p>
                      )) : (
                        <p className="text-xs text-surface-400 italic">Aucun diplôme</p>
                      )}
                    </div>
                  </div>

                  {/* Compétences */}
                  <div className="rounded-xl bg-surface-50 border border-surface-100 p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <FaBriefcase className="h-3.5 w-3.5 text-brand-500" />
                      <p className="text-xs font-bold text-surface-500 uppercase tracking-wider">Compétences</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar pr-1">
                      {competences.length > 0 ? competences.map((comp, i) => (
                        <span key={i} className="rounded-full bg-brand-50 border border-brand-100 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
                          {comp}
                        </span>
                      )) : (
                        <p className="text-xs text-surface-400 italic">Aucune compétence</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom row: Date & View CV */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-surface-100">
                  {c.dateSoumission && (
                    <div className="flex items-center gap-1.5 text-xs text-surface-400 font-medium">
                      <FaCalendarAlt className="h-3 w-3" />
                      Soumis le {new Date(c.dateSoumission).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
                    </div>
                  )}
                  <button
                    onClick={() => handleViewCv(c.id)}
                    className="flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700 transition hover:bg-brand-100 active:scale-95"
                  >
                    <FaFileAlt className="h-3 w-3" />
                    Visualiser mon CV
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-surface-200 border-dashed bg-white/60 p-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 mb-4">
            <FaBriefcase className="h-7 w-7 text-brand-400" />
          </div>
          <p className="text-lg font-display font-bold text-surface-900">Aucune candidature</p>
          <p className="mt-2 text-sm text-surface-500 max-w-sm mx-auto">
            Vous n'avez pas encore postulé à des offres. Explorez les offres disponibles et soumettez votre CV !
          </p>
        </div>
      )}
    </div>
  )
}

export default MesCandidatures
