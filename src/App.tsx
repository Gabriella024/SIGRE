import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import { LoginPage } from './pages/LoginPage'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'

function App() {


  return (
    <>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <div>Dashboard (placeholder)</div>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </>
  )
}

export default App
