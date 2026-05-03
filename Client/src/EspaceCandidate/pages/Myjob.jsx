import { useState } from "react"
import { FaCloudUploadAlt, FaBrain, FaMagic, FaChartBar, FaExclamationTriangle, FaSyncAlt, FaBriefcase, FaAward, FaLightbulb, FaTimes } from "react-icons/fa"
import { toast } from "react-toastify"
import cvToolsService from "../../features/cv-tools/cvToolsService"

function Myjob() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [prediction, setPrediction] = useState(null)

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file && file.type === "application/pdf") {
      setSelectedFile(file)
    } else {
      toast.error("Veuillez sélectionner un fichier PDF valide.", { toastId: 'invalid-pdf' })
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type === "application/pdf") {
      setSelectedFile(file)
    } else {
      toast.error("Veuillez déposer un fichier PDF valide.", { toastId: 'invalid-pdff' })
    }
  }

  const handleDragOver = (e) => e.preventDefault()

  const handlePredict = async () => {
    if (!selectedFile) return
    
    setIsProcessing(true)
    setPrediction(null)
    
    try {
      const response = await cvToolsService.predictJob(selectedFile)
      if (response.success) {
        setPrediction(response.data)
        toast.success("Analyse terminée !", { toastId: 'analyse-succ' })
      } else {
        toast.error(response.message || "L'IA n'a pas pu identifier de métier.", { toastId: 'analyse-err' })
      }
    } catch (error) {
      console.error("Prediction error:", error)
      toast.error("Une erreur est survenue lors de l'analyse.", { toastId: 'analyse-server-err' })
    } finally {
      setIsProcessing(false)
    }
  }

  const reset = () => {
    setSelectedFile(null)
    setPrediction(null)
  }

  return (
    <div className="max-w-6xl mx-auto -mt-6 space-y-3 animate-fade-in pb-2">
      
      {/* Header Premium — Affiché avant l'analyse */}
      {!prediction && !isProcessing && (
        <div className="relative overflow-hidden rounded-2xl bg-slate-900 p-4 sm:p-5 text-white shadow-xl">
          {/* Decorative Gradients */}
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-brand-500/20 to-transparent pointer-events-none"></div>
          <div className="absolute top-0 right-0 -mt-6 -mr-6 text-white/5 pointer-events-none">
            <FaMagic className="w-32 h-32" />
          </div>
          
          <div className="relative z-10 text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-2 py-0.5 mb-2 rounded-full bg-white/10 text-[10px] font-bold backdrop-blur-md border border-white/20 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse"></span>
              <span className="text-slate-200">Orientation IA</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">
              Votre <span className="text-brand-400">Métier Idéal ?</span>
            </h1>
            <p className="mt-1 text-slate-300 text-sm font-medium">
              Analyse prédictive de vos compétences grâce à notre IA.
            </p>
          </div>
        </div>
      )}

      {!prediction && !isProcessing && (
        <div className="max-w-2xl mx-auto transform transition hover:scale-[1.01]">
          {/* Upload Area */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className={`relative group h-44 border-2 border-dashed rounded-3xl transition-all duration-300 flex flex-col items-center justify-center p-4 shadow-sm hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-1
              ${selectedFile ? 'border-brand-500 bg-brand-50/50' : 'border-slate-300 bg-white hover:border-brand-400 hover:bg-slate-50'}`}
          >
            <input
              type="file"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              accept=".pdf"
            />
            
            {/* Bouton de désélection (X) */}
            {selectedFile && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                }}
                className="absolute top-2 right-2 z-20 p-1.5 rounded-full bg-red-100 text-red-500 hover:bg-red-200 transition-colors shadow-sm"
                title="Supprimer le fichier"
              >
                <FaTimes className="h-3 w-3" />
              </button>
            )}
            
            <div className="flex flex-col items-center pointer-events-none">
              <div className={`p-4 rounded-full mb-3 transition-all duration-500 shadow-md
                ${selectedFile ? 'bg-brand-600 text-white scale-110' : 'bg-slate-100 text-slate-400 group-hover:scale-110 group-hover:bg-brand-50 group-hover:text-brand-600'}`}
              >
                <FaCloudUploadAlt className="h-8 w-8" />
              </div>

              <div className="text-center">
                <p className="text-base font-extrabold text-slate-900">
                  {selectedFile ? selectedFile.name : "Déposez votre CV ici"}
                </p>
                <p className="text-xs text-slate-500 font-bold mt-1">
                  {selectedFile ? "Prêt pour l'analyse" : "Format PDF uniquement"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 flex justify-center">
            <button
              onClick={handlePredict}
              disabled={!selectedFile}
              className={`group relative flex items-center gap-2 px-8 py-2.5 rounded-xl font-bold transition-all duration-300 
                ${selectedFile 
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-200 hover:bg-brand-500 hover:-translate-y-0.5 active:scale-95' 
                  : 'bg-surface-200 text-surface-400 cursor-not-allowed'}`}
            >
              <FaBrain className={`h-4 w-4 ${selectedFile ? 'animate-pulse' : ''}`} />
              Lancer l'Analyse
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isProcessing && (
        <div className="max-w-xl mx-auto py-12 text-center space-y-4">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-brand-200 blur-2xl rounded-full opacity-20 animate-pulse" />
            <div className="relative h-20 w-20 bg-white rounded-2xl shadow-lg border border-brand-100 flex items-center justify-center text-brand-600 animate-float">
              <FaBrain className="h-10 w-10 animate-pulse" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-surface-800">Analyse IA en cours...</h3>
            <p className="text-xs text-surface-600 font-medium italic">Extraction des compétences et profilage...</p>
          </div>
          <div className="max-w-xs mx-auto h-1.5 bg-surface-100 rounded-full overflow-hidden">
            <div className="h-full bg-brand-500 animate-shimmer" style={{ width: '100%' }} />
          </div>
        </div>
      )}

      {/* Result View */}
      {prediction && (
        <div className="space-y-4 animate-slide-up">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            
            {/* Ideal Job Hero Card (Takes 2/4 on large screens) */}
            <div className="lg:col-span-2 relative overflow-hidden rounded-2xl border border-white bg-gradient-to-br from-brand-600 to-indigo-700 p-5 text-white shadow-xl shadow-brand-900/20">
              <div className="absolute top-0 right-0 p-4 opacity-10 grayscale brightness-200">
                <FaBriefcase size={60} />
              </div>
              
              <div className="relative z-10 space-y-1.5">
                <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-md text-[9px] font-bold uppercase tracking-widest">
                  <FaAward className="h-3 w-3" />
                  Match Idéal
                </div>
                <h2 className="text-2xl md:text-3xl font-display font-extrabold tracking-tight">
                  {prediction.metier_ideal}
                </h2>
                <div className="flex items-center gap-3 pt-1">
                  <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                    <span className="text-lg font-black">{prediction.confiance}%</span>
                  </div>
                  <p className="text-[10px] font-medium text-brand-50 leading-tight">
                    Optimisé pour votre <br/>profil technique.
                  </p>
                </div>
              </div>
            </div>

            {/* Confidence Card (Takes 1/4) */}
            <div className="relative rounded-3xl border-2 border-brand-300 hover:border-brand-500 transition-colors bg-white p-4 shadow-sm flex flex-col items-center justify-center text-center space-y-2 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-brand-600 z-20"></div>
              <p className="text-xs font-extrabold text-slate-600 uppercase tracking-widest mt-2">Confiance IA</p>
              <div className="relative flex items-center justify-center">
                 <svg className="h-24 w-24 transform -rotate-90">
                  <circle className="text-slate-100" strokeWidth="6" stroke="currentColor" fill="transparent" r="45" cx="48" cy="48" />
                  <circle className="text-brand-500 drop-shadow-md" strokeWidth="6" strokeDasharray={282.7} strokeDashoffset={282.7 - (282.7 * prediction.confiance) / 100} strokeLinecap="round" stroke="currentColor" fill="transparent" r="45" cx="48" cy="48" />
                </svg>
                <span className="absolute text-2xl font-black text-slate-900">{prediction.confiance}%</span>
              </div>
            </div>

            {/* Alternatives Card (Takes 1/4) */}
            <div className="relative rounded-3xl border-2 border-brand-300 hover:border-brand-500 transition-colors bg-white p-5 shadow-sm space-y-3 flex flex-col justify-center overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-brand-600 z-20"></div>
              <div className="flex items-center gap-2 mt-1">
                <FaChartBar className="h-4 w-4 text-brand-500" />
                <h4 className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">Top Alternatives</h4>
              </div>
              <div className="space-y-3">
                {prediction.toutes_categories && Object.entries(prediction.toutes_categories)
                  .filter(([name]) => name !== prediction.metier_ideal)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 2)
                  .map(([name, score], idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-extrabold text-slate-900 truncate pr-2">{name}</span>
                      <span className="text-slate-600 font-bold">{score}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-400 rounded-full shadow-sm" style={{ width: `${score}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Explanation Section (Takes 3/4) */}
            <div className="lg:col-span-3 rounded-2xl border border-brand-100 bg-brand-50/30 p-5 space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
                  <FaLightbulb className="h-3.5 w-3.5" />
                </div>
                <h3 className="text-sm font-bold text-surface-900">Analyse de l'IA</h3>
              </div>
              <p className="text-surface-800 font-medium leading-relaxed text-[13px] italic">
                "{prediction.explication}"
              </p>
            </div>

            {/* Bottom Action (Takes 1/4) */}
            <div className="flex flex-col gap-2 justify-center">
              <button
                onClick={() => window.open('/candidate/offers')}
                className="w-full h-10 flex items-center justify-center gap-2 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-500 shadow-md shadow-brand-100 transition active:scale-95"
              >
                Trouver des Offres
              </button>
              <button
                onClick={reset}
                className="w-full h-10 flex items-center justify-center gap-2 rounded-xl border border-surface-200 text-surface-600 text-xs font-bold hover:bg-surface-50 transition active:scale-95"
              >
                Retenter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trust Notice */}
      {!isProcessing && (
        <div className="max-w-md mx-auto flex items-center gap-2 p-2 rounded-xl border border-surface-100 bg-surface-50/50">
          <FaExclamationTriangle className="h-3 w-3 text-surface-400 shrink-0" />
          <p className="text-[10px] text-surface-600 font-medium leading-tight">
            <strong>Confidentialité :</strong> Vos données sont traitées de manière éphémère et ne sont pas sauvegardées.
          </p>
        </div>
      )}

    </div>
  )
}

export default Myjob
