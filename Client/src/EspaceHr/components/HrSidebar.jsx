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
  { label: "Creer une Offre", to: "/hr/create-offer", icon: FaPlusCircle },
  { label: "Demandes Acces", to: "/hr/access-requests", icon: FaFileAlt },
]

function HrSidebar() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)
  const userName = user?.name || "HR"

  const handleLogout = () => {
    dispatch(logout())
    dispatch(reset())
    navigate("/login")
  }

  return (
    <aside className="group w-full rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 lg:h-screen lg:w-20 lg:overflow-hidden lg:rounded-none lg:border-y-0 lg:border-l-0 lg:hover:w-72">
      <div className="flex h-full flex-col">
        <div className="border-b border-slate-200 px-4 py-4 lg:px-5">
          <h2 className="flex items-center justify-center text-lg font-bold text-slate-900 lg:justify-start">
            <span className="hidden text-indigo-600 lg:inline lg:group-hover:hidden">SR</span>
            <span className="ml-0 overflow-hidden whitespace-nowrap opacity-100 transition-all duration-300 lg:ml-0 lg:max-w-0 lg:opacity-0 lg:group-hover:ml-2 lg:group-hover:max-w-[180px] lg:group-hover:opacity-100">
              SmartRecruit
            </span>
          </h2>
          <p className="mt-1 hidden text-xs font-semibold tracking-wider text-indigo-600 lg:block lg:opacity-0 lg:transition-opacity lg:duration-200 lg:group-hover:opacity-100">
            HR
          </p>
        </div>

        <nav className="flex flex-1 items-center px-3 py-3">
          <ul className="w-full space-y-4">
            {menuItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center justify-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition lg:justify-center lg:group-hover:justify-start ${
                      isActive
                        ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200"
                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                    }`
                  }
                >
                  <item.icon className="h-5 w-5 shrink-0" aria-hidden />
                  <span className="overflow-hidden whitespace-nowrap opacity-100 transition-all duration-300 lg:max-w-0 lg:opacity-0 lg:group-hover:ml-1 lg:group-hover:max-w-[180px] lg:group-hover:opacity-100">
                    {item.label}
                  </span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mx-3 mb-3 mt-auto border-t border-slate-200 pt-3">
          <div className="mb-3 flex items-center justify-center gap-2 px-2 text-slate-700 lg:justify-center lg:group-hover:justify-start">
            <FaUserCircle className="h-5 w-5 text-indigo-600" aria-hidden />
            <span className="overflow-hidden whitespace-nowrap text-sm font-medium opacity-100 transition-all duration-300 lg:max-w-0 lg:opacity-0 lg:group-hover:ml-1 lg:group-hover:max-w-[140px] lg:group-hover:opacity-100">
              {userName}
            </span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 lg:justify-center lg:group-hover:justify-center"
          >
            <FaSignOutAlt className="h-4 w-4" aria-hidden />
            <span className="overflow-hidden whitespace-nowrap opacity-100 transition-all duration-300 lg:max-w-0 lg:opacity-0 lg:group-hover:max-w-[120px] lg:group-hover:opacity-100">
              Deconnexion
            </span>
          </button>
        </div>
      </div>
    </aside>
  )
}

export default HrSidebar
