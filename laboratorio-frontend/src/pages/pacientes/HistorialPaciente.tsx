// src/pages/pacientes/HistorialPaciente.tsx

import React, { useState, useEffect } from "react";

// ============================================
// INTERFACES LOCALES
// ============================================

interface Paciente {
  nro_ficha: number;
  nombre: string;
  apellido: string;
  dni: string;
  fecha_nacimiento: string;
  fecha_alta: string;
  edad: number;
  sexo: string;
  telefono?: string;
  direccion?: string;
  mutual?: string;
  nro_afiliado?: string;
  grupo_sanguineo?: string;
  estado: string;
}

interface Analisis {
  codigo: number;
  descripcion: string;
  tipo: string;
  fecha_realizacion?: string;
  valor_hallado?: string;
  unidad_hallada?: string;
  valor_referencia: {
    minimo?: number;
    maximo?: number;
    unidad?: string;
    tipo_persona?: string;
  };
  estado: string;
}

interface Orden {
  id_orden: number;
  fecha_ingreso: string;
  urgente: boolean;
  medico_solicitante: {
    nombre: string;
    apellido: string;
  };
  bioquimico_responsable?: {
    nombre: string;
    apellido: string;
  } | null;
  total_analisis: number;
  analisis: Analisis[];
}

interface EventoCronologia {
  fecha: string;
  tipo: string;
  descripcion: string;
  icono: string;
  urgente?: boolean;
  detalles?: {
    id_orden?: number;
    total_analisis?: number;
    medico?: string;
    codigo?: number;
    valor_hallado?: string;
    unidad?: string;
  };
}

interface Estadisticas {
  total_ordenes: number;
  total_analisis: number;
  analisis_finalizados: number;
  analisis_pendientes: number;
  porcentaje_completado: number;
  primer_orden?: string;
  ultima_orden?: string;
}

interface TipoAnalisis {
  tipo: string;
  cantidad: number;
}

interface HistorialData {
  paciente: Paciente;
  estadisticas: Estadisticas;
  ordenes: Orden[];
  tipos_analisis: TipoAnalisis[];
  cronologia: EventoCronologia[];
}

interface ApiResponse {
  success: boolean;
  historial?: HistorialData;
  message?: string;
  error?: string;
}

// ============================================
// COMPONENTES UI BÁSICOS
// ============================================

const Button = ({ 
  onClick, 
  children, 
  variant = "primary", 
  className = "",
  disabled = false 
}: {
  onClick: () => void;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
  disabled?: boolean;
}) => {
  const baseClasses = "px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300"
  };
  
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const Badge = ({ 
  children, 
  variant = "default",
  className = ""
}: { 
  children: React.ReactNode; 
  variant?: "default" | "success" | "warning" | "danger" | "info";
  className?: string;
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
    <span className={`${baseClasses} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function HistorialPaciente(): JSX.Element {
  const [nroFicha, setNroFicha] = useState<string>("");
  const [historial, setHistorial] = useState<HistorialData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [vistaActual, setVistaActual] = useState<'resumen' | 'ordenes' | 'cronologia' | 'estadisticas'>('resumen');

  // ============================================
  // EFECTOS Y FUNCIONES
  // ============================================

  useEffect(() => {
    const pathParts = window.location.pathname.split('/');
    const fichaIndex = pathParts.indexOf('paciente') + 1;
    
    if (fichaIndex > 0 && pathParts[fichaIndex]) {
      const ficha = pathParts[fichaIndex];
      setNroFicha(ficha);
      cargarHistorialPaciente(ficha);
    } else {
      setError("Número de ficha no válido");
      setLoading(false);
    }
  }, []);

  const cargarHistorialPaciente = async (nroFicha: string): Promise<void> => {
    try {
      setLoading(true);
      console.log('📋 Cargando historial del paciente con ficha:', nroFicha);
      
      const apiUrl = import.meta.env?.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiUrl}/paciente/historial/${nroFicha}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: ApiResponse = await response.json();
      console.log('📋 Historial obtenido:', data);

      if (data.success && data.historial) {
        setHistorial(data.historial);
        setError("");
      } else {
        setError(data.message || "No se pudo cargar el historial");
      }
    } catch (error: any) {
      console.error("💥 Error al cargar historial:", error);
      setError("Error al cargar el historial del paciente");
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // FUNCIONES AUXILIARES
  // ============================================

  const formatFecha = (fecha: string): string => {
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatFechaCompleta = (fecha: string): string => {
    return new Date(fecha).toLocaleDateString('es-AR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const getSexoCompleto = (sexo: string): string => {
    switch (sexo) {
      case 'M': return 'Masculino';
      case 'F': return 'Femenino';
      case 'X': return 'Otro';
      default: return sexo;
    }
  };

  const getEstadoBadge = (estado: string): JSX.Element => {
    switch (estado) {
      case 'finalizado':
        return <Badge variant="success">Finalizado</Badge>;
      case 'pendiente':
        return <Badge variant="warning">Pendiente</Badge>;
      case 'procesando':
        return <Badge variant="info">En Proceso</Badge>;
      default:
        return <Badge variant="default">{estado}</Badge>;
    }
  };

  const getInterpretacionColor = (analisis: Analisis): string => {
    if (!analisis.valor_hallado || !analisis.valor_referencia.minimo || !analisis.valor_referencia.maximo) {
      return 'text-gray-600';
    }

    const valor = parseFloat(analisis.valor_hallado);
    const min = analisis.valor_referencia.minimo;
    const max = analisis.valor_referencia.maximo;

    if (valor < min || valor > max) {
      return 'text-red-600 font-semibold';
    }
    return 'text-green-600';
  };

  // ============================================
  // FUNCIONES DE NAVEGACIÓN
  // ============================================

  const navigateBack = (): void => {
    window.location.href = '/medico/pacientes';
  };

  const navigateToDashboard = (): void => {
    window.location.href = '/medico/dashboard';
  };

  const navigateToNuevaOrden = (): void => {
    window.location.href = '/medico/nueva-solicitud';
  };

  const navigateToEditarPaciente = (): void => {
    window.location.href = `/medico/paciente/${nroFicha}/editar`;
  };

  // ============================================
  // RENDERIZADO CONDICIONAL
  // ============================================

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando historial médico...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error al cargar historial</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-x-3">
            <Button onClick={navigateToDashboard} variant="secondary">
              Ir al Dashboard
            </Button>
            <Button onClick={navigateBack}>
              Ver Lista de Pacientes
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!historial) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 text-6xl mb-4">📋</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Sin historial</h2>
          <p className="text-gray-600 mb-6">No hay historial médico disponible para este paciente</p>
          <Button onClick={navigateBack}>Ver Lista de Pacientes</Button>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDERIZADO PRINCIPAL
  // ============================================

  return (
    <div className="min-h-screen bg-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">📋 Historial Médico</h1>
              <p className="mt-1 text-sm text-gray-500">
                {historial.paciente.nombre} {historial.paciente.apellido} - Ficha #{historial.paciente.nro_ficha}
              </p>
            </div>
            <div className="flex space-x-3">
              <Button onClick={navigateBack} variant="secondary">
                ← Volver
              </Button>
              <Button onClick={navigateToEditarPaciente} variant="secondary">
                ✏️ Editar
              </Button>
              <Button onClick={navigateToNuevaOrden} className="bg-green-600 hover:bg-green-700">
                🧪 Nueva Orden
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Información del paciente */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Información Personal</h4>
              <p className="text-sm text-gray-600">
                DNI: <span className="font-mono">{historial.paciente.dni}</span>
              </p>
              <p className="text-sm text-gray-600">Edad: {historial.paciente.edad} años</p>
              <p className="text-sm text-gray-600">Sexo: {getSexoCompleto(historial.paciente.sexo)}</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Contacto</h4>
              <p className="text-sm text-gray-600">
                Teléfono: {historial.paciente.telefono || 'No especificado'}
              </p>
              <p className="text-sm text-gray-600">
                Dirección: {historial.paciente.direccion || 'No especificada'}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Información Médica</h4>
              <p className="text-sm text-gray-600">
                Obra Social: {historial.paciente.mutual || 'No especificada'}
              </p>
              <p className="text-sm text-gray-600">
                Nº Afiliado: {historial.paciente.nro_afiliado || 'N/A'}
              </p>
              <p className="text-sm text-gray-600">
                Grupo Sanguíneo: <span className="font-semibold text-red-600">
                  {historial.paciente.grupo_sanguineo || 'No especificado'}
                </span>
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Fechas Importantes</h4>
              <p className="text-sm text-gray-600">
                Registro: {formatFecha(historial.paciente.fecha_alta)}
              </p>
              <p className="text-sm text-gray-600">
                Nacimiento: {formatFecha(historial.paciente.fecha_nacimiento)}
              </p>
            </div>
          </div>
        </div>

        {/* Estadísticas generales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="text-3xl mr-4">📋</div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Órdenes</p>
                <p className="text-2xl font-bold text-blue-600">{historial.estadisticas.total_ordenes}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="text-3xl mr-4">🧪</div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Análisis</p>
                <p className="text-2xl font-bold text-purple-600">{historial.estadisticas.total_analisis}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="text-3xl mr-4">✅</div>
              <div>
                <p className="text-sm font-medium text-gray-500">Finalizados</p>
                <p className="text-2xl font-bold text-green-600">{historial.estadisticas.analisis_finalizados}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="text-3xl mr-4">⏳</div>
              <div>
                <p className="text-sm font-medium text-gray-500">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-600">{historial.estadisticas.analisis_pendientes}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navegación de vistas */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { key: 'resumen', label: 'Resumen', icon: '📊' },
                { key: 'ordenes', label: 'Órdenes', icon: '📋' },
                { key: 'cronologia', label: 'Cronología', icon: '📅' },
                { key: 'estadisticas', label: 'Estadísticas', icon: '📈' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setVistaActual(tab.key as any)}
                  className={`${
                    vistaActual === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Vista Resumen */}
            {vistaActual === 'resumen' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Últimas órdenes */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4">Últimas Órdenes</h4>
                    <div className="space-y-3">
                      {historial.ordenes.slice(0, 5).map((orden: Orden) => (
                        <div key={orden.id_orden} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-medium text-gray-900">Orden #{orden.id_orden}</p>
                              <p className="text-sm text-gray-600">{formatFecha(orden.fecha_ingreso)}</p>
                            </div>
                            <div className="flex space-x-2">
                              {orden.urgente && <Badge variant="danger">Urgente</Badge>}
                              <Badge variant="info">{orden.total_analisis} análisis</Badge>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">
                            Dr. {orden.medico_solicitante.nombre} {orden.medico_solicitante.apellido}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tipos de análisis más frecuentes */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4">Tipos de Análisis Más Frecuentes</h4>
                    <div className="space-y-3">
                      {historial.tipos_analisis.map((tipo, index) => (
                        <div key={index} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
                          <span className="text-gray-900">{tipo.tipo}</span>
                          <Badge variant="info">{tipo.cantidad}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Progreso general */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Progreso General</h4>
                  <div className="bg-gray-200 rounded-full h-4 mb-2">
                    <div 
                      className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                      style={{ width: `${historial.estadisticas.porcentaje_completado}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600">
                    {historial.estadisticas.porcentaje_completado}% de análisis completados 
                    ({historial.estadisticas.analisis_finalizados} de {historial.estadisticas.total_analisis})
                  </p>
                </div>
              </div>
            )}

            {/* Vista Órdenes */}
            {vistaActual === 'ordenes' && (
              <div className="space-y-4">
                {historial.ordenes.map((orden: Orden) => (
                  <div key={orden.id_orden} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h5 className="font-semibold text-gray-900">Orden #{orden.id_orden}</h5>
                        <p className="text-sm text-gray-600">{formatFechaCompleta(orden.fecha_ingreso)}</p>
                        <p className="text-sm text-gray-600">
                          Dr. {orden.medico_solicitante.nombre} {orden.medico_solicitante.apellido}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        {orden.urgente && <Badge variant="danger">Urgente</Badge>}
                        <Badge variant="info">{orden.total_analisis} análisis</Badge>
                      </div>
                    </div>
                    
                    {/* Lista de análisis */}
                    <div className="border-t border-gray-200 pt-4">
                      <h6 className="font-medium text-gray-900 mb-3">Análisis:</h6>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {orden.analisis.map((analisis: Analisis, index: number) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-900">{analisis.descripcion}</p>
                              <p className="text-sm text-gray-600">{analisis.tipo}</p>
                              {analisis.valor_hallado && (
                                <p className={`text-sm ${getInterpretacionColor(analisis)}`}>
                                  {analisis.valor_hallado} {analisis.unidad_hallada}
                                </p>
                              )}
                            </div>
                            {getEstadoBadge(analisis.estado)}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Vista Cronología */}
            {vistaActual === 'cronologia' && (
              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-300"></div>
                  {historial.cronologia.map((evento: EventoCronologia, index: number) => (
                    <div key={index} className="relative flex items-start space-x-4 pb-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center text-sm">
                        {evento.icono}
                      </div>
                      <div className="flex-grow">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">{evento.descripcion}</p>
                            <p className="text-sm text-gray-600">{formatFechaCompleta(evento.fecha)}</p>
                            {evento.detalles && (
                              <div className="text-xs text-gray-500 mt-1">
                                {evento.detalles.medico && `Dr. ${evento.detalles.medico}`}
                                {evento.detalles.valor_hallado && ` - Valor: ${evento.detalles.valor_hallado} ${evento.detalles.unidad || ''}`}
                              </div>
                            )}
                          </div>
                          {evento.urgente && <Badge variant="danger">Urgente</Badge>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Vista Estadísticas */}
            {vistaActual === 'estadisticas' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Resumen Temporal</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between p-3 border border-gray-200 rounded-lg">
                      <span className="text-gray-600">Primera orden</span>
                      <span className="font-medium">
                        {historial.estadisticas.primer_orden ? 
                          formatFecha(historial.estadisticas.primer_orden) : 'N/A'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between p-3 border border-gray-200 rounded-lg">
                      <span className="text-gray-600">Última orden</span>
                      <span className="font-medium">
                        {historial.estadisticas.ultima_orden ? 
                          formatFecha(historial.estadisticas.ultima_orden) : 'N/A'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between p-3 border border-gray-200 rounded-lg">
                      <span className="text-gray-600">Completitud</span>
                      <span className="font-medium">{historial.estadisticas.porcentaje_completado}%</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Distribución por Tipo</h4>
                  <div className="space-y-3">
                    {historial.tipos_analisis.map((tipo, index) => (
                      <div key={index} className="p-3 border border-gray-200 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-gray-900">{tipo.tipo}</span>
                          <Badge variant="info">{tipo.cantidad}</Badge>
                        </div>
                        <div className="bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ 
                              width: `${(tipo.cantidad / historial.estadisticas.total_analisis) * 100}%` 
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {Math.round((tipo.cantidad / historial.estadisticas.total_analisis) * 100)}% del total
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-center space-x-4">
          <Button onClick={navigateToDashboard} variant="secondary">
            🏠 Ir al Dashboard
          </Button>
          <Button onClick={navigateBack} variant="secondary">
            👥 Ver Pacientes
          </Button>
          <Button onClick={navigateToNuevaOrden} className="bg-green-600 hover:bg-green-700">
            🧪 Nueva Orden de Análisis
          </Button>
        </div>
      </div>
    </div>
  );
}