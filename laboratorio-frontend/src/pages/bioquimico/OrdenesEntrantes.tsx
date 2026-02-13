import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// ==========================================
// COMPONENTES UI REUTILIZABLES
// ==========================================
const Badge = ({ children, variant = 'default' }: any) => {
  const variants: any = {
    pendiente: "text-orange-600 border-orange-200 bg-orange-50",
    en_proceso: "text-blue-600 border-blue-200 bg-blue-50",
    finalizado: "text-green-600 border-green-200 bg-green-50",
    urgente: "text-red-600 border-red-200 bg-red-50 animate-pulse",
    default: "text-gray-600 border-gray-200 bg-gray-50"
  };
  return (
    <span className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border flex items-center justify-center gap-1 w-max mx-auto shadow-sm ${variants[variant] || variants.default}`}>
      {children}
    </span>
  );
};

// ==========================================
// INTERFAZ
// ==========================================
interface OrdenEntrante {
  id_orden: number;
  nro_orden: string;
  fecha_ingreso_orden: string;
  estado: string;
  urgente: number;
  nombre_paciente: string;
  apellido_paciente: string;
  dni: number;
  edad: number;
  mutual: string;
  nombre_medico: string;
  apellido_medico: string;
  total_analisis: number;
  analisis_listos: number;
}

export default function OrdenesEntrantes() {
  const navigate = useNavigate();
  
  // Estados Globales
  const [ordenesOriginales, setOrdenesOriginales] = useState<OrdenEntrante[]>([]);
  const [ordenesFiltradas, setOrdenesFiltradas] = useState<OrdenEntrante[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Estados de la Interfaz (Pestañas y Buscador)
  const [tabActiva, setTabActiva] = useState<'pendientes' | 'completadas'>('pendientes');
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    cargarOrdenes();
  }, []);

  // Motor de Filtrado en Tiempo Real
  useEffect(() => {
    let resultado = [...ordenesOriginales];

    // 1. Filtrar por Pestaña (Pendientes vs Finalizadas)
    if (tabActiva === 'pendientes') {
      resultado = resultado.filter(o => o.estado === 'pendiente' || o.estado === 'en_proceso');
    } else {
      resultado = resultado.filter(o => o.estado === 'finalizado');
    }

    // 2. Filtrar por Buscador (DNI, Orden o Nombre)
    if (busqueda.trim() !== "") {
      const b = busqueda.toLowerCase();
      resultado = resultado.filter(o => 
        o.nro_orden.toLowerCase().includes(b) ||
        o.dni.toString().includes(b) ||
        o.nombre_paciente.toLowerCase().includes(b) ||
        o.apellido_paciente.toLowerCase().includes(b)
      );
    }

    setOrdenesFiltradas(resultado);
  }, [ordenesOriginales, tabActiva, busqueda]);

  const cargarOrdenes = async () => {
    try {
      setLoading(true);
      setError("");
      
      // Agregamos un Timeout de 5 seg. Si el backend se cuelga, cortamos la petición y mostramos error.
      const response = await axios.get('http://localhost:5000/api/ordenes/pendientes', { timeout: 5000 });
      
      if (response.data.success) {
        setOrdenesOriginales(response.data.ordenes);
      } else {
        setError("Error en la respuesta del servidor.");
      }
    } catch (err: any) {
      console.error('❌ Error de conexión:', err);
      if (err.code === 'ECONNABORTED') {
        setError("El servidor tardó demasiado en responder (Timeout). Revisa la terminal del backend.");
      } else {
        setError("No se pudo conectar con el servidor backend.");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatFecha = (f: string) => new Date(f).toLocaleString('es-AR', { 
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' 
  });

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-blue-600 mb-4"></div>
      <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">Cargando base de datos...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <header className="mb-6 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Gestión de Muestras</h1>
            <p className="text-sm text-gray-500 font-medium mt-1">Área técnica y carga de resultados</p>
          </div>
          <button onClick={cargarOrdenes} className="text-sm text-blue-600 font-bold bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 transition">
            🔄 Actualizar Datos
          </button>
        </header>

        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-800 rounded-lg border border-red-300 text-sm font-bold shadow-sm">
            🚨 {error}
          </div>
        )}

        {/* CONTROLES: PESTAÑAS Y BUSCADOR */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
          
          {/* Pestañas (Tabs) */}
          <div className="flex border-b border-gray-200 bg-gray-50/50">
            <button 
              onClick={() => setTabActiva('pendientes')}
              className={`flex-1 py-4 text-sm font-black uppercase tracking-widest transition-colors border-b-4 ${tabActiva === 'pendientes' ? 'border-blue-600 text-blue-700 bg-blue-50/30' : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
            >
              ⏳ Pendientes por Cargar
            </button>
            <button 
              onClick={() => setTabActiva('completadas')}
              className={`flex-1 py-4 text-sm font-black uppercase tracking-widest transition-colors border-b-4 ${tabActiva === 'completadas' ? 'border-green-600 text-green-700 bg-green-50/30' : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
            >
              ✅ Órdenes Finalizadas
            </button>
          </div>

          {/* Buscador */}
          <div className="p-4 bg-white">
            <div className="relative">
              <span className="absolute left-4 top-3 text-lg">🔍</span>
              <input 
                type="text" 
                placeholder="Buscar por DNI del paciente, N° de Orden o Apellido..." 
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-12 pr-4 py-3 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>
          </div>
        </div>

        {/* LISTA DE ÓRDENES */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          
          {/* Encabezados de Tabla */}
          <div className="grid grid-cols-5 gap-4 px-6 py-4 border-b border-gray-100 bg-gray-50/80">
            <div className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Detalle Orden</div>
            <div className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Paciente</div>
            <div className="text-[10px] font-black text-gray-500 uppercase tracking-wider text-center">Estado</div>
            <div className="text-[10px] font-black text-gray-500 uppercase tracking-wider text-center">Progreso</div>
            <div className="text-[10px] font-black text-gray-500 uppercase tracking-wider text-right">Acción</div>
          </div>

          {/* Filas */}
          <div className="divide-y divide-gray-100">
            {ordenesFiltradas.length === 0 ? (
              <div className="p-16 text-center">
                <p className="text-4xl mb-2">{tabActiva === 'pendientes' ? '🎉' : '📂'}</p>
                <p className="text-gray-500 font-bold">
                  {busqueda ? "No se encontraron resultados para tu búsqueda." : 
                    (tabActiva === 'pendientes' ? "No hay órdenes pendientes. ¡Todo al día!" : "Aún no hay órdenes finalizadas.")}
                </p>
              </div>
            ) : (
              ordenesFiltradas.map((orden) => {
                const porcentaje = orden.total_analisis > 0 
                  ? Math.round((orden.analisis_listos / orden.total_analisis) * 100) : 0;

                return (
                  <div key={orden.id_orden} className="grid grid-cols-5 gap-4 px-6 py-5 items-center hover:bg-blue-50/30 transition-colors group">
                    
                    {/* COL 1: ORDEN */}
                    <div>
                      <p className="font-black text-blue-900 text-sm tracking-tight flex items-center gap-2">
                        {orden.nro_orden}
                        {orden.urgente === 1 && <span title="URGENTE" className="text-red-500 animate-pulse">🚨</span>}
                      </p>
                      <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase">📅 {formatFecha(orden.fecha_ingreso_orden)}</p>
                      <p className="text-xs text-gray-500 mt-0.5 italic">Dr. {orden.apellido_medico}</p>
                    </div>

                    {/* COL 2: PACIENTE */}
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{orden.apellido_paciente}, {orden.nombre_paciente}</p>
                      <p className="text-xs text-gray-500 mt-0.5">DNI: {orden.dni} • {orden.edad} años</p>
                      <span className="inline-block mt-1 bg-gray-100 text-gray-600 border border-gray-200 text-[10px] font-bold px-2 py-0.5 rounded uppercase shadow-sm">
                        {orden.mutual || 'Particular'}
                      </span>
                    </div>

                    {/* COL 3: ESTADO */}
                    <div className="text-center">
                      <Badge variant={orden.estado}>{orden.estado.replace('_', ' ')}</Badge>
                    </div>

                    {/* COL 4: PROGRESO */}
                    <div className="px-4">
                      <div className="flex justify-between items-end mb-1">
                        <span className="text-[10px] font-bold text-gray-500 uppercase">{orden.analisis_listos}/{orden.total_analisis}</span>
                        <span className={`text-xs font-black ${porcentaje === 100 ? 'text-green-600' : 'text-blue-600'}`}>{porcentaje}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                        <div 
                          className={`h-full transition-all duration-500 ease-out ${porcentaje === 100 ? 'bg-green-500' : 'bg-blue-500'}`} 
                          style={{ width: `${porcentaje}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* COL 5: ACCIÓN */}
                    <div className="text-right">
                      <button 
                        onClick={() => navigate(`/bioquimico/orden/${orden.id_orden}/cargar`)}
                        className={`font-bold text-xs uppercase tracking-wide px-4 py-2 rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 ml-auto
                          ${tabActiva === 'pendientes' 
                            ? 'bg-blue-600 text-white hover:bg-blue-700' 
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:text-blue-600'}`}
                      >
                        {tabActiva === 'pendientes' ? '🧪 Cargar Resultados' : '👁️ Ver Ficha'}
                      </button>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}