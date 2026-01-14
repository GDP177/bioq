import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { useReactToPrint } from "react-to-print";

// Componentes UI reutilizables
import { Button } from "@/components/ui/button";
import { CustomCard } from "@/components/ui/CustomCard";

// ==========================================
// INTERFACES
// ==========================================
interface Paciente {
  nro_ficha: number;
  nombre: string;
  apellido: string;
  dni: number;
  edad: number;
  sexo: string;
  mutual: string;
  nro_afiliado: string;
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
  tecnico_responsable: string | null;
}

interface OrdenDetalle {
  id: number;
  nro_orden: string;
  fecha_ingreso: string;
  estado: string;
  urgente: boolean;
  requiere_ayuno: boolean;
  observaciones: string | null;
  paciente: Paciente;
  medico_solicitante: {
    nombre: string;
    apellido: string;
    matricula: string;
  };
  analisis: Analisis[];
  resumen: {
    total_analisis: number;
    analisis_finalizados: number;
    porcentaje_completado: number;
  };
}

// ==========================================
// COMPONENTES UI INTERNOS
// ==========================================
const Badge = ({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' }) => {
  const baseClasses = "px-3 py-1 rounded-full text-xs font-medium";
  const variants = {
    default: "bg-gray-100 text-gray-800",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    danger: "bg-red-100 text-red-800",
    info: "bg-blue-100 text-blue-800"
  };
  return <span className={`${baseClasses} ${variants[variant]}`}>{children}</span>;
};

const LoadingSpinner = () => (
  <div className="min-h-screen bg-blue-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Cargando detalle...</p>
    </div>
  </div>
);

const StatsCard = ({ title, value, icon, color = 'blue' }: { title: string; value: number | string; icon: string; color?: string }) => (
  <div className="text-center bg-gray-50 p-4 rounded-lg border border-gray-100">
    <div className="text-2xl mb-1">{icon}</div>
    <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
    <p className="text-sm text-gray-500">{title}</p>
  </div>
);

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export default function OrdenDetalle() {
  const navigate = useNavigate();
  const { id_orden } = useParams(); // Asegúrate que tu ruta usa :id_orden
  const [orden, setOrden] = useState<OrdenDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Referencia para impresión
  const componentRef = useRef<HTMLDivElement>(null);

  // Hook de impresión
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Orden_${orden?.nro_orden}_${orden?.paciente.apellido || 'Paciente'}`,
  });

  useEffect(() => {
    const usuario = localStorage.getItem("usuario");
    if (!usuario) { navigate("/login"); return; }

    if (id_orden) {
        // NOTA: Si usas el ID numérico en la URL, asegúrate de parsearlo si es necesario
        // O si usas el nro_orden (string), úsalo directo.
        // Aquí asumo que id_orden es el ID numérico de la base de datos.
        cargarOrdenDetalle(parseInt(id_orden)); 
    } else {
        setError("ID de orden no válido");
        setLoading(false);
    }
  }, [id_orden, navigate]);

  const cargarOrdenDetalle = async (ordenId: number) => {
    try {
        setLoading(true);
        // Ajusta la URL según tu backend real
        const response = await axios.get(`http://localhost:5000/api/orden/detalles/${ordenId}`);

        if (response.data.success) {
            const { orden: rawOrden, analisis: rawAnalisis } = response.data;
            
            // Mapeo seguro de datos
            const ordenFormateada: OrdenDetalle = {
                id: rawOrden.id_orden,
                nro_orden: rawOrden.nro_orden || String(rawOrden.id_orden),
                fecha_ingreso: rawOrden.fecha_ingreso,
                estado: rawOrden.estado || "pendiente",
                urgente: rawOrden.urgente === 1,
                requiere_ayuno: rawOrden.requiere_ayuno === 1,
                observaciones: rawOrden.observaciones,
                paciente: {
                    nro_ficha: rawOrden.nro_ficha,
                    nombre: rawOrden.nombre || "N/A",
                    apellido: rawOrden.apellido || "",
                    dni: rawOrden.dni || 0,
                    edad: rawOrden.edad || 0,
                    sexo: rawOrden.sexo || "-",
                    mutual: rawOrden.mutual || "Particular",
                    nro_afiliado: rawOrden.nro_afiliado || ""
                },
                medico_solicitante: {
                    nombre: "Juan", // Datos simulados si no vienen del backend
                    apellido: "Pérez",
                    matricula: "MP-1234"
                },
                analisis: (rawAnalisis || []).map((a: any) => ({
                    id: a.id_orden_analisis,
                    codigo: a.codigo_practica,
                    descripcion: a.descripcion_practica || "Análisis",
                    tipo: "General", // Ajustar si tienes tipos en BD
                    estado: a.estado?.toLowerCase() || "pendiente",
                    valor_hallado: a.valor_hallado || "-",
                    unidad_hallada: a.unidad_hallada || "",
                    valor_referencia: a.REFERENCIA || "",
                    interpretacion: a.interpretacion || "Normal",
                    tecnico_responsable: a.tecnico_responsable,
                    fecha_realizacion: a.fecha_realizacion
                })),
                resumen: {
                    total_analisis: rawAnalisis?.length || 0,
                    analisis_finalizados: (rawAnalisis || []).filter((a: any) => a.estado === 'finalizado').length,
                    porcentaje_completado: 0 // Se calcula en render si quieres
                }
            };
            // Calculamos porcentaje
            if (ordenFormateada.resumen.total_analisis > 0) {
                ordenFormateada.resumen.porcentaje_completado = Math.round(
                    (ordenFormateada.resumen.analisis_finalizados / ordenFormateada.resumen.total_analisis) * 100
                );
            }

            setOrden(ordenFormateada);
        }
    } catch (err) {
        console.error(err);
        setError("Error al cargar la orden.");
    } finally {
        setLoading(false);
    }
  };

  const formatFecha = (f: string) => f ? new Date(f).toLocaleDateString('es-AR') : "-";
  const getEstadoBadge = (s: string) => {
    switch(s.toLowerCase()) {
        case 'finalizado': return 'success';
        case 'pendiente': return 'warning';
        default: return 'default';
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error || !orden) return <div className="p-10 text-center text-red-500">{error || "No se encontró la orden"}</div>;

  return (
    <div className="min-h-screen bg-blue-50 pb-10">
      
      {/* HEADER DE NAVEGACIÓN (Pantalla) */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10 print:hidden">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => navigate('/MedicoDashboard')}>← Volver</Button>
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Orden #{orden.nro_orden}</h1>
                    <p className="text-xs text-gray-500">Detalles y Resultados</p>
                </div>
            </div>
            <div className="flex gap-2">
                {orden.urgente && <Badge variant="danger">URGENTE</Badge>}
                <Badge variant={getEstadoBadge(orden.estado)}>{orden.estado.toUpperCase()}</Badge>
                {/* Botón de Imprimir */}
                <Button onClick={() => handlePrint()} className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
                    🖨️ Imprimir Informe
                </Button>
            </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL (Pantalla) */}
      <main className="max-w-7xl mx-auto px-4 py-8 print:hidden">
        
        {/* Resumen Superior */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <CustomCard title="👤 Paciente">
                <div className="text-sm space-y-2">
                    <p><span className="text-gray-500">Nombre:</span> <strong>{orden.paciente.apellido}, {orden.paciente.nombre}</strong></p>
                    <p><span className="text-gray-500">DNI:</span> {orden.paciente.dni}</p>
                    <p><span className="text-gray-500">Edad:</span> {orden.paciente.edad} años</p>
                    <p><span className="text-gray-500">Cobertura:</span> <span className="text-blue-600 font-bold">{orden.paciente.mutual}</span></p>
                </div>
            </CustomCard>

            <CustomCard title="📊 Estado">
                <div className="flex justify-around items-center h-full">
                    <StatsCard title="Total" value={orden.resumen.total_analisis} icon="🧪" />
                    <StatsCard title="Listos" value={orden.resumen.analisis_finalizados} icon="✅" color="green" />
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{orden.resumen.porcentaje_completado}%</div>
                        <div className="text-xs text-gray-500">Completado</div>
                    </div>
                </div>
            </CustomCard>
        </div>

        {/* Tabla de Análisis (Vista Pantalla) */}
        <CustomCard title="Resultados">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Determinación</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Estado</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Resultado</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Ref.</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {orden.analisis.map((a) => (
                            <tr key={a.id}>
                                <td className="px-6 py-4 text-sm font-medium text-gray-900">{a.descripcion}</td>
                                <td className="px-6 py-4"><Badge variant={getEstadoBadge(a.estado)}>{a.estado}</Badge></td>
                                <td className="px-6 py-4 text-sm font-bold">{a.valor_hallado} <span className="text-gray-400 font-normal">{a.unidad_hallada}</span></td>
                                <td className="px-6 py-4 text-xs text-gray-500">{a.valor_referencia}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </CustomCard>
      </main>

      {/* ================================================================= */}
      {/* FORMATO DE IMPRESIÓN (Oculto en pantalla, visible al imprimir)     */}
      {/* ================================================================= */}
      <div style={{ display: "none" }}>
        <div ref={componentRef} className="p-[15mm] text-gray-900 bg-white font-serif text-sm w-[210mm] min-h-[297mm] relative">
            
            {/* ENCABEZADO */}
            <header className="border-b-2 border-gray-800 pb-4 mb-6 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-blue-900 uppercase">Laboratorio BioQ</h1>
                    <p className="text-xs text-gray-600">Bioquímica Clínica y Especializada</p>
                    <p className="text-xs text-gray-600">Av. San Martín 1234 • Tel: 444-5555</p>
                </div>
                <div className="text-right">
                    <div className="border border-gray-400 px-3 py-1 rounded bg-gray-50">
                        <span className="block text-[10px] text-gray-500 uppercase">Protocolo</span>
                        <span className="text-xl font-mono font-bold">{orden.nro_orden}</span>
                    </div>
                    <p className="text-xs mt-1">Fecha: {formatFecha(orden.fecha_ingreso)}</p>
                </div>
            </header>

            {/* DATOS PACIENTE */}
            <section className="mb-6 border border-gray-300 rounded p-4 bg-gray-50/50">
                <div className="grid grid-cols-2 gap-y-2 gap-x-8 text-sm">
                    <div className="flex border-b border-gray-200 pb-1">
                        <span className="w-24 font-bold text-gray-500 text-xs uppercase">Paciente:</span>
                        <span className="font-bold text-base uppercase">{orden.paciente.apellido}, {orden.paciente.nombre}</span>
                    </div>
                    <div className="flex border-b border-gray-200 pb-1">
                        <span className="w-24 font-bold text-gray-500 text-xs uppercase">DNI:</span>
                        <span>{orden.paciente.dni}</span>
                    </div>
                    <div className="flex border-b border-gray-200 pb-1">
                        <span className="w-24 font-bold text-gray-500 text-xs uppercase">Edad/Sexo:</span>
                        <span>{orden.paciente.edad} años / {orden.paciente.sexo}</span>
                    </div>
                    <div className="flex border-b border-gray-200 pb-1">
                        <span className="w-24 font-bold text-gray-500 text-xs uppercase">Cobertura:</span>
                        <span className="font-bold">{orden.paciente.mutual}</span>
                    </div>
                    <div className="flex border-b border-gray-200 pb-1 col-span-2">
                        <span className="w-24 font-bold text-gray-500 text-xs uppercase">Solicitante:</span>
                        <span>DR. {orden.medico_solicitante.apellido} {orden.medico_solicitante.nombre} ({orden.medico_solicitante.matricula})</span>
                    </div>
                </div>
            </section>

            {/* TABLA RESULTADOS */}
            <h3 className="text-center font-bold uppercase border-b border-black mb-4 pb-1">Informe de Resultados</h3>
            <table className="w-full text-left border-collapse mb-10">
                <thead>
                    <tr className="border-b-2 border-gray-400 text-xs uppercase text-gray-600">
                        <th className="py-2 w-5/12">Determinación</th>
                        <th className="py-2 w-2/12 text-center">Resultado</th>
                        <th className="py-2 w-2/12 text-center">Unidad</th>
                        <th className="py-2 w-3/12 text-right">Valor Ref.</th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {orden.analisis.map((a, i) => (
                        <tr key={i} className="border-b border-gray-100">
                            <td className="py-3 font-medium text-gray-800 pl-2">
                                {a.descripcion}
                                {a.tipo && <span className="block text-[10px] text-gray-400 uppercase">{a.tipo}</span>}
                            </td>
                            <td className="py-3 text-center font-bold text-base text-gray-900">{a.valor_hallado || "-"}</td>
                            <td className="py-3 text-center text-gray-600">{a.unidad_hallada}</td>
                            <td className="py-3 text-right text-gray-600 pr-2 whitespace-pre-line text-xs">{a.valor_referencia}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* OBSERVACIONES */}
            {orden.observaciones && (
                <div className="mb-8 p-3 bg-gray-100 rounded text-xs border border-gray-300">
                    <strong className="block mb-1">OBSERVACIONES:</strong>
                    <p>{orden.observaciones}</p>
                </div>
            )}

            {/* FOOTER FIRMA */}
            <footer className="absolute bottom-[20mm] left-[15mm] right-[15mm]">
                <div className="flex justify-end">
                    <div className="text-center w-64 pt-8 border-t border-gray-800">
                        <p className="font-bold text-sm">Bioquímico Responsable</p>
                        <p className="text-xs text-gray-500">Matrícula N° ----</p>
                    </div>
                </div>
                <div className="mt-4 text-[10px] text-gray-400 text-center border-t pt-2">
                    Informe generado electrónicamente por Sistema BioQ • Página 1 de 1
                </div>
            </footer>
        </div>
      </div>

    </div>
  );
}