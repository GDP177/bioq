import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { useReactToPrint } from "react-to-print";

// ==========================================
// COMPONENTES UI
// ==========================================
const Button = ({ onClick, children, className, variant = 'primary' }: any) => (
  <button 
    onClick={onClick} 
    className={`px-4 py-2 rounded-lg font-medium transition-all shadow-sm ${className} ${variant === 'ghost' ? 'hover:bg-gray-100 text-gray-600 border border-gray-200 bg-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
  >
    {children}
  </button>
);

const CustomCard = ({ title, children, className }: any) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
    <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
      <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">{title}</h3>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const Badge = ({ children, variant = 'default', className }: any) => {
  const variants: any = {
    default: "bg-gray-100 text-gray-700 border-gray-200",
    success: "bg-green-50 text-green-700 border-green-200",
    warning: "bg-yellow-50 text-yellow-700 border-yellow-200",
    danger: "bg-red-50 text-red-700 border-red-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
    alert: "bg-orange-50 text-orange-800 border-orange-200"
  };
  return <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${variants[variant]} ${className}`}>{children}</span>;
};

const Money = ({ amount }: { amount: number }) => (
  <span className="font-mono">
    {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount)}
  </span>
);

const LoadingSpinner = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-500 font-medium text-sm">Cargando resultados...</p>
    </div>
  </div>
);

// ==========================================
// INTERFACES
// ==========================================
interface Analisis {
  id: number | string;
  codigo: number;
  descripcion: string;
  tipo: string;
  estado: string;
  fecha_realizacion: string | null;
  valor_hallado: string | null;
  unidad: string | null;
  valor_referencia: string | null;
  interpretacion: string | null;
  tecnico: string | null;
  observaciones: string | null;
  honorarios: number;
  es_subanalisis?: boolean; 
  sub_analisis?: Analisis[];
}

interface OrdenDetalle {
  id: number;
  nro_orden: string;
  fecha_ingreso: string;
  estado: string;
  urgente: boolean;
  observaciones_medico: string | null;
  costo_total: number;
  matricula_bioquimico: string;
  // Objetos anidados que el frontend espera
  paciente: {
    nro_ficha: number;
    nombre: string;
    apellido: string;
    dni: number | string;
    edad: number;
    sexo: string;
    mutual: string;
  };
  medico_solicitante: {
    nombre: string;
    apellido: string;
  };
  analisis: Analisis[];
  resumen: {
    total_analisis: number;
    analisis_finalizados: number;
    porcentaje_completado: number;
  };
}

// ==========================================
// FILA DE ANÁLISIS
// ==========================================
const AnalisisRow = ({ a, isChild = false }: { a: Analisis, isChild?: boolean }) => {
  const isPatologico = a.interpretacion && ['alto', 'bajo', 'patologico', 'positivo'].includes(a.interpretacion.toLowerCase());
  const fechaFormatted = a.fecha_realizacion ? new Date(a.fecha_realizacion).toLocaleDateString('es-AR') : "-";
  
  const rowClass = isChild 
    ? "bg-gray-50/50 hover:bg-gray-100 text-xs border-b border-gray-100" 
    : "bg-white hover:bg-blue-50 transition-colors border-b border-gray-200 text-sm font-medium";

  const paddingLeft = isChild ? "pl-12" : "pl-6";

  return (
    <tr className={rowClass}>
      <td className={`py-3 pr-4 ${paddingLeft}`}>
        <div className="flex items-center">
          {isChild && <span className="text-gray-400 mr-2">↳</span>}
          <div>
            <div className={`${isChild ? 'text-gray-700' : 'text-gray-900 font-bold'}`}>
              {a.descripcion}
            </div>
            {!isChild && <div className="text-[9px] text-gray-400 font-mono">Cód: {a.codigo}</div>}
          </div>
        </div>
      </td>
      
      <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-center text-xs">
        {fechaFormatted}
      </td>

      <td className="px-4 py-3 font-bold text-gray-900 text-center">
        {a.valor_hallado || "-"}
      </td>

      <td className="px-4 py-3 text-xs text-gray-500 text-center">
        {a.unidad || ""}
      </td>

      <td className="px-4 py-3 text-center">
        <div className="text-xs text-gray-500 font-mono">
          {a.valor_referencia || "-"}
        </div>
      </td>

      <td className="px-4 py-3 text-center">
        {a.interpretacion ? (
          <span className={`text-[10px] font-bold uppercase ${isPatologico ? 'text-red-600' : 'text-green-600'}`}>
            {a.interpretacion}
          </span>
        ) : "-"}
      </td>

      <td className="px-4 py-3 text-xs text-gray-500 italic max-w-[150px] truncate" title={a.observaciones || ""}>
        {a.observaciones || "-"}
      </td>

      <td className="px-6 py-3 text-right font-medium text-gray-700">
         {!isChild ? <Money amount={a.honorarios} /> : null}
      </td>
    </tr>
  );
};

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export default function OrdenDetalle() {
  const navigate = useNavigate();
  const { id_orden } = useParams();
  const [orden, setOrden] = useState<OrdenDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const componentRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({ contentRef: componentRef, documentTitle: `Orden_${id_orden}` });

  useEffect(() => {
    if (id_orden) cargarOrdenDetalle(parseInt(id_orden));
  }, [id_orden]);

  const cargarOrdenDetalle = async (ordenId: number) => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/ordenes/${ordenId}`);
      
      if (response.data.success) {
        const raw = response.data.orden;
        const analisisList = response.data.analisis || [];

        // 🔥 MAPEO MANUAL (ESTO ES LO QUE FALTABA)
        // Convertimos la respuesta plana del backend a la estructura anidada que usa la vista
        const ordenMapeada: OrdenDetalle = {
          id: raw.id_orden,
          nro_orden: raw.nro_orden,
          fecha_ingreso: raw.fecha_ingreso,
          estado: raw.estado,
          urgente: raw.urgente === 1,
          observaciones_medico: raw.observaciones,
          costo_total: raw.costo_total || 0,
          matricula_bioquimico: raw.matricula_bioquimico || "Pendiente",
          
          // Estructura Paciente
          paciente: {
            nro_ficha: raw.nro_ficha,
            nombre: raw.nombre || raw.nombre_paciente,
            apellido: raw.apellido || raw.apellido_paciente,
            dni: raw.dni || raw.DNI,
            edad: raw.edad,
            sexo: raw.sexo,
            mutual: raw.mutual || "Particular"
          },
          
          // Estructura Médico
          medico_solicitante: {
            nombre: raw.nombre_medico,
            apellido: raw.apellido_medico
          },
          
          // Análisis (ya vienen con estructura correcta del backend)
          analisis: analisisList,
          
          resumen: {
            total_analisis: analisisList.length,
            analisis_finalizados: 0, // Puedes calcularlo si quieres
            porcentaje_completado: 0
          }
        };

        setOrden(ordenMapeada); 
      }
    } catch (err) {
      console.error(err);
      setError("Error al cargar orden");
    } finally {
      setLoading(false);
    }
  };

  const calcularTotal = () => orden?.analisis.reduce((sum, item) => sum + (item.honorarios || 0), 0) || 0;
  const formatFecha = (f?: string) => f ? new Date(f).toLocaleDateString('es-AR') : "-";

  if (loading) return <LoadingSpinner />;
  if (!orden) return <div className="text-center p-10 text-red-500 font-bold">Error: No se encontró la orden.</div>;

  return (
    <div className="min-h-screen bg-gray-50/50 pb-12">
      
      {/* HEADER */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10 print:hidden">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/medico/ordenes')}>← Volver</Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                Orden #{orden.nro_orden}
                {orden.urgente && <span className="bg-red-50 text-red-600 border border-red-100 text-[10px] px-2 py-0.5 rounded font-bold uppercase">Urgente</span>}
              </h1>
              <p className="text-xs text-gray-500">Creada el {formatFecha(orden.fecha_ingreso)}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={handlePrint} className="flex items-center gap-2 shadow-sm text-sm">
              🖨️ Imprimir Informe
            </Button>
          </div>
        </div>
      </header>

      {/* CONTENIDO */}
      <main className="max-w-7xl mx-auto px-4 py-8 print:hidden">
        
        {/* Tarjetas Superiores */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <CustomCard title="Datos del Paciente" className="lg:col-span-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-lg font-bold text-gray-900">{orden.paciente.apellido}, {orden.paciente.nombre}</p>
                <div className="flex gap-4 mt-2 text-sm text-gray-600">
                  <span>DNI: <strong>{orden.paciente.dni}</strong></span>
                  <span>Edad: <strong>{orden.paciente.edad}</strong></span>
                  <span>Sexo: <strong>{orden.paciente.sexo}</strong></span>
                </div>
              </div>
              <div className="text-right">
                <span className="block text-[10px] text-gray-400 uppercase font-bold">Cobertura</span>
                <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">{orden.paciente.mutual}</span>
              </div>
            </div>
          </CustomCard>

          <CustomCard title="Info. Administrativa">
            <div className="space-y-2">
              <div>
                <span className="block text-[10px] text-gray-400 uppercase">Bioquímico Responsable</span>
                <span className="text-sm font-bold text-gray-800">Matrícula: {orden.matricula_bioquimico}</span>
              </div>
              <div className="border-t border-gray-100 pt-2 mt-2">
                <span className="block text-[10px] text-gray-400 uppercase">Solicitante</span>
                <span className="text-sm text-gray-600 truncate block">Dr. {orden.medico_solicitante.apellido}</span>
              </div>
            </div>
          </CustomCard>

          <CustomCard title="Progreso">
            <div className="flex items-center justify-between h-full px-2">
              <div className="text-center">
                <span className="block text-xl font-bold text-gray-800">{orden.resumen.total_analisis}</span>
                <span className="text-[10px] text-gray-400 uppercase">Total</span>
              </div>
              <div className="h-8 w-px bg-gray-200"></div>
              <div className="text-center">
                <span className="block text-xl font-bold text-green-600">{orden.resumen.analisis_finalizados}</span>
                <span className="text-[10px] text-gray-400 uppercase">Listos</span>
              </div>
              <div className="relative w-12 h-12 flex items-center justify-center rounded-full border-4 border-blue-50">
                <span className="text-[10px] font-bold text-blue-600">{orden.resumen.porcentaje_completado}%</span>
              </div>
            </div>
          </CustomCard>
        </div>

        {/* Tabla de Resultados */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 className="font-bold text-gray-700">Resultados de Análisis</h3>
            <span className="text-xs text-gray-500">Mostrando {orden.analisis.length} determinaciones</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-white border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Determinación</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-400 uppercase">Fecha</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-400 uppercase">Valor</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-400 uppercase">Unidad</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-400 uppercase">Referencia</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-400 uppercase">Interp.</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Obs.</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-400 uppercase">Honorarios</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {orden.analisis.map((parent, index) => (
                  <React.Fragment key={`group-${parent.codigo}-${index}`}>
                    {/* Renderiza al Padre */}
                    <AnalisisRow a={parent} />
                    
                    {/* Renderiza a los Hijos si existen */}
                    {parent.sub_analisis && parent.sub_analisis.length > 0 && (
                        parent.sub_analisis.map((child, cIndex) => (
                            <AnalisisRow key={`child-${parent.codigo}-${child.codigo}-${cIndex}`} a={child} isChild={true} />
                        ))
                    )}
                  </React.Fragment>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t border-gray-200">
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-right text-sm font-bold text-gray-600 uppercase">
                    Total Honorarios:
                  </td>
                  <td className="px-4 py-4 text-right text-lg font-black text-green-700">
                    <Money amount={calcularTotal()} />
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {orden.observaciones_medico && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-100 rounded-lg flex gap-3 text-sm text-yellow-800">
            <span className="text-xl">📋</span>
            <div>
              <p className="font-bold text-xs uppercase mb-1 text-yellow-700">Observaciones Generales</p>
              <p>{orden.observaciones_medico}</p>
            </div>
          </div>
        )}

      </main>

      {/* ================================================================= */}
      {/* FORMATO DE IMPRESIÓN (PDF)                                        */}
      {/* ================================================================= */}
      <div style={{ display: "none" }}>
        <div ref={componentRef} className="p-[15mm] text-gray-900 bg-white font-serif text-sm w-[210mm] min-h-[297mm] relative">
          
          {/* HEADER PDF */}
          <header className="border-b-2 border-gray-800 pb-4 mb-6 flex justify-between items-end">
            <div>
              <h1 className="text-2xl font-bold text-blue-900 uppercase tracking-widest">Laboratorio Bioquímico UME</h1>
              <p className="text-xs text-gray-600">Universidad Nacional del Chaco Austral</p>
              <p className="text-xs text-gray-600">Presidencia Roque Sáenz Peña - Chaco</p>
            </div>
            <div className="text-right">
              <div className="border border-gray-400 px-4 py-1 rounded bg-gray-50 mb-1">
                <span className="block text-[9px] text-gray-500 uppercase font-bold">Protocolo</span>
                <span className="text-xl font-mono font-bold">{orden.nro_orden}</span>
              </div>
              <p className="text-xs">Fecha: <strong>{formatFecha(orden.fecha_ingreso)}</strong></p>
            </div>
          </header>

          {/* DATOS PACIENTE PDF */}
          <section className="mb-6 border border-gray-300 rounded p-4 bg-gray-50/30">
            <div className="grid grid-cols-2 gap-y-1 gap-x-8 text-sm">
              <div className="flex border-b border-gray-200 pb-1">
                <span className="w-24 font-bold text-gray-600 text-xs uppercase">Paciente:</span>
                <span className="font-bold uppercase">{orden.paciente.apellido}, {orden.paciente.nombre}</span>
              </div>
              <div className="flex border-b border-gray-200 pb-1">
                <span className="w-24 font-bold text-gray-600 text-xs uppercase">DNI:</span>
                <span className="font-mono">{orden.paciente.dni}</span>
              </div>
              <div className="flex border-b border-gray-200 pb-1">
                <span className="w-24 font-bold text-gray-600 text-xs uppercase">Edad/Sexo:</span>
                <span>{orden.paciente.edad} años / {orden.paciente.sexo}</span>
              </div>
              <div className="flex border-b border-gray-200 pb-1">
                <span className="w-24 font-bold text-gray-600 text-xs uppercase">Obra Social:</span>
                <span className="font-bold">{orden.paciente.mutual}</span>
              </div>
              <div className="flex border-b border-gray-200 pb-1 col-span-2 mt-1">
                <span className="w-24 font-bold text-gray-600 text-xs uppercase">Solicitante:</span>
                <span>DR. {orden.medico_solicitante.apellido} {orden.medico_solicitante.nombre}</span>
              </div>
            </div>
          </section>

          {/* TABLA PDF */}
          <h3 className="text-center font-bold uppercase border-b-2 border-gray-800 mb-2 pb-1 tracking-wider">Informe de Resultados</h3>
          <table className="w-full text-left border-collapse mb-8 text-xs">
            <thead>
              <tr className="border-b border-gray-400 uppercase text-gray-600 bg-gray-50">
                <th className="py-2 pl-2 w-4/12">Determinación</th>
                <th className="py-2 text-center w-2/12">Resultado</th>
                <th className="py-2 text-center w-1/12">Unid.</th>
                <th className="py-2 text-center w-2/12">Ref.</th>
                <th className="py-2 text-center w-3/12">Obs.</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {orden.analisis.map((parent, index) => (
                <React.Fragment key={`print-group-${index}`}>
                  {/* Padre */}
                  <tr className="border-b border-gray-100">
                    <td className="py-2 pl-2 font-medium text-gray-800">{parent.descripcion}</td>
                    <td className="py-2 text-center font-bold text-gray-900">{parent.valor_hallado || "-"}</td>
                    <td className="py-2 text-center text-gray-500">{parent.unidad}</td>
                    <td className="py-2 text-center text-gray-600">{parent.valor_referencia}</td>
                    <td className="py-2 text-center text-gray-500 italic">{parent.observaciones || ""}</td>
                  </tr>
                  
                  {/* Hijos */}
                  {parent.sub_analisis?.map((child, cIndex) => (
                    <tr key={`print-child-${index}-${cIndex}`} className="border-b border-gray-100 bg-gray-50/50">
                      <td className="py-2 pl-6 text-gray-700 text-[10px]">↳ {child.descripcion}</td>
                      <td className="py-2 text-center font-bold text-gray-900">{child.valor_hallado || "-"}</td>
                      <td className="py-2 text-center text-gray-500">{child.unidad}</td>
                      <td className="py-2 text-center text-gray-600">{child.valor_referencia}</td>
                      <td className="py-2 text-center text-gray-500 italic">{child.observaciones || ""}</td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>

          {orden.observaciones_medico && (
            <div className="mb-8 p-3 border border-gray-200 rounded bg-gray-50 text-xs">
              <strong className="block uppercase mb-1 text-gray-500">Observaciones Generales:</strong>
              <p>{orden.observaciones_medico}</p>
            </div>
          )}

          {/* FOOTER PDF */}
          <footer className="absolute bottom-[20mm] left-[15mm] right-[15mm]">
            <div className="flex justify-end mb-6">
              <div className="text-center w-64">
                <div className="h-16 mb-2"></div>
                <div className="border-t border-gray-800 pt-1">
                  <p className="font-bold text-sm">Bioquímico Responsable</p>
                  <p className="text-xs text-gray-500">Matrícula: {orden.matricula_bioquimico}</p>
                </div>
              </div>
            </div>
            <div className="text-[9px] text-gray-400 text-center border-t pt-2">
              Sistema de Gestión de Laboratorio UME • Documento generado el {new Date().toLocaleDateString()}
            </div>
          </footer>
        </div>
      </div>

    </div>
  );
}