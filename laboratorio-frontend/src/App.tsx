// src/App.tsx - CON RUTAS ACTUALIZADAS

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/login/Login'
import MedicoDashboard from './pages/dashboard/MedicoDashboard'
import OrdenesLista from './pages/medico/OrdenesLista'
import OrdenDetalle from './pages/medico/OrdenDetalle'
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
          <Route path="/medico/ordenes" element={<OrdenesLista />} />
          <Route path="/medico/orden/:id_orden" element={<OrdenDetalle />} />
          
          {/* Rutas futuras */}
          <Route path="/medico/pacientes" element={<div className="p-8"><h2>Gestión de Pacientes - En desarrollo</h2></div>} />
          <Route path="/medico/analisis" element={<div className="p-8"><h2>Gestión de Análisis - En desarrollo</h2></div>} />
          <Route path="/medico/nueva-solicitud" element={<div className="p-8"><h2>Nueva Solicitud - En desarrollo</h2></div>} />
          
          {/* Ruta por defecto */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Ruta 404 */}
          <Route path="*" element={<div className="p-8 text-center"><h2>Página no encontrada</h2><p>La página que buscas no existe.</p></div>} />
        </Routes>
      </div>
    </Router>
  )
}

export default App