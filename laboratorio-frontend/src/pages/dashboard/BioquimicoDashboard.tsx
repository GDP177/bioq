import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { BeakerIcon, CheckCircleIcon, ClockIcon, PlayIcon } from "@heroicons/react/24/solid";

export default function BioquimicoDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    // Usar ID del usuario logueado
    const user = JSON.parse(localStorage.getItem('usuario') || '{}');
    axios.get(`http://localhost:5000/api/bioquimico/dashboard/${user.matricula || '1234'}`)
      .then(res => setData(res.data))
      .catch(e => console.error(e));
  }, []);

  if (!data) return <div className="p-10 text-center text-slate-400">Cargando área de trabajo...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER CON SALUDO PERSONALIZADO */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-slate-800">Hola, {data.bioquimico.nombre_bq} 👋</h1>
            <p className="text-slate-500 font-medium">Aquí tienes el resumen de tu jornada laboral.</p>
          </div>
          <button 
            onClick={() => navigate('/bioquimico/ordenes-entrantes')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md transition-all flex items-center gap-2"
          >
            <PlayIcon className="w-5 h-5"/> Comenzar a Procesar
          </button>
        </div>

        {/* TARJETAS DE PROCESO (Estilo Kanban simplificado) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <WorkCard 
            title="Pendientes de Carga" 
            count={data.estadisticas.ordenes_pendientes} 
            icon={<ClockIcon className="w-8 h-8 text-amber-500"/>} 
            bg="bg-white" border="border-amber-100" 
            onClick={() => navigate('/bioquimico/ordenes-entrantes')}
          />
          <WorkCard 
            title="En Proceso Analítico" 
            count={data.estadisticas.ordenes_proceso} 
            icon={<BeakerIcon className="w-8 h-8 text-blue-500"/>} 
            bg="bg-white" border="border-blue-100" 
          />
          <WorkCard 
            title="Completadas Hoy" 
            count={data.estadisticas.ordenes_completadas} 
            icon={<CheckCircleIcon className="w-8 h-8 text-emerald-500"/>} 
            bg="bg-emerald-50/50" border="border-emerald-100" 
          />
        </div>

        {/* PRIORIDADES */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              Prioridad Alta: Urgencias
            </h2>
            
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              {data.ordenes_pendientes.filter((o:any) => o.urgente === 1).length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  🎉 ¡No hay urgencias pendientes!
                </div>
              ) : (
                data.ordenes_pendientes.filter((o:any) => o.urgente === 1).map((orden: any) => (
                  <div key={orden.id} className="p-4 border-b border-slate-50 flex justify-between items-center hover:bg-red-50/30 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="bg-red-100 text-red-600 font-bold p-3 rounded-lg text-lg">!</div>
                      <div>
                        <p className="font-bold text-slate-800">{orden.paciente.apellido}, {orden.paciente.nombre}</p>
                        <p className="text-xs text-slate-500">Orden #{orden.nro_orden} • {orden.total_analisis} determinaciones</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => navigate(`/bioquimico/orden/${orden.id}/cargar`)}
                      className="text-xs font-bold bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm"
                    >
                      Cargar Ahora
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ACCESOS RÁPIDOS */}
          <div>
            <h2 className="text-lg font-bold text-slate-800 mb-4">Herramientas</h2>
            <div className="grid grid-cols-1 gap-3">
              <button onClick={() => navigate('/admin/analisis')} className="p-4 bg-white border border-slate-200 rounded-xl text-left hover:border-indigo-300 hover:shadow-md transition-all group">
                <span className="text-indigo-600 font-bold block group-hover:text-indigo-700">📖 Catálogo de Análisis</span>
                <span className="text-xs text-slate-400">Consultar códigos y valores ref.</span>
              </button>
              <button className="p-4 bg-white border border-slate-200 rounded-xl text-left hover:border-indigo-300 hover:shadow-md transition-all group">
                <span className="text-indigo-600 font-bold block group-hover:text-indigo-700">📊 Reportes Mensuales</span>
                <span className="text-xs text-slate-400">Ver estadísticas de producción.</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

const WorkCard = ({ title, count, icon, bg, border, onClick }: any) => (
  <div onClick={onClick} className={`${bg} border ${border} p-6 rounded-2xl shadow-sm cursor-pointer hover:shadow-md transition-all flex items-center justify-between`}>
    <div>
      <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
      <p className="text-4xl font-black text-slate-800">{count}</p>
    </div>
    <div className="opacity-80">{icon}</div>
  </div>
);