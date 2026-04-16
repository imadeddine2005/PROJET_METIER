import { useState, useEffect } from "react"
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

  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        // Scrolling down past 50px
        setIsVisible(false)
        setOpen(false) // Close dropdown if open
      } else {
        // Scrolling up
        setIsVisible(true)
      }
      setLastScrollY(currentScrollY)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [lastScrollY])

  return (
    <header 
      className={`sticky top-0 z-50 glass border-b-0 transition-transform duration-300 ease-in-out ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="text-2xl font-display font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-800 cursor-pointer" onClick={() => navigate("/candidate")}>
          SmartRecruit.AI
        </div>

        <nav className="hidden items-center gap-2 md:flex">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-brand-600 text-white shadow-md shadow-brand-500/30"
                    : "text-surface-600 hover:bg-surface-100/80 hover:text-surface-900"
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
            className="inline-flex items-center gap-2 rounded-full border border-surface-200 bg-white/50 px-4 py-2.5 text-sm font-semibold text-surface-700 shadow-sm transition-all hover:bg-white hover:shadow-md hover:border-brand-200 active:scale-95"
          >
            <FaUserCircle className="h-6 w-6 text-brand-600" aria-hidden />
            <span className="max-w-[130px] truncate">{userName}</span>
            <FaChevronDown className="h-3 w-3 text-surface-500" aria-hidden />
          </button>

          {open ? (
            <div className="absolute right-0 z-20 mt-3 w-48 rounded-xl border border-surface-100 bg-white/95 backdrop-blur-md p-1.5 shadow-xl animate-slide-up">
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 hover:text-red-700"
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
