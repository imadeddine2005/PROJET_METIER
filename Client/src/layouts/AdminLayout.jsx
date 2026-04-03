import { Outlet } from "react-router-dom"
import { useSelector } from "react-redux"

function AdminLayout() {
  const { user } = useSelector((state) => state.auth)
  const name = user?.name || "User"

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900">Hello {name}</h1>
      <p className="mt-1 text-slate-600">Admin space</p>
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <Outlet />
      </div>
    </div>
  )
}

export default AdminLayout
