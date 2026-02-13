import { useState, useEffect } from "react";
import axios from "axios";
import { 
  UsersIcon, ClipboardDocumentListIcon, CurrencyDollarIcon, 
  ExclamationTriangleIcon, ChartBarIcon, ClockIcon 
} from "@heroicons/react/24/outline";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Usamos un ID fijo o lo sacamos del localStorage
    const user = JSON.parse(localStorage.getItem('usuario') || '{}');
    axios.get(`http://localhost:5000/api/admin/dashboard/${user.id || 1}`)
      .then(res => setStats(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-10 text-center animate-pulse text-indigo-600 font-bold">Cargando Panel de Control...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* ENCABEZADO */}
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Panel de Control</h1>
          <p className="text-slate-500">Visión global del laboratorio y métricas de rendimiento.</p>
        </div>

        {/* TARJETAS PRINCIPALES */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Órdenes Hoy" value={stats?.metricas_generales?.ordenes_hoy || 0} icon={<ClockIcon className="w-6 h-6 text-blue-600"/>} color="bg-blue-50 border-blue-200" />
          <StatCard title="Pacientes Totales" value={stats?.metricas_generales?.total_pacientes || 0} icon={<UsersIcon className="w-6 h-6 text-indigo-600"/>} color="bg-indigo-50 border-indigo-200" />
          <StatCard title="Pendientes" value={stats?.estadisticas_ordenes?.pendientes || 0} icon={<ExclamationTriangleIcon className="w-6 h-6 text-amber-600"/>} color="bg-amber-50 border-amber-200" />
          <StatCard title="Finalizadas (Mes)" value={stats?.facturacion?.ordenes_finalizadas || 0} icon={<ClipboardDocumentListIcon className="w-6 h-6 text-emerald-600"/>} color="bg-emerald-50 border-emerald-200" />
        </div>

        {/* SECCIÓN DIVIDIDA */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* TABLA DE ACTIVIDAD RECIENTE */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <ChartBarIcon className="w-5 h-5 text-slate-400"/> Actividad Reciente
              </h3>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">En tiempo real</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="px-6 py-3">Orden</th>
                    <th className="px-6 py-3">Paciente</th>
                    <th className="px-6 py-3 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats?.ordenes_recientes?.slice(0, 7).map((orden: any) => (
                    <tr key={orden.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3 font-bold text-slate-700">{orden.nro_orden}</td>
                      <td className="px-6 py-3 text-slate-600">{orden.paciente.apellido}, {orden.paciente.nombre}</td>
                      <td className="px-6 py-3 text-center">
                        <Badge status={orden.estado} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ALERTAS Y ACCIONES */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-bold text-slate-800 mb-4">📢 Notificaciones del Sistema</h3>
              <div className="space-y-3">
                {stats?.notificaciones?.map((notif: string, i: number) => (
                  <div key={i} className="text-sm p-3 bg-slate-50 rounded-lg border border-slate-100 text-slate-600 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
                    {notif}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl shadow-lg p-6 text-white">
              <h3 className="font-bold text-lg mb-2">Facturación Estimada</h3>
              <p className="text-slate-300 text-sm mb-4">Órdenes procesadas este mes</p>
              <div className="text-3xl font-black">{stats?.facturacion?.ordenes_facturables || 0}</div>
              <div className="mt-4 w-full bg-white/20 rounded-full h-1.5">
                <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: `${stats?.facturacion?.porcentaje_finalizacion || 0}%` }}></div>
              </div>
              <p className="text-[10px] text-right mt-1 text-emerald-300">{stats?.facturacion?.porcentaje_finalizacion}% Completado</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// COMPONENTES AUXILIARES
const StatCard = ({ title, value, icon, color }: any) => (
  <div className={`p-6 rounded-2xl border ${color} shadow-sm transition-transform hover:scale-[1.02]`}>
    <div className="flex justify-between items-start">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1 text-slate-600">{title}</p>
        <h2 className="text-3xl font-black text-slate-800">{value}</h2>
      </div>
      <div className="p-2 bg-white rounded-lg shadow-sm">{icon}</div>
    </div>
  </div>
);

const Badge = ({ status }: { status: string }) => {
  const styles: any = {
    pendiente: "bg-amber-100 text-amber-700 border-amber-200",
    en_proceso: "bg-blue-100 text-blue-700 border-blue-200",
    finalizado: "bg-emerald-100 text-emerald-700 border-emerald-200",
  };
  return <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${styles[status] || 'bg-gray-100'}`}>{status?.replace('_', ' ')}</span>;
};