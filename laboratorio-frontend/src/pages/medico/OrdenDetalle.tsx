// src/pages/medico/OrdenDetalle.tsx

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

// Componentes UI reutilizables
import { Button } from "@/components/ui/button";
import { CustomCard } from "@/components/ui/CustomCard";

// Interfaces
interface Paciente {
  nro_ficha: number;
  nombre: string;
  apellido: string;
  dni: number;
  fecha_nacimiento: string;
  edad: number;
  sexo: string;
  telefono: string;
  direccion: string;
  email: string;
  mutual: string;
  nro_afiliado: string;
  grupo_sanguineo: string;
}

interface Analisis {
  id: number;
  codigo: number;
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
}

interface OrdenDetalle {
  id: number;
  nro_orden: string;
  fecha_ingreso: string;
  fecha_procesamiento: string | null;
  fecha_finalizacion: string | null;
  fecha_toma_muestra: string | null;
  estado: string;
  urgente: boolean;
  observaciones: string | null;
  instrucciones_paciente: string | null;
  requiere_ayuno: boolean;
  costo_total: number | null;
  paciente: Paciente;
  medico_solicitante: {
    nombre: string;
    apellido: string;
    especialidad: string;
    matricula: string;
  };
  bioquimico_responsable: {
    nombre: string;
    apellido: string;
  } | null;
  analisis: Analisis[];
  resumen: {
    total_analisis: number;
    analisis_pendientes: number;
    analisis_procesando: number;
    analisis_finalizados: number;
    porcentaje_completado: number;
  };
}

interface OrdenDetalleResponse {
  success: boolean;
  orden: any; // Cambiado a any temporalmente para mapear la respuesta del backend
  analisis: any[];
}

// Componente Badge
const Badge = ({ 
  children, 
  variant = 'default' 
}: { 
  children: React.ReactNode; 
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' 
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
    <span className={`${baseClasses} ${variants[variant]}`}>
      {children}
    </span>
  );
};

// Componente Loading
const LoadingSpinner = () => (
  <div className="min-h-screen bg-blue-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Cargando detalle de orden...</p>
    </div>
  </div>
);

// Componente StatsCard
const StatsCard = ({ 
  title, 
  value, 
  icon, 
  color = 'blue' 
}: { 
  title: string; 
  value: number | string; 
  icon: string; 
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red' 
}) => {
  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    orange: 'text-orange-600',
    purple: 'text-purple-600',
    red: 'text-red-600',
  };

  return (
    <div className="text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <p className={`text-2xl font-bold ${colorClasses[color]}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      <p className="text-sm text-gray-500">{title}</p>
    </div>
  );
};

export default function OrdenDetalle() {
  const navigate = useNavigate();
  const { id_orden } = useParams();
  const [orden, setOrden] = useState<OrdenDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const usuario = localStorage.getItem("usuario");
    if (!usuario) {
      navigate("/login");
      return;
    }

    if (id_orden && id_orden !== "0") {
      cargarOrdenDetalle(parseInt(id_orden));
    } else {
      setError("ID de orden no válido");
      setLoading(false);
    }
  }, [id_orden, navigate]);


const cargarOrdenDetalle = async (ordenId: number) => {
    try {
        setLoading(true);
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const response = await axios.get(`${apiUrl}/orden/detalles/${ordenId}`);

        if (response.data.success) {
            const { orden: rawOrden, analisis: rawAnalisis } = response.data;
            
            // Verificamos que los análisis se reciban correctamente
            console.log("Análisis procesados:", rawAnalisis?.length || 0);

            const ordenFormateada = {
                ...rawOrden,
                // Salvaguardas contra valores nulos para evitar el crash
                paciente: {
                    nombre: rawOrden?.nombre || "N/A",
                    apellido: rawOrden?.apellido || ""
                },
                analisis: (rawAnalisis || []).map((a: any) => ({
                    id: a.id_orden_analisis,
                    codigo: a.codigo_practica,
                    descripcion: a.descripcion_practica || "Análisis",
                    estado: a.estado?.toLowerCase() || "pendiente", // Protege contra error toUpperCase
                    valor_hallado: a.valor_hallado || "-",
                    unidad_hallada: a.unidad_hallada || "",
                    valor_referencia: a.REFERENCIA || "Ver protocolo", // Columna real de tu DB
                    interpretacion: a.interpretacion || "Normal", 
                    tecnico_responsable: a.tecnico_responsable || "Pendiente",
                    fecha_realizacion: a.fecha_realizacion
                })),
                resumen: {
                    total_analisis: rawAnalisis?.length || 0,
                    analisis_finalizados: (rawAnalisis || []).filter((a: any) => a.estado === 'finalizado').length,
                    porcentaje_completado: rawAnalisis?.length 
                        ? Math.round((rawAnalisis.filter((a: any) => a.estado === 'finalizado').length / rawAnalisis.length) * 100) 
                        : 0
                }
            };
            setOrden(ordenFormateada);
        }
    } catch (err: any) {
        console.error("Error crítico en OrdenDetalle:", err);
        setError("Error al cargar la información de la orden.");
    } finally {
        setLoading(false);
    }
};
  const formatFecha = (fecha: string | null | undefined): string => {
    if (!fecha) return 'No disponible';
    try {
      return new Date(fecha).toLocaleDateString('es-AR');
    } catch {
      return 'Fecha inválida';
    }
  };

  const formatFechaHora = (fecha: string | null | undefined): string => {
    if (!fecha) return 'No disponible';
    try {
      return new Date(fecha).toLocaleString('es-AR');
    } catch {
      return 'Fecha inválida';
    }
  };

  const getEstadoBadge = (estado: string) => {
    if (!estado) return 'default';
    switch (estado.toLowerCase()) {
      case 'pendiente': return 'warning';
      case 'procesando': return 'info';
      case 'finalizado': case 'completado': return 'success';
      case 'cancelado': return 'danger';
      default: return 'default';
    }
  };

  const getInterpretacionBadge = (interpretacion: string | null) => {
    if (!interpretacion) return 'default';
    switch (interpretacion.toLowerCase()) {
      case 'normal': return 'success';
      case 'alto': case 'bajo': return 'warning';
      case 'critico': return 'danger';
      default: return 'default';
    }
  };

  const navigateBack = () => navigate('/MedicoDashboard');

  const generarPDF = async () => {
    alert('Funcionalidad de PDF en desarrollo');
  };

  if (loading) return <LoadingSpinner />;

  if (error || !orden) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-6xl mb-4">❌</div>
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={navigateBack}>Volver al Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Button variant="ghost" onClick={navigateBack} className="mr-4">← Volver</Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">📋 {orden.nro_orden}</h1>
                <p className="text-gray-600">Detalle de orden de análisis</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {orden.urgente && <Badge variant="danger">🚨 URGENTE</Badge>}
              <Badge variant={getEstadoBadge(orden.estado)}>{orden.estado.toUpperCase()}</Badge>
              {orden.estado === 'finalizado' && (
                <Button onClick={generarPDF} className="bg-green-600 hover:bg-green-700">📄 Descargar PDF</Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <CustomCard title="📋 Información de la Orden">
            <div className="space-y-3">
              <div><p className="text-sm text-gray-500">Número de Orden</p><p className="font-medium">{orden.nro_orden}</p></div>
              <div><p className="text-sm text-gray-500">Fecha de Solicitud</p><p className="font-medium">{formatFecha(orden.fecha_ingreso)}</p></div>
              {orden.requiere_ayuno && <div><p className="text-sm text-red-500 font-bold">Requiere Ayuno</p></div>}
            </div>
          </CustomCard>

          <CustomCard title="👤 Información del Paciente">
            <div className="space-y-3">
              <div><p className="text-sm text-gray-500">Nombre Completo</p><p className="font-medium">{orden.paciente.nombre} {orden.paciente.apellido}</p></div>
              <div><p className="text-sm text-gray-500">DNI</p><p className="font-medium">{orden.paciente.dni}</p></div>
              <div><p className="text-sm text-gray-500">Edad</p><p className="font-medium">{orden.paciente.edad} años</p></div>
            </div>
          </CustomCard>

          <CustomCard title="📊 Resumen de Análisis">
            <div className="grid grid-cols-2 gap-4">
              <StatsCard title="Total" value={orden.resumen.total_analisis} icon="🧪" color="blue" />
              <StatsCard title="Finalizados" value={orden.resumen.analisis_finalizados} icon="✅" color="green" />
            </div>
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Progreso</span>
                <span className="text-sm">{orden.resumen.porcentaje_completado}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${orden.resumen.porcentaje_completado}%` }}></div>
              </div>
            </div>
          </CustomCard>
        </div>

        <CustomCard title={`🧪 Análisis Solicitados (${orden.analisis.length})`}>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Análisis</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resultado</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orden.analisis.map((analisis) => (
                  <tr key={analisis.id}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{analisis.descripcion}</td>
                    <td className="px-6 py-4"><Badge variant={getEstadoBadge(analisis.estado)}>{analisis.estado.toUpperCase()}</Badge></td>
                    <td className="px-6 py-4 text-sm text-gray-500">{analisis.valor_hallado || "Pendiente"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CustomCard>
      </main>
    </div>
  );
}