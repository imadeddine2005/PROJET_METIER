import { Outlet } from "react-router-dom"
import Header from "../components/Header"

function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex flex-col">
        <Outlet />
      </div>
    </div>
  )
}

export default PublicLayout
