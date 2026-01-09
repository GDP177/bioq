// src/pages/dashboard/BioquimicoDashboard.tsx - DASHBOARD BIOQUÍMICO FUNCIONAL

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

interface BioquimicoData {
  matricula: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  fecha_habilitacion?: string;
  fecha_vencimiento_matricula?: string;
}

interface EstadisticasData {
  total_ordenes: number;
  ordenes_pendientes: number;
  ordenes_proceso: number;
  ordenes_completadas: number;
  ordenes_hoy: number;
}

interface OrdenPendiente {
  id: number;
  nro_orden: string;
  fecha_ingreso: string;
  estado: string;
  urgente: boolean;
  paciente: {
    nombre: string;
    apellido: string;
    dni: number;
  };
  total_analisis: number;
}

interface AnalisisPendiente {
  id: number;
  codigo_practica: string;
  estado: string;
  orden: {
    id: number;
    nro_orden: string;
    urgente: boolean;
  };
  paciente: {
    nombre: string;
    apellido: string;
  };
}

interface DashboardData {
  success: boolean;
  bioquimico: BioquimicoData;
  estadisticas: EstadisticasData;
  ordenes_pendientes: OrdenPendiente[];
  analisis_pendientes: AnalisisPendiente[];
  notificaciones: string[];
  timestamp: string;
}

export default function BioquimicoDashboard() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<any>(null);
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
      const parsedUsuario = JSON.parse(usuarioGuardado);
      if (parsedUsuario.rol !== 'bioquimico') {
        console.error("❌ Usuario no es bioquímico:", parsedUsuario.rol);
        navigate("/login");
        return;
      }
      
      setUsuario(parsedUsuario);
      
      // Cargar datos del dashboard
      loadDashboardData(parsedUsuario.matricula || parsedUsuario.id);
    } catch (error) {
      console.error("❌ Error al parsear usuario:", error);
      localStorage.removeItem("usuario");
      navigate("/login");
    }
  }, [navigate]);

  const loadDashboardData = async (matricula: string) => {
    try {
      setLoading(true);
      console.log("📊 Cargando dashboard bioquímico para matrícula:", matricula);
      
      const response = await axios.get<DashboardData>(
        `http://localhost:5000/api/bioquimico/dashboard/${matricula}`
      );

      console.log("✅ Dashboard bioquímico cargado:", response.data);
      setDashboardData(response.data);
    } catch (error: any) {
      console.error("❌ Error al cargar dashboard bioquímico:", error);
      
      if (error.response?.status === 404) {
        setError("No se encontraron datos para este bioquímico. Verifique que el perfil esté completo.");
      } else {
        setError("Error al cargar los datos del dashboard");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("usuario");
    navigate("/login");
  };

  const formatFecha = (fecha: string) => {
    try {
      return new Date(fecha).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.warn("Error al formatear fecha:", fecha);
      return 'Fecha inválida';
    }
  };

  const getEstadoBadge = (estado: string | null | undefined, urgente: boolean = false) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    const urgenteClass = urgente ? "ring-2 ring-red-400" : "";
    
    const estadoNormalizado = (estado || 'desconocido').toLowerCase().trim();
    
    switch (estadoNormalizado) {
      case 'pendiente':
        return `${baseClasses} bg-yellow-100 text-yellow-800 ${urgenteClass}`;
      case 'en_proceso':
      case 'procesando':
      case 'proceso':
        return `${baseClasses} bg-blue-100 text-blue-800 ${urgenteClass}`;
      case 'completado':
      case 'finalizado':
      case 'listo':
        return `${baseClasses} bg-green-100 text-green-800 ${urgenteClass}`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 ${urgenteClass}`;
    }
  };

  const getEstadoTexto = (estado: string | null | undefined, urgente: boolean = false) => {
    const estadoNormalizado = (estado || 'desconocido').toLowerCase().trim();
    const urgentePrefix = urgente ? '🚨 ' : '';
    
    switch (estadoNormalizado) {
      case 'pendiente':
        return `${urgentePrefix}PENDIENTE`;
      case 'en_proceso':
      case 'procesando':
      case 'proceso':
        return `${urgentePrefix}EN PROCESO`;
      case 'completado':
      case 'finalizado':
      case 'listo':
        return `${urgentePrefix}COMPLETADO`;
      default:
        return `${urgentePrefix}ESTADO DESCONOCIDO`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard bioquímico...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mr-2"
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
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🧬</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Dashboard Bioquímico</h2>
          <p className="text-gray-600">No hay datos disponibles</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                🧬 Dashboard Bioquímico
              </h1>
              <p className="text-gray-600">
                Bienvenido/a, Bioq. {dashboardData.bioquimico.nombre} {dashboardData.bioquimico.apellido}
              </p>
              <p className="text-sm text-gray-500">
                Matrícula: {dashboardData.bioquimico.matricula}
              </p>
            </div>
            <div className="flex items-center space-x-4">
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
        
        {/* Stats Cards - Órdenes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

              {/* Total Órdenes */}
              <button
                onClick={() => navigate(`/bioquimico/${usuario.matricula}/ordenes/todas`)}
                className="text-left"
              >
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 w-full">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 text-3xl">📋</div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Total Órdenes</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {dashboardData.estadisticas.total_ordenes || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </button>

              {/* Órdenes Pendientes */}
              <button
                onClick={() => navigate(`/bioquimico/${usuario.matricula}/ordenes/pendientes`)}
                className="text-left"
              >
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 w-full">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 text-3xl">⏳</div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Pendientes</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {dashboardData.estadisticas.ordenes_pendientes || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </button>

              {/* Órdenes Completadas */}
              <button
                onClick={() => navigate(`/bioquimico/${usuario.matricula}/ordenes/completadas`)}
                className="text-left"
              >
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 w-full">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 text-3xl">✅</div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Completadas</p>
                      <p className="text-2xl font-bold text-green-600">
                        {dashboardData.estadisticas.ordenes_completadas || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </button>

              {/* Órdenes de Hoy */}
              <button
                onClick={() => navigate(`/bioquimico/${usuario.matricula}/ordenes/hoy`)}
                className="text-left"
              >
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 w-full">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 text-3xl">📅</div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Hoy</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {dashboardData.estadisticas.ordenes_hoy || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </button>
            </div>


        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          
          {/* Órdenes Pendientes */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              📋 Órdenes Pendientes
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {dashboardData.ordenes_pendientes && dashboardData.ordenes_pendientes.length > 0 ? (
                dashboardData.ordenes_pendientes.map((orden) => (
                  <div 
                    key={orden.id} 
                    className="p-3 bg-gray-50 rounded-lg border-l-4 border-green-400"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-gray-900">
                          {orden.nro_orden}
                        </p>
                        <p className="text-sm text-gray-600">
                          {orden.paciente.nombre} {orden.paciente.apellido}
                        </p>
                        <p className="text-xs text-gray-500">
                          DNI: {orden.paciente.dni}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={getEstadoBadge(orden.estado, orden.urgente)}>
                          {getEstadoTexto(orden.estado, orden.urgente)}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatFecha(orden.fecha_ingreso)}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-600">
                      Total análisis: {orden.total_analisis}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No hay órdenes pendientes</p>
              )}
            </div>
          </div>

          {/* Análisis Pendientes */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              🧪 Análisis Pendientes
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {dashboardData.analisis_pendientes && dashboardData.analisis_pendientes.length > 0 ? (
                dashboardData.analisis_pendientes.map((analisis) => (
                  <div 
                    key={analisis.id} 
                    className="p-3 bg-gray-50 rounded-lg border-l-4 border-blue-400"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-gray-900">
                          Código: {analisis.codigo_practica}
                        </p>
                        <p className="text-sm text-gray-600">
                          {analisis.paciente.nombre} {analisis.paciente.apellido}
                        </p>
                        <p className="text-xs text-gray-500">
                          Orden: {analisis.orden.nro_orden}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={getEstadoBadge(analisis.estado, analisis.orden.urgente)}>
                          {getEstadoTexto(analisis.estado, analisis.orden.urgente)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No hay análisis pendientes</p>
              )}
            </div>
          </div>
        </div>

        {/* Notificaciones */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            🔔 Notificaciones
          </h3>
          <div className="space-y-3">
            {dashboardData.notificaciones && dashboardData.notificaciones.length > 0 ? (
              dashboardData.notificaciones.map((notificacion, index) => (
                <div key={index} className="p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
                  <p className="text-sm text-gray-700">{notificacion || 'Notificación sin contenido'}</p>
                </div>
              ))
            ) : (
              <div className="p-3 bg-gray-50 rounded-lg border-l-4 border-gray-400">
                <p className="text-sm text-gray-500">No hay notificaciones nuevas</p>
              </div>
            )}
          </div>
        </div>

        {/* Timestamp */}
        <div className="mt-8 text-center text-xs text-gray-500">
          Última actualización: {dashboardData.timestamp ? formatFecha(dashboardData.timestamp) : 'Fecha no disponible'}
        </div>
      </div>
    </div>
  );
}