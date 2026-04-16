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
      toast.error("Veuillez sélectionner un fichier PDF valide.")
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type === "application/pdf") {
      setSelectedFile(file)
    } else {
      toast.error("Veuillez déposer un fichier PDF valide.")
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
        toast.success("Analyse terminée !")
      } else {
        toast.error(response.message || "L'IA n'a pas pu identifier de métier.")
      }
    } catch (error) {
      console.error("Prediction error:", error)
      toast.error("Une erreur est survenue lors de l'analyse.")
    } finally {
      setIsProcessing(false)
    }
  }

  const reset = () => {
    setSelectedFile(null)
    setPrediction(null)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-2 animate-fade-in pb-2">
      
      {/* Header Section — Seulment affiché avant l'analyse */}
      {!prediction && !isProcessing && (
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-100 text-brand-700 text-[10px] font-bold uppercase tracking-wider">
            <FaMagic className="h-3 w-3" />
            Orientation IA
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-surface-900 tracking-tight">
            Votre <span className="text-brand-600">Métier Idéal ?</span>
          </h1>
          <p className="text-surface-500 max-w-lg mx-auto text-sm leading-relaxed">
            Analyse prédictive de vos compétences en quelques secondes.
          </p>
        </div>
      )}

      {!prediction && !isProcessing && (
        <div className="max-w-2xl mx-auto transform transition hover:scale-[1.01]">
          {/* Upload Area */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className={`relative group h-40 border-2 border-dashed rounded-2xl transition-all duration-300 flex flex-col items-center justify-center p-4 bg-white shadow-lg shadow-surface-200/50 
              ${selectedFile ? 'border-brand-400 bg-brand-50/10' : 'border-surface-200 hover:border-brand-300 hover:bg-surface-50/50'}`}
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
              <div className={`p-3 rounded-xl mb-2 transition-all duration-500 
                ${selectedFile ? 'bg-brand-500 text-white scale-110' : 'bg-surface-100 text-surface-400 group-hover:scale-110 group-hover:bg-brand-50 group-hover:text-brand-500'}`}
              >
                <FaCloudUploadAlt className="h-6 w-6" />
              </div>

              <div className="text-center">
                <p className="text-sm font-bold text-surface-800">
                  {selectedFile ? selectedFile.name : "Déposez votre CV ici"}
                </p>
                <p className="text-[10px] text-surface-500 mt-0.5">
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
            <p className="text-xs text-surface-500 italic">Extraction des compétences et profilage...</p>
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
            <div className="rounded-2xl border border-surface-200 bg-white p-3 shadow-sm flex flex-col items-center justify-center text-center space-y-2">
              <p className="text-[9px] font-bold text-surface-400 uppercase tracking-widest">Confiance IA</p>
              <div className="relative flex items-center justify-center">
                 <svg className="h-20 w-20 transform -rotate-90">
                  <circle className="text-surface-100" strokeWidth="5" stroke="currentColor" fill="transparent" r="37" cx="40" cy="40" />
                  <circle className="text-brand-500" strokeWidth="5" strokeDasharray={232.5} strokeDashoffset={232.5 - (232.5 * prediction.confiance) / 100} strokeLinecap="round" stroke="currentColor" fill="transparent" r="37" cx="40" cy="40" />
                </svg>
                <span className="absolute text-lg font-black text-surface-800">{prediction.confiance}%</span>
              </div>
            </div>

            {/* Alternatives Card (Takes 1/4) */}
            <div className="rounded-2xl border border-surface-200 bg-white p-3 shadow-sm space-y-2 flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <FaChartBar className="h-3 w-3 text-brand-500" />
                <h4 className="text-[9px] font-bold text-surface-400 uppercase tracking-wider">Top Alternatives</h4>
              </div>
              <div className="space-y-2">
                {prediction.toutes_categories && Object.entries(prediction.toutes_categories)
                  .filter(([name]) => name !== prediction.metier_ideal)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 2)
                  .map(([name, score], idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="flex justify-between text-[10px]">
                      <span className="font-semibold text-surface-700 truncate pr-2">{name}</span>
                      <span className="text-surface-400 font-medium">{score}%</span>
                    </div>
                    <div className="h-1 w-full bg-surface-100 rounded-full overflow-hidden">
                      <div className="h-full bg-surface-400 rounded-full" style={{ width: `${score}%` }} />
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
              <p className="text-surface-700 leading-relaxed text-[13px] italic">
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
          <p className="text-[10px] text-surface-400 leading-tight">
            <strong>Confidentialité :</strong> Vos données sont traitées de manière éphémère et ne sont pas sauvegardées.
          </p>
        </div>
      )}

    </div>
  )
}

export default Myjob
