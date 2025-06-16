// laboratorio-frontend/src/pages/dashboard/AdminDashboard.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomCard } from '@/components/ui/CustomCard';

// Interfaces
interface AdminData {
  id: number;
  username: string;
  email: string;
  rol: string;
}

interface MetricasGenerales {
  ordenes_hoy: number;
  ordenes_semana: number;
  ordenes_mes: number;
  total_pacientes: number;
  total_medicos: number;
  total_bioquimicos: number;
  total_usuarios: number;
}

interface EstadisticasOrdenes {
  pendientes: number;
  en_proceso: number;
  finalizadas: number;
  canceladas: number;
}

interface AnalisisFrecuente {
  codigo: string;
  descripcion: string;
  cantidad: number;
}

interface MedicoRendimiento {
  nombre: string;
  apellido: string;
  especialidad: string;
  ordenes_solicitadas: number;
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
  };
  medico: {
    nombre: string;
    apellido: string;
  };
}

interface Facturacion {
  ordenes_facturables: number;
  ordenes_finalizadas: number;
  porcentaje_finalizacion: number;
}

interface DashboardData {
  success: boolean;
  administrador: AdminData;
  metricas_generales: MetricasGenerales;
  estadisticas_ordenes: EstadisticasOrdenes;
  analisis_frecuentes: AnalisisFrecuente[];
  rendimiento_medicos: MedicoRendimiento[];
  ordenes_recientes: OrdenReciente[];
  facturacion: Facturacion;
  notificaciones: string[];
  timestamp: string;
}

// Componente de estadísticas
const StatsCard: React.FC<{
  title: string;
  value: number;
  icon: string;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo';
  trend?: string;
  onClick?: () => void;
}> = ({ title, value, icon, color, trend, onClick }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    green: 'bg-green-50 border-green-200 text-green-800',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    red: 'bg-red-50 border-red-200 text-red-800',
    purple: 'bg-purple-50 border-purple-200 text-purple-800',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-800'
  };

  return (
    <div 
      className={`p-6 border rounded-lg ${colorClasses[color]} ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-90">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
          {trend && (
            <p className="text-xs mt-1 opacity-75">{trend}</p>
          )}
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </div>
  );
};

// Componente principal
const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cargarDashboard();
  }, []);

  const cargarDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener datos del usuario desde localStorage
      const usuarioData = localStorage.getItem('usuario');
      if (!usuarioData) {
        navigate('/login');
        return;
      }

      const usuario = JSON.parse(usuarioData);
      
      if (usuario.rol !== 'admin') {
        navigate('/login');
        return;
      }

      const response = await fetch(`/api/admin/dashboard/${usuario.id_usuario || usuario.id}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setDashboardData(data);
      } else {
        setError(data.message || 'Error al cargar dashboard');
      }
    } catch (err: any) {
      console.error('Error al cargar dashboard:', err);
      setError('Error de conexión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard administrativo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={cargarDashboard}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return <div>No hay datos disponibles</div>;
  }

  const { 
    administrador, 
    metricas_generales, 
    estadisticas_ordenes, 
    analisis_frecuentes,
    rendimiento_medicos,
    ordenes_recientes,
    facturacion,
    notificaciones 
  } = dashboardData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="bg-purple-100 p-3 rounded-full">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Dashboard Administrativo
                </h1>
                <p className="text-gray-600">
                  {administrador.username} - {administrador.email}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/admin/usuarios')}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <span>Gestionar Usuarios</span>
              </button>
              
              <button
                onClick={() => navigate('/login')}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                title="Cerrar sesión"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Notificaciones */}
        {notificaciones.length > 0 && (
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M15 17h5l-5 5c-5.5 0-10-4.5-10-10s4.5-10 10-10 10 4.5 10 10h-5"/>
                </svg>
                Notificaciones del Sistema
              </h3>
              <div className="space-y-2">
                {notificaciones.map((notificacion, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg">
                    <div className="text-purple-600 mt-0.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-sm text-purple-800">{notificacion}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Métricas Generales */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Órdenes Hoy"
            value={metricas_generales.ordenes_hoy}
            icon="📅"
            color="blue"
            trend="últimas 24 horas"
          />
          <StatsCard
            title="Total Pacientes"
            value={metricas_generales.total_pacientes}
            icon="👥"
            color="green"
            onClick={() => navigate('/admin/pacientes')}
          />
          <StatsCard
            title="Médicos Activos"
            value={metricas_generales.total_medicos}
            icon="👨‍⚕️"
            color="indigo"
            onClick={() => navigate('/admin/usuarios')}
          />
          <StatsCard
            title="Bioquímicos"
            value={metricas_generales.total_bioquimicos}
            icon="🔬"
            color="purple"
            onClick={() => navigate('/admin/usuarios')}
          />
        </section>

        {/* Estadísticas de Órdenes */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Pendientes"
            value={estadisticas_ordenes.pendientes}
            icon="⏳"
            color="yellow"
          />
          <StatsCard
            title="En Proceso"
            value={estadisticas_ordenes.en_proceso}
            icon="🔄"
            color="blue"
          />
          <StatsCard
            title="Finalizadas"
            value={estadisticas_ordenes.finalizadas}
            icon="✅"
            color="green"
          />
          <StatsCard
            title="Facturación"
            value={facturacion.porcentaje_finalizacion}
            icon="💰"
            color="indigo"
            trend={`${facturacion.ordenes_finalizadas}/${facturacion.ordenes_facturables} completadas`}
          />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Análisis Más Frecuentes */}
          <CustomCard title="🧪 Análisis Más Solicitados" className="h-fit">
            <div className="space-y-4">
              {analisis_frecuentes.length > 0 ? (
                analisis_frecuentes.slice(0, 8).map((analisis, index) => (
                  <div key={index} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50">
                    <div>
                      <p className="font-medium text-gray-800">
                        {analisis.descripcion || `Código ${analisis.codigo}`}
                      </p>
                      <p className="text-sm text-gray-500">Código: {analisis.codigo}</p>
                    </div>
                    <div className="text-right">
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        {analisis.cantidad}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No hay datos disponibles</p>
                </div>
              )}
            </div>
          </CustomCard>

          {/* Rendimiento de Médicos */}
          <CustomCard title="👨‍⚕️ Rendimiento de Médicos" className="h-fit">
            <div className="space-y-4">
              {rendimiento_medicos.length > 0 ? (
                rendimiento_medicos.slice(0, 8).map((medico, index) => (
                  <div key={index} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50">
                    <div>
                      <p className="font-medium text-gray-800">
                        Dr. {medico.nombre} {medico.apellido}
                      </p>
                      <p className="text-sm text-gray-500">{medico.especialidad}</p>
                    </div>
                    <div className="text-right">
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                        {medico.ordenes_solicitadas} órdenes
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No hay datos disponibles</p>
                </div>
              )}
            </div>
          </CustomCard>
        </div>

        {/* Órdenes Recientes */}
        <section className="mt-8">
          <CustomCard title="📋 Órdenes Recientes">
            <div className="space-y-4">
              {ordenes_recientes.length > 0 ? (
                ordenes_recientes.slice(0, 10).map((orden) => (
                  <div key={orden.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-gray-800">
                          {orden.nro_orden}
                        </span>
                        {orden.urgente && (
                          <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                            URGENTE
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {orden.paciente.apellido}, {orden.paciente.nombre}
                        </p>
                        <p className="text-xs text-gray-500">
                          Dr. {orden.medico.nombre} {orden.medico.apellido}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <span className="text-xs text-gray-500">
                        {new Date(orden.fecha_ingreso).toLocaleDateString()}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        orden.estado === 'pendiente' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : orden.estado === 'en_proceso'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {orden.estado.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No hay órdenes recientes</p>
                </div>
              )}
            </div>
          </CustomCard>
        </section>

        {/* Accesos Rápidos */}
        <section className="mt-8">
          <CustomCard title="🚀 Accesos Rápidos de Administración">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <button
                onClick={() => navigate('/admin/usuarios')}
                className="p-6 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 text-center group"
              >
                <div className="text-3xl mb-2">👥</div>
                <h3 className="font-semibold text-gray-800 group-hover:text-purple-800">Gestión de Usuarios</h3>
                <p className="text-sm text-gray-600 mt-1">Médicos, bioquímicos y admins</p>
              </button>

              <button
                onClick={() => navigate('/admin/pacientes')}
                className="p-6 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200 text-center group"
              >
                <div className="text-3xl mb-2">🏥</div>
                <h3 className="font-semibold text-gray-800 group-hover:text-indigo-800">Gestión de Pacientes</h3>
                <p className="text-sm text-gray-600 mt-1">CRUD y exportación</p>
              </button>

              <button
                onClick={() => navigate('/admin/configuracion')}
                className="p-6 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-center group"
              >
                <div className="text-3xl mb-2">⚙️</div>
                <h3 className="font-semibold text-gray-800 group-hover:text-blue-800">Configuración</h3>
                <p className="text-sm text-gray-600 mt-1">Sistema y parámetros</p>
              </button>

              <button
                onClick={() => navigate('/admin/reportes')}
                className="p-6 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all duration-200 text-center group"
              >
                <div className="text-3xl mb-2">📊</div>
                <h3 className="font-semibold text-gray-800 group-hover:text-green-800">Reportes</h3>
                <p className="text-sm text-gray-600 mt-1">Analytics y métricas</p>
              </button>
            </div>
          </CustomCard>
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;