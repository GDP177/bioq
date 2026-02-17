// src/pages/dashboard/MedicoDashboard.tsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { 
    UserPlusIcon, 
    ClockIcon, 
    CheckCircleIcon,
    ChartBarIcon
} from "@heroicons/react/24/outline";

export default function MedicoDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    // Usar ID del usuario logueado almacenado en localStorage
    const user = JSON.parse(localStorage.getItem('usuario') || '{}');
    
    // Obtener datos del dashboard
    axios.get(`http://localhost:5000/api/medico/dashboard/${user.id || 5}`)
      .then(res => setData(res.data))
      .catch(e => console.error(e));
  }, []);

  if (!data) return <div className="p-10 text-center text-slate-400">Cargando consultorio...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* 1. HEADER + ACCIÓN PRINCIPAL */}
        <div className="bg-indigo-900 rounded-3xl p-8 text-white shadow-xl flex justify-between items-center relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-2">Bienvenido, Dr. {data.medico.apellido}</h1>
            <p className="text-indigo-200">Tiene <strong className="text-white">{data.estadisticas.total_ordenes}</strong> solicitudes históricas registradas.</p>
          </div>
          <button 
            onClick={() => navigate('/medico/nueva-solicitud')}
            className="relative z-10 bg-white text-indigo-900 hover:bg-indigo-50 px-6 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2"
          >
            <UserPlusIcon className="w-5 h-5"/> Nueva Solicitud
          </button>
          <div className="absolute right-0 top-0 h-full w-1/3 bg-white/5 skew-x-12 transform origin-bottom-left"></div>
        </div>

        {/* 2. ESTADÍSTICAS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <InfoCard 
                label="Pacientes Activos" 
                val={data.estadisticas.pacientes_activos} 
                icon="👥" 
            />
            <InfoCard 
                label="En Proceso" 
                val={data.estadisticas.en_proceso} 
                icon="⏳" 
                color="text-amber-600"
                bg="bg-amber-50"
            />
            <InfoCard 
                label="Para Revisar" 
                val={data.estadisticas.para_revisar} 
                icon="📩" 
                highlight 
            />
            <InfoCard 
                label="Total Histórico" 
                val={data.estadisticas.total_ordenes} 
                icon="📚" 
            />
        </div>

        {/* 3. GRÁFICO Y TABLAS (LAYOUT DIVIDIDO) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* COLUMNA IZQUIERDA: GRÁFICO DE ACTIVIDAD */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:col-span-2">
                <div className="flex items-center gap-2 mb-6">
                    <ChartBarIcon className="w-6 h-6 text-indigo-500"/>
                    <h3 className="font-bold text-slate-800 text-lg">Actividad Semestral</h3>
                </div>
                {/* Componente de Gráfico SVG Nativo */}
                <SimpleAreaChart data={data.grafico || []} />
            </div>

            {/* COLUMNA DERECHA: RESUMEN DE ESTADO */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h3 className="font-bold text-slate-800 text-lg mb-4">Resumen de Estado</h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                        <div className="flex items-center gap-3">
                            <CheckCircleIcon className="w-5 h-5 text-green-600"/>
                            <span className="text-green-800 font-medium">Finalizadas hoy</span>
                        </div>
                        <span className="font-bold text-green-700">
                            {/* Filtramos las que tengan fecha de finalización de HOY */}
                            {data.listas?.finalizadas?.filter((o:any) => {
                                const today = new Date();
                                if(!o.fecha_finalizacion) return false;
                                const date = new Date(o.fecha_finalizacion);
                                return date.getDate() === today.getDate() &&
                                       date.getMonth() === today.getMonth() &&
                                       date.getFullYear() === today.getFullYear();
                            }).length || 0}
                        </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="flex items-center gap-3">
                            <ClockIcon className="w-5 h-5 text-blue-600"/>
                            <span className="text-blue-800 font-medium">Pendientes urgentes</span>
                        </div>
                        <span className="font-bold text-blue-700">
                           {data.estadisticas.ordenes_urgentes}
                        </span>
                    </div>
                </div>
            </div>
        </div>

        {/* 4. LISTAS DE ÓRDENES (DOS COLUMNAS) - ✅ MODIFICADO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* LISTA PENDIENTES (Imagen 1) */}
            <OrderList 
                title="Últimas Pendientes Enviadas" 
                orders={data.listas?.pendientes || []} 
                icon={<ClockIcon className="w-5 h-5 text-amber-500"/>}
                emptyText="No hay órdenes pendientes"
                // isCompleted={false} usa fecha_ingreso_orden
                onOrderClick={(id: number) => navigate(`/medico/orden/${id}`)}
            />

            {/* LISTA FINALIZADAS (Imagen 2) */}
            <OrderList 
                title="Últimas Finalizadas" 
                orders={data.listas?.finalizadas || []} 
                icon={<CheckCircleIcon className="w-5 h-5 text-green-500"/>}
                emptyText="No hay resultados recientes"
                isCompleted={true} // Usa fecha_finalizacion
                onOrderClick={(id: number) => navigate(`/medico/orden/${id}`)}
            />
        </div>

      </div>
    </div>
  );
}

// --- SUBCOMPONENTES ---

const InfoCard = ({ label, val, icon, highlight, color, bg }: any) => (
    <div className={`p-5 rounded-2xl border ${highlight ? 'bg-indigo-50 border-indigo-200' : (bg || 'bg-white') + ' border-slate-200'} shadow-sm flex flex-col items-center justify-center text-center transition-transform hover:scale-105`}>
        <span className="text-2xl mb-2">{icon}</span>
        <p className={`text-3xl font-black ${highlight ? 'text-indigo-700' : (color || 'text-slate-800')}`}>{val}</p>
        <p className="text-xs font-bold uppercase text-slate-400 tracking-wider">{label}</p>
    </div>
);

// ✅ Componente OrderList Actualizado con Lógica Binaria (Pendiente/Finalizado)
const OrderList = ({ title, orders, icon, emptyText, isCompleted, onOrderClick }: any) => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
            {icon}
            <h3 className="font-bold text-slate-800">{title}</h3>
        </div>
        <div className="divide-y divide-slate-100 flex-1">
            {orders.length > 0 ? (
                orders.map((orden: any) => (
                    <div 
                        key={orden.id_orden} 
                        // Evento Click para Navegación
                        onClick={() => onOrderClick && onOrderClick(orden.id_orden)}
                        className="p-4 hover:bg-slate-50 transition-colors flex justify-between items-center group cursor-pointer"
                    >
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-700">{orden.Apellido_paciente}, {orden.Nombre_paciente?.charAt(0)}.</span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-mono">#{orden.nro_orden || orden.id_orden}</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">
                                {/* Muestra fecha finalización si está completo, sino fecha ingreso */}
                                {new Date(isCompleted ? (orden.fecha_finalizacion || orden.fecha_ingreso_orden) : orden.fecha_ingreso_orden).toLocaleDateString()}
                            </p>
                        </div>
                        <div className="text-right">
                             {/* Lógica Visual Simplificada: Amarillo (Pendiente) o Verde (Listo) */}
                             <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                                 isCompleted 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-yellow-100 text-yellow-800'
                             }`}>
                                 {isCompleted ? 'FINALIZADO' : 'PENDIENTE'}
                             </span>
                        </div>
                    </div>
                ))
            ) : (
                <div className="p-8 text-center text-slate-400 text-sm italic">
                    {emptyText}
                </div>
            )}
        </div>
        <div className="p-3 border-t border-slate-100 bg-slate-50 text-center">
             <button 
                onClick={() => { /* Navegación opcional al listado completo */ }}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
             >
                Ver todas
             </button>
        </div>
    </div>
);

const SimpleAreaChart = ({ data }: { data: any[] }) => {
    if (!data || data.length === 0) return <div className="h-48 flex items-center justify-center text-slate-400">Sin datos suficientes</div>;

    const height = 200;
    const width = 600; 
    const maxVal = Math.max(...data.map(d => d.cantidad), 10); 
    const points = data.map((d, i) => {
        const x = (i / (data.length - 1 || 1)) * width;
        const y = height - (d.cantidad / maxVal) * height * 0.8; 
        return `${x},${y}`;
    }).join(" ");

    const areaPoints = `0,${height} ${points} ${width},${height}`;

    return (
        <div className="w-full overflow-hidden">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48 drop-shadow-sm">
                <defs>
                    <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4"/>
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0"/>
                    </linearGradient>
                </defs>
                <polygon points={areaPoints} fill="url(#chartGradient)" />
                <polyline points={points} fill="none" stroke="#4f46e5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                {data.map((d, i) => {
                     const x = (i / (data.length - 1 || 1)) * width;
                     const y = height - (d.cantidad / maxVal) * height * 0.8;
                     return (
                         <g key={i} className="group">
                             <circle cx={x} cy={y} r="4" fill="white" stroke="#4f46e5" strokeWidth="2" />
                             <text x={x} y={y - 10} textAnchor="middle" fontSize="12" fill="#475569" className="opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                                 {d.cantidad}
                             </text>
                             <text x={x} y={height - 5} textAnchor="middle" fontSize="10" fill="#94a3b8">
                                 {d.periodo}
                             </text>
                         </g>
                     )
                })}
            </svg>
        </div>
    );
};