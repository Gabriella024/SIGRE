import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'

import { ProtectedRoute } from './routes/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'

import {ProjectsPage} from './pages/ProyectPage'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { DashboardLayout } from './layouts/DashboardLayaout'
import { EntrepreneursPage } from './pages/EntrepreneurPage'
import { OrientationPage } from './pages/OrientationPage'
import { UsersPage } from './pages/User'
import { PitchPage } from './pages/PitchPage'
import { EvaluatorPage } from './pages/EvaluatorsPage'
import { ChallengesPage } from './pages/ChallengesPage'
import { EvaluationsPage } from './pages/EvaluationsPage'
// import {CalendarPage} from './pages/CalendarPage'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/proyectos" element={<ProjectsPage />} />
            <Route path='/emprendedores' element={<EntrepreneursPage />}></Route>
            <Route path='/orientaciones' element={<OrientationPage />}></Route>
            <Route path='/usuarios' element={<UsersPage />}></Route>
            <Route path='/pitch' element={<PitchPage />}></Route>
            <Route path='/evaluadores' element={<EvaluatorPage />}></Route>
            <Route path='/retos' element={<ChallengesPage />}></Route>
            <Route path='/evaluaciones' element={<EvaluationsPage />}></Route>
            {/* <Route path='/calendario' element={<CalendarPage />}></Route> */}
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App