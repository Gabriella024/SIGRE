import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";

import { ProtectedRoute } from "./app/router/ProtectedRoute";
import { HomeRedirect } from "./app/router/HomeRedirect";
import { SCREEN_CODES } from "./features/access-control/constants/screens";
import { AuthProvider } from "./features/auth/context/AuthContext";

import { ProjectsPage } from "./pages/ProjectPage";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { EntrepreneursPage } from "./pages/EntrepreneurPage";
import { EntrepreneurDetailPage } from "./pages/EntrepreneurDetailPage";
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
import InvitacionRutaPage from "./pages/InvitacionRutaPage";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/invitacion/:token" element={<InvitacionRutaPage />} />
          <Route path="/" element={<HomeRedirect />} />

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
                <ProtectedRoute
                  moduleCode="panel"
                  screenCode={SCREEN_CODES.panel}
                >
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/proyectos"
              element={
                <ProtectedRoute
                  moduleCode="proyectos"
                  screenCode={SCREEN_CODES.proyectos}
                >
                  <ProjectsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/emprendedores"
              element={
                <ProtectedRoute
                  moduleCode="emprendedores"
                  screenCode={SCREEN_CODES.emprendedores}
                >
                  <EntrepreneursPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/emprendedores/:id"
              element={
                <ProtectedRoute
                  moduleCode="emprendedores"
                  screenCode={SCREEN_CODES.emprendedores}
                >
                  <EntrepreneurDetailPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/orientaciones"
              element={
                <ProtectedRoute
                  moduleCode="orientaciones"
                  screenCode={SCREEN_CODES.orientaciones}
                >
                  <OrientationPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/usuarios"
              element={
                <ProtectedRoute
                  moduleCode="usuarios"
                  screenCode={SCREEN_CODES.usuarios}
                >
                  <UsersPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/pitch"
              element={
                <ProtectedRoute
                  moduleCode="pitch"
                  screenCode={SCREEN_CODES.pitch}
                >
                  <PitchPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/evaluadores"
              element={
                <ProtectedRoute
                  moduleCode="evaluadores"
                  screenCode={SCREEN_CODES.evaluadores}
                >
                  <EvaluatorPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/retos"
              element={
                <ProtectedRoute
                  moduleCode="retos"
                  screenCode={SCREEN_CODES.retos}
                >
                  <ChallengesPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/evaluaciones"
              element={
                <ProtectedRoute
                  moduleCode="evaluaciones"
                  screenCode={SCREEN_CODES.evaluaciones}
                >
                  <EvaluationsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/orientacion-masiva"
              element={
                <ProtectedRoute
                  moduleCode="orientacion_masiva"
                  screenCode={SCREEN_CODES.orientacion_masiva}
                >
                  <CargarAsistentesPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/informes"
              element={
                <ProtectedRoute
                  moduleCode="informes"
                  screenCode={SCREEN_CODES.informes}
                >
                  <InformesPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/configuracion"
              element={
                <ProtectedRoute
                  moduleCode="configuracion"
                  screenCode={SCREEN_CODES.configuracion}
                >
                  <ConfiguracionPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/control-accesos"
              element={
                <ProtectedRoute
                  moduleCode="control_accesos"
                  screenCode={SCREEN_CODES.control_accesos}
                >
                  <AccessControlPage />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;