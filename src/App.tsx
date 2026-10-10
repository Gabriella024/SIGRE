import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";

import { ProtectedRoute } from "./app/router/ProtectedRoute";
import { AuthProvider } from "./features/auth/context/AuthContext";

import { ProjectsPage } from "./pages/ProjectPage";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { EntrepreneursPage } from "./pages/EntrepreneurPage";
import { OrientationPage } from "./pages/OrientationPage";
import { UsersPage } from "./pages/UserPage";
import { PitchPage } from "./pages/PitchPage";
import { EvaluatorPage } from "./pages/EvaluatorsPage";
import { ChallengesPage } from "./pages/ChallengesPage";
import { EvaluationsPage } from "./pages/EvaluationsPage";

import InformesPage from "./pages/ReportPage";
import ConfiguracionPage from "./pages/SettingsPage";
import AccessControlPage from "./pages/AccessControlPage";
import CargarAsistentesPage from "./pages/CargarAsistentesPage";

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
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute moduleCode="panel">
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/proyectos"
              element={
                <ProtectedRoute moduleCode="proyectos">
                  <ProjectsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/emprendedores"
              element={
                <ProtectedRoute moduleCode="emprendedores">
                  <EntrepreneursPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/orientaciones"
              element={
                <ProtectedRoute moduleCode="orientaciones">
                  <OrientationPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/usuarios"
              element={
                <ProtectedRoute moduleCode="usuarios">
                  <UsersPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/pitch"
              element={
                <ProtectedRoute moduleCode="pitch">
                  <PitchPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/evaluadores"
              element={
                <ProtectedRoute moduleCode="evaluadores">
                  <EvaluatorPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/retos"
              element={
                <ProtectedRoute moduleCode="retos">
                  <ChallengesPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/evaluaciones"
              element={
                <ProtectedRoute moduleCode="evaluaciones">
                  <EvaluationsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/orientacion-masiva"
              element={
                <ProtectedRoute moduleCode="orientacion_masiva">
                  <CargarAsistentesPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/informes"
              element={
                <ProtectedRoute moduleCode="informes">
                  <InformesPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/configuracion"
              element={
                <ProtectedRoute moduleCode="configuracion">
                  <ConfiguracionPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/control-accesos"
              element={
                <ProtectedRoute moduleCode="control_accesos">
                  <AccessControlPage />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route
            path="*"
            element={<Navigate to="/login" replace />}
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;