// src/pages/medico/OrdenDetalle.tsx

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

interface Paciente {
  nro_ficha: number;
  nombre: string;
  apellido: string;
  dni: number;
  fecha_nacimiento: string;
  edad: number;
  sexo: string;
  telefono: string;
  direccion: string;
  email: string;
  mutual: string;
  nro_afiliado: string;
  grupo_sanguineo: string;
}

interface Analisis {
  id: number;
  codigo: number;
  descripcion: string;
  tipo: string;
  estado: string;
  fecha_realizacion: string | null;
  valor_hallado: string | null;
  unidad_hallada: string | null;
  valor_referencia: string | null;
  interpretacion: string | null;
  observaciones: string | null;
  tecnico_responsable: string | null;
}

interface OrdenDetalle {
  id: number;
  nro_orden: string;
  fecha_ingreso: string;
  fecha_procesamiento: string | null;
  fecha_finalizacion: string | null;
  fecha_toma_muestra: string | null;
  estado: string;
  urgente: boolean;
  observaciones: string | null;
  instrucciones_paciente: string | null;
  requiere_ayuno: boolean;
  costo_total: number | null;
  paciente: Paciente;
  medico_solicitante: {
    nombre: string;
    apellido: string;
    especialidad: string;
    matricula: string;
  };
  bioquimico_responsable: {
    nombre: string;
    apellido: string;
  } | null;
  analisis: Analisis[];
  resumen: {
    total_analisis: number;
    analisis_pendientes: number;
    analisis_procesando: number;
    analisis_finalizados: number;
    porcentaje_completado: number;
  };
}

interface OrdenDetalleResponse {
  success: boolean;
  orden: OrdenDetalle;
}

export default function OrdenDetalle() {
  const navigate = useNavigate();
  const { id_orden } = useParams<{ id_orden: string }>();
  const [orden, setOrden] = useState<OrdenDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const usuario = localStorage.getItem("usuario");
    if (!usuario) {
      navigate("/login");
      return;
    }

    if (!id_orden) {
      navigate("/medico/ordenes");
      return;
    }

    const parsedUsuario = JSON.parse(usuario);
    cargarOrdenDetalle(parsedUsuario.id, parseInt(id_orden));
  }, [navigate, id_orden]);

  const cargarOrdenDetalle = async (medicoId: number, ordenId: number) => {
    try {
      setLoading(true);
      
      const response = await axios.get<OrdenDetalleResponse>(
        `http://localhost:5000/api/medico/${medicoId}/orden/${ordenId}`
      );

      if (response.data.success) {
        setOrden(response.data.orden);
      } else {
        setError("Orden no encontrada");
      }
    } catch (error: any) {
      console.error("Error al cargar orden:", error);
      if (error.response?.status === 404) {
        setError("Orden no encontrada");
      } else {
        setError("Error al cargar la orden");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatFecha = (fecha: string | null) => {
    if (!fecha) return 'No disponible';
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEstadoBadge = (estado: string) => {
    const baseClasses = "px-3 py-1 rounded-full text-sm font-medium";
    
    switch (estado) {
      case 'pendiente':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'procesando':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'finalizado':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'cancelado':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getEstadoOrden = (estado: string) => {
    const baseClasses = "px-4 py-2 rounded-full text-sm font-medium";
    
    switch (estado) {
      case 'pendiente':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'en_proceso':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'completado':
        return `${baseClasses} bg-green-100 text-green-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const navigateBack = () => {
    navigate('/medico/ordenes');
  };

  const generarPDF = () => {
    // TODO: Implementar generación de PDF
    alert('Funcionalidad de PDF en desarrollo');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando detalle de orden...</p>
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
            onClick={navigateBack}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Volver a órdenes
          </button>
        </div>
      </div>
    );
  }

  if (!orden) {
    return <div>No hay datos disponibles</div>;
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
                  📋 {orden.nro_orden}
                </h1>
                <p className="text-gray-600">
                  Detalle de orden de análisis
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {orden.urgente && (
                <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                  🚨 URGENTE
                </span>
              )}
              <span className={getEstadoOrden(orden.estado)}>
                {orden.estado.toUpperCase()}
              </span>
              {orden.estado === 'completado' && (
                <button
                  onClick={generarPDF}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  📄 Descargar PDF
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Información General */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Datos de la Orden */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              📋 Información de la Orden
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Número de Orden</p>
                <p className="font-medium text-gray-900">{orden.nro_orden}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Fecha de Solicitud</p>
                <p className="font-medium text-gray-900">{formatFecha(orden.fecha_ingreso)}</p>
              </div>
              {orden.fecha_toma_muestra && (
                <div>
                  <p className="text-sm text-gray-500">Fecha Toma de Muestra</p>
                  <p className="font-medium text-gray-900">{formatFecha(orden.fecha_toma_muestra)}</p>
                </div>
              )}
              {orden.fecha_finalizacion && (
                <div>
                  <p className="text-sm text-gray-500">Fecha de Finalización</p>
                  <p className="font-medium text-gray-900">{formatFecha(orden.fecha_finalizacion)}</p>
                </div>
              )}
              {orden.costo_total && (
                <div>
                  <p className="text-sm text-gray-500">Costo Total</p>
                  <p className="font-medium text-gray-900">${orden.costo_total.toFixed(2)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Datos del Paciente */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              👤 Información del Paciente
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Nombre Completo</p>
                <p className="font-medium text-gray-900">
                  {orden.paciente.nombre} {orden.paciente.apellido}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">DNI</p>
                <p className="font-medium text-gray-900">{orden.paciente.dni}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Edad</p>
                <p className="font-medium text-gray-900">
                  {orden.paciente.edad} años ({orden.paciente.sexo === 'M' ? 'Masculino' : 'Femenino'})
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Obra Social</p>
                <p className="font-medium text-gray-900">{orden.paciente.mutual}</p>
                {orden.paciente.nro_afiliado && (
                  <p className="text-sm text-gray-500">N° Afiliado: {orden.paciente.nro_afiliado}</p>
                )}
              </div>
              {orden.paciente.grupo_sanguineo && (
                <div>
                  <p className="text-sm text-gray-500">Grupo Sanguíneo</p>
                  <p className="font-medium text-gray-900">{orden.paciente.grupo_sanguineo}</p>
                </div>
              )}
            </div>
          </div>

          {/* Resumen de Progreso */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              📊 Progreso de Análisis
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Progreso General</span>
                  <span className="text-sm font-medium text-gray-900">
                    {orden.resumen.porcentaje_completado}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full" 
                    style={{ width: `${orden.resumen.porcentaje_completado}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{orden.resumen.total_analisis}</p>
                  <p className="text-sm text-gray-500">Total</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{orden.resumen.analisis_finalizados}</p>
                  <p className="text-sm text-gray-500">Finalizados</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{orden.resumen.analisis_procesando}</p>
                  <p className="text-sm text-gray-500">En Proceso</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">{orden.resumen.analisis_pendientes}</p>
                  <p className="text-sm text-gray-500">Pendientes</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Instrucciones y Observaciones */}
        {(orden.instrucciones_paciente || orden.observaciones || orden.requiere_ayuno) && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              📝 Instrucciones y Observaciones
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {orden.requiere_ayuno && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">⏰</span>
                    <div>
                      <p className="font-medium text-yellow-800">Requiere Ayuno</p>
                      <p className="text-sm text-yellow-700">El paciente debe presentarse en ayunas</p>
                    </div>
                  </div>
                </div>
              )}
              
              {orden.instrucciones_paciente && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Instrucciones para el Paciente:</p>
                  <p className="text-gray-900 bg-blue-50 p-3 rounded-lg">{orden.instrucciones_paciente}</p>
                </div>
              )}
              
              {orden.observaciones && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Observaciones Médicas:</p>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{orden.observaciones}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Lista de Análisis */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              🧪 Análisis Solicitados ({orden.analisis.length})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Análisis
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resultado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Técnico
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orden.analisis.map((analisis) => (
                  <tr key={analisis.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {analisis.descripcion}
                        </div>
                        <div className="text-sm text-gray-500">
                          {analisis.tipo} • Código: {analisis.codigo}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getEstadoBadge(analisis.estado)}>
                        {analisis.estado.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {analisis.valor_hallado ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {analisis.valor_hallado} {analisis.unidad_hallada}
                          </div>
                          {analisis.valor_referencia && (
                            <div className="text-sm text-gray-500">
                              Ref: {analisis.valor_referencia}
                            </div>
                          )}
                          {analisis.interpretacion && (
                            <div className={`text-sm font-medium ${
                              analisis.interpretacion === 'normal' ? 'text-green-600' :
                              analisis.interpretacion === 'alto' || analisis.interpretacion === 'bajo' ? 'text-orange-600' :
                              analisis.interpretacion === 'critico' ? 'text-red-600' : 'text-gray-600'
                            }`}>
                              {analisis.interpretacion.toUpperCase()}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">Pendiente</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {analisis.tecnico_responsable || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatFecha(analisis.fecha_realizacion)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Información Adicional */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          
          {/* Médico Solicitante */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              👨‍⚕️ Médico Solicitante
            </h3>
            <div className="space-y-2">
              <p className="font-medium text-gray-900">
                Dr. {orden.medico_solicitante.nombre} {orden.medico_solicitante.apellido}
              </p>
              <p className="text-sm text-gray-600">{orden.medico_solicitante.especialidad}</p>
              <p className="text-sm text-gray-500">Mat: {orden.medico_solicitante.matricula}</p>
            </div>
          </div>

          {/* Bioquímico Responsable */}
          {orden.bioquimico_responsable && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                🔬 Bioquímico Responsable
              </h3>
              <div className="space-y-2">
                <p className="font-medium text-gray-900">
                  {orden.bioquimico_responsable.nombre} {orden.bioquimico_responsable.apellido}
                </p>
                <p className="text-sm text-gray-600">Bioquímico/a</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}