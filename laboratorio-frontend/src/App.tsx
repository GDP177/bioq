// src/App.tsx - CON RUTAS ACTUALIZADAS PARA PACIENTES

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/login/Login'
import MedicoDashboard from './pages/dashboard/MedicoDashboard'
import OrdenesLista from './pages/medico/OrdenesLista'
import OrdenDetalle from './pages/medico/OrdenDetalle'
import NuevaSolicitud from './pages/medico/NuevaSolicitud'
import GestionPacientes from './pages/medico/GestionPacientes'
import GestionAnalisis from './pages/medico/GestionAnalisis'
import RegisterForm from './pages/login/RegisterForm'
import CompletarPerfilMedico from './pages/medico/CompletarPerfilMedico';

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
          
          {/* Rutas del médico - Dashboard */}
          <Route path="/MedicoDashboard" element={<MedicoDashboard />} />
          <Route path="/medico/dashboard" element={<MedicoDashboard />} />
          
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
          
          {/* Rutas futuras - En desarrollo */}
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
                    onClick={() => window.location.href = '/medico/dashboard'} 
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    🏠 Ir al Dashboard
                  </button>
                  <button 
                    onClick={() => window.location.href = '/medico/pacientes'} 
                    className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    👥 Ver Pacientes
                  </button>
                </div>
                <div className="mt-6 text-sm text-gray-500">
                  <p>Rutas disponibles:</p>
                  <ul className="text-left mt-2 space-y-1">
                    <li>• /medico/dashboard - Panel principal</li>
                    <li>• /medico/pacientes - Gestión de pacientes</li>
                    <li>• /medico/ordenes - Órdenes de análisis</li>
                    <li>• /medico/analisis - Gestión de análisis</li>
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