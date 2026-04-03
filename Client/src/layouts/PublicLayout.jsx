import { Outlet } from "react-router-dom"
import Header from "../components/Header"

function PublicLayout() {
  return (
    <div className="min-h-screen">
      <Header />
      <Outlet />
    </div>
  )
}

export default PublicLayout
