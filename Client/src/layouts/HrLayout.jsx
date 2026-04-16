import { useState } from "react"
import { Outlet } from "react-router-dom"
import HrSidebar from "../EspaceHr/components/HrSidebar"

function HrLayout() {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false)

  return (
    <div className="flex min-h-screen bg-slate-50/50 text-surface-800 font-sans transition-colors duration-500 overflow-x-hidden">
      {/* Sidebar Wrapper */}
      <div 
        onMouseEnter={() => setIsSidebarExpanded(true)}
        onMouseLeave={() => setIsSidebarExpanded(false)}
        className={`fixed inset-y-0 left-0 z-50 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] will-change-[width]
          ${isSidebarExpanded ? 'w-72' : 'w-20'} hidden lg:block`}
      >
        <HrSidebar isExpanded={isSidebarExpanded} />
      </div>

      {/* Mobile Sidebar (Fixed/Overlay) */}
      <div className="lg:hidden">
        <HrSidebar isExpanded={true} />
      </div>

      {/* Main Content Area */}
      <main 
        className={`flex-1 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] will-change-[margin-left]
          ${isSidebarExpanded ? 'lg:ml-72' : 'lg:ml-20'} min-w-0`}
      >
        <div className="p-4 sm:p-6 lg:p-8 animate-fade-in relative min-h-screen">
          {/* Decorative elements for Premium look */}
          <div className="absolute top-0 right-0 -z-10 w-[500px] h-[500px] bg-brand-100/30 rounded-full mix-blend-multiply filter blur-[120px] animate-blob"></div>
          <div className="absolute bottom-10 left-10 -z-10 w-[300px] h-[300px] bg-blue-100/20 rounded-full mix-blend-multiply filter blur-[100px] animate-blob animation-delay-2000"></div>

          <div className="min-h-[calc(100vh-4rem)] rounded-[2.5rem] border border-white bg-white/40 backdrop-blur-xl p-6 shadow-2xl shadow-slate-200/50 lg:p-10 relative overflow-hidden">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}

export default HrLayout
