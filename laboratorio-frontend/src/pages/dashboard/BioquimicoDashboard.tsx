// src/pages/dashboard/BioquimicoDashboard.tsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { BeakerIcon, CheckCircleIcon, ClockIcon, PlayIcon } from "@heroicons/react/24/solid";

// ==========================================
// DATOS DE EJEMPLO PARA EL GRÁFICO (MOCK)
// NOTA: En el futuro, tu backend debería devolver estos datos.
// ==========================================
const dataHistoricaMock = [
    { nombre: 'Ene', completadas: 65 },
    { nombre: 'Feb', completadas: 59 },
    { nombre: 'Mar', completadas: 80 },
    { nombre: 'Abr', completadas: 81 },
    { nombre: 'May', completadas: 56 },
    { nombre: 'Jun', completadas: 110 }, 
];

// ==========================================
// COMPONENTE SVG: SIRENA ROJA
// ==========================================
const SirenIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="currentColor">
      <path d="M432 320H400L361.9 129.3C346.7 53.5 280 0 200.4 0S54.1 53.5 38.9 129.3L0 320v48c0 17.7 14.3 32 32 32H368c17.7 0 32-14.3 32-32V320zM200.4 48c55.6 0 102 37.1 112.8 88H88c10.8-50.9 57.2-88 112.4-88zM60.1 240L76.3 160H324.5l16.3 80H60.1z" opacity="0.6"/>
      <path className="animate-pulse" d="M453.3 330.7c-12-4.3-25.3 1.7-29.6 13.7L403.3 400H346.7c-17.7 0-32 14.3-32 32v48c0 17.7 14.3 32 32 32H480c17.7 0 32-14.3 32-32V432c0-17.7-14.3-32-32-32H453.3l20.3-55.7c4.3-12-1.7-25.3-13.7-29.6zM464 464H360V448H464v16z"/>
    </svg>
);

export default function BioquimicoDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('usuario') || '{}');
    // Usamos un fallback '1234' si no hay matrícula
    axios.get(`http://localhost:5000/api/bioquimico/dashboard/${user.matricula || '1234'}`)
      .then(res => setData(res.data))
      .catch(e => console.error("Error cargando dashboard:", e));
  }, []);

  if (!data) return <div className="min-h-screen flex items-center justify-center text-slate-400 font-medium animate-pulse">Cargando área de trabajo...</div>;

  // BLINDAJE DE DATOS URGENTES
  const ordenesPendientes = data.ordenes_pendientes || [];
  const ordenesUrgentes = ordenesPendientes.filter((o: any) => 
    o.urgente === true || o.urgente === 1 || String(o.urgente).toLowerCase() === 'true'
  );

  // Cálculo para el Gráfico Custom (obtener el valor máximo para escalar las barras)
  const maxCompletadas = Math.max(...dataHistoricaMock.map(d => d.completadas));

  return (
    <div className="min-h-screen bg-slate-50/80 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Hola, {data.bioquimico?.nombre_bq || 'Bioquímico'} 👋</h1>
            <p className="text-slate-500 font-medium mt-1">Resumen de actividad del laboratorio.</p>
          </div>
          <button 
            onClick={() => navigate('/bioquimico/ordenes-entrantes')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-sm hover:shadow-md transition-all flex items-center gap-2"
          >
            <PlayIcon className="w-5 h-5"/> Comenzar a Procesar
          </button>
        </div>

        {/* KPI CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <WorkCard 
            title="Pendientes de Carga" 
            count={data.estadisticas?.ordenes_pendientes || 0} 
            icon={<ClockIcon className="w-8 h-8 text-amber-500"/>} 
            bg="bg-white" border="border-amber-100/50" 
            onClick={() => navigate('/bioquimico/ordenes-entrantes')}
            accentColor="amber"
          />
          <WorkCard 
            title="En Proceso Analítico" 
            count={data.estadisticas?.ordenes_proceso || 0} 
            icon={<BeakerIcon className="w-8 h-8 text-blue-500"/>} 
            bg="bg-white" border="border-blue-100/50"
            accentColor="blue" 
          />
          <WorkCard 
            title="Completadas Hoy" 
            count={data.estadisticas?.ordenes_completadas || 0} 
            icon={<CheckCircleIcon className="w-8 h-8 text-emerald-500"/>} 
            bg="bg-emerald-50/40" border="border-emerald-100/50"
            accentColor="emerald" 
          />
        </div>

        {/* SECCIÓN PRINCIPAL: URGENCIAS Y HERRAMIENTAS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COLUMNA IZQUIERDA: URGENCIAS */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
              <div className="relative flex items-center justify-center">
                 <SirenIcon className="w-7 h-7 text-red-600 relative z-10" />
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-40"></span>
              </div>
              Prioridad Alta: Urgencias
            </h2>
            
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              {ordenesUrgentes.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
                  <CheckCircleIcon className="w-12 h-12 text-slate-300"/>
                  <p className="text-slate-500 font-medium">¡Excelente! No hay urgencias pendientes.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                    {ordenesUrgentes.map((orden: any) => (
                    <div key={orden.id} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-red-50/40 transition-colors group">
                        <div className="flex items-center gap-4">
                        <div className="bg-red-100 text-red-600 h-12 w-12 flex items-center justify-center rounded-xl shadow-sm">
                            <ClockIcon className="w-6 h-6 animate-pulse"/>
                        </div>
                        <div>
                            <p className="font-bold text-slate-800 text-lg">{orden.paciente?.apellido}, {orden.paciente?.nombre}</p>
                            <div className="flex items-center gap-3 text-sm text-slate-500 font-medium mt-1">
                                <span className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-600">Ord. #{orden.nro_orden}</span>
                                <span>•</span>
                                <span>{orden.total_analisis} análisis</span>
                            </div>
                        </div>
                        </div>
                        <button 
                        onClick={() => navigate(`/bioquimico/orden/${orden.id}/cargar`)}
                        className="w-full sm:w-auto text-sm font-bold bg-white border-2 border-red-100 text-red-600 px-5 py-2.5 rounded-xl hover:bg-red-600 hover:text-white hover:border-red-600 transition-all shadow-sm whitespace-nowrap"
                        >
                        ⚡ Atender Ahora
                        </button>
                    </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* COLUMNA DERECHA: HERRAMIENTAS */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-6">Accesos Rápidos</h2>
            <div className="grid grid-cols-1 gap-4">
              <ToolCard 
                icon="📖" title="Catálogo de Análisis" subtitle="Consultar códigos y V.R."
                onClick={() => navigate('/admin/analisis')}
              />
              <ToolCard 
                 icon="📅" title="Historial de Pacientes" subtitle="Buscar resultados anteriores."
              />
            </div>
          </div>
        </div>

        {/* 🔥 NUEVA SECCIÓN: GRÁFICO PERSONALIZADO CON TAILWIND 🔥 */}
        <div className="pt-4 pb-8">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">Evolución de Órdenes Completadas</h2>
                <select className="text-sm border-slate-200 rounded-lg text-slate-500 font-medium focus:ring-indigo-500 outline-none">
                    <option>Últimos 6 meses</option>
                    <option>Último año</option>
                </select>
            </div>
            
            {/* Contenedor del Gráfico Custom */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 h-80 flex flex-col justify-end relative">
                
                {/* Líneas horizontales de guía de fondo */}
                <div className="absolute inset-0 p-8 pb-14 flex flex-col justify-between pointer-events-none">
                    <div className="border-b border-slate-100 border-dashed w-full h-0"></div>
                    <div className="border-b border-slate-100 border-dashed w-full h-0"></div>
                    <div className="border-b border-slate-100 border-dashed w-full h-0"></div>
                    <div className="border-b border-slate-200 w-full h-0"></div>
                </div>

                {/* Barras */}
                <div className="flex justify-between items-end w-full h-[200px] z-10 px-2 sm:px-10">
                    {dataHistoricaMock.map((item, index) => {
                        // Calculamos el porcentaje de altura en base al mes que más tuvo (maxCompletadas)
                        const heightPercentage = Math.max((item.completadas / maxCompletadas) * 100, 5); // min 5% para que se vea
                        const isLast = index === dataHistoricaMock.length - 1; // Resaltamos el mes actual
                        
                        return (
                            <div key={index} className="flex flex-col items-center group w-full">
                                {/* Tooltip que aparece al pasar el mouse */}
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-slate-800 text-white text-xs font-bold px-2 py-1 rounded mb-2 shadow-lg">
                                    {item.completadas}
                                </div>
                                {/* La barra propiamente dicha */}
                                <div 
                                    className={`w-8 sm:w-16 rounded-t-md transition-all duration-500 ${isLast ? 'bg-indigo-600' : 'bg-slate-300 group-hover:bg-indigo-400'}`}
                                    style={{ height: `${heightPercentage}%` }}
                                ></div>
                                {/* Etiqueta del mes */}
                                <span className={`text-sm mt-3 ${isLast ? 'font-bold text-indigo-700' : 'font-medium text-slate-500'}`}>
                                    {item.nombre}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}

// Componentes auxiliares estilizados
const WorkCard = ({ title, count, icon, bg, border, onClick, accentColor }: any) => {
    const colors: any = { amber: 'hover:shadow-amber-100', blue: 'hover:shadow-blue-100', emerald: 'hover:shadow-emerald-100' };
    return (
    <div onClick={onClick} className={`${bg} border-2 ${border} p-6 rounded-2xl shadow-sm ${onClick ? `cursor-pointer hover:shadow-lg ${colors[accentColor]} hover:-translate-y-1` : ''} transition-all duration-300 flex items-center justify-between relative overflow-hidden`}>
        <div className="relative z-10">
        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">{title}</p>
        <p className="text-5xl font-black text-slate-800 tracking-tight">{count}</p>
        </div>
        <div className="opacity-90 transform scale-110">{icon}</div>
    </div>
)};

const ToolCard = ({ icon, title, subtitle, onClick }: any) => (
    <button onClick={onClick} className="w-full p-4 bg-white border-2 border-slate-100 rounded-xl text-left hover:border-indigo-200 hover:bg-indigo-50/30 hover:shadow-md transition-all group flex items-start gap-4">
        <span className="text-2xl bg-slate-50 w-12 h-12 flex items-center justify-center rounded-lg group-hover:bg-white transition-colors">{icon}</span>
        <div>
            <span className="text-slate-800 font-bold block group-hover:text-indigo-700 transition-colors">{title}</span>
            <span className="text-sm text-slate-400 font-medium">{subtitle}</span>
        </div>
    </button>
);