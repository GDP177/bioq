// src/App.tsx - CON TODAS LAS RUTAS COMPLETAS

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/login/Login'
import MedicoDashboard from './pages/dashboard/MedicoDashboard'
import OrdenesLista from './pages/medico/OrdenesLista'
import OrdenDetalle from './pages/medico/OrdenDetalle'
import NuevaSolicitud from './pages/medico/NuevaSolicitud'
import GestionPacientes from './pages/medico/GestionPacientes'
import GestionAnalisis from './pages/medico/GestionAnalisis'
import RegisterForm from './pages/login/RegisterForm'
import './App.css'

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Rutas de autenticación */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<RegisterForm />} />
          
          {/* Rutas del médico */}
          <Route path="/MedicoDashboard" element={<MedicoDashboard />} />
          <Route path="/medico/dashboard" element={<MedicoDashboard />} />
          
          {/* Gestión de órdenes */}
          <Route path="/medico/ordenes" element={<OrdenesLista />} />
          <Route path="/medico/orden/:id_orden" element={<OrdenDetalle />} />
          
          {/* Nueva solicitud */}
          <Route path="/medico/nueva-solicitud" element={<NuevaSolicitud />} />
          
          {/* Gestión de pacientes */}
          <Route path="/medico/pacientes" element={<GestionPacientes />} />
          
          {/* Gestión de análisis */}
          <Route path="/medico/analisis" element={<GestionAnalisis />} />
          
          {/* Rutas futuras */}
          <Route path="/medico/paciente/nuevo" element={<div className="p-8"><h2>Registrar Nuevo Paciente - En desarrollo</h2></div>} />
          <Route path="/medico/paciente/:id_paciente/historial" element={<div className="p-8"><h2>Historial del Paciente - En desarrollo</h2></div>} />
          <Route path="/medico/reportes" element={<div className="p-8"><h2>Reportes - En desarrollo</h2></div>} />
          
          {/* Ruta por defecto */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Ruta 404 */}
          <Route path="*" element={
            <div className="min-h-screen bg-blue-50 flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Página no encontrada</h2>
                <p className="text-gray-600 mb-6">La página que buscas no existe.</p>
                <button 
                  onClick={() => window.location.href = '/MedicoDashboard'} 
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Volver al Dashboard
                </button>
              </div>
            </div>
          } />
        </Routes>
      </div>
    </Router>
  )
}

export default App