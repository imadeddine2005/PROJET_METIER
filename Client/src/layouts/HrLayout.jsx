import { Outlet } from "react-router-dom"
import HrSidebar from "../EspaceHr/components/HrSidebar"

function HrLayout() {
  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <div className="lg:shrink-0">
        <HrSidebar />
      </div>
      <div className="flex-1 p-4 sm:p-6">
        <div className="min-h-[calc(100vh-2rem)] rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:min-h-[calc(100vh-3rem)]">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default HrLayout
