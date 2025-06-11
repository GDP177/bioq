// src/pages/medico/OrdenDetalle.tsx

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

// Componentes UI reutilizables
import { Button } from "@/components/ui/button";
import { CustomCard } from "@/components/ui/CustomCard";

// Interfaces
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

// Componente Badge
const Badge = ({ 
  children, 
  variant = 'default' 
}: { 
  children: React.ReactNode; 
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' 
}) => {
  const baseClasses = "px-3 py-1 rounded-full text-xs font-medium";
  const variants = {
    default: "bg-gray-100 text-gray-800",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    danger: "bg-red-100 text-red-800",
    info: "bg-blue-100 text-blue-800"
  };
  
  return (
    <span className={`${baseClasses} ${variants[variant]}`}>
      {children}
    </span>
  );
};

// Componente Loading
const LoadingSpinner = () => (
  <div className="min-h-screen bg-blue-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Cargando detalle de orden...</p>
    </div>
  </div>
);

// Componente StatsCard
const StatsCard = ({ 
  title, 
  value, 
  icon, 
  color = 'blue' 
}: { 
  title: string; 
  value: number | string; 
  icon: string; 
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red' 
}) => {
  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    orange: 'text-orange-600',
    purple: 'text-purple-600',
    red: 'text-red-600',
  };

  return (
    <div className="text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <p className={`text-2xl font-bold ${colorClasses[color]}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      <p className="text-sm text-gray-500">{title}</p>
    </div>
  );
};

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

    try {
      const parsedUsuario = JSON.parse(usuario);
      if (parsedUsuario?.id && id_orden) {
        cargarOrdenDetalle(parsedUsuario.id, parseInt(id_orden));
      } else {
        setError("Datos de usuario o orden inválidos");
        navigate("/medico/ordenes");
      }
    } catch (err) {
      console.error("Error al parsear usuario:", err);
      setError("Error de autenticación");
      navigate("/login");
    }
  }, [navigate, id_orden]);

  const cargarOrdenDetalle = async (medicoId: number, ordenId: number) => {
    try {
      setLoading(true);
      setError("");
      
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await axios.get<OrdenDetalleResponse>(
        `${apiUrl}/medico/${medicoId}/orden/${ordenId}`,
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (response.data.success) {
        setOrden(response.data.orden);
      } else {
        setError("Error al cargar el detalle de la orden");
      }
    } catch (error: any) {
      console.error("Error al cargar orden:", error);
      if (error.code === 'ECONNABORTED') {
        setError("Tiempo de espera agotado. Verifique la conexión.");
      } else if (error.response?.status === 401) {
        setError("Sesión expirada. Inicie sesión nuevamente.");
        navigate("/login");
      } else if (error.response?.status === 404) {
        setError("Orden no encontrada.");
      } else if (error.response?.status >= 500) {
        setError("Error del servidor. Intente más tarde.");
      } else {
        setError("Error al cargar el detalle de la orden");
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const formatFecha = (fecha: string | null | undefined): string => {
    if (!fecha) return 'No disponible';
    try {
      return new Date(fecha).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  const formatFechaHora = (fecha: string | null | undefined): string => {
    if (!fecha) return 'No disponible';
    try {
      return new Date(fecha).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'pendiente':
        return 'warning';
      case 'procesando':
      case 'en_proceso':
        return 'info';
      case 'finalizado':
      case 'completado':
        return 'success';
      case 'cancelado':
        return 'danger';
      default:
        return 'default';
    }
  };

  const getInterpretacionBadge = (interpretacion: string | null) => {
    if (!interpretacion) return 'default';
    
    switch (interpretacion.toLowerCase()) {
      case 'normal':
        return 'success';
      case 'alto':
      case 'bajo':
        return 'warning';
      case 'critico':
      case 'crítico':
        return 'danger';
      default:
        return 'default';
    }
  };

  const navigateBack = () => {
    navigate('/medico/ordenes');
  };

  const generarPDF = async () => {
    try {
      // Implementar generación de PDF
      console.log("Generando PDF para orden:", orden?.id);
      alert('Funcionalidad de PDF en desarrollo');
    } catch (error) {
      console.error("Error al generar PDF:", error);
      alert('Error al generar PDF');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !orden) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-6xl mb-4">❌</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error || "Orden no encontrada"}</p>
          <Button onClick={navigateBack}>
            Volver a Órdenes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={navigateBack}
                className="mr-4"
                aria-label="Volver a órdenes"
              >
                ← Volver
              </Button>
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
                <Badge variant="danger">
                  🚨 URGENTE
                </Badge>
              )}
              <Badge variant={getEstadoBadge(orden.estado)}>
                {orden.estado.toUpperCase()}
              </Badge>
              {(orden.estado === 'completado' || orden.estado === 'finalizado') && (
                <Button
                  onClick={generarPDF}
                  className="bg-green-600 hover:bg-green-700"
                >
                  📄 Descargar PDF
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Información General */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Datos de la Orden */}
          <CustomCard title="📋 Información de la Orden">
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
              {orden.costo_total && Number(orden.costo_total) > 0 && (
                <div>
                  <p className="text-sm text-gray-500">Costo Total</p>
                  <p className="font-medium text-gray-900">${Number(orden.costo_total).toFixed(2)}</p>
                </div>
              )}
            </div>
          </CustomCard>

          {/* Datos del Paciente */}
          <CustomCard title="👤 Información del Paciente">
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
              {orden.paciente.mutual && (
                <div>
                  <p className="text-sm text-gray-500">Obra Social</p>
                  <p className="font-medium text-gray-900">{orden.paciente.mutual}</p>
                </div>
              )}
              {orden.paciente.grupo_sanguineo && (
                <div>
                  <p className="text-sm text-gray-500">Grupo Sanguíneo</p>
                  <p className="font-medium text-gray-900">{orden.paciente.grupo_sanguineo}</p>
                </div>
              )}
            </div>
          </CustomCard>

          {/* Resumen de Análisis */}
          <CustomCard title="📊 Resumen de Análisis">
            <div className="grid grid-cols-2 gap-4">
              <StatsCard
                title="Total"
                value={orden.resumen.total_analisis}
                icon="🧪"
                color="blue"
              />
              <StatsCard
                title="Finalizados"
                value={orden.resumen.analisis_finalizados}
                icon="✅"
                color="green"
              />
              <StatsCard
                title="En Proceso"
                value={orden.resumen.analisis_procesando}
                icon="🔄"
                color="orange"
              />
              <StatsCard
                title="Pendientes"
                value={orden.resumen.analisis_pendientes}
                icon="⏳"
                color="red"
              />
            </div>
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Progreso General</span>
                <span className="text-sm text-gray-600">{orden.resumen.porcentaje_completado}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${orden.resumen.porcentaje_completado}%` }}
                ></div>
              </div>
            </div>
          </CustomCard>
        </div>

        {/* Instrucciones y Observaciones */}
        {(orden.instrucciones_paciente || orden.observaciones || orden.requiere_ayuno) && (
          <CustomCard title="📝 Instrucciones y Observaciones" className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {orden.requiere_ayuno && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center mb-2">
                    <span className="text-yellow-600 text-lg mr-2">⚠️</span>
                    <h4 className="font-medium text-yellow-800">Requiere Ayuno</h4>
                  </div>
                  <p className="text-sm text-yellow-700">
                    El paciente debe presentarse en ayunas para realizar los análisis.
                  </p>
                </div>
              )}
              
              {orden.instrucciones_paciente && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Instrucciones para el Paciente</h4>
                  <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded-lg">
                    {orden.instrucciones_paciente}
                  </p>
                </div>
              )}
              
              {orden.observaciones && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Observaciones Médicas</h4>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {orden.observaciones}
                  </p>
                </div>
              )}
            </div>
          </CustomCard>
        )}

        {/* Lista de Análisis */}
        <CustomCard title={`🧪 Análisis Solicitados (${orden.analisis.length})`}>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Análisis
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resultado
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Técnico
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                      <Badge variant={getEstadoBadge(analisis.estado)}>
                        {analisis.estado.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      {analisis.valor_hallado ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {analisis.valor_hallado} {analisis.unidad_hallada || ''}
                          </div>
                          {analisis.valor_referencia && (
                            <div className="text-sm text-gray-500">
                              Ref: {analisis.valor_referencia}
                            </div>
                          )}
                          {analisis.interpretacion && (
                            <Badge variant={getInterpretacionBadge(analisis.interpretacion)}>
                              {analisis.interpretacion.toUpperCase()}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">Sin resultado</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {analisis.tecnico_responsable || 'No asignado'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatFechaHora(analisis.fecha_realizacion)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CustomCard>

        {/* Información del Médico y Bioquímico */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <CustomCard title="👨‍⚕️ Médico Solicitante">
            <div className="space-y-2">
              <p><span className="font-medium">Nombre:</span> {orden.medico_solicitante.nombre} {orden.medico_solicitante.apellido}</p>
              <p><span className="font-medium">Especialidad:</span> {orden.medico_solicitante.especialidad}</p>
              <p><span className="font-medium">Matrícula:</span> {orden.medico_solicitante.matricula}</p>
            </div>
          </CustomCard>

          {orden.bioquimico_responsable && (
            <CustomCard title="🧬 Bioquímico Responsable">
              <div className="space-y-2">
                <p><span className="font-medium">Nombre:</span> {orden.bioquimico_responsable.nombre} {orden.bioquimico_responsable.apellido}</p>
              </div>
            </CustomCard>
          )}
        </div>
      </main>
    </div>
  );
}