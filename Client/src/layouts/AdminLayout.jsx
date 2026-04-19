import { useState } from "react"
import { Outlet } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import AdminSidebar from "../EspaceAdmin/components/AdminSidebar"
import ActionAdminModal from "../EspaceAdmin/components/ActionAdminModal"
import CandidatureDetailsModal from "../EspaceAdmin/components/CandidatureDetailsModal"
import { closeAdminModal, approveRequest, rejectRequest } from "../features/admin/adminSlice"

function AdminLayout() {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false)
  const dispatch = useDispatch()
  const modalData = useSelector((state) => state.admin.modal)

  const handleModalConfirm = (demandeId, actionType, note) => {
    if (actionType === 'APPROVER') {
      dispatch(approveRequest({ demandeId, decisionNote: note }))
    } else {
      dispatch(rejectRequest({ demandeId, decisionNote: note }))
    }
    dispatch(closeAdminModal())
  }

  return (
    <div className="flex min-h-screen bg-slate-900 text-slate-200 font-sans transition-colors duration-500 overflow-x-hidden">
      {/* Sidebar Wrapper */}
      <div 
        onMouseEnter={() => setIsSidebarExpanded(true)}
        onMouseLeave={() => setIsSidebarExpanded(false)}
        className={`fixed inset-y-0 left-0 z-50 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] will-change-[width]
          ${isSidebarExpanded ? 'w-72' : 'w-20'} hidden lg:block`}
      >
        <AdminSidebar isExpanded={isSidebarExpanded} />
      </div>

      {/* Mobile Sidebar (Fixed/Overlay) */}
      <div className="lg:hidden">
        <AdminSidebar isExpanded={true} />
      </div>

      {/* Main Content Area */}
      <main 
        className={`flex-1 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] will-change-[margin-left]
          ${isSidebarExpanded ? 'lg:ml-72' : 'lg:ml-20'} min-w-0 bg-slate-50`}
      >
        <div className="p-4 sm:p-6 lg:p-8 animate-fade-in relative min-h-screen">
          {/* Decorative elements for Premium look */}
          <div className="absolute top-0 right-0 -z-10 w-[500px] h-[500px] bg-indigo-200/40 rounded-full mix-blend-multiply filter blur-[120px] animate-blob"></div>
          <div className="absolute bottom-10 left-10 -z-10 w-[300px] h-[300px] bg-purple-200/30 rounded-full mix-blend-multiply filter blur-[100px] animate-blob animation-delay-2000"></div>

          <div className="min-h-[calc(100vh-4rem)] rounded-[2.5rem] border border-white/50 bg-white/70 backdrop-blur-2xl p-6 shadow-2xl shadow-indigo-900/10 lg:p-10 relative overflow-hidden">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Global Admin Modal */}
      {modalData?.isOpen && (
        <ActionAdminModal 
          isOpen={modalData.isOpen}
          onClose={() => dispatch(closeAdminModal())}
          onConfirm={handleModalConfirm}
          demandeId={modalData.demandeId}
          actionType={modalData.actionType}
          candidatRef={modalData.candidatRef}
        />
      )}

      {/* Details Modal */}
      <CandidatureDetailsModal />
    </div>
  )
}

export default AdminLayout
