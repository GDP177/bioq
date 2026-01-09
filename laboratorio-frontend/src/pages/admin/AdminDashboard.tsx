// src/pages/dashboard/AdminDashboard.tsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { MainLayout } from "../../components/layout/MainLayout";

// --- INTERFACES ---
interface AdminData {
  id: number;
  username: string;
  email: string;
  rol: string;
}

interface MetricasGenerales {
  ordenes_hoy: number;
  total_pacientes: number;
  total_medicos: number;
  total_usuarios: number;
}

interface OrdenReciente {
  id: number;
  nro_orden: string;
  fecha_ingreso: string;
  estado: string;
  paciente: { nombre: string; apellido: string; dni: string };
  medico: { nombre: string; apellido: string };
}

interface DashboardData {
  success: boolean;
  administrador: AdminData;
  metricas_generales: MetricasGenerales;
  ordenes_recientes: OrdenReciente[];
  notificaciones: string[];
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const usuarioGuardado = localStorage.getItem("usuario");
    if (!usuarioGuardado) {
      navigate("/login");
      return;
    }

    try {
      const parsedUsuario = JSON.parse(usuarioGuardado);
      if (parsedUsuario.rol !== 'admin') {
        navigate("/login");
        return;
      }
      setUsuario(parsedUsuario);
      const adminId = parsedUsuario.id || parsedUsuario.id_usuario;
      
      if (!adminId) {
        setError("Sesión inválida.");
        setLoading(false);
        return;
      }

      loadDashboardData(adminId);
    } catch (err) {
      navigate("/login");
    }
  }, [navigate]);

  const loadDashboardData = async (adminId: any) => {
    try {
      setLoading(true);
      const cleanId = String(adminId).replace(/[^0-9]/g, '');
      const response = await axios.get<DashboardData>(
        `http://localhost:5000/api/admin/dashboard/${cleanId}`
      );
      setDashboardData(response.data);
    } catch (err: any) {
      setError("No se pudieron obtener las métricas globales.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto p-6">
        
        {/* Cabecera */}
        <header className="mb-8 text-center">
          <h2 className="text-3xl font-black text-indigo-950 tracking-tight uppercase">
            Control Central
          </h2>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">
            Panel de supervisión global • {new Date().toLocaleDateString('es-AR')}
          </p>
        </header>

        {/* Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: "Órdenes Hoy", val: dashboardData?.metricas_generales.ordenes_hoy, icon: "📋", color: "border-blue-500", text: "text-blue-600" },
            { label: "Pacientes Totales", val: dashboardData?.metricas_generales.total_pacientes, icon: "👥", color: "border-green-500", text: "text-green-600" },
            { label: "Médicos Activos", val: dashboardData?.metricas_generales.total_medicos, icon: "👨‍⚕️", color: "border-purple-500", text: "text-purple-600" },
            { label: "Usuarios Sistema", val: dashboardData?.metricas_generales.total_usuarios, icon: "🔑", color: "border-indigo-500", text: "text-indigo-600" }
          ].map((item, idx) => (
            <div key={idx} className={`bg-white p-6 rounded-2xl shadow-sm border-l-4 ${item.color} flex justify-between items-center transition-transform hover:scale-[1.02]`}>
              <div>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1">{item.label}</p>
                <p className={`text-3xl font-black ${item.text}`}>{item.val || 0}</p>
              </div>
              <span className="text-3xl opacity-20">{item.icon}</span>
            </div>
          ))}
        </div>

        {/* Área Principal: Órdenes y Alertas */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Monitor de Órdenes Recientes - Ocupa 3 columnas para mayor visibilidad */}
          <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex items-center gap-2">
              <span className="text-indigo-600 font-bold">📑</span>
              <h3 className="font-black text-sm text-gray-700 uppercase tracking-tight">Órdenes Recientes en Red</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50 text-[10px] uppercase font-black text-gray-400">
                  <tr>
                    <th className="p-4">Orden</th>
                    <th className="p-4">Paciente</th>
                    <th className="p-4">Médico</th>
                    <th className="p-4">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                  {dashboardData?.ordenes_recientes.map(orden => (
                    <tr key={orden.id} className="hover:bg-indigo-50/30 transition duration-75">
                      <td className="p-4 font-bold text-indigo-900">{orden.nro_orden}</td>
                      <td className="p-4">
                        <p className="font-bold text-gray-800 uppercase text-xs">{orden.paciente.apellido}, {orden.paciente.nombre}</p>
                        <p className="text-[10px] text-gray-400">DNI: {orden.paciente.dni}</p>
                      </td>
                      <td className="p-4 text-xs font-bold text-gray-500 italic">Dr. {orden.medico.apellido}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${
                          orden.estado === 'pendiente' ? 'bg-amber-100 text-amber-700' :
                          orden.estado === 'finalizado' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {orden.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Columna de Alertas - Ocupa 1 columna */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-black text-xs text-gray-700 mb-4 uppercase tracking-widest flex items-center gap-2">
                <span className="animate-pulse">🔔</span> Alertas Críticas
              </h3>
              <div className="space-y-3">
                {dashboardData?.notificaciones.map((notif, i) => (
                  <div key={i} className="p-4 bg-indigo-50/50 rounded-xl border-l-4 border-indigo-400 text-[11px] text-indigo-900 font-bold leading-relaxed">
                    {notif}
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </MainLayout>
  );
}