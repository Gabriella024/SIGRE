import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'

import { ProtectedRoute } from './app/router/ProtectedRoute'
import { AuthProvider } from './features/auth/context/AuthContext'

import {ProjectsPage} from './pages/ProjectPage'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { DashboardLayout } from './layouts/DashboardLayout'
import { EntrepreneursPage } from './pages/EntrepreneurPage'
import { OrientationPage } from './pages/OrientationPage'
import { UsersPage } from './pages/UserPage'
import { PitchPage } from './pages/PitchPage'
import { EvaluatorPage } from './pages/EvaluatorsPage'
import { ChallengesPage } from './pages/ChallengesPage'
import { EvaluationsPage } from './pages/EvaluationsPage'
import InformesPage from './pages/ReportPage'
import ConfiguracionPage from './pages/SettingsPage'
import AccessControlPage from './pages/AccessControlPage'


import CargarAsistentesPage from './pages/CargarAsistentesPage'

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
            <Route path='/orientacion-masiva' element={<CargarAsistentesPage />}></Route>
            <Route path='/informes' element={<InformesPage />}></Route>
            <Route path='/configuracion' element={<ConfiguracionPage />}></Route>
            <Route path='/control-accesos' element={<AccessControlPage />}></Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App