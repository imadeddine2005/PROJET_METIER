import { Outlet } from "react-router-dom"
import { useSelector } from "react-redux"
import CandidateHeader from "../EspaceCandidate/components/CandidateHeader"

function CandidateLayout() {
  const { user } = useSelector((state) => state.auth)
  const name = user?.name || "User"

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 to-brand-50/40 font-sans text-surface-800 overflow-x-hidden">
      <CandidateHeader />
      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 animate-fade-in">
        {/* Main Content Pane */}
        <div className="relative min-h-[60vh] rounded-2xl border border-white/50 bg-white/70 backdrop-blur-sm p-6 shadow-xl shadow-brand-900/5 sm:p-8 overflow-hidden">
          {/* Subtle gradient glowing orbs - contained within the panel */}
          <div className="absolute top-0 right-0 -z-10 w-72 h-72 bg-brand-300 rounded-full mix-blend-multiply filter blur-[80px] opacity-20 animate-blob"></div>
          <div className="absolute bottom-0 left-0 -z-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-[80px] opacity-20 animate-blob animation-delay-2000"></div>
          
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default CandidateLayout
