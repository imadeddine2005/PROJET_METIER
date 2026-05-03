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
    <div className="-mt-6 space-y-3 animate-fade-in">

      {/* Header Premium (Minimized) */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-900 p-3 sm:p-4 text-white shadow-xl">
        {/* Decorative Gradients */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-brand-500/20 to-transparent pointer-events-none"></div>
        <div className="absolute top-0 right-0 -mt-6 -mr-6 text-white/5 pointer-events-none">
          <FaFileAlt className="w-28 h-28" />
        </div>
        
        <div className="relative z-10 flex flex-row items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2 py-0.5 mb-1 rounded-full bg-white/10 text-[10px] font-bold backdrop-blur-md border border-white/20 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse"></span>
              <span className="text-slate-200">Suivi Candidat</span>
            </div>
            <h2 className="text-xl font-display font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">
              Mes Candidatures
            </h2>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2 flex items-center gap-3">
            <div className="text-center">
              <span className="block text-xl font-bold text-white">{candidatures?.length || 0}</span>
              <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">Soumises</span>
            </div>
          </div>
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
              className="group relative rounded-3xl border-2 border-brand-300 bg-white p-4 shadow-sm hover:border-brand-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] transition-all duration-300 overflow-hidden flex flex-col justify-between"
              >
                {/* Ligne bleue supérieure toujours visible */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-brand-600 group-hover:bg-brand-700 transition-colors duration-300 z-20"></div>

                {/* Top row: Title + Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 border border-brand-100">
                      <FaBriefcase className="h-4 w-4 text-brand-600" />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-extrabold text-slate-900 group-hover:text-brand-700 transition-colors">
                        {c.offreTitre || "Offre sans titre"}
                      </h3>
                      {c.cvFileName && (
                        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-600 font-bold">
                          <FaFileAlt className="h-3.5 w-3.5 text-slate-500" />
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
                  <div className="rounded-xl bg-slate-50 border-2 border-slate-200 p-4 transition hover:border-brand-300">
                    <div className="flex items-center gap-1.5 mb-3">
                      <FaGraduationCap className="h-4 w-4 text-brand-500" />
                      <p className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">Diplômes</p>
                    </div>
                    <div className="space-y-2 max-h-24 overflow-y-auto custom-scrollbar pr-1">
                      {diplomes.length > 0 ? diplomes.map((d, i) => (
                        <p key={i} className="text-[13px] text-slate-900 font-bold leading-snug flex items-start gap-2">
                          <span className="text-slate-400">•</span> {d}
                        </p>
                      )) : (
                        <p className="text-xs text-slate-500 italic font-semibold">Aucun diplôme</p>
                      )}
                    </div>
                  </div>

                  {/* Compétences */}
                  <div className="rounded-xl bg-slate-50 border-2 border-slate-200 p-4 transition hover:border-brand-300">
                    <div className="flex items-center gap-1.5 mb-3">
                      <FaBriefcase className="h-4 w-4 text-brand-500" />
                      <p className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">Compétences</p>
                    </div>
                    <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto custom-scrollbar pr-1">
                      {competences.length > 0 ? competences.map((comp, i) => (
                        <span key={i} className="rounded-lg bg-brand-100 border border-brand-200 px-2.5 py-1 text-xs font-extrabold text-brand-800 shadow-sm">
                          {comp}
                        </span>
                      )) : (
                        <p className="text-xs text-slate-500 italic font-semibold">Aucune compétence</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom row: Date & View CV */}
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 pt-4 border-t-2 border-slate-100">
                  {c.dateSoumission && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 font-bold">
                      <FaCalendarAlt className="h-3.5 w-3.5 text-slate-400" />
                      Soumis le {new Date(c.dateSoumission).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
                    </div>
                  )}
                  <button
                    onClick={() => handleViewCv(c.id)}
                    className="flex items-center gap-2 rounded-xl border-2 border-brand-600 bg-white px-4 py-2 text-xs font-bold text-brand-600 shadow-sm transition hover:bg-brand-50 active:scale-95"
                  >
                    <FaFileAlt className="h-3.5 w-3.5" />
                    Visualiser mon CV
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50/50 backdrop-blur-sm py-24 px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-white shadow-md flex items-center justify-center mb-6">
            <FaBriefcase className="h-8 w-8 text-slate-400" />
          </div>
          <p className="text-2xl font-display font-extrabold text-slate-900">Aucune candidature</p>
          <p className="mt-3 text-slate-600 max-w-md mx-auto text-lg font-medium">
            Vous n'avez pas encore postulé à des offres. Explorez les offres disponibles et soumettez votre CV !
          </p>
        </div>
      )}
    </div>
  )
}

export default MesCandidatures
