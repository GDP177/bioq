import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Layout
import Layout from "@/components/layout/Layout";

// Pages
import Dashboard from "@/pages/dashboard/Dashboard";
import Pacientes from "@/pages/pacientes/Paciente";
import NuevoPaciente from "@/pages/pacientes/NuevoPaciente";
import Ordenes from "@/pages/ordenes/Ordenes";
import NuevaOrden from "@/pages/ordenes/NuevaOrden";
import Analisis from "@/pages/analisis/Analisis";
import Resultados from "@/pages/resultados/Resultados";
import Login from "@/pages/login/Login";
import RegisterForm from "@/pages/login/RegisterForm";
import NotFound from "@/pages/error/NotFound";

// Ruta protegida
import ProtectedRoute from "./components/auth/ProtectedRoute";

function App() {
  return (
    <Router>
      <div className="App">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#363636",
              color: "#fff",
            },
            success: {
              style: {
                background: "#10B981",
              },
            },
            error: {
              style: {
                background: "#EF4444",
              },
            },
          }}
        />

        <Routes>
          {/* Página de login */}
          <Route path="/login" element={<Login />} />

          {/* Página de registro */}
          <Route path="/register" element={<RegisterForm />} />

          {/* Rutas protegidas */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />

            <Route path="pacientes">
              <Route index element={<Pacientes />} />
              <Route path="nuevo" element={<NuevoPaciente />} />
              <Route path=":id/editar" element={<NuevoPaciente />} />
            </Route>

            <Route path="ordenes">
              <Route index element={<Ordenes />} />
              <Route path="nueva" element={<NuevaOrden />} />
              <Route path=":id/editar" element={<NuevaOrden />} />
            </Route>

            <Route path="analisis" element={<Analisis />} />

            <Route path="resultados">
              <Route index element={<Resultados />} />
              <Route path=":id" element={<Resultados />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
