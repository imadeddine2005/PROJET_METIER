import { Link, NavLink, useNavigate } from "react-router-dom"
import { FaSignInAlt, FaSignOutAlt, FaUser } from "react-icons/fa"
import { useSelector, useDispatch } from "react-redux"
import { logout, reset } from "../features/auth/authSlice"

function authTabClass({ isActive }) {
  return [
    "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200",
    isActive
      ? "bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200/90"
      : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900",
  ].join(" ")
}

function Header() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)

  const handleLogout = () => {
    dispatch(logout())
    dispatch(reset())
    navigate("/login")
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link
          to="/"
          className="text-lg font-bold tracking-tight text-slate-900 transition hover:text-indigo-600 sm:text-xl"
        >
          SmartRecruite
        </Link>

        <nav aria-label="Main">
          <ul className="flex items-center gap-1 sm:gap-2">
            {user ? (
              <li>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  <FaSignOutAlt className="h-4 w-4 shrink-0" aria-hidden />
                  Logout
                </button>
              </li>
            ) : (
              <li>
                <div
                  className="flex items-center gap-0.5 rounded-lg bg-slate-100/95 p-1 ring-1 ring-slate-200/70"
                  aria-label="Login or register"
                >
                  <NavLink to="/login" end className={authTabClass}>
                    <FaSignInAlt className="h-4 w-4 shrink-0" aria-hidden />
                    Login
                  </NavLink>
                  <NavLink to="/register" className={authTabClass}>
                    <FaUser className="h-4 w-4 shrink-0" aria-hidden />
                    Register
                  </NavLink>
                </div>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  )
}

export default Header
