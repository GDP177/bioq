// src/pages/medico/OrdenesLista.tsx

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";

interface Orden {
  id: number;
  nro_orden: string;
  fecha_ingreso: string;
  fecha_procesamiento: string | null;
  fecha_finalizacion: string | null;
  estado: string;
  urgente: boolean;
  observaciones: string | null;
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

interface OrdenesResponse {
  success: boolean;
  ordenes: Orden[];
  total: number;
  filtros_aplicados: {
    estado?: string;
    urgente?: boolean;
    fecha_desde?: string;
    fecha_hasta?: string;
  };
}

export default function OrdenesLista() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Filtros
  const [filtroEstado, setFiltroEstado] = useState(searchParams.get('estado') || 'todos');
  const [filtroUrgente, setFiltroUrgente] = useState(searchParams.get('urgente') === 'true');
  const [busqueda, setBusqueda] = useState(searchParams.get('buscar') || '');

  useEffect(() => {
    const usuario = localStorage.getItem("usuario");
    if (!usuario) {
      navigate("/login");
      return;
    }

    const parsedUsuario = JSON.parse(usuario);
    cargarOrdenes(parsedUsuario.id);
  }, [navigate, filtroEstado, filtroUrgente, busqueda]);

  const cargarOrdenes = async (medicoId: number) => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (filtroEstado !== 'todos') params.set('estado', filtroEstado);
      if (filtroUrgente) params.set('urgente', 'true');
      if (busqueda) params.set('buscar', busqueda);

      const response = await axios.get<OrdenesResponse>(
        `http://localhost:5000/api/medico/${medicoId}/ordenes?${params.toString()}`
      );

      if (response.data.success) {
        setOrdenes(response.data.ordenes);
      } else {
        setError("Error al cargar las órdenes");
      }
    } catch (error: any) {
      console.error("Error al cargar órdenes:", error);
      setError("Error al cargar las órdenes");
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    const params = new URLSearchParams();
    if (filtroEstado !== 'todos') params.set('estado', filtroEstado);
    if (filtroUrgente) params.set('urgente', 'true');
    if (busqueda) params.set('buscar', busqueda);
    
    setSearchParams(params);
  };

  const limpiarFiltros = () => {
    setFiltroEstado('todos');
    setFiltroUrgente(false);
    setBusqueda('');
    setSearchParams({});
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEstadoBadge = (estado: string, urgente: boolean = false) => {
    const baseClasses = "px-3 py-1 rounded-full text-xs font-medium";
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

  const navigateToOrdenDetalle = (ordenId: number) => {
    navigate(`/medico/orden/${ordenId}`);
  };

  const navigateBack = () => {
    navigate('/MedicoDashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando órdenes...</p>
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
            onClick={navigateBack}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <button
                onClick={navigateBack}
                className="mr-4 p-2 text-gray-600 hover:text-gray-900"
              >
                ← Volver
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  📋 Mis Órdenes
                </h1>
                <p className="text-gray-600">
                  Gestión de órdenes de análisis
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/medico/nueva-solicitud')}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              + Nueva Orden
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Filtros */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Filtro Estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todos">Todos los estados</option>
                <option value="pendiente">Pendientes</option>
                <option value="en_proceso">En Proceso</option>
                <option value="completado">Completadas</option>
              </select>
            </div>

            {/* Filtro Urgente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prioridad
              </label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="urgente"
                  checked={filtroUrgente}
                  onChange={(e) => setFiltroUrgente(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="urgente" className="ml-2 text-sm text-gray-700">
                  Solo urgentes
                </label>
              </div>
            </div>

            {/* Búsqueda */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar
              </label>
              <input
                type="text"
                placeholder="Paciente, DNI, N° Orden..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Botones */}
            <div className="flex items-end space-x-2">
              <button
                onClick={aplicarFiltros}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Aplicar
              </button>
              <button
                onClick={limpiarFiltros}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Órdenes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Header de la tabla */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Órdenes ({ordenes.length})
              </h3>
              <div className="text-sm text-gray-500">
                {filtroEstado !== 'todos' && `Filtro: ${filtroEstado}`}
                {filtroUrgente && ` • Solo urgentes`}
              </div>
            </div>
          </div>

          {/* Tabla */}
          <div className="overflow-x-auto">
            {ordenes.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Orden
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paciente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progreso
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {ordenes.map((orden) => (
                    <tr key={orden.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {orden.nro_orden}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {orden.id}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {orden.paciente.nombre} {orden.paciente.apellido}
                          </div>
                          <div className="text-sm text-gray-500">
                            DNI: {orden.paciente.dni} • {orden.paciente.edad} años
                          </div>
                          <div className="text-xs text-gray-400">
                            {orden.paciente.mutual}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getEstadoBadge(orden.estado, orden.urgente)}>
                          {orden.urgente && '🚨 '}
                          {orden.estado.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm text-gray-900">
                            {orden.progreso.analisis_listos}/{orden.progreso.total_analisis}
                          </div>
                          <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${orden.progreso.porcentaje}%` }}
                            ></div>
                          </div>
                          <div className="ml-2 text-xs text-gray-500">
                            {orden.progreso.porcentaje}%
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900">
                            {formatFecha(orden.fecha_ingreso)}
                          </div>
                          {orden.fecha_finalizacion && (
                            <div className="text-xs text-gray-500">
                              Finalizada: {formatFecha(orden.fecha_finalizacion)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => navigateToOrdenDetalle(orden.id)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Ver detalles
                        </button>
                        {orden.estado === 'completado' && (
                          <button className="text-green-600 hover:text-green-900">
                            Descargar PDF
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📋</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No se encontraron órdenes
                </h3>
                <p className="text-gray-500 mb-4">
                  {filtroEstado !== 'todos' || filtroUrgente || busqueda
                    ? 'Intenta cambiar los filtros de búsqueda'
                    : 'Aún no tienes órdenes creadas'}
                </p>
                {(!filtroEstado && !filtroUrgente && !busqueda) && (
                  <button
                    onClick={() => navigate('/medico/nueva-solicitud')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Crear primera orden
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Estadísticas rápidas */}
        {ordenes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="text-2xl mr-3">📊</div>
                <div>
                  <p className="text-sm text-gray-500">Total mostradas</p>
                  <p className="text-xl font-bold text-gray-900">{ordenes.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="text-2xl mr-3">⏳</div>
                <div>
                  <p className="text-sm text-gray-500">Pendientes</p>
                  <p className="text-xl font-bold text-yellow-600">
                    {ordenes.filter(o => o.estado === 'pendiente').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="text-2xl mr-3">🔄</div>
                <div>
                  <p className="text-sm text-gray-500">En proceso</p>
                  <p className="text-xl font-bold text-blue-600">
                    {ordenes.filter(o => o.estado === 'en_proceso').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="text-2xl mr-3">🚨</div>
                <div>
                  <p className="text-sm text-gray-500">Urgentes</p>
                  <p className="text-xl font-bold text-red-600">
                    {ordenes.filter(o => o.urgente).length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}