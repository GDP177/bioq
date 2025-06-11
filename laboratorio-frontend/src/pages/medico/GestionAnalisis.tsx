// src/pages/medico/GestionAnalisis.tsx

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";

// Componentes UI reutilizables
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { CustomCard } from "@/components/ui/CustomCard";

// Interfaces
interface AnalisisItem {
  id: number;
  codigo_practica: number;
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
  orden: {
    id: number;
    nro_orden: string;
    fecha_ingreso: string;
    urgente: boolean;
    paciente: {
      nombre: string;
      apellido: string;
      dni: number;
      edad: number;
    };
  };
}

interface AnalisisResponse {
  success: boolean;
  analisis: AnalisisItem[];
  total: number;
  estadisticas: {
    total_analisis: number;
    pendientes: number;
    procesando: number;
    finalizados: number;
    con_resultados: number;
  };
  filtros_aplicados: {
    estado?: string;
    tipo?: string;
    buscar?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
  };
}

type EstadoAnalisis = 'todos' | 'pendiente' | 'procesando' | 'finalizado' | 'cancelado';

// Componente Badge simple
const Badge = ({ 
  children, 
  variant = 'default',
  className = ''
}: { 
  children: React.ReactNode; 
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
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

// Componente Loading simple
const LoadingSpinner = () => (
  <div className="min-h-screen bg-blue-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Cargando análisis...</p>
    </div>
  </div>
);

// Componente Modal simple
const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children 
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <Button
            variant="ghost"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            ✕
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
};

// Componente StatsCard simple
const StatsCard = ({ 
  title, 
  value, 
  icon, 
  color = 'blue' 
}: { 
  title: string; 
  value: number | string; 
  icon: React.ReactNode; 
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red' 
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    orange: 'bg-orange-50 border-orange-200',
    purple: 'bg-purple-50 border-purple-200',
    red: 'bg-red-50 border-red-200',
  };

  const valueColorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    orange: 'text-orange-600',
    purple: 'text-purple-600',
    red: 'text-red-600',
  };

  return (
    <div className={`bg-white p-4 rounded-lg shadow-sm border-2 ${colorClasses[color]}`}>
      <div className="flex items-center">
        <div className="text-2xl mr-3">{icon}</div>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className={`text-xl font-bold ${valueColorClasses[color]}`}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
        </div>
      </div>
    </div>
  );
};

// Componente Filtros
const FiltrosSection = ({
  filtroEstado,
  setFiltroEstado,
  filtroTipo,
  setFiltroTipo,
  busqueda,
  setBusqueda,
  fechaDesde,
  setFechaDesde,
  fechaHasta,
  setFechaHasta,
  tiposDisponibles,
  limpiarFiltros
}: {
  filtroEstado: EstadoAnalisis;
  setFiltroEstado: (estado: EstadoAnalisis) => void;
  filtroTipo: string;
  setFiltroTipo: (tipo: string) => void;
  busqueda: string;
  setBusqueda: (busqueda: string) => void;
  fechaDesde: string;
  setFechaDesde: (fecha: string) => void;
  fechaHasta: string;
  setFechaHasta: (fecha: string) => void;
  tiposDisponibles: string[];
  limpiarFiltros: () => void;
}) => (
  <CustomCard className="mb-6">
    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
      <FormField htmlFor="filtro-estado" label="Estado">
        <select
          id="filtro-estado"
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value as EstadoAnalisis)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="todos">Todos</option>
          <option value="pendiente">Pendientes</option>
          <option value="procesando">Procesando</option>
          <option value="finalizado">Finalizados</option>
          <option value="cancelado">Cancelados</option>
        </select>
      </FormField>

      <FormField htmlFor="filtro-tipo" label="Tipo">
        <select
          id="filtro-tipo"
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="todos">Todos los tipos</option>
          {tiposDisponibles.map(tipo => (
            <option key={tipo} value={tipo}>{tipo}</option>
          ))}
        </select>
      </FormField>

      <FormField htmlFor="busqueda" label="Buscar">
        <Input
          id="busqueda"
          type="text"
          placeholder="Análisis, paciente..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </FormField>

      <FormField htmlFor="fecha-desde" label="Desde">
        <Input
          id="fecha-desde"
          type="date"
          value={fechaDesde}
          onChange={(e) => setFechaDesde(e.target.value)}
        />
      </FormField>

      <FormField htmlFor="fecha-hasta" label="Hasta">
        <Input
          id="fecha-hasta"
          type="date"
          value={fechaHasta}
          onChange={(e) => setFechaHasta(e.target.value)}
        />
      </FormField>

      <div className="flex items-end">
        <Button
          variant="secondary"
          onClick={limpiarFiltros}
          className="w-full"
        >
          Limpiar
        </Button>
      </div>
    </div>
  </CustomCard>
);

// Componente principal
export default function GestionAnalisis() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [analisis, setAnalisis] = useState<AnalisisItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Filtros
  const [filtroEstado, setFiltroEstado] = useState<EstadoAnalisis>(
    (searchParams.get('estado') as EstadoAnalisis) || 'todos'
  );
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  
  // Estadísticas
  const [estadisticas, setEstadisticas] = useState({
    total_analisis: 0,
    pendientes: 0,
    procesando: 0,
    finalizados: 0,
    con_resultados: 0
  });
  
  // Modal
  const [mostrarDetalle, setMostrarDetalle] = useState(false);
  const [analisisSeleccionado, setAnalisisSeleccionado] = useState<AnalisisItem | null>(null);
  
  // Tipos disponibles
  const [tiposDisponibles, setTiposDisponibles] = useState<string[]>([]);

  useEffect(() => {
    const usuario = localStorage.getItem("usuario");
    if (!usuario) {
      navigate("/login");
      return;
    }

    try {
      const parsedUsuario = JSON.parse(usuario);
      if (parsedUsuario?.id) {
        cargarAnalisis(parsedUsuario.id);
      } else {
        setError("Usuario inválido");
        navigate("/login");
      }
    } catch (err) {
      console.error("Error al parsear usuario:", err);
      setError("Error de autenticación");
      navigate("/login");
    }
  }, [navigate, filtroEstado, filtroTipo, busqueda, fechaDesde, fechaHasta]);

  const cargarAnalisis = async (medicoId: number) => {
    try {
      setLoading(true);
      setError("");
      
      const params = new URLSearchParams();
      if (filtroEstado !== 'todos') params.set('estado', filtroEstado);
      if (filtroTipo !== 'todos') params.set('tipo', filtroTipo);
      if (busqueda.trim()) params.set('buscar', busqueda.trim());
      if (fechaDesde) params.set('fecha_desde', fechaDesde);
      if (fechaHasta) params.set('fecha_hasta', fechaHasta);

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await axios.get<AnalisisResponse>(
        `${apiUrl}/medico/${medicoId}/analisis?${params.toString()}`,
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (response.data.success) {
        setAnalisis(response.data.analisis || []);
        setEstadisticas(response.data.estadisticas || {
          total_analisis: 0,
          pendientes: 0,
          procesando: 0,
          finalizados: 0,
          con_resultados: 0
        });
        
        const tipos = Array.from(
          new Set(
            response.data.analisis
              ?.map(a => a.tipo)
              ?.filter((tipo): tipo is string => Boolean(tipo))
          )
        );
        setTiposDisponibles(tipos);
      } else {
        setError("Error al cargar análisis");
      }
    } catch (error: any) {
      console.error("Error al cargar análisis:", error);
      if (error.code === 'ECONNABORTED') {
        setError("Tiempo de espera agotado. Verifique la conexión.");
      } else if (error.response?.status === 401) {
        setError("Sesión expirada. Inicie sesión nuevamente.");
        navigate("/login");
      } else if (error.response?.status >= 500) {
        setError("Error del servidor. Intente más tarde.");
      } else {
        setError("Error al cargar los análisis");
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
        return 'info';
      case 'finalizado':
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

  const limpiarFiltros = () => {
    setFiltroEstado('todos');
    setFiltroTipo('todos');
    setBusqueda('');
    setFechaDesde('');
    setFechaHasta('');
  };

  const exportarResultados = async () => {
    try {
      const csvContent = analisis.map(item => ({
        'Análisis': item.descripcion,
        'Código': item.codigo_practica,
        'Tipo': item.tipo,
        'Estado': item.estado,
        'Paciente': `${item.orden.paciente.nombre} ${item.orden.paciente.apellido}`,
        'DNI': item.orden.paciente.dni,
        'Orden': item.orden.nro_orden,
        'Valor Hallado': item.valor_hallado || 'Sin resultado',
        'Unidad': item.unidad_hallada || '',
        'Interpretación': item.interpretacion || '',
        'Fecha Realización': formatFechaHora(item.fecha_realizacion),
        'Técnico': item.tecnico_responsable || ''
      }));

      console.log("Datos para exportar:", csvContent);
      alert('Funcionalidad de exportación en desarrollo. Ver consola para datos.');
    } catch (error) {
      console.error("Error al exportar:", error);
      alert('Error al exportar los resultados');
    }
  };

  const verDetalleAnalisis = (analisisItem: AnalisisItem) => {
    setAnalisisSeleccionado(analisisItem);
    setMostrarDetalle(true);
  };

  const navegarAOrden = (ordenId: number) => {
    navigate(`/medico/orden/${ordenId}`);
  };

  const navigateBack = () => {
    navigate('/MedicoDashboard');
  };

  if (loading) {
    return <LoadingSpinner />;
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
                aria-label="Volver al dashboard"
              >
                ← Volver
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  🧪 Gestión de Análisis
                </h1>
                <p className="text-gray-600">
                  Monitoreo y seguimiento de análisis clínicos
                </p>
              </div>
            </div>
            <Button
              onClick={exportarResultados}
              disabled={analisis.length === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              📊 Exportar Resultados
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6" role="alert">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Estadísticas usando StatsCard */}
        <section className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <StatsCard
            title="Total"
            value={estadisticas.total_analisis}
            icon="🧪"
            color="blue"
          />
          <StatsCard
            title="Pendientes"
            value={estadisticas.pendientes}
            icon="⏳"
            color="orange"
          />
          <StatsCard
            title="Procesando"
            value={estadisticas.procesando}
            icon="🔄"
            color="blue"
          />
          <StatsCard
            title="Finalizados"
            value={estadisticas.finalizados}
            icon="✅"
            color="green"
          />
          <StatsCard
            title="Con Resultados"
            value={estadisticas.con_resultados}
            icon="📋"
            color="purple"
          />
        </section>

        {/* Filtros */}
        <FiltrosSection
          filtroEstado={filtroEstado}
          setFiltroEstado={setFiltroEstado}
          filtroTipo={filtroTipo}
          setFiltroTipo={setFiltroTipo}
          busqueda={busqueda}
          setBusqueda={setBusqueda}
          fechaDesde={fechaDesde}
          setFechaDesde={setFechaDesde}
          fechaHasta={fechaHasta}
          setFechaHasta={setFechaHasta}
          tiposDisponibles={tiposDisponibles}
          limpiarFiltros={limpiarFiltros}
        />

        {/* Tabla de Análisis */}
        <CustomCard>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Análisis ({analisis.length})
            </h2>
            <div className="text-sm text-gray-500">
              {filtroEstado !== 'todos' && `Filtro: ${filtroEstado}`}
              {filtroTipo !== 'todos' && ` • Tipo: ${filtroTipo}`}
            </div>
          </div>

          <div className="overflow-x-auto">
            {analisis.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Análisis
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paciente
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Orden
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Resultado
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analisis.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.descripcion}
                          </div>
                          <div className="text-sm text-gray-500">
                            {item.tipo} • Código: {item.codigo_practica}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.orden.paciente.nombre} {item.orden.paciente.apellido}
                          </div>
                          <div className="text-sm text-gray-500">
                            DNI: {item.orden.paciente.dni} • {item.orden.paciente.edad} años
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.orden.nro_orden}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatFecha(item.orden.fecha_ingreso)}
                            {item.orden.urgente && (
                              <span className="ml-1 text-red-600 font-medium" title="Orden urgente">🚨</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={getEstadoBadge(item.estado)}>
                          {item.estado.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        {item.valor_hallado ? (
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {item.valor_hallado} {item.unidad_hallada || ''}
                            </div>
                            {item.valor_referencia && (
                              <div className="text-sm text-gray-500">
                                Ref: {item.valor_referencia}
                              </div>
                            )}
                            {item.interpretacion && (
                              <Badge variant={getInterpretacionBadge(item.interpretacion)}>
                                {item.interpretacion.toUpperCase()}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">Sin resultado</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatFechaHora(item.fecha_realizacion)}
                        </div>
                        {item.tecnico_responsable && (
                          <div className="text-sm text-gray-500">
                            {item.tecnico_responsable}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => verDetalleAnalisis(item)}
                        >
                          Ver detalle
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navegarAOrden(item.orden.id)}
                          className="text-purple-600 hover:text-purple-900"
                        >
                          Ver orden
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🧪</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No se encontraron análisis
                </h3>
                <p className="text-gray-500 mb-4">
                  {filtroEstado !== 'todos' || filtroTipo !== 'todos' || busqueda
                    ? 'Intenta cambiar los filtros de búsqueda'
                    : 'Aún no hay análisis registrados'}
                </p>
              </div>
            )}
          </div>
        </CustomCard>
      </main>

      {/* Modal de Detalle */}
      <Modal
        isOpen={mostrarDetalle}
        onClose={() => setMostrarDetalle(false)}
        title="Detalle del Análisis"
      >
        {analisisSeleccionado && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Información del Análisis */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Información del Análisis</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Análisis:</span> {analisisSeleccionado.descripcion}</p>
                  <p><span className="font-medium">Código:</span> {analisisSeleccionado.codigo_practica}</p>
                  <p><span className="font-medium">Tipo:</span> {analisisSeleccionado.tipo}</p>
                  <p>
                    <span className="font-medium">Estado:</span> 
                    <Badge variant={getEstadoBadge(analisisSeleccionado.estado)} className="ml-2">
                      {analisisSeleccionado.estado.toUpperCase()}
                    </Badge>
                  </p>
                  {analisisSeleccionado.fecha_realizacion && (
                    <p><span className="font-medium">Fecha Realización:</span> {formatFechaHora(analisisSeleccionado.fecha_realizacion)}</p>
                  )}
                  {analisisSeleccionado.tecnico_responsable && (
                    <p><span className="font-medium">Técnico:</span> {analisisSeleccionado.tecnico_responsable}</p>
                  )}
                </div>
              </div>
              
              {/* Información del Paciente y Orden */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Paciente y Orden</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Paciente:</span> {analisisSeleccionado.orden.paciente.nombre} {analisisSeleccionado.orden.paciente.apellido}</p>
                  <p><span className="font-medium">DNI:</span> {analisisSeleccionado.orden.paciente.dni}</p>
                  <p><span className="font-medium">Edad:</span> {analisisSeleccionado.orden.paciente.edad} años</p>
                  <p><span className="font-medium">N° Orden:</span> {analisisSeleccionado.orden.nro_orden}</p>
                  <p><span className="font-medium">Fecha Orden:</span> {formatFecha(analisisSeleccionado.orden.fecha_ingreso)}</p>
                  {analisisSeleccionado.orden.urgente && (
                    <p className="text-red-600 font-medium">🚨 ORDEN URGENTE</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Resultados */}
            {analisisSeleccionado.valor_hallado && (
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-3">Resultados</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Valor Hallado</p>
                      <p className="text-lg font-bold text-gray-900">
                        {analisisSeleccionado.valor_hallado} {analisisSeleccionado.unidad_hallada || ''}
                      </p>
                    </div>
                    {analisisSeleccionado.valor_referencia && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Valor de Referencia</p>
                        <p className="text-gray-900">{analisisSeleccionado.valor_referencia}</p>
                      </div>
                    )}
                    {analisisSeleccionado.interpretacion && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Interpretación</p>
                        <Badge variant={getInterpretacionBadge(analisisSeleccionado.interpretacion)}>
                          {analisisSeleccionado.interpretacion.toUpperCase()}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Observaciones */}
            {analisisSeleccionado.observaciones && (
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-3">Observaciones</h4>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700">{analisisSeleccionado.observaciones}</p>
                </div>
              </div>
            )}
            
            <div className="mt-6 flex justify-end space-x-3">
              <Button
                onClick={() => navegarAOrden(analisisSeleccionado.orden.id)}
              >
                Ver Orden Completa
              </Button>
              <Button
                variant="secondary"
                onClick={() => setMostrarDetalle(false)}
              >
                Cerrar
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}