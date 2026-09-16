import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'

import { ProtectedRoute } from './routes/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'

import { ProjectsPage } from './pages/ProyectPage'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { DashboardLayout } from './layouts/DashboardLayaout'
import { EntrepreneurPage } from './pages/EntrepreneurPage'

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
            <Route path='/emprendedores' element={<EntrepreneurPage/>}></Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App