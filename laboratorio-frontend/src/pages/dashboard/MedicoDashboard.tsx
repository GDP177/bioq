// src/pages/dashboard/MedicoDashboard.tsx - CON NAVEGACIÓN

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

interface MedicoData {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  especialidad?: string;
  matricula?: string;
  telefono?: string;
  rol: string;
}

interface EstadisticasData {
  total_ordenes: number;
  ordenes_pendientes: number;
  ordenes_proceso: number;
  ordenes_completadas: number;
  ordenes_urgentes: number;
  total_analisis: number;
  analisis_pendientes: number;
  analisis_proceso: number;
  analisis_listos: number;
  analisis_entregados: number;
  total_pacientes: number;
  ordenes_recientes: number;
}

interface OrdenReciente {
  id: number;
  nro_orden: string;
  fecha_ingreso: string;
  estado: string;
  urgente: boolean;
  paciente: {
    nombre: string;
    apellido: string;
    dni: number;
    mutual: string;
    edad: number;
  };
  progreso: {
    total_analisis: number;
    analisis_listos: number;
    porcentaje: number;
  };
}

interface PacienteReciente {
  nro_ficha: number;
  nombre: string;
  apellido: string;
  dni: number;
  edad: number;
  sexo: string;
  mutual: string;
  ultima_orden: string;
  total_ordenes: number;
}

interface AnalisisFrecuente {
  codigo: number;
  descripcion: string;
  tipo: string;
  veces_solicitado: number;
  porcentaje_completado: number;
}

interface DashboardData {
  success: boolean;
  medico: MedicoData;
  estadisticas: EstadisticasData;
  ordenes_recientes: OrdenReciente[];
  pacientes_recientes: PacienteReciente[];
  analisis_frecuentes: AnalisisFrecuente[];
  notificaciones: string[];
  timestamp: string;
}

export default function MedicoDashboard() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<MedicoData | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Verificar si hay usuario logueado
    const usuarioGuardado = localStorage.getItem("usuario");
    if (!usuarioGuardado) {
      navigate("/login");
      return;
    }

    try {
      const parsedUsuario = JSON.parse(usuarioGuardado) as MedicoData;
      setUsuario(parsedUsuario);
      
      // Cargar datos del dashboard
      loadDashboardData(parsedUsuario.id);
    } catch (error) {
      console.error("❌ Error al parsear usuario:", error);
      localStorage.removeItem("usuario");
      navigate("/login");
    }
  }, [navigate]);

  const loadDashboardData = async (medicoId: number) => {
    try {
      setLoading(true);
      console.log("📊 Cargando dashboard con datos reales para médico ID:", medicoId);
      
      const response = await axios.get<DashboardData>(
        `http://localhost:5000/api/medico/dashboard/${medicoId}`
      );

      console.log("✅ Dashboard con datos reales cargado:", response.data);
      setDashboardData(response.data);
    } catch (error: any) {
      console.error("❌ Error al cargar dashboard:", error);
      setError("Error al cargar los datos del dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("usuario");
    navigate("/login");
  };

  // FUNCIONES DE NAVEGACIÓN
  const navigateToOrdenes = (filtro?: string) => {
    const params = new URLSearchParams();
    if (filtro) params.set('estado', filtro);
    navigate(`/medico/ordenes?${params.toString()}`);
  };

  const navigateToAnalisis = (filtro?: string) => {
    const params = new URLSearchParams();
    if (filtro) params.set('estado', filtro);
    navigate(`/medico/analisis?${params.toString()}`);
  };

  const navigateToPacientes = () => {
    navigate('/medico/pacientes');
  };

  const navigateToOrdenDetalle = (ordenId: number) => {
    navigate(`/medico/orden/${ordenId}`);
  };

  const navigateToNuevaSolicitud = () => {
    navigate('/medico/nueva-solicitud');
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getEstadoBadge = (estado: string, urgente: boolean = false) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    const urgenteClass = urgente ? "ring-2 ring-red-400" : "";
    
    switch (estado) {
      case 'pendiente':
        return `${baseClasses} bg-yellow-100 text-yellow-800 ${urgenteClass}`;
      case 'en_proceso':
        return `${baseClasses} bg-blue-100 text-blue-800 ${urgenteClass}`;
      case 'completado':
        return `${baseClasses} bg-green-100 text-green-800 ${urgenteClass}`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 ${urgenteClass}`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos del dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mr-2"
          >
            Reintentar
          </button>
          <button
            onClick={handleLogout}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return <div>No hay datos disponibles</div>;
  }

  return (
    <div className="min-h-screen bg-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                🏥 Dashboard Médico
              </h1>
              <p className="text-gray-600">
                Bienvenido, Dr. {dashboardData.medico.nombre} {dashboardData.medico.apellido}
              </p>
              {dashboardData.medico.especialidad && (
                <p className="text-sm text-gray-500">
                  {dashboardData.medico.especialidad} • Mat: {dashboardData.medico.matricula}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={navigateToNuevaSolicitud}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                + Nueva Solicitud
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Stats Cards - Órdenes CLICKEABLES */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div 
            onClick={() => navigateToOrdenes()}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-3xl">📋</div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Órdenes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData.estadisticas.total_ordenes}
                </p>
                <p className="text-xs text-blue-600">Click para ver todas</p>
              </div>
            </div>
          </div>

          <div 
            onClick={() => navigateToOrdenes('pendiente')}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-3xl">⏳</div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {dashboardData.estadisticas.ordenes_pendientes}
                </p>
                <p className="text-xs text-blue-600">Click para ver detalles</p>
              </div>
            </div>
          </div>

          <div 
            onClick={() => navigateToOrdenes('completado')}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-3xl">✅</div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completadas</p>
                <p className="text-2xl font-bold text-green-600">
                  {dashboardData.estadisticas.ordenes_completadas}
                </p>
                <p className="text-xs text-blue-600">Click para ver detalles</p>
              </div>
            </div>
          </div>

          <div 
            onClick={() => navigateToOrdenes('urgente')}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-3xl">🚨</div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Urgentes</p>
                <p className="text-2xl font-bold text-red-600">
                  {dashboardData.estadisticas.ordenes_urgentes}
                </p>
                <p className="text-xs text-blue-600">Click para ver urgentes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards - Análisis CLICKEABLES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div 
            onClick={() => navigateToAnalisis()}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-3xl">🧪</div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Análisis</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData.estadisticas.total_analisis}
                </p>
                <p className="text-xs text-blue-600">Click para gestionar</p>
              </div>
            </div>
          </div>

          <div 
            onClick={() => navigateToAnalisis('finalizado')}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-3xl">🔬</div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Análisis Listos</p>
                <p className="text-2xl font-bold text-green-600">
                  {dashboardData.estadisticas.analisis_listos}
                </p>
                <p className="text-xs text-blue-600">Click para revisar</p>
              </div>
            </div>
          </div>

          <div 
            onClick={navigateToPacientes}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-3xl">👥</div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pacientes</p>
                <p className="text-2xl font-bold text-blue-600">
                  {dashboardData.estadisticas.total_pacientes}
                </p>
                <p className="text-xs text-blue-600">Click para gestionar</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          
          {/* Órdenes Recientes - CLICKEABLES */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                📋 Órdenes Recientes
              </h3>
              <button 
                onClick={() => navigateToOrdenes()}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Ver todas →
              </button>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {dashboardData.ordenes_recientes.length > 0 ? (
                dashboardData.ordenes_recientes.map((orden) => (
                  <div 
                    key={orden.id} 
                    onClick={() => navigateToOrdenDetalle(orden.id)}
                    className="p-3 bg-gray-50 rounded-lg border-l-4 border-blue-400 cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-gray-900">
                          {orden.nro_orden || `Orden #${orden.id}`}
                        </p>
                        <p className="text-sm text-gray-600">
                          {orden.paciente.nombre} {orden.paciente.apellido}
                        </p>
                        <p className="text-xs text-gray-500">
                          {orden.paciente.mutual} • DNI: {orden.paciente.dni}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={getEstadoBadge(orden.estado, orden.urgente)}>
                          {orden.urgente && '🚨 '}{orden.estado.toUpperCase()}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatFecha(orden.fecha_ingreso)}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-gray-600">
                        Progreso: {orden.progreso.analisis_listos}/{orden.progreso.total_analisis} análisis
                      </div>
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${orden.progreso.porcentaje}%` }}
                        ></div>
                      </div>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">Click para ver detalles</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No hay órdenes recientes</p>
              )}
            </div>
          </div>

          {/* Notificaciones */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              🔔 Notificaciones
            </h3>
            <div className="space-y-3">
              {dashboardData.notificaciones.map((notificacion, index) => (
                <div key={index} className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                  <p className="text-sm text-gray-700">{notificacion}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Timestamp */}
        <div className="mt-8 text-center text-xs text-gray-500">
          Última actualización: {formatFecha(dashboardData.timestamp)}
        </div>
      </div>
    </div>
  );
}