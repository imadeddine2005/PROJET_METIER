import { useState } from "react"
import { FaChevronDown, FaSignOutAlt, FaUserCircle } from "react-icons/fa"
import { useDispatch, useSelector } from "react-redux"
import { NavLink, useNavigate } from "react-router-dom"
import { logout, reset } from "../../features/auth/authSlice"


const items = [
  { label: "Offres d'emploi", to: "/candidate/offers" },
  { label: "Mes Candidatures", to: "/candidate/applications" },
  { label: "Mon Metier", to: "/candidate/my-job" },
]

function CandidateHeader() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)
  const [open, setOpen] = useState(false)
  const userName = user?.name || "Candidat"

  const handleLogout = () => {
    dispatch(logout())
    dispatch(reset())
    navigate("/login")
  }

  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="text-lg font-bold tracking-tight text-slate-900">
          SmartRecruit
        </div>

        <nav className="hidden items-center gap-2 md:flex">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <FaUserCircle className="h-5 w-5 text-indigo-600" aria-hidden />
            <span className="max-w-[130px] truncate">{userName}</span>
            <FaChevronDown className="h-3 w-3 text-slate-500" aria-hidden />
          </button>

          {open ? (
            <div className="absolute right-0 z-20 mt-2 w-44 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100"
              >
                <FaSignOutAlt className="h-4 w-4" aria-hidden />
                Logout
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}

export default CandidateHeader
