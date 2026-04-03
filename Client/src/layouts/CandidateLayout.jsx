import { Outlet } from "react-router-dom"
import { useSelector } from "react-redux"
import CandidateHeader from "../EspaceCandidate/components/CandidateHeader"

function CandidateLayout() {
  const { user } = useSelector((state) => state.auth)
  const name = user?.name || "User"

  return (
    <div className="min-h-screen bg-slate-50">
      <CandidateHeader />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-slate-900">Hello {name}</h1>
        <p className="mt-1 text-slate-600">Candidate space</p>
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default CandidateLayout
