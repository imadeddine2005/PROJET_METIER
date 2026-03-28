import { useState, useEffect } from "react"
import { FaUser } from "react-icons/fa"
import { register, reset } from "../features/auth/authSlice"
import { useSelector, useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import Spinner from "../components/Spinner"

const inputClass =
  "w-full rounded-lg border border-slate-200/90 bg-white px-4 py-2.5 text-base text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"

function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    password2: "",
  })

  const { name, email, password, password2 } = formData

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.auth
  )

  useEffect(() => {
    if (isError) {
      toast.error(message)
    }
    if (isSuccess) {
      toast.success("Registration successful! Please log in.")
      navigate("/login")
    }
    dispatch(reset())
  }, [user, isError, isSuccess, message, navigate, dispatch])

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }))
  }

  const onSubmit = (e) => {
    e.preventDefault()
    if (password !== password2) {
      toast.error("Passwords do not match")
    } else {
      const userData = {
        name,
        email,
        password,
      }
      dispatch(register(userData))
    }
  }

  if (isLoading) {
    return <Spinner />
  }

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-5rem)] max-w-lg flex-col justify-center px-5 py-5 sm:py-6">
      <section className="mb-5 text-center sm:mb-6">
        <h1 className="flex items-center justify-center gap-2.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          <FaUser className="h-6 w-6 text-indigo-600 sm:h-7 sm:w-7" aria-hidden />
          Register
        </h1>
        <p className="mt-2 text-sm text-slate-600 sm:text-base">
          Please create an account
        </p>
      </section>

      <div className="rounded-xl border border-slate-200/80 bg-white/80 p-6 shadow-sm ring-1 ring-slate-200/60 backdrop-blur-sm sm:p-7">
        <form onSubmit={onSubmit} className="space-y-3 sm:space-y-4">
          <input
            type="text"
            className={inputClass}
            id="name"
            name="name"
            value={name}
            placeholder="Enter your name"
            onChange={onChange}
            autoComplete="name"
          />
          <input
            type="email"
            className={inputClass}
            id="email"
            name="email"
            value={email}
            placeholder="Enter your email"
            onChange={onChange}
            autoComplete="email"
          />
          <input
            type="password"
            className={inputClass}
            id="password"
            name="password"
            value={password}
            placeholder="Enter password"
            onChange={onChange}
            autoComplete="new-password"
          />
          <input
            type="password"
            className={inputClass}
            id="password2"
            name="password2"
            value={password2}
            placeholder="Confirm password"
            onChange={onChange}
            autoComplete="new-password"
          />
          <button
            type="submit"
            className="mt-2 w-full rounded-lg bg-indigo-600 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  )
}

export default Register
