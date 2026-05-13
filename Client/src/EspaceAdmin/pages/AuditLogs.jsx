import { useState, useEffect, useCallback } from "react"
import adminService from "../../features/admin/adminService"
import { toast } from "react-toastify"
import {
  FaShieldAlt, FaCheckCircle, FaExclamationTriangle,
  FaSync, FaUser, FaSearch, FaChevronDown, FaChevronUp,
  FaFilter, FaTimes
} from "react-icons/fa"
import Spinner from "../../components/Spinner"

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatDate = (ts) =>
  new Date(ts).toLocaleString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  })

const ACTION_COLORS = {
  LOGIN:           "bg-blue-100 text-blue-700 border-blue-200",
  LOGOUT:          "bg-slate-100 text-slate-600 border-slate-200",
  CANDIDATURE:     "bg-violet-100 text-violet-700 border-violet-200",
  DECISION:        "bg-amber-100 text-amber-700 border-amber-200",
  DEMANDE_ACCES:   "bg-cyan-100 text-cyan-700 border-cyan-200",
  OFFRE:           "bg-emerald-100 text-emerald-700 border-emerald-200",
  DEFAULT:         "bg-slate-100 text-slate-600 border-slate-200",
}

const getActionColor = (action = "") => {
  const upper = action.toUpperCase()
  for (const [key, cls] of Object.entries(ACTION_COLORS)) {
    if (upper.includes(key)) return cls
  }
  return ACTION_COLORS.DEFAULT
}

const RESULT_BADGE = {
  SUCCESS: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  FAILURE: "bg-red-50    text-red-700    border border-red-200",
  ERROR:   "bg-orange-50 text-orange-700 border border-orange-200",
}
const getResultBadge = (r = "") =>
  RESULT_BADGE[r.toUpperCase()] ?? "bg-slate-50 text-slate-600 border border-slate-200"

// ── Sub-components ────────────────────────────────────────────────────────────

function IntegrityBanner({ result, onVerify, loading }) {
  if (!result) return null
  const ok = result.data?.valid
  return (
    <div className={`rounded-2xl border-2 px-6 py-4 flex items-start gap-4 transition-all ${
      ok ? "bg-emerald-50 border-emerald-300" : "bg-red-50 border-red-400"
    }`}>
      <div className={`mt-0.5 shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
        ok ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
      }`}>
        {ok ? <FaCheckCircle className="h-4 w-4" /> : <FaExclamationTriangle className="h-4 w-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-bold text-sm ${ok ? "text-emerald-800" : "text-red-800"}`}>
          {ok ? "Chaîne d'audit intègre" : "⚠️ Alerte sécurité — Chaîne compromise"}
        </p>
        <p className={`text-xs mt-0.5 ${ok ? "text-emerald-600" : "text-red-600"}`}>
          {result.data?.message} &nbsp;·&nbsp; {result.data?.totalLogsChecked} log(s) vérifiés
        </p>
        {!ok && result.data?.firstInvalidLogId && (
          <p className="text-xs font-mono mt-1 text-red-700">
            Premier log invalide : #{result.data.firstInvalidLogId}
          </p>
        )}
      </div>
      <button
        onClick={onVerify}
        disabled={loading}
        className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg border border-current opacity-70 hover:opacity-100 transition disabled:opacity-40"
      >
        Re-vérifier
      </button>
    </div>
  )
}

function LogRow({ log, expanded, onToggle }) {
  return (
    <div
      className="border border-slate-200 rounded-xl overflow-hidden transition-shadow hover:shadow-md bg-white"
    >
      {/* Row header — always visible */}
      <button
        onClick={onToggle}
        className="w-full text-left px-4 py-3 grid gap-x-3 items-center hover:bg-slate-50 transition-colors"
        style={{ gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1.2fr 28px" }}
      >
        {/* Timestamp */}
        <span className="text-xs text-slate-500 font-mono truncate">{formatDate(log.timestamp)}</span>

        {/* Email */}
        <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 truncate">
          <FaUser className="shrink-0 text-slate-400 text-[10px]" />
          {log.userEmail}
        </span>

        {/* Action badge */}
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wide truncate ${getActionColor(log.action)}`}>
          {log.action}
        </span>

        {/* Result badge */}
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getResultBadge(log.result)}`}>
          {log.result}
        </span>

        {/* Resource ID */}
        <span className="text-xs text-slate-400 font-mono truncate">{log.resourceId ?? "—"}</span>

        {/* Chevron */}
        <span className="text-slate-400">
          {expanded ? <FaChevronUp className="h-3 w-3" /> : <FaChevronDown className="h-3 w-3" />}
        </span>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 space-y-2 text-xs">
          <div className="flex gap-6 flex-wrap">
            <div>
              <span className="text-slate-400 font-semibold uppercase tracking-widest text-[9px]">User ID</span>
              <p className="font-mono text-slate-700 mt-0.5">{log.userId ?? "—"}</p>
            </div>
            <div>
              <span className="text-slate-400 font-semibold uppercase tracking-widest text-[9px]">Détails</span>
              <p className="text-slate-700 mt-0.5 max-w-lg leading-relaxed">{log.details || "—"}</p>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-200 space-y-1">
            <div>
              <span className="text-slate-400 font-semibold uppercase tracking-widest text-[9px]">Previous Hash</span>
              <p className="font-mono text-[10px] text-slate-500 break-all mt-0.5">{log.previousHash}</p>
            </div>
            <div>
              <span className="text-slate-400 font-semibold uppercase tracking-widest text-[9px]">Current Hash</span>
              <p className="font-mono text-[10px] text-slate-500 break-all mt-0.5">{log.currentHash}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

function AuditLogs() {
  const [logs, setLogs]               = useState([])
  const [loading, setLoading]         = useState(true)
  const [verifying, setVerifying]     = useState(false)
  const [integrityResult, setIntegrityResult] = useState(null)
  const [expandedId, setExpandedId]   = useState(null)
  const [search, setSearch]           = useState("")
  const [filterResult, setFilterResult] = useState("ALL")

  // ── Fetch all logs ──
  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const data = await adminService.getAuditLogs()
      // API returns ApiResponse<List<AuditLog>> → data.data is the array
      setLogs(Array.isArray(data?.data) ? data.data : [])
    } catch (err) {
      toast.error("Impossible de charger les logs d'audit.")
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Verify chain integrity ──
  const verifyIntegrity = useCallback(async () => {
    setVerifying(true)
    try {
      const result = await adminService.verifyAuditIntegrity()
      setIntegrityResult(result)
      if (result?.data?.valid) {
        toast.success("Chaîne d'audit intègre ✓")
      } else {
        toast.error("⚠️ Alerte : la chaîne d'audit a été compromise !")
      }
    } catch (err) {
      toast.error("Erreur lors de la vérification d'intégrité.")
    } finally {
      setVerifying(false)
    }
  }, [])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  // ── Filtered view ──
  const filtered = logs.filter((l) => {
    const matchSearch =
      !search ||
      l.userEmail?.toLowerCase().includes(search.toLowerCase()) ||
      l.action?.toLowerCase().includes(search.toLowerCase()) ||
      l.resourceId?.toLowerCase().includes(search.toLowerCase())
    const matchResult =
      filterResult === "ALL" || l.result?.toUpperCase() === filterResult
    return matchSearch && matchResult
  })

  const clearFilters = () => { setSearch(""); setFilterResult("ALL") }
  const hasFilters = search || filterResult !== "ALL"

  if (loading) return <Spinner />

  return (
    <div className="w-full space-y-6 pb-12 animate-fade-in-up">

      {/* ── Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 -mt-8 -mr-8 text-white/5 pointer-events-none">
          <FaShieldAlt className="w-48 h-48" />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-3 rounded-full bg-white/10 text-xs font-medium border border-white/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-200">Sécurité — SHA-256 chaîné</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">
              Audit Trail
            </h2>
            <p className="mt-1 text-slate-400 text-sm">
              {logs.length} événement(s) enregistrés — lecture seule
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-sm font-semibold transition disabled:opacity-40"
            >
              <FaSync className={loading ? "animate-spin" : ""} /> Actualiser
            </button>
            <button
              onClick={verifyIntegrity}
              disabled={verifying}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-sm font-bold transition shadow-lg shadow-indigo-500/20 disabled:opacity-40"
            >
              <FaShieldAlt /> {verifying ? "Vérification…" : "Vérifier l'intégrité"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Integrity result banner ── */}
      <IntegrityBanner result={integrityResult} onVerify={verifyIntegrity} loading={verifying} />

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par email, action, ressource…"
            className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
        <div className="flex items-center gap-2">
          <FaFilter className="text-slate-400 text-xs shrink-0" />
          {["ALL", "SUCCESS", "FAILURE", "ERROR"].map((r) => (
            <button
              key={r}
              onClick={() => setFilterResult(r)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${
                filterResult === r
                  ? "bg-indigo-500 text-white border-indigo-500"
                  : "bg-white text-slate-500 border-slate-200 hover:border-indigo-300"
              }`}
            >
              {r === "ALL" ? "Tous" : r}
            </button>
          ))}
          {hasFilters && (
            <button onClick={clearFilters} className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 transition">
              <FaTimes className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* ── Column headers ── */}
      {filtered.length > 0 && (
        <div
          className="hidden sm:grid px-4 text-[9px] font-extrabold uppercase tracking-widest text-slate-400 gap-x-3"
          style={{ gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1.2fr 28px" }}
        >
          <span>Horodatage</span>
          <span>Utilisateur</span>
          <span>Action</span>
          <span>Résultat</span>
          <span>Ressource</span>
          <span />
        </div>
      )}

      {/* ── Log list ── */}
      {filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map((log) => (
            <LogRow
              key={log.id}
              log={log}
              expanded={expandedId === log.id}
              onToggle={() => setExpandedId(expandedId === log.id ? null : log.id)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50/50 py-24 px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-white shadow flex items-center justify-center mb-4">
            <FaShieldAlt className="w-6 h-6 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">Aucun log trouvé</h3>
          <p className="mt-2 text-slate-400 text-sm max-w-sm">
            {hasFilters
              ? "Aucun log ne correspond à vos filtres."
              : "Aucune action n'a encore été enregistrée dans l'audit trail."}
          </p>
          {hasFilters && (
            <button onClick={clearFilters} className="mt-4 text-indigo-500 hover:underline text-sm font-semibold">
              Effacer les filtres
            </button>
          )}
        </div>
      )}

      {/* ── Footer count ── */}
      {filtered.length > 0 && filtered.length !== logs.length && (
        <p className="text-center text-xs text-slate-400">
          Affichage de {filtered.length} sur {logs.length} log(s)
        </p>
      )}
    </div>
  )
}

export default AuditLogs
