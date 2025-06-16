// src/App.tsx - CON RUTAS ACTUALIZADAS PARA PACIENTES Y DASHBOARDS CORREGIDOS

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/login/Login'
import MedicoDashboard from './pages/dashboard/MedicoDashboard'
import BioquimicoDashboard from './pages/dashboard/BioquimicoDashboard'
import OrdenesLista from './pages/medico/OrdenesLista'
import OrdenDetalle from './pages/medico/OrdenDetalle'
import NuevaSolicitud from './pages/medico/NuevaSolicitud'
import GestionPacientes from './pages/medico/GestionPacientes'
import GestionAnalisis from './pages/medico/GestionAnalisis'
import RegisterForm from './pages/login/RegisterForm'
import CompletarPerfilMedico from './pages/medico/CompletarPerfilMedico';
import CompletarPerfilBioquimico from './pages/bioquimico/CompletarPerfilBioquimico';

// Páginas de pacientes
import NuevoPaciente from './pages/pacientes/NuevoPaciente'
import PacienteRegistroExitoso from './pages/pacientes/PacienteRegistroExitoso'
import EditarPaciente from './pages/pacientes/EditarPaciente'
import HistorialPaciente from './pages/pacientes/HistorialPaciente'

import './App.css'

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Rutas de autenticación */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<RegisterForm />} />
          
          {/* Rutas para completar perfiles */}
          <Route path="/completar-perfil-medico" element={<CompletarPerfilMedico />} />
          <Route path="/completar-perfil-bioquimico" element={<CompletarPerfilBioquimico />} />
          
          {/* ========================================= */}
          {/* DASHBOARDS - RUTAS MÚLTIPLES PARA COMPATIBILIDAD */}
          {/* ========================================= */}
          
          {/* Rutas del médico - Dashboard */}
          <Route path="/MedicoDashboard" element={<MedicoDashboard />} />
          <Route path="/medico/dashboard" element={<MedicoDashboard />} />
          <Route path="/dashboard/medico/:id" element={<MedicoDashboard />} />
          
          {/* Rutas del bioquímico - Dashboard */}
          <Route path="/BioquimicoDashboard" element={<BioquimicoDashboard />} />
          <Route path="/bioquimico/dashboard" element={<BioquimicoDashboard />} />
          <Route path="/dashboard/bioquimico/:matricula" element={<BioquimicoDashboard />} />
          
          {/* ========================================= */}
          {/* RUTAS DEL MÉDICO */}
          {/* ========================================= */}
          
          {/* Gestión de órdenes */}
          <Route path="/medico/ordenes" element={<OrdenesLista />} />
          <Route path="/medico/orden/:id_orden" element={<OrdenDetalle />} />
          
          {/* Nueva solicitud */}
          <Route path="/medico/nueva-solicitud" element={<NuevaSolicitud />} />
          
          {/* Gestión de pacientes */}
          <Route path="/medico/pacientes" element={<GestionPacientes />} />
          <Route path="/medico/paciente/nuevo" element={<NuevoPaciente />} />
          
          {/* ⚠️ NUEVAS RUTAS DE PACIENTES */}
          <Route path="/pacientes/registro-exitoso" element={<PacienteRegistroExitoso />} />
          <Route path="/medico/paciente/:nro_ficha/editar" element={<EditarPaciente />} />
          <Route path="/medico/paciente/:nro_ficha/historial" element={<HistorialPaciente />} />
          
          {/* Rutas alternativas para compatibilidad */}
          <Route path="/pacientes" element={<Navigate to="/medico/pacientes" replace />} />
          <Route path="/pacientes/nuevo" element={<Navigate to="/medico/paciente/nuevo" replace />} />
          
          {/* Gestión de análisis */}
          <Route path="/medico/analisis" element={<GestionAnalisis />} />
          
          {/* ========================================= */}
          {/* RUTAS FUTURAS - EN DESARROLLO */}
          {/* ========================================= */}
          
          {/* Rutas futuras - En desarrollo */}
          <Route path="/medico/resultados" element={
            <div className="min-h-screen bg-blue-50 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">📋</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Resultados</h2>
                <p className="text-gray-600 mb-6">Módulo en desarrollo</p>
                <button 
                  onClick={() => window.location.href = '/medico/dashboard'} 
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Volver al Dashboard
                </button>
              </div>
            </div>
          } />

          <Route path="/medico/reportes" element={
            <div className="min-h-screen bg-blue-50 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">📊</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Reportes</h2>
                <p className="text-gray-600 mb-6">Módulo en desarrollo</p>
                <button 
                  onClick={() => window.location.href = '/medico/dashboard'} 
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Volver al Dashboard
                </button>
              </div>
            </div>
          } />
          
          {/* ========================================= */}
          {/* RUTAS DE REDIRECCIÓN Y ERROR */}
          {/* ========================================= */}
          
          {/* Ruta por defecto */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Ruta 404 - Mejorada */}
          <Route path="*" element={
            <div className="min-h-screen bg-blue-50 flex items-center justify-center">
              <div className="text-center max-w-md mx-auto px-4">
                <div className="text-6xl mb-4">🔍</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Página no encontrada</h2>
                <p className="text-gray-600 mb-6">
                  La página que buscas no existe o ha sido movida.
                </p>
                <div className="space-y-3">
                  <button 
                    onClick={() => window.location.href = '/login'} 
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    🏠 Ir al Login
                  </button>
                  <button 
                    onClick={() => window.location.href = '/medico/dashboard'} 
                    className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    👨‍⚕️ Dashboard Médico
                  </button>
                  <button 
                    onClick={() => window.location.href = '/bioquimico/dashboard'} 
                    className="w-full bg-green-200 text-green-800 px-4 py-2 rounded-lg hover:bg-green-300 transition-colors"
                  >
                    🧬 Dashboard Bioquímico
                  </button>
                </div>
                <div className="mt-6 text-sm text-gray-500">
                  <p>Rutas disponibles:</p>
                  <ul className="text-left mt-2 space-y-1">
                    <li>• /login - Iniciar sesión</li>
                    <li>• /medico/dashboard - Panel médico</li>
                    <li>• /bioquimico/dashboard - Panel bioquímico</li>
                    <li>• /medico/pacientes - Gestión de pacientes</li>
                  </ul>
                </div>
              </div>
            </div>
          } />
        </Routes>
      </div>
    </Router>
  )
}

export default App