// src/pages/medico/OrdenesLista.tsx

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";

// ==========================================
// INTERFACES 
// ==========================================
// Usamos 'any' en las propiedades anidadas/opcionales para crear un 
// escudo contra los distintos formatos que puede enviar el backend
interface Orden {
  id?: number;
  id_orden?: number;
  nro_orden?: string;
  fecha_ingreso?: string;
  estado?: string;
  urgente?: boolean | number;
  observaciones?: string;
  notas?: string;
  [key: string]: any; // Permite acceder a cualquier otra propiedad dinámica de la BD
}

interface OrdenesResponse {
  success: boolean;
  ordenes?: Orden[];
  data?: Orden[];
  total?: number;
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export default function OrdenesLista() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
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
    console.log('🔍 Cargando lista de órdenes enriquecida para médico ID:', parsedUsuario.id);
    cargarOrdenes(parsedUsuario.id);
  }, [navigate, searchParams]);

  const cargarOrdenes = async (medicoId: number) => {
    try {
      setLoading(true);
      setError("");
      
      const queryParams = new URLSearchParams();
      if (filtroEstado !== 'todos') queryParams.set('estado', filtroEstado);
      if (filtroUrgente) queryParams.set('urgente', 'true');
      if (busqueda) queryParams.set('buscar', busqueda);

      const response = await axios.get<OrdenesResponse>(
        `http://localhost:5000/api/ordenes/medico/${medicoId}?${queryParams.toString()}`
      );

      if (response.data.success) {
        const dataRecibida = response.data.ordenes || response.data.data || [];
        setOrdenes(dataRecibida);
        console.log('✅ Órdenes cargadas con detalles:', dataRecibida.length);
      } else {
        setError("Error al cargar las órdenes desde el servidor.");
      }
    } catch (error: any) {
      console.error("❌ Error al cargar órdenes:", error);
      setError("No se pudo conectar con el servidor para obtener las órdenes.");
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    const params: any = {};
    if (filtroEstado !== 'todos') params.estado = filtroEstado;
    if (filtroUrgente) params.urgente = 'true';
    if (busqueda) params.buscar = busqueda;
    setSearchParams(params);
  };

  const limpiarFiltros = () => {
    setFiltroEstado('todos');
    setFiltroUrgente(false);
    setBusqueda('');
    setSearchParams({});
  };

  // ==========================================
  // FUNCIONES EXTRACTORAS BLINDADAS (Basadas en el DER)
  // ==========================================
  const getId = (o: Orden) => o.id || o.id_orden || 0;
  
  // Soporte para mayúsculas/minúsculas exactas de la Base de Datos
  const getNombre = (o: Orden) => o.paciente?.nombre || o.paciente?.Nombre_paciente || o.Nombre_paciente || o.nombre_paciente || o.nombre || "";
  const getApellido = (o: Orden) => o.paciente?.apellido || o.paciente?.Apellido_paciente || o.Apellido_paciente || o.apellido_paciente || o.apellido || "Sin Nombre";
  const getDni = (o: Orden) => o.paciente?.dni || o.paciente?.DNI || o.DNI || o.dni || o.dni_paciente || "-";
  const getMutual = (o: Orden) => o.paciente?.mutual || o.mutual || o.obra_social || "Particular";
  const getEdad = (o: Orden) => o.paciente?.edad || o.edad || "";
  const getUrgente = (o: Orden) => o.urgente === true || o.urgente === 1;
  const getObservaciones = (o: Orden) => o.observaciones || o.notas || "";

  // Cálculo Dinámico de Progreso
  const getValoresProgreso = (o: Orden) => {
    let total = 0;
    let listos = 0;

    // Escenario 1: El backend manda la lista de análisis dentro de la orden
    if (Array.isArray(o.analisis)) {
      total = o.analisis.length;
      listos = o.analisis.filter((a: any) => 
        a.estado?.toLowerCase() === 'finalizado' || 
        a.estado?.toLowerCase() === 'completado'
      ).length;
    } 
    // Escenario 2: El backend manda contadores sueltos o anidados
    else {
      total = Number(o.progreso?.total_analisis || o.total_analisis || o.cantidad_analisis || 0);
      listos = Number(o.progreso?.analisis_listos || o.analisis_finalizados || o.analisis_listos || 0);
    }
    
    // Escenario 3: El backend ya mandó el porcentaje directamente
    let porcentaje = 0;
    if (o.progreso?.porcentaje !== undefined) {
      porcentaje = o.progreso.porcentaje;
    } else if (total > 0) {
      porcentaje = Math.round((listos / total) * 100);
    }

    return {
      total,
      listos,
      porcentaje,
      texto: total > 0 ? `${listos}/${total} análisis` : 'Sin análisis cargados'
    };
  };

  const formatFechaHora = (fecha?: string) => {
    if (!fecha) return { dia: "N/A", hora: "--:--" };
    const date = new Date(fecha);
    return {
      dia: date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      hora: date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getEstadoBadge = (estado?: string, urgente: boolean | number = false) => {
    const isUrgente = urgente === true || urgente === 1;
    const baseClasses = "px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 w-fit uppercase tracking-wider shadow-sm";
    const urgenteClass = isUrgente ? "ring-2 ring-red-500 ring-offset-1" : "";
    const status = estado?.toLowerCase() || 'pendiente';

    switch (status) {
      case 'pendiente': return `${baseClasses} bg-yellow-100 text-yellow-800 ${urgenteClass}`;
      case 'en_proceso':
      case 'procesando': return `${baseClasses} bg-blue-100 text-blue-800 ${urgenteClass}`;
      case 'completado':
      case 'finalizada': return `${baseClasses} bg-green-100 text-green-800 ${urgenteClass}`;
      default: return `${baseClasses} bg-gray-100 text-gray-800 ${urgenteClass}`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando sus órdenes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50 pb-12">
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <button onClick={() => navigate('/MedicoDashboard')} className="mr-4 p-2 text-gray-600 hover:text-blue-600 transition-colors">← Volver</button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Mis Órdenes</h1>
                <p className="text-xs text-gray-500">Gestión detallada de análisis solicitados</p>
              </div>
            </div>
            <button onClick={() => navigate('/medico/solicitud-nueva')} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 text-sm font-bold shadow-md transition-all flex items-center gap-2">
              <span>+</span> Nueva Orden
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Panel de Filtros */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Estado</label>
              <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white transition-colors">
                <option value="todos">Todos los estados</option>
                <option value="pendiente">Pendientes</option>
                <option value="en_proceso">En Proceso</option>
                <option value="completado">Completadas</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Prioridad</label>
              <label className="flex items-center h-10 cursor-pointer bg-gray-50 px-3 rounded-lg border border-gray-200 hover:bg-white transition-colors">
                <input type="checkbox" checked={filtroUrgente} onChange={(e) => setFiltroUrgente(e.target.checked)} className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                <span className="ml-2 text-sm font-medium text-gray-700">Solo urgentes 🚨</span>
              </label>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Buscador</label>
              <input type="text" placeholder="Paciente, DNI o N° Orden..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white transition-colors" />
            </div>
            <div className="flex items-end gap-2">
              <button onClick={aplicarFiltros} className="flex-1 bg-gray-900 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-black transition-colors shadow-sm">Aplicar</button>
              <button onClick={limpiarFiltros} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors border border-gray-200">Reset</button>
            </div>
          </div>
        </div>

        {/* Tabla Detallada */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {error && (
             <div className="p-4 bg-red-50 text-red-700 text-sm border-b border-red-100 flex items-center gap-2 font-medium">
               <span>⚠️ {error}</span>
             </div>
          )}

          <div className="overflow-x-auto">
            {ordenes.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">Detalle Orden</th>
                    <th className="px-6 py-4 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">Paciente</th>
                    <th className="px-6 py-4 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">Estado Actual</th>
                    <th className="px-6 py-4 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider w-48">Progreso</th>
                    <th className="px-6 py-4 text-right text-xs font-extrabold text-gray-500 uppercase tracking-wider">Acción</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {ordenes.map((orden, index) => {
                    const idOrden = getId(orden);
                    const isUrgente = getUrgente(orden);
                    const progreso = getValoresProgreso(orden);
                    const fecha = formatFechaHora(orden.fecha_ingreso);
                    const obs = getObservaciones(orden);

                    return (
                      <tr key={`orden-${idOrden}-${index}`} className="hover:bg-blue-50/50 transition-colors group">
                        
                        {/* Columna: Detalle Orden */}
                        <td className="px-6 py-5">
                          <div className="text-base font-black text-blue-700">#{orden.nro_orden || idOrden}</div>
                          <div className="text-[10px] text-gray-400 font-mono mt-0.5">ID Interno: {idOrden}</div>
                          <div className="text-xs text-gray-500 font-medium mt-1.5 flex items-center gap-2">
                            <span>📅 {fecha.dia}</span>
                            <span className="text-gray-300">|</span>
                            <span>🕒 {fecha.hora} hs</span>
                          </div>
                          {obs && (
                            <div className="mt-2 text-[11px] text-gray-500 italic truncate max-w-[200px]" title={obs}>
                              💬 {obs}
                            </div>
                          )}
                        </td>

                        {/* Columna: Paciente */}
                        <td className="px-6 py-5">
                          <div className="text-sm font-bold text-gray-900">{getApellido(orden)}, {getNombre(orden)}</div>
                          <div className="text-xs text-gray-500 mt-0.5">DNI: <span className="font-mono">{getDni(orden)}</span> {getEdad(orden) ? `• ${getEdad(orden)} años` : ''}</div>
                          <div className="mt-1.5 inline-flex bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-bold tracking-wide">
                            {getMutual(orden)}
                          </div>
                        </td>

                        {/* Columna: Estado */}
                        <td className="px-6 py-5">
                          <span className={getEstadoBadge(orden.estado, orden.urgente)}>
                            {isUrgente && '🚨'} {orden.estado?.toUpperCase() || 'PENDIENTE'}
                          </span>
                        </td>

                        {/* Columna: Progreso */}
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-1.5 w-full">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-gray-500">{progreso.texto}</span>
                              <span className={`font-black ${progreso.porcentaje === 100 ? 'text-green-600' : 'text-blue-600'}`}>
                                {progreso.porcentaje}%
                              </span>
                            </div>
                            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                              <div 
                                className={`h-full transition-all duration-700 ease-out ${progreso.porcentaje === 100 ? 'bg-green-500' : 'bg-blue-500'}`} 
                                style={{ width: `${progreso.porcentaje}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>

                        {/* Columna: Acción */}
                        <td className="px-6 py-5 text-right">
                          <button 
                            onClick={() => navigate(`/medico/orden/${idOrden}`)} 
                            className="inline-flex items-center justify-center bg-white border-2 border-blue-100 text-blue-700 px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-600 hover:border-blue-600 hover:text-white transition-all shadow-sm focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
                          >
                            Abrir Ficha →
                          </button>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-24 bg-gray-50/50">
                <div className="text-5xl mb-4 grayscale opacity-50">📂</div>
                <h3 className="text-xl font-bold text-gray-800">No se encontraron órdenes</h3>
                <p className="text-sm text-gray-500 max-w-sm mx-auto mt-2 leading-relaxed">
                  Aún no hay registros cargados o no coinciden con los filtros seleccionados.
                </p>
                <button onClick={limpiarFiltros} className="mt-6 bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-bold hover:bg-gray-50 transition-colors shadow-sm">
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}