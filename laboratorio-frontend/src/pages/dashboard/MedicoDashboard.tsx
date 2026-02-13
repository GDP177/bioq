import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { UserPlusIcon, DocumentMagnifyingGlassIcon, ArrowPathIcon } from "@heroicons/react/24/outline";

export default function MedicoDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    // Usar ID del usuario logueado
    const user = JSON.parse(localStorage.getItem('usuario') || '{}');
    axios.get(`http://localhost:5000/api/medico/dashboard/${user.id || 5}`)
      .then(res => setData(res.data))
      .catch(e => console.error(e));
  }, []);

  if (!data) return <div className="p-10 text-center text-slate-400">Cargando consultorio...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* HEADER + ACCIÓN PRINCIPAL */}
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
          
          {/* Decoración de fondo */}
          <div className="absolute right-0 top-0 h-full w-1/3 bg-white/5 skew-x-12 transform origin-bottom-left"></div>
        </div>

        {/* ESTADÍSTICAS RÁPIDAS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <InfoCard label="Pacientes Activos" val="--" icon="👥" />
            <InfoCard label="En Proceso" val="--" icon="⏳" />
            <InfoCard label="Para Revisar" val="--" icon="📩" highlight />
            <InfoCard label="Total Histórico" val={data.estadisticas.total_ordenes} icon="📚" />
        </div>

        {/* LISTA DE PACIENTES RECIENTES */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <DocumentMagnifyingGlassIcon className="w-5 h-5 text-indigo-500"/>
                    Últimas Solicitudes Enviadas
                </h3>
                <button onClick={() => navigate('/medico/ordenes')} className="text-xs font-bold text-indigo-600 hover:underline">Ver todas</button>
            </div>
            
            {/* Como la API actual de dashboard medico es muy basica, simulamos una lista o usamos la que tengas si existe */}
            <div className="p-10 text-center text-slate-400 flex flex-col items-center">
                <ArrowPathIcon className="w-10 h-10 mb-2 text-slate-300"/>
                <p>Para ver el detalle de las órdenes y descargar resultados,</p>
                <p>diríjase a la sección <span className="font-bold text-slate-600">"Órdenes Enviadas"</span>.</p>
                <button 
                    onClick={() => navigate('/medico/ordenes')}
                    className="mt-4 px-4 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                    Ir al listado
                </button>
            </div>
        </div>

      </div>
    </div>
  );
}

const InfoCard = ({ label, val, icon, highlight }: any) => (
    <div className={`p-5 rounded-2xl border ${highlight ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200'} shadow-sm flex flex-col items-center justify-center text-center`}>
        <span className="text-2xl mb-2">{icon}</span>
        <p className={`text-2xl font-black ${highlight ? 'text-indigo-700' : 'text-slate-800'}`}>{val}</p>
        <p className="text-xs font-bold uppercase text-slate-400 tracking-wider">{label}</p>
    </div>
);