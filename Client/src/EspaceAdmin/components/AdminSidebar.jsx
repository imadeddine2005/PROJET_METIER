import { FaShieldAlt, FaTasks, FaSignOutAlt, FaHistory } from "react-icons/fa"
import { NavLink, useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { logout, reset } from "../../features/auth/authSlice"

const menuItems = [
  { label: "Gestion des Accès", to: "/admin", icon: FaTasks },
  { label: "Historique", to: "/admin/history", icon: FaHistory },
]

function AdminSidebar({ isExpanded }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)

  const handleLogout = () => {
    dispatch(logout())
    dispatch(reset())
    navigate("/login")
  }

  return (
    <aside className={`h-full w-full bg-slate-900 border-r border-slate-800 shadow-2xl transition-all duration-300 relative overflow-hidden font-sans flex flex-col`}>
      {/* Decorative Gradients */}
      <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-indigo-500/20 to-transparent pointer-events-none"></div>
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-[80px] pointer-events-none"></div>

      {/* Logo Section */}
      <div className="flex items-center px-5 py-8 relative z-10 shrink-0">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-xl shadow-indigo-500/20 border border-white/10 overflow-hidden relative group">
          <FaShieldAlt className="text-white text-xl group-hover:scale-110 transition-transform" />
        </div>
        <div className={`ml-4 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden will-change-[max-width,opacity] ${isExpanded ? 'max-w-xs opacity-100' : 'max-w-0 opacity-0'}`}>
          <h2 className="whitespace-nowrap text-xl font-display font-bold text-white tracking-tight">
            Smart<span className="text-indigo-400">Recruit</span>
          </h2>
          <p className="text-[10px] font-bold tracking-widest text-indigo-300 uppercase">Espace System</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2 relative z-10 overflow-y-auto overflow-x-hidden pb-4 custom-scrollbar">
        {menuItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/admin'}
            className={({ isActive }) =>
              `flex items-center h-12 rounded-xl transition-all duration-300 group outline-none relative overflow-hidden ${
                isActive
                  ? "text-white bg-indigo-500/15 border border-indigo-500/30"
                  : "text-slate-400 border border-transparent hover:text-white hover:bg-white/5"
              }`
            }
            title={!isExpanded ? item.label : undefined}
          >
            {({ isActive }) => (
              <>
                <div className={`absolute left-0 top-0 bottom-0 w-1 bg-indigo-400 transition-transform duration-300 origin-left ${isActive ? 'scale-x-100' : 'scale-x-0'}`}></div>
                <div className="w-12 h-full flex items-center justify-center shrink-0">
                  <item.icon className={`h-5 w-5 transition-colors duration-300 ${isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-indigo-300'}`} />
                </div>
                <span className={`font-semibold text-sm whitespace-nowrap transition-all duration-300 ${isExpanded ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'}`}>
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Admin Profile & Logout */}
      <div className="p-4 relative z-10 shrink-0">
        <div className={`rounded-2xl transition-all duration-300 ${isExpanded ? 'bg-slate-800/50 p-3 border border-slate-700/50' : 'bg-transparent p-0 border-transparent'}`}>
          <div className="flex items-center">
            <div className={`h-10 w-10 shrink-0 rounded-xl bg-slate-700 flex items-center justify-center font-bold text-white border border-slate-600 transition-all ${isExpanded ? '' : 'mx-auto'}`}>
              AD
            </div>
            <div className={`ml-3 overflow-hidden transition-all duration-300 ${isExpanded ? 'max-w-[150px] opacity-100' : 'max-w-0 opacity-0'}`}>
              <p className="truncate text-sm font-bold text-white">Administrateur</p>
              <p className="truncate text-[10px] text-slate-400 font-medium">{user?.email}</p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className={`flex items-center text-red-400 hover:text-red-300 transition-all duration-300 rounded-xl hover:bg-red-500/10 ${
              isExpanded ? 'w-full h-10 mt-3 px-3 relative' : 'w-10 h-10 mt-2 mx-auto justify-center'
            }`}
            title="Se déconnecter"
          >
            <FaSignOutAlt className="h-4 w-4 shrink-0" />
            <span className={`ml-3 text-sm font-semibold whitespace-nowrap transition-all duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0 ml-0'}`}>
              Déconnexion
            </span>
          </button>
        </div>
      </div>
    </aside>
  )
}

export default AdminSidebar
