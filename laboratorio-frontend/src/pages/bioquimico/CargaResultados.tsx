import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

// ==========================================
// ESTILOS GLOBALES PARA IMPRESIÓN (OCULTA EL SIDEBAR MÁGICAMENTE)
// ==========================================
const PrintStyles = () => (
  <style>
    {`
      @media print {
        /* Oculta la barra lateral y barras de navegación */
        aside, nav, .sidebar { display: none !important; }
        /* Elimina los márgenes que deja el sidebar */
        #root, body, main, .App, .ml-64 { margin: 0 !important; padding: 0 !important; width: 100% !important; }
        /* Fuerza fondo blanco */
        body { background-color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        /* Oculta todos los botones */
        .print-hide { display: none !important; }
        @page { margin: 15mm; }
      }
    `}
  </style>
);

// ==========================================
// COMPONENTES UI REUTILIZABLES
// ==========================================
const Badge = ({ children, variant = 'default' }: any) => {
  const variants: any = {
    pendiente: "bg-yellow-100 text-yellow-800",
    en_proceso: "bg-blue-100 text-blue-800",
    finalizado: "bg-green-100 text-green-800",
    urgente: "bg-red-100 text-red-700 border border-red-200 uppercase",
    default: "bg-gray-100 text-gray-800"
  };
  return <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${variants[variant] || variants.default}`}>{children}</span>;
};

const Input = ({ value, onChange, placeholder, disabled, modoEdicion }: any) => (
  <input
    type="text"
    value={value || ""}
    onChange={onChange}
    disabled={disabled || !modoEdicion}
    placeholder={modoEdicion ? placeholder : "-"}
    className={`w-full px-2 py-1 border rounded text-xs focus:ring-2 focus:ring-blue-500 outline-none transition-colors text-center font-semibold
      ${!modoEdicion 
        ? 'bg-transparent border-transparent text-gray-800 cursor-default' 
        : 'bg-white border-gray-300 text-gray-900'} 
      print:border-none print:bg-transparent print:p-0 print:m-0 print:text-black print:text-center print:shadow-none`}
  />
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
  valor_hallado: string | null;
  unidad: string | null;
  valor_referencia: string | null;
  observaciones: string | null;
  interpretacion: string | null;
  tecnico: string | null;
  es_subanalisis?: boolean;
  sub_analisis?: Analisis[];
}

interface OrdenTrabajo {
  id: number;
  nro_orden: string;
  estado: string;
  fecha: string;
  urgente: number;
  paciente: {
    nombre: string;
    apellido: string;
    dni: number;
    edad: number;
    sexo: string;
    mutual: string;
  };
  medico: string;
  analisis: Analisis[];
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export default function CargarResultados() {
  const { id_orden } = useParams();
  const navigate = useNavigate();
  const [orden, setOrden] = useState<OrdenTrabajo | null>(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState<string | number | null>(null);
  const [modoEdicion, setModoEdicion] = useState(true);

  useEffect(() => {
    if (id_orden) cargarOrden(parseInt(id_orden));
  }, [id_orden]);

  const cargarOrden = async (ordenId: number) => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/ordenes/${ordenId}`);
      
      if (response.data.success) {
        const raw = response.data.orden;
        const analisisList = response.data.analisis || [];

        const todosFinalizados = analisisList.length > 0 && analisisList.every((a: any) => a.estado === 'finalizado');
        const estadoReal = todosFinalizados ? 'finalizado' : raw.estado;

        setOrden({
            id: raw.id_orden,
            nro_orden: raw.nro_orden,
            estado: estadoReal,
            fecha: raw.fecha_ingreso_orden || new Date().toISOString(),
            urgente: raw.urgente,
            paciente: {
                nombre: raw.nombre || raw.nombre_paciente, 
                apellido: raw.apellido || raw.apellido_paciente,
                dni: raw.dni || raw.DNI,
                edad: raw.edad,
                sexo: raw.sexo,
                mutual: raw.mutual || 'Particular'
            },
            medico: raw.apellido_medico ? `Dr. ${raw.apellido_medico}` : 'No especificado',
            analisis: analisisList
        });

        if (estadoReal === 'finalizado') setModoEdicion(false);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al cargar la orden de trabajo");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (identificador: string | number, campo: keyof Analisis, valor: string, esHijo: boolean) => {
    setOrden(prev => {
      if (!prev) return null;
      const nuevosAnalisis = prev.analisis.map(parent => {
        const parentId = parent.id || parent.codigo;
        if (parentId === identificador && !esHijo) return { ...parent, [campo]: valor };
        if (parent.sub_analisis) {
          const hijosActualizados = parent.sub_analisis.map(child => {
            const childId = child.id || child.codigo;
            if (childId === identificador && esHijo) return { ...child, [campo]: valor };
            return child;
          });
          return { ...parent, sub_analisis: hijosActualizados };
        }
        return parent;
      });
      return { ...prev, analisis: nuevosAnalisis };
    });
  };

  const guardarResultadoIndividual = async (analisis: Analisis) => {
    const identificador = analisis.id || analisis.codigo; 
    try {
      setGuardando(identificador);
      await axios.put(`http://localhost:5000/api/ordenes/${id_orden}/analisis/${analisis.codigo}`, {
        valor_hallado: analisis.valor_hallado,
        unidad: analisis.unidad,
        observaciones: analisis.observaciones
      });
      handleChange(identificador, 'estado', 'finalizado', analisis.es_subanalisis || false);
    } catch (error) {
      alert("Error al guardar en la base de datos.");
    } finally {
      setGuardando(null);
    }
  };

  const finalizarOrdenCompleta = async () => {
    if (!window.confirm("¿Estás seguro de que deseas marcar toda esta orden como FINALIZADA?")) return;
    try {
        setLoading(true);
        await axios.put(`http://localhost:5000/api/ordenes/${id_orden}/finalizar`);
        alert("🎉 ¡Orden finalizada con éxito!");
        navigate('/bioquimico/ordenes-entrantes');
    } catch (error) {
        alert("Hubo un error al finalizar la orden.");
        setLoading(false);
    }
  };

  // Cálculos de progreso
  let totalAnalisis = 0;
  let listos = 0;
  orden?.analisis.forEach(a => {
    if (a.sub_analisis && a.sub_analisis.length > 0) {
        a.sub_analisis.forEach(sub => { totalAnalisis++; if(sub.estado === 'finalizado') listos++; });
    } else {
        totalAnalisis++; if(a.estado === 'finalizado') listos++;
    }
  });
  const porcentaje = totalAnalisis === 0 ? 0 : Math.round((listos / totalAnalisis) * 100);

  const formatFecha = (f: string) => new Date(f).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute:'2-digit' });

  // Render de Fila
  const FilaCarga = ({ item, isChild = false }: { item: Analisis, isChild?: boolean }) => {
    const isParentWithChildren = !isChild && item.sub_analisis && item.sub_analisis.length > 0;
    const identificadorSeguro = item.id || item.codigo;
    
    return (
      <tr className={`border-b border-slate-100 ${isChild ? 'bg-slate-50/50' : 'bg-white hover:bg-slate-50'} transition-colors`}>
        <td className={`py-3 px-4 ${isChild ? 'pl-10' : ''}`}>
          <div className="flex flex-col">
            <span className={`text-xs ${isChild ? 'text-slate-600' : 'font-bold text-slate-800 uppercase'}`}>
              {isChild && "↳ "} {item.descripcion}
            </span>
            <span className="text-[9px] text-slate-400 font-mono print:hidden">Cód: {item.codigo}</span>
          </div>
        </td>
        <td className="py-3 px-2 text-center text-xs text-slate-600 print:text-black">{item.valor_referencia || "-"}</td>
        <td className="py-3 px-2 w-32">
          {isParentWithChildren ? <div className="text-[10px] text-slate-400 text-center print:hidden">--</div> : 
            <Input value={item.valor_hallado} onChange={(e: any) => handleChange(identificadorSeguro, 'valor_hallado', e.target.value, isChild)} placeholder="Resultado" modoEdicion={modoEdicion} />
          }
        </td>
        <td className="py-3 px-2 w-24">
          {isParentWithChildren ? null : <Input value={item.unidad} onChange={(e: any) => handleChange(identificadorSeguro, 'unidad', e.target.value, isChild)} placeholder="Unidad" modoEdicion={modoEdicion} />}
        </td>
        <td className="py-3 px-2 w-48">
          {isParentWithChildren ? null : <Input value={item.observaciones} onChange={(e: any) => handleChange(identificadorSeguro, 'observaciones', e.target.value, isChild)} placeholder="Notas..." modoEdicion={modoEdicion} />}
        </td>
        <td className="py-3 px-2 text-right print-hide">
          {!isParentWithChildren && modoEdicion && (
            <button 
                onClick={() => guardarResultadoIndividual(item)}
                disabled={guardando === identificadorSeguro}
                className={`px-3 py-1 rounded text-[10px] font-bold transition-all shadow-sm ${item.estado === 'finalizado' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
            >
                {guardando === identificadorSeguro ? '⏳' : (item.estado === 'finalizado' ? '✓ Listo' : 'Guardar')}
            </button>
          )}
        </td>
      </tr>
    );
  };

  if (loading) return <div className="p-10 text-center font-bold text-indigo-600 animate-pulse">Cargando protocolo...</div>;
  if (!orden) return <div className="p-10 text-center text-red-500 font-bold">No se encontró la orden.</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans print:p-0 print:bg-white text-slate-800">
      <PrintStyles /> {/* 🔥 ESTO OCULTA EL SIDEBAR AL IMPRIMIR */}
      <div className="max-w-6xl mx-auto">
        
        {/* ========================================== */}
        {/* HEADER SUPERIOR (Botones de acción, oculto en print) */}
        {/* ========================================== */}
        <div className="flex justify-between items-center mb-6 print-hide">
          <button onClick={() => navigate('/bioquimico/ordenes-entrantes')} className="text-slate-500 hover:text-indigo-600 text-sm font-bold flex items-center gap-2 transition-colors">
            ← Volver a Entrantes
          </button>
          <div className="flex gap-3">
            {orden.estado === 'finalizado' ? (
              <>
                <button onClick={() => setModoEdicion(!modoEdicion)} className="bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm">
                  {modoEdicion ? '🔒 Bloquear Edición' : '✏️ Corregir Datos'}
                </button>
                <button onClick={() => window.print()} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-bold shadow-sm transition-all flex items-center gap-2">
                  🖨️ Imprimir PDF
                </button>
              </>
            ) : (
              <button onClick={finalizarOrdenCompleta} className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-bold shadow-sm transition-all flex items-center gap-2">
                ✅ Finalizar Orden
              </button>
            )}
          </div>
        </div>

        <div className="mb-6 flex items-center gap-4">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Orden #{orden.nro_orden}</h1>
          {orden.urgente === 1 && <Badge variant="urgente">URGENTE</Badge>}
        </div>

        {/* ========================================== */}
        {/* TARJETAS DE INFORMACIÓN (Estilo Médico) */}
        {/* ========================================== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            
            {/* Tarjeta 1: Paciente */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 print:shadow-none print:border-slate-300">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Datos del Paciente</p>
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-bold text-slate-900 text-lg mb-1">{orden.paciente.apellido}, {orden.paciente.nombre}</p>
                        <p className="text-xs text-slate-500">DNI: {orden.paciente.dni} <span className="mx-1">•</span> Edad: {orden.paciente.edad} <span className="mx-1">•</span> Sexo: {orden.paciente.sexo}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Cobertura</p>
                        <p className="text-sm font-bold text-indigo-600 uppercase">{orden.paciente.mutual}</p>
                    </div>
                </div>
            </div>

            {/* Tarjeta 2: Info Administrativa */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 print:shadow-none print:border-slate-300">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Info. Administrativa</p>
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <span className="text-xs text-slate-500">Solicitante</span>
                        <span className="text-xs font-bold text-slate-800">{orden.medico}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-xs text-slate-500">Fecha Ingreso</span>
                        <span className="text-xs font-bold text-slate-800">{formatFecha(orden.fecha)}</span>
                    </div>
                </div>
            </div>

            {/* Tarjeta 3: Progreso */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 print:shadow-none print:border-slate-300">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Progreso de Carga</p>
                <div className="flex items-center gap-6">
                    <div className="text-center">
                        <p className="text-2xl font-black text-slate-800">{totalAnalisis}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Total</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-black text-green-600">{listos}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Listos</p>
                    </div>
                    <div className="flex-1 flex justify-end">
                        <div className="w-12 h-12 rounded-full border-4 border-indigo-100 flex items-center justify-center relative">
                            <span className="text-xs font-bold text-indigo-700">{porcentaje}%</span>
                        </div>
                    </div>
                </div>
            </div>

        </div>

        {/* ========================================== */}
        {/* TABLA DE RESULTADOS */}
        {/* ========================================== */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden print:shadow-none print:border-none print:mt-8">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center print:bg-white print:border-b-2 print:border-slate-800">
            <h3 className="font-bold text-slate-800 text-sm">Resultados de Análisis</h3>
            <span className="text-xs text-slate-500 italic print-hide">
              {modoEdicion ? 'Editando resultados...' : 'Modo Solo Lectura'}
            </span>
          </div>
          
          <table className="min-w-full">
            <thead className="bg-white border-b border-slate-200 print:border-b-2 print:border-slate-800">
              <tr>
                <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider w-1/3 print:text-black">Determinación</th>
                <th className="px-2 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-wider w-24 print:text-black">Valor Ref.</th>
                <th className="px-2 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-wider w-32 print:text-black">Resultado</th>
                <th className="px-2 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-wider w-24 print:text-black">Unidad</th>
                <th className="px-2 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider w-48 print:text-black">Notas</th>
                <th className="px-2 py-3 text-right text-[10px] font-black text-slate-400 uppercase tracking-wider print-hide">Acción</th>
              </tr>
            </thead>
            <tbody>
              {orden.analisis.map((parent, index) => (
                <React.Fragment key={`group-${parent.codigo}-${index}`}>
                  <FilaCarga item={parent} />
                  {parent.sub_analisis?.map((child, cIndex) => (
                    <FilaCarga key={`child-${child.codigo}-${cIndex}`} item={child} isChild={true} />
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>

          {/* Pie de página exclusivo para impresión */}
          <div className="hidden print:block mt-16 pt-8 border-t border-slate-300">
             <div className="flex justify-between items-end">
                 <div>
                     <p className="text-[10px] text-slate-500">Documento generado el: {new Date().toLocaleDateString('es-AR')}</p>
                     <p className="text-[10px] text-slate-500">Sistema de Laboratorio Central</p>
                 </div>
                 <div className="text-center">
                     <div className="w-48 border-b border-slate-800 mb-2"></div>
                     <p className="text-xs font-bold text-slate-800">Firma y Sello Bioquímico</p>
                 </div>
             </div>
          </div>

        </div>

      </div>
    </div>
  );
}