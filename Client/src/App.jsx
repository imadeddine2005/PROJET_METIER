import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom"
import Login from "./pages/Login"
import Register from "./pages/Register"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import ProtectedRoute from "./components/auth/ProtectedRoute"
import AdminLayout from "./layouts/AdminLayout"
import HrLayout from "./layouts/HrLayout"
import CandidateLayout from "./layouts/CandidateLayout"
import AdminDashboard from "./EspaceAdmin/pages/AdminDashboard"
import MesOffres from "./EspaceHr/pages/MesOffres"
import CreerOffre from "./EspaceHr/pages/CreerOffre"
import EditerOffre from "./EspaceHr/pages/EditerOffre"
import DemandesAcces from "./EspaceHr/pages/DemandesAcces"
import CanddatteJobeOffers from "./EspaceCandidate/pages/CanddatteJobeOffers"
import MesCandidatures from "./EspaceCandidate/pages/mes-candidatures"
import OffreCandidatures from "./EspaceHr/pages/OffreCandidatures"
import Myjob from "./EspaceCandidate/pages/Myjob"
import ApplyToOffer from "./EspaceCandidate/pages/ApplyToOffer"
import PublicLayout from "./layouts/PublicLayout"


function App() {
  return (
    <>
      <Router>
        <div className="min-h-screen">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route element={<PublicLayout />}>
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["ROLE_ADMIN"]} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["ROLE_HR", "ROLE_ADMIN"]} />}>
            <Route path="/hr" element={<HrLayout />}>
              <Route index element={<Navigate to="/hr/offers" replace />} />
              <Route path="offers" element={<MesOffres />} />
              <Route path="offers/:offreId/applicants" element={<OffreCandidatures />} />
              <Route path="create-offer" element={<CreerOffre />} />
              <Route path="edit-offer/:offreId" element={<EditerOffre />} />
              <Route path="access-requests" element={<DemandesAcces />} />
            </Route>
          </Route>

          <Route
            element={<ProtectedRoute allowedRoles={["ROLE_CANDIDAT", "ROLE_ADMIN"]} />}
          >
            <Route path="/candidate" element={<CandidateLayout />}>
              <Route index element={<Navigate to="/candidate/offers" replace />} />
              <Route path="offers" element={<CanddatteJobeOffers />} />
              <Route path="offers/:offreId/apply" element={<ApplyToOffer />} />
              <Route path="applications" element={<MesCandidatures />} />
              <Route path="my-job" element={<Myjob />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        </div>
      </Router>
      <ToastContainer />
    </>
  )
}

export default App
