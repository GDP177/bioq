// src/App.tsx - ACTUALIZADO CON SIDEBAR DINÁMICO Y RUTAS ANIDADAS

import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import Login from './pages/login/Login'
import MedicoDashboard from './pages/dashboard/MedicoDashboard'
import BioquimicoDashboard from './pages/dashboard/BioquimicoDashboard'
import AdminDashboard from './pages/dashboard/AdminDashboard' 
import OrdenesLista from './pages/medico/OrdenesLista'
import OrdenDetalle from './pages/medico/OrdenDetalle'
import NuevaSolicitud from './pages/medico/NuevaSolicitud'
import GestionPacientes from './pages/medico/GestionPacientes'
import GestionPacientesAdmin from './pages/admin/GestionPacientes'
import RegisterForm from './pages/login/RegisterForm'
import CompletarPerfilMedico from './pages/medico/CompletarPerfilMedico';
import CompletarPerfilBioquimico from './pages/bioquimico/CompletarPerfilBioquimico';
import OrdenesFiltradas from './pages/ordenes/OrdenesFiltradas';
import BioquimicoOrdenDetalle from './pages/bioquimico/OrdenDetalle';
import GestionAnalisis from './pages/admin/GestionAnalisis'; 

// Layout y Sidebar
import { MainLayout } from './components/layout/MainLayout'

// Páginas de pacientes
import NuevoPaciente from './pages/pacientes/NuevoPaciente'
import PacienteRegistroExitoso from './pages/pacientes/PacienteRegistroExitoso'
import EditarPaciente from './pages/pacientes/EditarPaciente'
import HistorialPaciente from './pages/pacientes/HistorialPaciente'
import NuevaOrdenAdmin from './pages/admin/NuevaOrden';

// ✅ CORRECCIÓN CLAVE: El import de OrdenesEntrantes debe apuntar a la carpeta del bioquímico
import OrdenesEntrantes from './pages/bioquimico/OrdenesEntrantes'; 
import CargaResultados from "./pages/bioquimico/CargaResultados";

// Páginas usuarios
import GestionUsuarios from './pages/admin/GestionUsuarios'; 

import './App.css'

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* ========================================= */}
          {/* RUTAS PÚBLICAS (SIN SIDEBAR) */}
          {/* ========================================= */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* ========================================= */}
          {/* RUTAS PROTEGIDAS (CON SIDEBAR FIJO) */}
          {/* ========================================= */}
          <Route element={<MainLayout><Outlet /></MainLayout>}>
            
            {/* Rutas para completar perfiles */}
            <Route path="/completar-perfil-medico" element={<CompletarPerfilMedico />} />
            <Route path="/completar-perfil-bioquimico" element={<CompletarPerfilBioquimico />} />

            {/* --- RUTAS DEL ADMINISTRADOR --- */}
            <Route path="/AdminDashboard" element={<AdminDashboard />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/dashboard/admin/:id" element={<AdminDashboard />} />    
            <Route path="/admin/pacientes" element={<GestionPacientesAdmin />} />
            <Route path="/admin/usuarios" element={<GestionUsuarios />} />
            <Route path="/admin/nueva-orden" element={<NuevaOrdenAdmin />} />
            <Route path="/admin/analisis" element={<GestionAnalisis />} />  

            {/* --- RUTAS DEL MÉDICO --- */}
            <Route path="/MedicoDashboard" element={<MedicoDashboard />} />
            <Route path="/medico/dashboard" element={<MedicoDashboard />} />
            <Route path="/dashboard/medico/:id" element={<MedicoDashboard />} />
            <Route path="/medico/ordenes" element={<OrdenesLista />} />
            <Route path="/medico/orden/:id_orden" element={<OrdenDetalle />} />
            <Route path="/medico/nueva-solicitud" element={<NuevaSolicitud />} />
            <Route path="/medico/pacientes" element={<GestionPacientes />} />
            <Route path="/medico/paciente/nuevo" element={<NuevoPaciente />} />
            <Route path="/medico/paciente/:nro_ficha/editar" element={<EditarPaciente />} />
            <Route path="/medico/paciente/:nro_ficha/historial" element={<HistorialPaciente />} />
            <Route path="/medico/analisis" element={<GestionAnalisis />} />
            
            <Route path="/medico/resultados" element={<div className="p-8">Módulo Resultados</div>} />
            <Route path="/medico/reportes" element={<div className="p-8">Módulo Reportes</div>} />

            {/* --- RUTAS DEL BIOQUÍMICO --- */}
            <Route path="/BioquimicoDashboard" element={<BioquimicoDashboard />} />
            <Route path="/bioquimico/dashboard" element={<BioquimicoDashboard />} />
            <Route path="/dashboard/bioquimico/:matricula" element={<BioquimicoDashboard />} />
            <Route path="/bioquimico/:matricula/ordenes/:tipo" element={<OrdenesFiltradas />} />
            <Route path="/orden/:id" element={<BioquimicoOrdenDetalle />} />
            
            {/* ✅ Asegúrate de que las rutas del bioquímico sean estas: */}
            <Route path="/bioquimico/ordenes-entrantes" element={<OrdenesEntrantes />} />
            <Route path="/bioquimico/orden/:id_orden/cargar" element={<CargaResultados />} />
            
          </Route>

          {/* --- RUTAS DE COMPATIBILIDAD --- */}
          <Route path="/pacientes" element={<Navigate to="/medico/pacientes" replace />} />
          <Route path="/pacientes/nuevo" element={<Navigate to="/medico/paciente/nuevo" replace />} />
          <Route path="/pacientes/registro-exitoso" element={<PacienteRegistroExitoso />} />

          {/* --- RUTA 404 --- */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App