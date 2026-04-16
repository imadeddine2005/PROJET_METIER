import {
  FaBriefcase,
  FaFileAlt,
  FaPlusCircle,
  FaSignOutAlt,
  FaUserCircle,
} from "react-icons/fa"
import { NavLink, useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { logout, reset } from "../../features/auth/authSlice"

const menuItems = [
  { label: "Mes offres", to: "/hr/offers", icon: FaBriefcase },
  { label: "Créer une Offre", to: "/hr/create-offer", icon: FaPlusCircle },
  { label: "Demandes Accès", to: "/hr/access-requests", icon: FaFileAlt },
]

function HrSidebar({ isExpanded }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)
  const userName = user?.name || "RH"

  const handleLogout = () => {
    dispatch(logout())
    dispatch(reset())
    navigate("/login")
  }

  return (
    <aside className={`h-full w-full bg-gradient-to-b from-slate-800 to-brand-950 border-r border-white/5 shadow-2xl transition-all duration-300 relative overflow-hidden font-sans`}>
      {/* Dynamic Ambient Light Effect */}
      <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-brand-500/20 blur-[80px] pointer-events-none"></div>
      <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-indigo-500/10 blur-[80px] pointer-events-none"></div>

      <div className="flex h-full flex-col relative z-10">
        {/* Logo Section */}
        <div className="flex items-center px-4 py-8">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 via-brand-600 to-indigo-700 shadow-xl shadow-brand-500/20 border border-white/10 transition-transform duration-300 will-change-transform">
            <span className="text-2xl font-black text-white italic tracking-tighter">SR</span>
          </div>
          <div className={`ml-4 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden will-change-[max-width,opacity] ${isExpanded ? 'max-w-xs opacity-100' : 'max-w-0 opacity-0'}`}>
            <h2 className="whitespace-nowrap text-xl font-display font-bold text-white tracking-tight">
              Smart<span className="text-brand-400">Recruit</span>
            </h2>
            <p className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase">Espace Recruteur</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-2 pt-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center h-12 rounded-xl border transition-colors duration-300 group outline-none focus:ring-0 focus-visible:outline-none relative overflow-hidden ${
                  isActive
                    ? "text-white bg-white/10 border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                    : "text-slate-400 border-transparent hover:text-white hover:bg-white/5"
                }`
              }
            >
              {({ isActive }) => (
                <div className="flex items-center w-full h-full relative">
                  {/* Active highlight bar */}
                  {isActive && <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-brand-500 rounded-r-full"></div>}
                  
                  {/* Fixed Width Icon Container */}
                  <div className="flex h-full w-14 shrink-0 items-center justify-center pointer-events-none">
                    <item.icon className={`h-5 w-5 transition-all duration-300 will-change-transform ${isActive ? 'scale-110 text-brand-400' : 'group-hover:scale-110 group-hover:text-brand-400'}`} />
                  </div>
                  
                  {/* Label with smooth expansion */}
                  <div className={`transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden will-change-[max-width,opacity] ${isExpanded ? 'max-w-xs opacity-100 ml-1' : 'max-w-0 opacity-0 ml-0'}`}>
                    <span className="whitespace-nowrap font-bold text-sm">
                      {item.label}
                    </span>
                  </div>
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User & Logout Section */}
        <div className="p-4 border-t border-white/5 bg-black/20">
          <div className="mb-4 flex items-center h-12 px-1 overflow-hidden">
            <div className="relative w-12 shrink-0 flex justify-center pointer-events-none">
              <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 border border-white/10 shadow-inner">
                <FaUserCircle className="h-7 w-7" />
              </div>
              <div className="absolute bottom-0 right-1 h-3 w-3 rounded-full border-2 border-slate-900 bg-emerald-500 shadow-sm"></div>
            </div>
            <div className={`ml-3 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden will-change-[max-width,opacity] ${isExpanded ? 'max-w-xs opacity-100' : 'max-w-0 opacity-0'}`}>
              <p className="whitespace-nowrap text-sm font-extrabold text-white">{userName}</p>
              <div className="flex items-center gap-1.5 focus:outline-none">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <p className="whitespace-nowrap text-[10px] text-slate-500 font-bold uppercase tracking-wider">En Ligne</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className={`flex items-center h-12 w-full rounded-xl border transition-colors duration-200 outline-none focus:ring-0 focus-visible:outline-none group
              ${isExpanded ? 'bg-white/5 border-white/5 text-slate-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20' : 'text-slate-500 border-transparent hover:text-red-500'}`}
            title="Déconnexion"
          >
            <div className="flex h-full w-14 shrink-0 items-center justify-center pointer-events-none">
              <FaSignOutAlt className="h-5 w-5 transition-transform duration-300 will-change-transform group-hover:scale-110" />
            </div>
            <div className={`transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden will-change-[max-width,opacity] ${isExpanded ? 'max-w-xs opacity-100 ml-0' : 'max-w-0 opacity-0 ml-0'}`}>
              <span className="whitespace-nowrap font-bold text-sm">
                Déconnexion
              </span>
            </div>
          </button>
        </div>
      </div>
    </aside>
  )
}

export default HrSidebar
